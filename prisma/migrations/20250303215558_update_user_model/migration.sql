/*
  Warnings:

  - A unique constraint covering the columns `[order_id]` on the table `entry_orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_id` to the `entry_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_entry_order_id_fkey";

-- AlterTable
ALTER TABLE "entry_orders" ADD COLUMN     "order_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "entry_orders_order_id_key" ON "entry_orders"("order_id");

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;
