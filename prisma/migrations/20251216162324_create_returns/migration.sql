-- CreateEnum
CREATE TYPE "ReturnLineType" AS ENUM ('returned', 'exchanged');

-- CreateTable
CREATE TABLE "returns" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "return_date" TIMESTAMP(3) NOT NULL,
    "original_sale_id" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "customer_shop_name" TEXT,
    "staff_id" TEXT,
    "staff_name" TEXT,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "return_id" TEXT NOT NULL,
    "line_type" "ReturnLineType" NOT NULL,
    "product_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "applied_price" DECIMAL(12,2) NOT NULL,
    "sale_type" "SaleType" NOT NULL,
    "is_offer_item" BOOLEAN NOT NULL DEFAULT false,
    "product_name" TEXT,
    "product_category" TEXT,
    "product_price" DECIMAL(12,2),
    "product_sku" TEXT,
    "product_ref" TEXT,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "returns_return_date_idx" ON "returns"("return_date");

-- CreateIndex
CREATE INDEX "returns_original_sale_id_idx" ON "returns"("original_sale_id");

-- CreateIndex
CREATE INDEX "returns_customer_id_idx" ON "returns"("customer_id");

-- CreateIndex
CREATE INDEX "returns_staff_id_idx" ON "returns"("staff_id");

-- CreateIndex
CREATE INDEX "return_items_return_id_idx" ON "return_items"("return_id");

-- CreateIndex
CREATE INDEX "return_items_product_id_idx" ON "return_items"("product_id");

-- CreateIndex
CREATE INDEX "return_items_line_type_idx" ON "return_items"("line_type");

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_original_sale_id_fkey" FOREIGN KEY ("original_sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
