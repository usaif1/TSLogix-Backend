-- AlterTable
ALTER TABLE "departure_orders" ADD COLUMN     "entry_order_id" TEXT;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_entry_order_id_fkey" FOREIGN KEY ("entry_order_id") REFERENCES "entry_orders"("entry_order_id") ON DELETE SET NULL ON UPDATE CASCADE;
