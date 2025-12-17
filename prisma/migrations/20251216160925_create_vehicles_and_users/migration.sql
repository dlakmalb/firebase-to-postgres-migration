-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'cashier');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "driver_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_vehicle_number_idx" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicle_number_unique_idx" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_unique_idx" ON "users"("username");
