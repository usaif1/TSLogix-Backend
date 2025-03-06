/*
  Warnings:

  - You are about to drop the column `supplier_id` on the `departure_orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_supplier_id_fkey";

-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "supplier_id";
