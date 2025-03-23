/*
  Warnings:

  - You are about to drop the column `temperature` on the `entry_orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "departure_orders" ADD COLUMN     "departure_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "departure_transfer_note" TEXT,
ADD COLUMN     "insured_value" DECIMAL(10,2),
ADD COLUMN     "palettes" TEXT,
ADD COLUMN     "product_description" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "total_qty" TEXT,
ADD COLUMN     "total_volume" TEXT,
ADD COLUMN     "total_weight" TEXT,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "temperature",
ADD COLUMN     "max_temperature" TEXT,
ADD COLUMN     "min_temperature" TEXT;
