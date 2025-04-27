-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "departure_order_id" TEXT;

-- CreateIndex
CREATE INDEX "idx_inventory_departure_order" ON "inventory"("departure_order_id");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_departure_order_id_fkey" FOREIGN KEY ("departure_order_id") REFERENCES "departure_orders"("departure_order_id") ON DELETE SET NULL ON UPDATE CASCADE;
