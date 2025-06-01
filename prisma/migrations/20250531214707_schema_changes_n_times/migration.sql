/*
  Warnings:

  - You are about to drop the column `departure_order_product_id` on the `cell_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `entry_order_product_id` on the `cell_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_status` on the `cell_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_type` on the `cell_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `volume` on the `cell_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `insured_value` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_code` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_status` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_type` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `palettes` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `product_description` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `total_qty` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `total_volume` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `total_weight` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `arrival_point` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `date_and_time_of_transfer` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `departure_date` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `departure_transfer_note` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `document_no` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `document_status` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `entry_order_id` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `id_responsible` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_progress` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_list` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `personnel_in_charge_id` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `responsible_for_collection` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `audit_status` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `mfd_date_time` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_code` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_status` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_type` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `palettes` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `product_description` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_packaging` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_packaging_qty` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_weight` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `technical_specification` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `total_qty` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `total_volume` on the `entry_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `total_weight` on the `entry_order_products` table. All the data in the column will be lost.
  - The `presentation` column on the `entry_order_products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `admission_date_time` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `audit_status` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `certificate_protocol_analysis` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `document_status` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `entry_date` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `entry_transfer_note` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `lot_series` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_progress` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `personnel_incharge_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `status_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `supplier_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `entry_orders` table. All the data in the column will be lost.
  - The `cif_value` column on the `entry_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `departure_order_id` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `departure_order_product_id` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `entry_order_id` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `entry_order_product_id` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_code` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_quantity` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_status` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_type` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `volume` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `audit_id` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the column `cell_assignment_id` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the column `last_updated` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_change` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_code` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_status` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the column `packaging_type` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the column `product_audit_id` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the `entry_order_product_audits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `statuses` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[departure_order_id,product_code]` on the table `departure_order_products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[departure_order_no]` on the table `departure_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entry_order_id,product_code]` on the table `entry_order_products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[allocation_id,cell_id]` on the table `inventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product_code` to the `departure_order_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requested_packages` to the `departure_order_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requested_quantity` to the `departure_order_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requested_weight` to the `departure_order_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `departure_orders` table without a default value. This is not possible if the table is not empty.
  - Made the column `customer_id` on table `departure_orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `departure_order_no` on table `departure_orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registration_date` on table `departure_orders` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `type` to the `document_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventory_quantity` to the `entry_order_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `package_quantity` to the `entry_order_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_code` to the `entry_order_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight_kg` to the `entry_order_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `entry_orders` table without a default value. This is not possible if the table is not empty.
  - Made the column `entry_order_no` on table `entry_orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registration_date` on table `entry_orders` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `current_package_quantity` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_quantity` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_weight` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_updated` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_status` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_code` to the `inventory` table without a default value. This is not possible if the table is not empty.
  - Made the column `cell_id` on table `inventory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `warehouse_id` on table `inventory` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `type` to the `origins` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OriginType" AS ENUM ('COMPRA_LOCAL', 'IMPORTACION', 'DEVOLUCION', 'ACONDICIONADO', 'TRANSFERENCIA_INTERNA', 'FRACCIONADO');

-- CreateEnum
CREATE TYPE "DocumentTypeEntry" AS ENUM ('PACKING_LIST', 'FACTURA', 'CERTIFICADO_ANALISIS', 'RRSS', 'PERMISO_ESPECIAL', 'OTRO');

-- CreateEnum
CREATE TYPE "DocumentTypeDeparture" AS ENUM ('INVOICE', 'DELIVERY_NOTE', 'TRANSFER_RECEIPT', 'SHIPPING_MANIFEST', 'CUSTOMS_DECLARATION', 'OTRO');

-- CreateEnum
CREATE TYPE "OrderStatusEntry" AS ENUM ('REVISION', 'PRESENTACION', 'FINALIZACION');

-- CreateEnum
CREATE TYPE "OrderStatusDeparture" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PresentationType" AS ENUM ('CAJA', 'PALETA', 'SACO', 'UNIDAD', 'PAQUETE', 'TAMBOS', 'BULTO', 'OTRO');

-- CreateEnum
CREATE TYPE "TemperatureRangeType" AS ENUM ('RANGE_15_30', 'RANGE_15_25', 'RANGE_2_8', 'AMBIENTE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('PAL_NORMAL', 'CAJ_NORMAL', 'SAC_NORMAL', 'UNI_NORMAL', 'PAQ_NORMAL', 'TAM_NORMAL', 'BUL_NORMAL', 'OTR_NORMAL', 'PAL_DANADA', 'CAJ_DANADA', 'SAC_DANADO', 'UNI_DANADA', 'PAQ_DANADO', 'TAM_DANADO', 'BUL_DANADO', 'OTR_DANADO');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');

-- DropForeignKey
ALTER TABLE "cell_assignments" DROP CONSTRAINT "cell_assignments_departure_order_id_fkey";

-- DropForeignKey
ALTER TABLE "cell_assignments" DROP CONSTRAINT "cell_assignments_departure_order_product_id_fkey";

-- DropForeignKey
ALTER TABLE "cell_assignments" DROP CONSTRAINT "cell_assignments_entry_order_id_fkey";

-- DropForeignKey
ALTER TABLE "cell_assignments" DROP CONSTRAINT "cell_assignments_entry_order_product_id_fkey";

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_document_type_id_fkey";

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_entry_order_id_fkey";

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_personnel_in_charge_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_order_product_audits" DROP CONSTRAINT "entry_order_product_audits_audited_by_fkey";

-- DropForeignKey
ALTER TABLE "entry_order_product_audits" DROP CONSTRAINT "entry_order_product_audits_entry_order_product_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_personnel_incharge_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_status_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_cell_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_departure_order_product_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_entry_order_product_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_logs" DROP CONSTRAINT "inventory_logs_audit_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_logs" DROP CONSTRAINT "inventory_logs_cell_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_logs" DROP CONSTRAINT "inventory_logs_product_audit_id_fkey";

-- DropIndex
DROP INDEX "departure_order_products_departure_order_id_product_id_key";

-- DropIndex
DROP INDEX "entry_order_products_entry_order_id_product_id_key";

-- DropIndex
DROP INDEX "idx_inventory_cell";

-- DropIndex
DROP INDEX "idx_inventory_departure_order";

-- DropIndex
DROP INDEX "inventory_product_id_warehouse_id_cell_id_entry_order_produ_key";

-- AlterTable
ALTER TABLE "cell_assignments" DROP COLUMN "departure_order_product_id",
DROP COLUMN "entry_order_product_id",
DROP COLUMN "packaging_status",
DROP COLUMN "packaging_type",
DROP COLUMN "volume";

-- AlterTable
ALTER TABLE "departure_order_products" DROP COLUMN "insured_value",
DROP COLUMN "packaging_code",
DROP COLUMN "packaging_status",
DROP COLUMN "packaging_type",
DROP COLUMN "palettes",
DROP COLUMN "product_description",
DROP COLUMN "total_qty",
DROP COLUMN "total_volume",
DROP COLUMN "total_weight",
DROP COLUMN "type",
ADD COLUMN     "delivery_instructions" TEXT,
ADD COLUMN     "lot_series" TEXT,
ADD COLUMN     "presentation" "PresentationType" NOT NULL DEFAULT 'CAJA',
ADD COLUMN     "product_code" TEXT NOT NULL,
ADD COLUMN     "requested_packages" INTEGER NOT NULL,
ADD COLUMN     "requested_pallets" INTEGER,
ADD COLUMN     "requested_quantity" INTEGER NOT NULL,
ADD COLUMN     "requested_volume" DECIMAL(10,2),
ADD COLUMN     "requested_weight" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "special_handling" TEXT,
ADD COLUMN     "temperature_requirement" "TemperatureRangeType" NOT NULL DEFAULT 'AMBIENTE',
ADD COLUMN     "total_value" DECIMAL(10,2),
ADD COLUMN     "unit_price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "arrival_point",
DROP COLUMN "date_and_time_of_transfer",
DROP COLUMN "departure_date",
DROP COLUMN "departure_transfer_note",
DROP COLUMN "document_no",
DROP COLUMN "document_status",
DROP COLUMN "entry_order_id",
DROP COLUMN "id_responsible",
DROP COLUMN "order_progress",
DROP COLUMN "packaging_list",
DROP COLUMN "personnel_in_charge_id",
DROP COLUMN "responsible_for_collection",
ADD COLUMN     "carrier_name" TEXT,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "departure_date_time" TIMESTAMP(3),
ADD COLUMN     "destination_point" TEXT,
ADD COLUMN     "order_status" "OrderStatusDeparture" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "review_comments" TEXT,
ADD COLUMN     "review_status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" TEXT,
ADD COLUMN     "total_pallets" INTEGER,
ADD COLUMN     "total_value" DECIMAL(10,2),
ADD COLUMN     "total_volume" DECIMAL(10,2),
ADD COLUMN     "total_weight" DECIMAL(10,2),
ADD COLUMN     "transport_type" TEXT,
ADD COLUMN     "uploaded_documents" JSONB,
ALTER COLUMN "customer_id" SET NOT NULL,
ALTER COLUMN "departure_order_no" SET NOT NULL,
ALTER COLUMN "registration_date" SET NOT NULL,
ALTER COLUMN "registration_date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "document_types" ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" "DocumentTypeEntry" NOT NULL;

-- AlterTable
ALTER TABLE "entry_order_products" DROP COLUMN "audit_status",
DROP COLUMN "mfd_date_time",
DROP COLUMN "packaging_code",
DROP COLUMN "packaging_status",
DROP COLUMN "packaging_type",
DROP COLUMN "palettes",
DROP COLUMN "product_description",
DROP COLUMN "quantity_packaging",
DROP COLUMN "remaining_packaging_qty",
DROP COLUMN "remaining_weight",
DROP COLUMN "technical_specification",
DROP COLUMN "total_qty",
DROP COLUMN "total_volume",
DROP COLUMN "total_weight",
ADD COLUMN     "guide_number" TEXT,
ADD COLUMN     "health_registration" TEXT,
ADD COLUMN     "humidity" TEXT,
ADD COLUMN     "inventory_quantity" INTEGER NOT NULL,
ADD COLUMN     "lot_series" TEXT,
ADD COLUMN     "manufacturing_date" TIMESTAMP(3),
ADD COLUMN     "package_quantity" INTEGER NOT NULL,
ADD COLUMN     "product_code" TEXT NOT NULL,
ADD COLUMN     "quantity_pallets" INTEGER,
ADD COLUMN     "serial_number" TEXT,
ADD COLUMN     "supplier_id" TEXT,
ADD COLUMN     "temperature_range" "TemperatureRangeType" NOT NULL DEFAULT 'AMBIENTE',
ADD COLUMN     "volume_m3" DECIMAL(10,2),
ADD COLUMN     "weight_kg" DECIMAL(10,2) NOT NULL,
DROP COLUMN "presentation",
ADD COLUMN     "presentation" "PresentationType" NOT NULL DEFAULT 'CAJA';

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "admission_date_time",
DROP COLUMN "audit_status",
DROP COLUMN "certificate_protocol_analysis",
DROP COLUMN "comments",
DROP COLUMN "document_status",
DROP COLUMN "entry_date",
DROP COLUMN "entry_transfer_note",
DROP COLUMN "lot_series",
DROP COLUMN "order_progress",
DROP COLUMN "personnel_incharge_id",
DROP COLUMN "status_id",
DROP COLUMN "supplier_id",
DROP COLUMN "type",
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "entry_date_time" TIMESTAMP(3),
ADD COLUMN     "order_status" "OrderStatusEntry" NOT NULL DEFAULT 'REVISION',
ADD COLUMN     "review_comments" TEXT,
ADD COLUMN     "review_status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" TEXT,
ADD COLUMN     "total_pallets" INTEGER,
ADD COLUMN     "total_volume" DECIMAL(10,2),
ADD COLUMN     "total_weight" DECIMAL(10,2),
ADD COLUMN     "uploaded_documents" JSONB,
DROP COLUMN "cif_value",
ADD COLUMN     "cif_value" DECIMAL(10,2),
ALTER COLUMN "entry_order_no" SET NOT NULL,
ALTER COLUMN "registration_date" SET NOT NULL,
ALTER COLUMN "registration_date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "departure_order_id",
DROP COLUMN "departure_order_product_id",
DROP COLUMN "entry_order_id",
DROP COLUMN "entry_order_product_id",
DROP COLUMN "expiration_date",
DROP COLUMN "packaging_code",
DROP COLUMN "packaging_quantity",
DROP COLUMN "packaging_status",
DROP COLUMN "packaging_type",
DROP COLUMN "quantity",
DROP COLUMN "volume",
DROP COLUMN "weight",
ADD COLUMN     "allocation_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "current_package_quantity" INTEGER NOT NULL,
ADD COLUMN     "current_quantity" INTEGER NOT NULL,
ADD COLUMN     "current_volume" DECIMAL(10,2),
ADD COLUMN     "current_weight" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "last_updated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "product_status" "ProductStatus" NOT NULL,
ADD COLUMN     "status_code" INTEGER NOT NULL,
ALTER COLUMN "cell_id" SET NOT NULL,
ALTER COLUMN "warehouse_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "inventory_logs" DROP COLUMN "audit_id",
DROP COLUMN "cell_assignment_id",
DROP COLUMN "last_updated",
DROP COLUMN "packaging_change",
DROP COLUMN "packaging_code",
DROP COLUMN "packaging_status",
DROP COLUMN "packaging_type",
DROP COLUMN "product_audit_id",
ADD COLUMN     "allocation_id" TEXT,
ADD COLUMN     "departure_allocation_id" TEXT,
ADD COLUMN     "package_change" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "product_status" "ProductStatus",
ADD COLUMN     "status_code" INTEGER,
ADD COLUMN     "volume_change" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "origins" ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" "OriginType" NOT NULL;

-- DropTable
DROP TABLE "entry_order_product_audits";

-- DropTable
DROP TABLE "order_types";

-- DropTable
DROP TABLE "statuses";

-- CreateTable
CREATE TABLE "departure_document_types" (
    "document_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentTypeDeparture" NOT NULL,
    "description" TEXT,

    CONSTRAINT "departure_document_types_pkey" PRIMARY KEY ("document_type_id")
);

-- CreateTable
CREATE TABLE "inventory_allocations" (
    "allocation_id" TEXT NOT NULL,
    "entry_order_id" TEXT NOT NULL,
    "entry_order_product_id" TEXT NOT NULL,
    "inventory_quantity" INTEGER NOT NULL,
    "package_quantity" INTEGER NOT NULL,
    "quantity_pallets" INTEGER,
    "presentation" "PresentationType" NOT NULL DEFAULT 'PALETA',
    "weight_kg" DECIMAL(10,2) NOT NULL,
    "volume_m3" DECIMAL(10,2),
    "cell_id" TEXT NOT NULL,
    "product_status" "ProductStatus" NOT NULL DEFAULT 'PAL_NORMAL',
    "status_code" INTEGER NOT NULL,
    "guide_number" TEXT,
    "uploaded_documents" JSONB,
    "observations" TEXT,
    "allocated_by" TEXT NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "inventory_allocations_pkey" PRIMARY KEY ("allocation_id")
);

-- CreateTable
CREATE TABLE "departure_allocations" (
    "allocation_id" TEXT NOT NULL,
    "departure_order_id" TEXT NOT NULL,
    "departure_order_product_id" TEXT NOT NULL,
    "source_allocation_id" TEXT NOT NULL,
    "allocated_quantity" INTEGER NOT NULL,
    "allocated_packages" INTEGER NOT NULL,
    "allocated_pallets" INTEGER,
    "presentation" "PresentationType" NOT NULL DEFAULT 'PALETA',
    "allocated_weight" DECIMAL(10,2) NOT NULL,
    "allocated_volume" DECIMAL(10,2),
    "cell_id" TEXT NOT NULL,
    "product_status" "ProductStatus" NOT NULL,
    "status_code" INTEGER NOT NULL,
    "guide_number" TEXT,
    "uploaded_documents" JSONB,
    "observations" TEXT,
    "allocated_by" TEXT NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "departure_allocations_pkey" PRIMARY KEY ("allocation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departure_document_types_name_key" ON "departure_document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departure_order_products_departure_order_id_product_code_key" ON "departure_order_products"("departure_order_id", "product_code");

-- CreateIndex
CREATE UNIQUE INDEX "departure_orders_departure_order_no_key" ON "departure_orders"("departure_order_no");

-- CreateIndex
CREATE UNIQUE INDEX "entry_order_products_entry_order_id_product_code_key" ON "entry_order_products"("entry_order_id", "product_code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_allocation_id_cell_id_key" ON "inventory"("allocation_id", "cell_id");

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_order_products" ADD CONSTRAINT "entry_order_products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_entry_order_id_fkey" FOREIGN KEY ("entry_order_id") REFERENCES "entry_orders"("entry_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_entry_order_product_id_fkey" FOREIGN KEY ("entry_order_product_id") REFERENCES "entry_order_products"("entry_order_product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_allocated_by_fkey" FOREIGN KEY ("allocated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "departure_document_types"("document_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_allocations" ADD CONSTRAINT "departure_allocations_departure_order_id_fkey" FOREIGN KEY ("departure_order_id") REFERENCES "departure_orders"("departure_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_allocations" ADD CONSTRAINT "departure_allocations_departure_order_product_id_fkey" FOREIGN KEY ("departure_order_product_id") REFERENCES "departure_order_products"("departure_order_product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_allocations" ADD CONSTRAINT "departure_allocations_source_allocation_id_fkey" FOREIGN KEY ("source_allocation_id") REFERENCES "inventory_allocations"("allocation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_allocations" ADD CONSTRAINT "departure_allocations_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_allocations" ADD CONSTRAINT "departure_allocations_allocated_by_fkey" FOREIGN KEY ("allocated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "inventory_allocations"("allocation_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "inventory_allocations"("allocation_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_departure_allocation_id_fkey" FOREIGN KEY ("departure_allocation_id") REFERENCES "departure_allocations"("allocation_id") ON DELETE SET NULL ON UPDATE CASCADE;
