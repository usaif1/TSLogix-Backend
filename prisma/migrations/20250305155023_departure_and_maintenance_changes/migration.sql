/*
  Warnings:

  - You are about to drop the column `temperature_id` on the `product_lines` table. All the data in the column will be lost.
  - You are about to drop the column `country_id` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `last_maintenance_date` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `maintenance_schedule` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `temperatures` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `temperature_range_id` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "product_lines" DROP CONSTRAINT "product_lines_temperature_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_country_id_fkey";

-- DropIndex
DROP INDEX "idx_product_maintenance";

-- AlterTable
ALTER TABLE "departure_orders" ADD COLUMN     "supplier_id" TEXT;

-- AlterTable
ALTER TABLE "product_lines" DROP COLUMN "temperature_id";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "country_id",
DROP COLUMN "last_maintenance_date",
DROP COLUMN "maintenance_schedule",
ADD COLUMN     "humidity" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "storage_conditions" TEXT,
ADD COLUMN     "temperature_range_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country_id" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "ruc" TEXT;

-- DropTable
DROP TABLE "temperatures";

-- CreateTable
CREATE TABLE "temperature_ranges" (
    "temperature_id" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "min_celsius" INTEGER,
    "max_celsius" INTEGER,

    CONSTRAINT "temperature_ranges_pkey" PRIMARY KEY ("temperature_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "temperature_ranges_range_key" ON "temperature_ranges"("range");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("country_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_temperature_range_id_fkey" FOREIGN KEY ("temperature_range_id") REFERENCES "temperature_ranges"("temperature_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;
