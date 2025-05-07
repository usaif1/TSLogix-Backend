/*
  Warnings:

  - You are about to drop the column `cell_number` on the `warehouse_cells` table. All the data in the column will be lost.
  - You are about to drop the column `column` on the `warehouse_cells` table. All the data in the column will be lost.
  - You are about to drop the column `current_usage` on the `warehouse_cells` table. All the data in the column will be lost.
  - You are about to drop the column `humidity` on the `warehouse_cells` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `warehouse_cells` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `warehouse_cells` table. All the data in the column will be lost.
  - You are about to drop the column `warehouse_id` on the `warehouse_cells` table. All the data in the column will be lost.
  - You are about to drop the column `zone` on the `warehouse_cells` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[warehouseId,row,bay,position]` on the table `warehouse_cells` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bay` to the `warehouse_cells` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `warehouse_cells` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseId` to the `warehouse_cells` table without a default value. This is not possible if the table is not empty.
  - Made the column `row` on table `warehouse_cells` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CellKind" AS ENUM ('NORMAL', 'V', 'T', 'R');

-- DropForeignKey
ALTER TABLE "warehouse_cells" DROP CONSTRAINT "warehouse_cells_warehouse_id_fkey";

-- DropIndex
DROP INDEX "warehouse_cells_warehouse_id_cell_number_key";

-- AlterTable
ALTER TABLE "warehouse_cells" DROP COLUMN "cell_number",
DROP COLUMN "column",
DROP COLUMN "current_usage",
DROP COLUMN "humidity",
DROP COLUMN "level",
DROP COLUMN "temperature",
DROP COLUMN "warehouse_id",
DROP COLUMN "zone",
ADD COLUMN     "bay" INTEGER NOT NULL,
ADD COLUMN     "currentUsage" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "kind" "CellKind" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "position" INTEGER NOT NULL,
ADD COLUMN     "warehouseId" TEXT NOT NULL,
ALTER COLUMN "row" SET NOT NULL,
ALTER COLUMN "capacity" SET DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_cells_warehouseId_row_bay_position_key" ON "warehouse_cells"("warehouseId", "row", "bay", "position");

-- AddForeignKey
ALTER TABLE "warehouse_cells" ADD CONSTRAINT "warehouse_cells_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;
