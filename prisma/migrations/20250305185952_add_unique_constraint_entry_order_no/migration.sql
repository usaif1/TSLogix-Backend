/*
  Warnings:

  - A unique constraint covering the columns `[entry_order_no]` on the table `entry_orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "entry_orders_entry_order_no_key" ON "entry_orders"("entry_order_no");
