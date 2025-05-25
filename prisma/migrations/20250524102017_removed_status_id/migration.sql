/*
  Warnings:

  - You are about to drop the column `status_id` on the `departure_orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_status_id_fkey";

-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "status_id",
ADD COLUMN     "packaging_list" TEXT;
