/*
  Warnings:

  - You are about to drop the column `verified_packaging_qty` on the `entry_order_audits` table. All the data in the column will be lost.
  - You are about to drop the column `verified_weight` on the `entry_order_audits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cell_assignments" ADD COLUMN     "warehouse_id" TEXT;

-- AlterTable
ALTER TABLE "entry_order_audits" DROP COLUMN "verified_packaging_qty",
DROP COLUMN "verified_weight";
