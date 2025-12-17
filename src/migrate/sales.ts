import { Prisma } from "@prisma/client";
import { getFirestore } from "../firebase";
import { prisma } from "../prisma";
import { toBool, toDate, toDecimal, toInt } from "../utils/parse";
import { extractDocIdFromRef, saleItemId } from "../utils/ids";

function mapSaleStatus(value: any): "completed" | "pending" | "cancelled" {
  const v = String(value ?? "completed").trim().toLowerCase();
  if (v === "pending") return "pending";
  if (v === "cancelled" || v === "canceled") return "cancelled";
  return "completed";
}

function mapSaleType(value: any): "retail" | "wholesale" {
  const v = String(value ?? "retail").trim().toLowerCase();
  return v === "wholesale" ? "wholesale" : "retail";
}

export async function migrateSales() {
  const db = getFirestore();
  const snapshot = await db.collection("sales").get();

  console.log(`Migrating sales: ${snapshot.size}`);

  let skippedSales = 0;
  let insertedItems = 0;
  let droppedItemsMissingProduct = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const saleId = String(data.id ?? doc.id);

    const customerId = data.customerId ? String(data.customerId) : null;
    const staffId = data.staffId ? String(data.staffId) : null;
    const vehicleId = data.vehicleId ? String(data.vehicleId) : null;

    const saleDate = toDate(data.saleDate) ?? toDate(data.createdAt) ?? new Date();
    const createdAt = toDate(data.createdAt) ?? new Date();
    const updatedAt = toDate(data.updatedAt) ?? createdAt;

    const items: any[] = Array.isArray(data.items) ? data.items : [];

    // Build raw item rows (we’ll resolve and filter productId later)
    const rawItems = items.map((it, index) => {
      const productRef = it?.productRef ? String(it.productRef) : null;
      const productIdFromRef = extractDocIdFromRef(productRef);

      const productSku =
        it?.productSku != null
          ? String(it.productSku)
          : it?.sku != null
            ? String(it.sku)
            : null;

      return {
        id: saleItemId(saleId, index),
        saleId,
        productIdFromRef,
        productRef,
        productSku,

        quantity: toInt(it?.quantity, 0),
        appliedPrice: toDecimal(it?.appliedPrice) ?? new Prisma.Decimal("0"),
        saleType: mapSaleType(it?.saleType),
        isOfferItem: toBool(it?.isOfferItem, false),

        // Snapshot fields (match your SaleItem model)
        productName: it?.productName != null ? String(it.productName) : null,
        productCategory: it?.productCategory != null ? String(it.productCategory) : null,
        productPrice: toDecimal(it?.productPrice) ?? toDecimal(it?.price),
      };
    });

    const didMigrate = await prisma.$transaction(async (tx) => {
      // 1) Validate related records exist (skip sale if broken refs)
      if (customerId) {
        const exists = await tx.customer.findUnique({
          where: { id: customerId },
          select: { id: true },
        });
        if (!exists) return false;
      }

      if (staffId) {
        const exists = await tx.user.findUnique({
          where: { id: staffId },
          select: { id: true },
        });
        if (!exists) return false;
      }

      if (vehicleId) {
        const exists = await tx.vehicle.findUnique({
          where: { id: vehicleId },
          select: { id: true },
        });
        if (!exists) return false;
      }

      // 2) Upsert Sale header (matches your Sale model)
      await tx.sale.upsert({
        where: { id: saleId },
        create: {
          id: saleId,

          saleDate,
          createdAt,
          updatedAt,

          customerId,
          customerName: data.customerName ? String(data.customerName) : null,
          customerShopName: data.customerShopName ? String(data.customerShopName) : null,

          staffId,
          staffName: data.staffName ? String(data.staffName) : null,

          vehicleId,

          subTotal: toDecimal(data.subTotal) ?? new Prisma.Decimal("0"),
          discountPercentage: toDecimal(data.discountPercentage) ?? new Prisma.Decimal("0"),
          discountAmount: toDecimal(data.discountAmount) ?? new Prisma.Decimal("0"),
          totalAmount: toDecimal(data.totalAmount) ?? new Prisma.Decimal("0"),

          paidAmountCash: toDecimal(data.paidAmountCash),
          paidAmountCheque: toDecimal(data.paidAmountCheque),
          paidAmountBankTransfer: toDecimal(data.paidAmountBankTransfer),
          creditUsed: toDecimal(data.creditUsed),

          totalAmountPaid: toDecimal(data.totalAmountPaid) ?? new Prisma.Decimal("0"),
          outstandingBalance: toDecimal(data.outstandingBalance) ?? new Prisma.Decimal("0"),

          paymentSummary: data.paymentSummary ? String(data.paymentSummary) : null,

          offerApplied: toBool(data.offerApplied, false),
          status: mapSaleStatus(data.status),
        },
        update: {
          saleDate,
          updatedAt,

          customerId,
          customerName: data.customerName ? String(data.customerName) : null,
          customerShopName: data.customerShopName ? String(data.customerShopName) : null,

          staffId,
          staffName: data.staffName ? String(data.staffName) : null,

          vehicleId,

          subTotal: toDecimal(data.subTotal) ?? new Prisma.Decimal("0"),
          discountPercentage: toDecimal(data.discountPercentage) ?? new Prisma.Decimal("0"),
          discountAmount: toDecimal(data.discountAmount) ?? new Prisma.Decimal("0"),
          totalAmount: toDecimal(data.totalAmount) ?? new Prisma.Decimal("0"),

          paidAmountCash: toDecimal(data.paidAmountCash),
          paidAmountCheque: toDecimal(data.paidAmountCheque),
          paidAmountBankTransfer: toDecimal(data.paidAmountBankTransfer),
          creditUsed: toDecimal(data.creditUsed),

          totalAmountPaid: toDecimal(data.totalAmountPaid) ?? new Prisma.Decimal("0"),
          outstandingBalance: toDecimal(data.outstandingBalance) ?? new Prisma.Decimal("0"),

          paymentSummary: data.paymentSummary ? String(data.paymentSummary) : null,

          offerApplied: toBool(data.offerApplied, false),
          status: mapSaleStatus(data.status),
        },
      });

      // 3) Insert SaleItems (drop rows with missing product)
      if (!rawItems.length) return true;

      const ids = Array.from(
        new Set(rawItems.map((r) => r.productIdFromRef).filter(Boolean) as string[])
      );

      const skus = Array.from(
        new Set(rawItems.map((r) => r.productSku).filter(Boolean) as string[])
      );

      const existingProducts = await tx.product.findMany({
        where: {
          OR: [
            ids.length ? { id: { in: ids } } : undefined,
            skus.length ? { sku: { in: skus } } : undefined,
          ].filter(Boolean) as any,
        },
        select: { id: true, sku: true },
      });

      const idSet = new Set(existingProducts.map((p) => p.id));
      const skuToId = new Map(
        existingProducts
          .filter((p) => p.sku)
          .map((p) => [p.sku as string, p.id] as const)
      );

      const safeItems = rawItems
        .map((r) => {
          let productId: string | null =
            r.productIdFromRef && idSet.has(r.productIdFromRef) ? r.productIdFromRef : null;

          if (!productId && r.productSku && skuToId.has(r.productSku)) {
            productId = skuToId.get(r.productSku)!;
          }

          if (!productId) {
            droppedItemsMissingProduct += 1;
            return null;
          }

          return {
            id: r.id,
            saleId: r.saleId,
            productId,

            quantity: r.quantity,
            appliedPrice: r.appliedPrice,
            saleType: r.saleType as any,
            isOfferItem: r.isOfferItem,

            productName: r.productName,
            productCategory: r.productCategory,
            productPrice: r.productPrice,
            productSku: r.productSku,
            productRef: r.productRef,
          };
        })
        .filter(Boolean) as any[];

      if (safeItems.length) {
        await tx.saleItem.createMany({
          data: safeItems,
          skipDuplicates: true,
        });
        insertedItems += safeItems.length;
      }

      return true;
    });

    if (!didMigrate) skippedSales += 1;
  }

  console.log(
    `Sales migration done. skipped sales (missing customer/staff/vehicle): ${skippedSales}, inserted sale_items: ${insertedItems}, dropped sale_items (missing product): ${droppedItemsMissingProduct}`
  );
}
