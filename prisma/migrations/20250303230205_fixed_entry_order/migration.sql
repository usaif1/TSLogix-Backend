/*
  Warnings:

  - You are about to drop the column `batch_number` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_date` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_progress_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `quality_check` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `received_quantity` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `storage_location` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `entry_orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "batch_number",
DROP COLUMN "expiry_date",
DROP COLUMN "order_progress_id",
DROP COLUMN "quality_check",
DROP COLUMN "received_quantity",
DROP COLUMN "storage_location",
DROP COLUMN "unit",
ADD COLUMN     "order_progress" TEXT;
