/*
  Warnings:

  - You are about to drop the column `warehouseId` on the `warehouse_cells` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[warehouse_id,row,bay,position]` on the table `warehouse_cells` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `warehouse_id` to the `warehouse_cells` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "warehouse_cells" DROP CONSTRAINT "warehouse_cells_warehouseId_fkey";

-- DropIndex
DROP INDEX "warehouse_cells_warehouseId_row_bay_position_key";

-- AlterTable
ALTER TABLE "warehouse_cells" DROP COLUMN "warehouseId",
ADD COLUMN     "warehouse_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_cells_warehouse_id_row_bay_position_key" ON "warehouse_cells"("warehouse_id", "row", "bay", "position");

-- AddForeignKey
ALTER TABLE "warehouse_cells" ADD CONSTRAINT "warehouse_cells_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;
