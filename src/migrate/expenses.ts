import { getFirestore } from "../firebase";
import { prisma } from "../prisma";
import { toDate, toDecimal } from "../utils/parse";

export async function migrateExpenses() {
  const db = getFirestore();
  const snapshot = await db.collection("expenses").get();

  console.log(`Migrating expenses: ${snapshot.size}`);

  for (const doc of snapshot.docs) {
    const data = doc.data();

    const id = String(data.id ?? doc.id);

    const category = String(data.category ?? "").trim();
    if (!category) continue;

    const amount = toDecimal(data.amount);
    if (!amount) continue;

    const expenseDate = toDate(data.expenseDate) ?? toDate(data.date) ?? toDate(data.createdAt);
    if (!expenseDate) continue;

    await prisma.expense.upsert({
      where: { id },
      create: {
        id,
        category,
        description: data.description ? String(data.description) : null,
        amount,
        expenseDate,
        staffId: data.staffId ? String(data.staffId) : null,
        vehicleId: data.vehicleId ? String(data.vehicleId) : null,
        createdAt: toDate(data.createdAt) ?? new Date(),
      },
      update: {
        category,
        description: data.description ? String(data.description) : null,
        amount,
        expenseDate,
        staffId: data.staffId ? String(data.staffId) : null,
        vehicleId: data.vehicleId ? String(data.vehicleId) : null,
      },
    });
  }

  console.log("Expenses migration completed");
}
