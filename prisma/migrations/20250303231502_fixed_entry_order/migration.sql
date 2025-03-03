/*
  Warnings:

  - You are about to drop the column `activeStateState_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `productLineProduct_line_id` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `temperatureTemperature_id` on the `entry_orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_activeStateState_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_productLineProduct_line_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_temperatureTemperature_id_fkey";

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "activeStateState_id",
DROP COLUMN "productLineProduct_line_id",
DROP COLUMN "temperatureTemperature_id";
