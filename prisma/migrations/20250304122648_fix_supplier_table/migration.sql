/*
  Warnings:

  - You are about to drop the column `active_state_id` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `country_id` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `document_types` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `last_maintenance_date` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `maintenance_notes` on the `suppliers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_active_state_id_fkey";

-- DropForeignKey
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_country_id_fkey";

-- DropIndex
DROP INDEX "idx_supplier_country";

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "active_state_id",
DROP COLUMN "country_id",
DROP COLUMN "document_types",
DROP COLUMN "last_maintenance_date",
DROP COLUMN "maintenance_notes";
