/*
  Warnings:

  - You are about to drop the column `product_list` on the `entry_orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "product_list",
ADD COLUMN     "active_state_id" TEXT,
ADD COLUMN     "batch_number" TEXT,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "order_progress" TEXT,
ADD COLUMN     "product_line_id" TEXT,
ADD COLUMN     "quality_check" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "received_quantity" INTEGER,
ADD COLUMN     "storage_location" TEXT,
ADD COLUMN     "temperature_id" TEXT,
ADD COLUMN     "unit" TEXT;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_lines"("product_line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_temperature_id_fkey" FOREIGN KEY ("temperature_id") REFERENCES "temperatures"("temperature_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_active_state_id_fkey" FOREIGN KEY ("active_state_id") REFERENCES "active_states"("state_id") ON DELETE SET NULL ON UPDATE CASCADE;
