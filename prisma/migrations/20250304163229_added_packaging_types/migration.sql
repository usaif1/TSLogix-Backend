/*
  Warnings:

  - You are about to drop the column `shipping_requirements` on the `labels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "departure_orders" ADD COLUMN     "packaging_id" TEXT;

-- AlterTable
ALTER TABLE "labels" DROP COLUMN "shipping_requirements";

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_packaging_id_fkey" FOREIGN KEY ("packaging_id") REFERENCES "packaging_types"("packaging_type_id") ON DELETE SET NULL ON UPDATE CASCADE;
