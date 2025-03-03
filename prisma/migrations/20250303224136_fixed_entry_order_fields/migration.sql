/*
  Warnings:

  - You are about to drop the column `active_state_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_progress` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `product_line_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `temperature_id` on the `entry_orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_active_state_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_product_line_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_temperature_id_fkey";

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "active_state_id",
DROP COLUMN "order_progress",
DROP COLUMN "product_line_id",
DROP COLUMN "temperature_id",
ADD COLUMN     "activeStateState_id" TEXT,
ADD COLUMN     "admission_date_time" TIMESTAMP(3),
ADD COLUMN     "cif_value" TEXT,
ADD COLUMN     "document_date" TIMESTAMP(3),
ADD COLUMN     "document_status" TEXT,
ADD COLUMN     "entry_order_no" TEXT,
ADD COLUMN     "expiration_date" TIMESTAMP(3),
ADD COLUMN     "humidity" TEXT,
ADD COLUMN     "lot_series" TEXT,
ADD COLUMN     "mfd_date_time" TIMESTAMP(3),
ADD COLUMN     "observation" TEXT,
ADD COLUMN     "order_progress_id" TEXT,
ADD COLUMN     "personnel_incharge_id" TEXT,
ADD COLUMN     "presentation" TEXT,
ADD COLUMN     "product" TEXT,
ADD COLUMN     "productLineProduct_line_id" TEXT,
ADD COLUMN     "protocol_analysis_certificate" TEXT,
ADD COLUMN     "quantity_packaging" TEXT,
ADD COLUMN     "registration_date" TIMESTAMP(3),
ADD COLUMN     "technical_specification" TEXT,
ADD COLUMN     "temperature" TEXT,
ADD COLUMN     "temperatureTemperature_id" TEXT,
ADD COLUMN     "total_qty" TEXT,
ADD COLUMN     "total_volume" TEXT,
ADD COLUMN     "total_weight" TEXT;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_personnel_incharge_id_fkey" FOREIGN KEY ("personnel_incharge_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_productLineProduct_line_id_fkey" FOREIGN KEY ("productLineProduct_line_id") REFERENCES "product_lines"("product_line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_temperatureTemperature_id_fkey" FOREIGN KEY ("temperatureTemperature_id") REFERENCES "temperatures"("temperature_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_activeStateState_id_fkey" FOREIGN KEY ("activeStateState_id") REFERENCES "active_states"("state_id") ON DELETE SET NULL ON UPDATE CASCADE;
