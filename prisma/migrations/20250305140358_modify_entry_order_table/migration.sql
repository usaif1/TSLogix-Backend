/*
  Warnings:

  - You are about to drop the column `protocol_analysis_certificate` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderTypeId` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_orderTypeId_fkey";

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "protocol_analysis_certificate",
ADD COLUMN     "certificate_protocol_analysis" TEXT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "orderTypeId";
