import { getFirestore } from "../firebase";
import { prisma } from "../prisma";
import { toDate } from '../utils/parse';

export async function migrateCustomers() {
  const db = getFirestore();
  const snapshot = await db.collection("customers").get();

  console.log(`Migrating customers: ${snapshot.size}`);

  for (const doc of snapshot.docs) {
    const data = doc.data();

    await prisma.customer.upsert({
      where: { id: doc.id },
      create: {
        id: doc.id,
        avatar: data.avatar ?? null,
        name: data.name ?? "",
        phone: data.phone ?? "",
        address: data.address ?? null,
        shopName: data.shopName ?? null,
        status: data.status ?? "active",
        createdAt: toDate(data.createdAt) ?? new Date(),
        updatedAt: toDate(data.updatedAt) ?? new Date(),
      },
      update: {
        avatar: data.avatar ?? null,
        name: data.name ?? "",
        phone: data.phone ?? "",
        address: data.address ?? null,
        shopName: data.shopName ?? null,
        status: data.status ?? "active",
        updatedAt: toDate(data.updatedAt) ?? new Date(),
      },
    });
  }

  console.log("Customers migration completed");
}
