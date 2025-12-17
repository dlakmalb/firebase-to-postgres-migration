import { getFirestore } from "../firebase";
import { prisma } from "../prisma";
import { toDate, toDecimal, toInt } from "../utils/parse";

// If Firestore has values like "Ice Cream" but enum uses "Ice_Cream", map here.
function mapCategory(value: any) {
  const raw = String(value ?? "Other").trim();

  // Firestore seems already "Yogurt", "Drink", "Ice_Cream", ...
  // But we normalize just in case:
  const normalized = raw.replace(/\s+/g, "_");

  const allowed = new Set([
    "Yogurt",
    "Drink",
    "Ice_Cream",
    "Dessert",
    "Curd",
    "Other",
  ]);

  return (allowed.has(normalized) ? normalized : "Other") as any;
}

export async function migrateProducts() {
  const db = getFirestore();
  const snapshot = await db.collection("products").get();

  console.log(`Migrating products: ${snapshot.size}`);

  for (const doc of snapshot.docs) {
    const data = doc.data();

    const id = String(data.id ?? doc.id);
    const name = String(data.name ?? "").trim();
    if (!id || !name) continue;

    // ⚠️ Optional: avoid storing massive base64 data URLs (can blow up Postgres rows)
    let imageUrl: string | null = data.imageUrl ? String(data.imageUrl) : null;
    if (imageUrl && imageUrl.startsWith("data:image/")) {
      // keep null or keep as-is if you really want it
      imageUrl = null;
    }

    await prisma.product.upsert({
      where: { id },
      create: {
        id,
        name,
        category: mapCategory(data.category),
        price: toDecimal(data.price) ?? toDecimal(0)!,
        wholesalePrice: toDecimal(data.wholesalePrice),
        stock: toInt(data.stock, 0),
        imageUrl,
        description: data.description ? String(data.description) : null,
        sku: data.sku ? String(data.sku) : null,
        reorderLevel: data.reorderLevel != null ? toInt(data.reorderLevel) : null,
        aiHint: data.aiHint ? String(data.aiHint) : null,
        createdAt: toDate(data.createdAt) ?? new Date(),
        updatedAt: toDate(data.updatedAt) ?? new Date(),
      },
      update: {
        name,
        category: mapCategory(data.category),
        price: toDecimal(data.price) ?? toDecimal(0)!,
        wholesalePrice: toDecimal(data.wholesalePrice),
        stock: toInt(data.stock, 0),
        imageUrl,
        description: data.description ? String(data.description) : null,
        sku: data.sku ? String(data.sku) : null,
        reorderLevel: data.reorderLevel != null ? toInt(data.reorderLevel) : null,
        aiHint: data.aiHint ? String(data.aiHint) : null,
        updatedAt: toDate(data.updatedAt) ?? new Date(),
      },
    });
  }

  console.log("Products migration completed");
}
