-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('ADD_STOCK_INVENTORY', 'LOAD_TO_VEHICLE', 'UNLOAD_FROM_VEHICLE', 'REMOVE_STOCK_WASTAGE', 'STOCK_ADJUSTMENT_MANUAL', 'ISSUE_SAMPLE');

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "product_sku" TEXT,
    "type" "StockTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previous_stock" INTEGER NOT NULL,
    "new_stock" INTEGER NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "vehicle_id" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_transactions_transaction_date_idx" ON "stock_transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "stock_transactions_product_id_idx" ON "stock_transactions"("product_id");

-- CreateIndex
CREATE INDEX "stock_transactions_type_idx" ON "stock_transactions"("type");

-- CreateIndex
CREATE INDEX "stock_transactions_vehicle_id_idx" ON "stock_transactions"("vehicle_id");

-- CreateIndex
CREATE INDEX "stock_transactions_user_id_idx" ON "stock_transactions"("user_id");

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
