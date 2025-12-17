import { StockTransactionType } from "@prisma/client";
import { getFirestore } from "../firebase";
import { prisma } from "../prisma";
import { toDate, toInt } from "../utils/parse";

function mapStockTxType(value: any): StockTransactionType {
  const v = String(value ?? "").trim().toUpperCase();

  switch (v) {
    case "ADD_STOCK_INVENTORY":
      return StockTransactionType.ADD_STOCK_INVENTORY;
    case "LOAD_TO_VEHICLE":
      return StockTransactionType.LOAD_TO_VEHICLE;
    case "UNLOAD_FROM_VEHICLE":
      return StockTransactionType.UNLOAD_FROM_VEHICLE;
    case "REMOVE_STOCK_WASTAGE":
      return StockTransactionType.REMOVE_STOCK_WASTAGE;
    case "STOCK_ADJUSTMENT_MANUAL":
      return StockTransactionType.STOCK_ADJUSTMENT_MANUAL;
    case "ISSUE_SAMPLE":
      return StockTransactionType.ISSUE_SAMPLE;

    default:
      // Don’t crash migration if Firestore has unexpected/typo type
      return StockTransactionType.STOCK_ADJUSTMENT_MANUAL;
  }
}

export async function migrateStockTransactions() {
  const db = getFirestore();

  // If your Firestore collection name differs, change here:
  const snapshot = await db.collection("stockTransactions").get();

  console.log(`Migrating stockTransactions: ${snapshot.size}`);

  let skipped = 0;
  let missingProductRefs = 0;
  let missingUserRefs = 0;
  let missingVehicleRefs = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const id = String(data.id ?? doc.id);

    const productId = data.productId != null ? String(data.productId) : null;
    const userId = data.userId != null ? String(data.userId) : null;
    const vehicleId = data.vehicleId != null ? String(data.vehicleId) : null;

    const createdAt = toDate(data.createdAt) ?? new Date();
    const updatedAt = toDate(data.updatedAt) ?? createdAt;
    const transactionDate = toDate(data.transactionDate) ?? createdAt;

    const type = mapStockTxType(data.type);
    const notes = data.notes != null ? String(data.notes) : null;

    const quantity = toInt(data.quantity, 0);
    const previousStock = data.previousStock != null ? toInt(data.previousStock, 0) : 0;
    const newStock = data.newStock != null ? toInt(data.newStock, 0) : 0;

    if (data.previousStock == null || data.newStock == null) {
        console.log("Stock tx missing stock values", { id });
    }

    const productName = data.productName != null ? String(data.productName) : null;
    const productSku = data.productSku != null ? String(data.productSku) : null;

    try {
      await prisma.$transaction(async (tx) => {
        // Optional relations: validate existence but don't fail migration
        let safeProductId: string | null = null;
        if (productId) {
          const p = await tx.product.findUnique({
            where: { id: productId },
            select: { id: true },
          });
          if (p) safeProductId = p.id;
          else missingProductRefs += 1;
        }

        let safeUserId: string | null = null;
        if (userId) {
          const u = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true },
          });
          if (u) safeUserId = u.id;
          else missingUserRefs += 1;
        }

        let safeVehicleId: string | null = null;
        if (vehicleId) {
          const v = await tx.vehicle.findUnique({
            where: { id: vehicleId },
            select: { id: true },
          });
          if (v) safeVehicleId = v.id;
          else missingVehicleRefs += 1;
        }

        await tx.stockTransaction.upsert({
          where: { id },
          create: {
            id,
            createdAt,
            updatedAt,
            transactionDate,
            type,
            notes,
            quantity,
            previousStock,
            newStock,

            // relations (nullable)
            productId: safeProductId,
            userId: safeUserId,
            vehicleId: safeVehicleId,

            // snapshot
            productName,
            productSku,
          },
          update: {
            updatedAt,
            transactionDate,
            type,
            notes,
            quantity,
            previousStock,
            newStock,

            productId: safeProductId,
            userId: safeUserId,
            vehicleId: safeVehicleId,

            productName,
            productSku,
          },
        });
      });
    } catch (e) {
      skipped += 1;
      console.log("SKIP stockTransaction", { id, error: (e as Error).message });
    }
  }

  console.log(
    `Stock transactions done. skipped: ${skipped}, missingProduct refs: ${missingProductRefs}, missingUser refs: ${missingUserRefs}, missingVehicle refs: ${missingVehicleRefs}`
  );
}
