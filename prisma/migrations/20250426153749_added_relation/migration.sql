-- AlterTable
ALTER TABLE "inventory_logs" ADD COLUMN     "cell_id" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "warehouse_id" TEXT;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE SET NULL ON UPDATE CASCADE;
