-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRY', 'DEPARTURE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('STORAGE', 'PICKING', 'DAMAGED');

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_temperature_range_id_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "priority" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "unit_volume" DECIMAL(10,2),
ADD COLUMN     "unit_weight" DECIMAL(10,2),
ALTER COLUMN "temperature_range_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "statuses" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "inventory" (
    "inventory_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "entry_order_id" TEXT,
    "location_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "expiration_date" TIMESTAMP(3),
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "log_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "movement_type" "MovementType" NOT NULL,
    "entry_order_id" TEXT,
    "departure_order_id" TEXT,
    "location_id" TEXT,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "locations" (
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType",
    "capacity" INTEGER,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id")
);

-- CreateIndex
CREATE INDEX "idx_inventory_product_location" ON "inventory"("product_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_log_timestamp_product" ON "inventory_logs"("timestamp", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_temperature_range_id_fkey" FOREIGN KEY ("temperature_range_id") REFERENCES "temperature_ranges"("temperature_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_entry_order_id_fkey" FOREIGN KEY ("entry_order_id") REFERENCES "entry_orders"("entry_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_entry_order_id_fkey" FOREIGN KEY ("entry_order_id") REFERENCES "entry_orders"("entry_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_departure_order_id_fkey" FOREIGN KEY ("departure_order_id") REFERENCES "departure_orders"("departure_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;
