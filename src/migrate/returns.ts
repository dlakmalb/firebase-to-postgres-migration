import { Prisma } from "@prisma/client";
import { getFirestore } from "../firebase";
import { prisma } from "../prisma";
import { toBool, toDate, toDecimal, toInt } from "../utils/parse";
import { extractDocIdFromRef, returnItemId } from "../utils/ids";

function mapSaleType(value: any): "retail" | "wholesale" {
  const v = String(value ?? "retail").trim().toLowerCase();
  return v === "wholesale" ? "wholesale" : "retail";
}

export async function migrateReturns() {
  const db = getFirestore();

  const snapshot = await db.collection("returns").get();
  console.log(`Migrating returns: ${snapshot.size}`);

  let skippedReturns = 0;
  let insertedItems = 0;
  let droppedItemsMissingProduct = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const returnId = String(data.id ?? doc.id);

    const originalSaleId = data.originalSaleId ? String(data.originalSaleId) : null;
    const staffId = data.staffId ? String(data.staffId) : null;
    const customerId = data.customerId ? String(data.customerId) : null;

    const returnDate = toDate(data.returnDate) ?? toDate(data.createdAt) ?? new Date();
    const createdAt = toDate(data.createdAt) ?? new Date();

    // ✅ Firebase has TWO arrays: returnedItems + exchangedItems
    const returnedItems: any[] = Array.isArray(data.returnedItems) ? data.returnedItems : [];
    const exchangedItems: any[] = Array.isArray(data.exchangedItems) ? data.exchangedItems : [];

    // ✅ merge them and stamp lineType explicitly
    const allItems: any[] = [
      ...returnedItems.map((it) => ({ ...it, __lineType: "returned" as const })),
      ...exchangedItems.map((it) => ({ ...it, __lineType: "exchanged" as const })),
    ];

    const rawItems = allItems.map((it, index) => {
      const productRef = it?.productRef ? String(it.productRef) : null;
      const productIdFromRef = extractDocIdFromRef(productRef);

      const productSku =
        it?.productSku != null
          ? String(it.productSku)
          : it?.sku != null
            ? String(it.sku)
            : null;

      return {
        id: returnItemId(returnId, index),
        returnId,
        productIdFromRef,
        productRef,
        productSku,

        // ✅ use our stamped type (not it.lineType)
        lineType: it.__lineType as "returned" | "exchanged",

        quantity: toInt(it?.quantity, 0),
        appliedPrice: toDecimal(it?.appliedPrice) ?? new Prisma.Decimal("0"),
        saleType: mapSaleType(it?.saleType),
        isOfferItem: toBool(it?.isOfferItem, false),

        // snapshot fields match your ReturnItem model
        productName: it?.productName != null ? String(it.productName) : null,
        productCategory: it?.productCategory != null ? String(it.productCategory) : null,
        productPrice: toDecimal(it?.productPrice) ?? toDecimal(it?.price),
      };
    });

    const didMigrate = await prisma.$transaction(async (tx) => {
      // 1) originalSaleId is core → skip if missing or not found
      if (!originalSaleId) return false;

      const saleExists = await tx.sale.findUnique({
        where: { id: originalSaleId },
        select: { id: true },
      });
      if (!saleExists) return false;

      // 2) If staffId is present, it must exist
      if (staffId) {
        const staffExists = await tx.user.findUnique({
          where: { id: staffId },
          select: { id: true },
        });
        if (!staffExists) return false;
      }

      // 3) If customerId is present, it must exist
      if (customerId) {
        const customerExists = await tx.customer.findUnique({
          where: { id: customerId },
          select: { id: true },
        });
        if (!customerExists) return false;
      }

      // 4) Upsert Return header
      await tx.return.upsert({
        where: { id: returnId },
        create: {
          id: returnId,
          createdAt,
          returnDate,

          originalSaleId,

          customerId,
          customerName: data.customerName ? String(data.customerName) : null,
          customerShopName: data.customerShopName ? String(data.customerShopName) : null,

          staffId,
          staffName: data.staffName ? String(data.staffName) : null,
        },
        update: {
          returnDate,
          originalSaleId,

          customerId,
          customerName: data.customerName ? String(data.customerName) : null,
          customerShopName: data.customerShopName ? String(data.customerShopName) : null,

          staffId,
          staffName: data.staffName ? String(data.staffName) : null,
        },
      });

      // 5) Insert ReturnItems (drop rows when product missing)
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
            console.log("DROP item (no product match)", {
              returnId,
              productIdFromRef: r.productIdFromRef,
              productSku: r.productSku,
              productRef: r.productRef,
            });
            droppedItemsMissingProduct += 1;
            return null;
          }

          return {
            id: r.id,
            returnId: r.returnId,
            lineType: r.lineType as any,

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
        await tx.returnItem.createMany({
          data: safeItems,
          skipDuplicates: true,
        });
        insertedItems += safeItems.length;
      }

      return true;
    });

    if (!didMigrate) skippedReturns += 1;
  }

  console.log(
    `Returns migration done. skipped returns (missing sale/customer/staff): ${skippedReturns}, inserted return_items: ${insertedItems}, dropped return_items (missing product): ${droppedItemsMissingProduct}`
  );
}
