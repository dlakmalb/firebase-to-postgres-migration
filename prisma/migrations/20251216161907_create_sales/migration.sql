-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('retail', 'wholesale');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('completed', 'pending', 'cancelled');

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "customer_shop_name" TEXT,
    "staff_id" TEXT,
    "staff_name" TEXT,
    "vehicle_id" TEXT,
    "sub_total" DECIMAL(12,2) NOT NULL,
    "discount_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "paid_amount_cash" DECIMAL(12,2),
    "paid_amount_cheque" DECIMAL(12,2),
    "paid_amount_bank_transfer" DECIMAL(12,2),
    "credit_used" DECIMAL(12,2),
    "total_amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstanding_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_summary" TEXT,
    "offer_applied" BOOLEAN NOT NULL DEFAULT false,
    "status" "SaleStatus" NOT NULL DEFAULT 'completed',

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
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

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_sale_date_idx" ON "sales"("sale_date");

-- CreateIndex
CREATE INDEX "sales_customer_id_idx" ON "sales"("customer_id");

-- CreateIndex
CREATE INDEX "sales_staff_id_idx" ON "sales"("staff_id");

-- CreateIndex
CREATE INDEX "sales_vehicle_id_idx" ON "sales"("vehicle_id");

-- CreateIndex
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");

-- CreateIndex
CREATE INDEX "sale_items_product_id_idx" ON "sale_items"("product_id");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
