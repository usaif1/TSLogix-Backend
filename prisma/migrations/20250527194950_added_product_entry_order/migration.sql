/*
  Warnings:

  - You are about to drop the column `insured_value` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_id` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `palettes` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `product_description` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `total_qty` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `total_volume` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `total_weight` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `humidity` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `insured_value` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `max_temperature` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `mfd_date_time` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `min_temperature` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `palettes` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `presentation` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `product_description` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_packaging` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_packaging_qty` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_weight` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `technical_specification` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `total_qty` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `total_volume` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `total_weight` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the `packaging_types` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[product_id,warehouse_id,cell_id,entry_order_product_id]` on the table `inventory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[product_code]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `packaging_code` to the `cell_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packaging_code` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packaging_code` to the `inventory_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_code` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PackagingStatus" AS ENUM ('NORMAL', 'PARTIALLY_DAMAGED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "PackagingType" AS ENUM ('PALET', 'BOX', 'SACK', 'UNIT', 'PACK', 'BARRELS', 'BUNDLE', 'OTHER');

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_packaging_id_fkey";

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_product_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_product_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_departure_order_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_entry_order_id_fkey";

-- DropIndex
DROP INDEX "inventory_product_id_warehouse_id_cell_id_key";

-- AlterTable
ALTER TABLE "cell_assignments" ADD COLUMN     "departure_order_product_id" TEXT,
ADD COLUMN     "entry_order_product_id" TEXT,
ADD COLUMN     "packaging_code" INTEGER NOT NULL,
ADD COLUMN     "packaging_status" "PackagingStatus" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "packaging_type" "PackagingType" NOT NULL DEFAULT 'BOX';

-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "insured_value",
DROP COLUMN "packaging_id",
DROP COLUMN "palettes",
DROP COLUMN "product_description",
DROP COLUMN "product_id",
DROP COLUMN "total_qty",
DROP COLUMN "total_volume",
DROP COLUMN "total_weight",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "expiration_date",
DROP COLUMN "humidity",
DROP COLUMN "insured_value",
DROP COLUMN "max_temperature",
DROP COLUMN "mfd_date_time",
DROP COLUMN "min_temperature",
DROP COLUMN "palettes",
DROP COLUMN "presentation",
DROP COLUMN "product_description",
DROP COLUMN "product_id",
DROP COLUMN "quantity_packaging",
DROP COLUMN "remaining_packaging_qty",
DROP COLUMN "remaining_weight",
DROP COLUMN "technical_specification",
DROP COLUMN "total_qty",
DROP COLUMN "total_volume",
DROP COLUMN "total_weight";

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "departure_order_product_id" TEXT,
ADD COLUMN     "entry_order_product_id" TEXT,
ADD COLUMN     "packaging_code" INTEGER NOT NULL,
ADD COLUMN     "packaging_status" "PackagingStatus" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "packaging_type" "PackagingType" NOT NULL DEFAULT 'BOX';

-- AlterTable
ALTER TABLE "inventory_logs" ADD COLUMN     "departure_order_product_id" TEXT,
ADD COLUMN     "entry_order_product_id" TEXT,
ADD COLUMN     "packaging_code" INTEGER NOT NULL,
ADD COLUMN     "packaging_status" "PackagingStatus" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "packaging_type" "PackagingType" NOT NULL DEFAULT 'BOX',
ADD COLUMN     "product_audit_id" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "product_code" TEXT NOT NULL;

-- DropTable
DROP TABLE "packaging_types";

-- CreateTable
CREATE TABLE "entry_order_products" (
    "entry_order_product_id" TEXT NOT NULL,
    "entry_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity_packaging" INTEGER NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "total_weight" DECIMAL(10,2) NOT NULL,
    "total_volume" DECIMAL(10,2),
    "palettes" INTEGER,
    "presentation" TEXT,
    "product_description" TEXT,
    "insured_value" DECIMAL(10,2),
    "technical_specification" TEXT,
    "expiration_date" TIMESTAMP(3),
    "mfd_date_time" TIMESTAMP(3),
    "packaging_type" "PackagingType" NOT NULL DEFAULT 'BOX',
    "packaging_status" "PackagingStatus" NOT NULL DEFAULT 'NORMAL',
    "packaging_code" INTEGER NOT NULL,
    "remaining_packaging_qty" INTEGER NOT NULL,
    "remaining_weight" DECIMAL(10,2) NOT NULL,
    "audit_status" "AuditResult" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "entry_order_products_pkey" PRIMARY KEY ("entry_order_product_id")
);

-- CreateTable
CREATE TABLE "entry_order_product_audits" (
    "audit_id" TEXT NOT NULL,
    "entry_order_product_id" TEXT NOT NULL,
    "audited_by" TEXT NOT NULL,
    "audit_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit_result" "AuditResult" NOT NULL,
    "comments" TEXT,
    "discrepancy_notes" TEXT,
    "packaging_condition" "PackagingStatus",

    CONSTRAINT "entry_order_product_audits_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "departure_order_products" (
    "departure_order_product_id" TEXT NOT NULL,
    "departure_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "total_weight" DECIMAL(10,2) NOT NULL,
    "total_volume" DECIMAL(10,2),
    "palettes" TEXT,
    "insured_value" DECIMAL(10,2),
    "product_description" TEXT,
    "type" TEXT,
    "packaging_type" "PackagingType" NOT NULL DEFAULT 'BOX',
    "packaging_status" "PackagingStatus" NOT NULL DEFAULT 'NORMAL',
    "packaging_code" INTEGER NOT NULL,

    CONSTRAINT "departure_order_products_pkey" PRIMARY KEY ("departure_order_product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entry_order_products_entry_order_id_product_id_key" ON "entry_order_products"("entry_order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "departure_order_products_departure_order_id_product_id_key" ON "departure_order_products"("departure_order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_warehouse_id_cell_id_entry_order_produ_key" ON "inventory"("product_id", "warehouse_id", "cell_id", "entry_order_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- AddForeignKey
ALTER TABLE "entry_order_products" ADD CONSTRAINT "entry_order_products_entry_order_id_fkey" FOREIGN KEY ("entry_order_id") REFERENCES "entry_orders"("entry_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_order_products" ADD CONSTRAINT "entry_order_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_order_product_audits" ADD CONSTRAINT "entry_order_product_audits_entry_order_product_id_fkey" FOREIGN KEY ("entry_order_product_id") REFERENCES "entry_order_products"("entry_order_product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_order_product_audits" ADD CONSTRAINT "entry_order_product_audits_audited_by_fkey" FOREIGN KEY ("audited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_order_products" ADD CONSTRAINT "departure_order_products_departure_order_id_fkey" FOREIGN KEY ("departure_order_id") REFERENCES "departure_orders"("departure_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_order_products" ADD CONSTRAINT "departure_order_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_assignments" ADD CONSTRAINT "cell_assignments_entry_order_product_id_fkey" FOREIGN KEY ("entry_order_product_id") REFERENCES "entry_order_products"("entry_order_product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_assignments" ADD CONSTRAINT "cell_assignments_departure_order_product_id_fkey" FOREIGN KEY ("departure_order_product_id") REFERENCES "departure_order_products"("departure_order_product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_entry_order_product_id_fkey" FOREIGN KEY ("entry_order_product_id") REFERENCES "entry_order_products"("entry_order_product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_departure_order_product_id_fkey" FOREIGN KEY ("departure_order_product_id") REFERENCES "departure_order_products"("departure_order_product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_audit_id_fkey" FOREIGN KEY ("product_audit_id") REFERENCES "entry_order_product_audits"("audit_id") ON DELETE SET NULL ON UPDATE CASCADE;
