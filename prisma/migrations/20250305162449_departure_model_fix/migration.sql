/*
  Warnings:

  - A unique constraint covering the columns `[order_id]` on the table `departure_orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_id` to the `departure_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_departure_order_id_fkey";

-- AlterTable
ALTER TABLE "departure_orders" ADD COLUMN     "order_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "departure_orders_order_id_key" ON "departure_orders"("order_id");

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_exit_option_id_fkey" FOREIGN KEY ("exit_option_id") REFERENCES "exit_options"("exit_option_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("label_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_packaging_id_fkey" FOREIGN KEY ("packaging_id") REFERENCES "packaging_types"("packaging_type_id") ON DELETE SET NULL ON UPDATE CASCADE;
