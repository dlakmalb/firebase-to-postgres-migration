import { getFirestore } from "../firebase";
import { prisma } from "../prisma";
import { toDate } from "../utils/parse";

export async function migrateVehicles() {
  const db = getFirestore();
  const snapshot = await db.collection("vehicles").get();

  console.log(`Migrating vehicles: ${snapshot.size}`);

  for (const doc of snapshot.docs) {
    const data = doc.data();

    const id = String(data.id ?? doc.id);
    const vehicleNumber = String(data.vehicleNumber ?? "").trim();
    if (!vehicleNumber) continue;

    await prisma.vehicle.upsert({
      where: { id },
      create: {
        id,
        vehicleNumber,
        driverName: data.driverName ? String(data.driverName) : null,
        notes: data.notes ? String(data.notes) : null,
        createdAt: toDate(data.createdAt) ?? new Date(),
        updatedAt: toDate(data.updatedAt) ?? new Date(),
      },
      update: {
        vehicleNumber,
        driverName: data.driverName ? String(data.driverName) : null,
        notes: data.notes ? String(data.notes) : null,
        updatedAt: toDate(data.updatedAt) ?? new Date(),
      },
    });
  }

  console.log("Vehicles migration completed");
}
