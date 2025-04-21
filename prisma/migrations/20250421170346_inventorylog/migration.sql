/*
  Warnings:

  - You are about to drop the column `location_id` on the `inventory` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `inventory_logs` table. All the data in the column will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_location_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_logs" DROP CONSTRAINT "inventory_logs_location_id_fkey";

-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "location_id";

-- AlterTable
ALTER TABLE "inventory_logs" DROP COLUMN "location_id";

-- DropTable
DROP TABLE "locations";
