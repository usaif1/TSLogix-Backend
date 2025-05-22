/*
  Warnings:

  - The values [V,T,R] on the enum `CellKind` will be removed. If these variants are still used in the database, this will fail.
  - The values [PARTIALLY_OCCUPIED,MAINTENANCE,RESERVED,BLOCKED] on the enum `CellStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [BOTH] on the enum `DocumentApplicableTo` will be removed. If these variants are still used in the database, this will fail.
  - The values [CLIENT,STAFF] on the enum `RoleName` will be removed. If these variants are still used in the database, this will fail.
  - The `total_qty` column on the `departure_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `total_volume` column on the `departure_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `total_weight` column on the `departure_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `cell_assigned_at` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `cell_id` on the `entry_orders` table. All the data in the column will be lost.
  - The `quantity_packaging` column on the `entry_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `total_qty` column on the `entry_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `total_volume` column on the `entry_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `total_weight` column on the `entry_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `palettes` column on the `entry_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `audit_status` on table `entry_orders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CellKind_new" AS ENUM ('NORMAL', 'DAMAGED', 'TRANSFER', 'RESERVED');
ALTER TABLE "warehouse_cells" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "warehouse_cells" ALTER COLUMN "kind" TYPE "CellKind_new" USING ("kind"::text::"CellKind_new");
ALTER TYPE "CellKind" RENAME TO "CellKind_old";
ALTER TYPE "CellKind_new" RENAME TO "CellKind";
DROP TYPE "CellKind_old";
ALTER TABLE "warehouse_cells" ALTER COLUMN "kind" SET DEFAULT 'NORMAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CellStatus_new" AS ENUM ('AVAILABLE', 'OCCUPIED');
ALTER TABLE "warehouse_cells" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "warehouse_cells" ALTER COLUMN "status" TYPE "CellStatus_new" USING ("status"::text::"CellStatus_new");
ALTER TYPE "CellStatus" RENAME TO "CellStatus_old";
ALTER TYPE "CellStatus_new" RENAME TO "CellStatus";
DROP TYPE "CellStatus_old";
ALTER TABLE "warehouse_cells" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DocumentApplicableTo_new" AS ENUM ('ENTRY', 'DEPARTURE');
ALTER TYPE "DocumentApplicableTo" RENAME TO "DocumentApplicableTo_old";
ALTER TYPE "DocumentApplicableTo_new" RENAME TO "DocumentApplicableTo";
DROP TYPE "DocumentApplicableTo_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RoleName_new" AS ENUM ('CUSTOMER', 'WAREHOUSE', 'ADMIN');
ALTER TABLE "roles" ALTER COLUMN "name" TYPE "RoleName_new" USING ("name"::text::"RoleName_new");
ALTER TYPE "RoleName" RENAME TO "RoleName_old";
ALTER TYPE "RoleName_new" RENAME TO "RoleName";
DROP TYPE "RoleName_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_cell_id_fkey";

-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "total_qty",
ADD COLUMN     "total_qty" INTEGER,
DROP COLUMN "total_volume",
ADD COLUMN     "total_volume" DECIMAL(10,2),
DROP COLUMN "total_weight",
ADD COLUMN     "total_weight" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "entry_order_audits" ADD COLUMN     "discrepancy_notes" TEXT,
ADD COLUMN     "verified_packaging_qty" INTEGER,
ADD COLUMN     "verified_weight" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "cell_assigned_at",
DROP COLUMN "cell_id",
ADD COLUMN     "remaining_packaging_qty" INTEGER,
ADD COLUMN     "remaining_weight" DECIMAL(10,2),
DROP COLUMN "quantity_packaging",
ADD COLUMN     "quantity_packaging" INTEGER,
DROP COLUMN "total_qty",
ADD COLUMN     "total_qty" INTEGER,
DROP COLUMN "total_volume",
ADD COLUMN     "total_volume" DECIMAL(10,2),
DROP COLUMN "total_weight",
ADD COLUMN     "total_weight" DECIMAL(10,2),
DROP COLUMN "palettes",
ADD COLUMN     "palettes" INTEGER,
ALTER COLUMN "audit_status" SET NOT NULL;

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "packaging_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "volume" DECIMAL(10,2),
ADD COLUMN     "weight" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "inventory_logs" ADD COLUMN     "cell_assignment_id" TEXT,
ADD COLUMN     "packaging_change" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weight_change" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "warehouse_cells" ADD COLUMN     "current_packaging_qty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "current_weight" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "cell_assignments" (
    "assignment_id" TEXT NOT NULL,
    "entry_order_id" TEXT,
    "departure_order_id" TEXT,
    "cell_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,
    "packaging_quantity" INTEGER NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "volume" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "cell_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- AddForeignKey
ALTER TABLE "cell_assignments" ADD CONSTRAINT "cell_assignments_entry_order_id_fkey" FOREIGN KEY ("entry_order_id") REFERENCES "entry_orders"("entry_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_assignments" ADD CONSTRAINT "cell_assignments_departure_order_id_fkey" FOREIGN KEY ("departure_order_id") REFERENCES "departure_orders"("departure_order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_assignments" ADD CONSTRAINT "cell_assignments_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_assignments" ADD CONSTRAINT "cell_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
