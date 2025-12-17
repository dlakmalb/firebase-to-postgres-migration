-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('yogurt', 'drink', 'ice_cream', 'dessert', 'curd', 'other');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "wholesale_price" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER,
    "image_url" TEXT,
    "ai_hint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "products"("stock");
