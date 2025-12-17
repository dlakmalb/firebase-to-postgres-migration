import { getFirestore } from "../firebase";
import { prisma } from "../prisma";
import { toDate } from "../utils/parse";

export async function migrateUsers() {
  const db = getFirestore();
  const snapshot = await db.collection("users").get();

  console.log(`Migrating users: ${snapshot.size}`);

  for (const doc of snapshot.docs) {
    const data = doc.data();

    const username = String(data.username ?? "").trim();
    if (!username) continue;

    await prisma.user.upsert({
      where: { id: username },
      create: {
        id: username,
        username,
        name: data.name ?? username,
        role: data.role ?? "cashier",
        // Do NOT migrate plain passwords. Prefer null.
        passwordHash: null,
        createdAt: toDate(data.createdAt) ?? new Date(),
        updatedAt: toDate(data.updatedAt) ?? new Date(),
      },
      update: {
        username,
        name: data.name ?? username,
        role: data.role ?? "cashier",
        updatedAt: toDate(data.updatedAt) ?? new Date(),
      },
    });
  }

  console.log("Users migration completed");
}
