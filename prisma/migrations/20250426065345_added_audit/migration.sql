-- CreateEnum
CREATE TYPE "CellStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'PARTIALLY_OCCUPIED', 'MAINTENANCE', 'RESERVED', 'BLOCKED');

-- DropIndex
DROP INDEX "inventory_product_id_expiration_date_key";

-- AlterTable
ALTER TABLE "departure_orders" ADD COLUMN     "warehouse_id" TEXT;

-- AlterTable
ALTER TABLE "entry_orders" ADD COLUMN     "cell_assigned_at" TIMESTAMP(3),
ADD COLUMN     "cell_id" TEXT,
ADD COLUMN     "warehouse_id" TEXT;

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "cell_id" TEXT,
ADD COLUMN     "warehouse_id" TEXT;

-- CreateTable
CREATE TABLE "warehouse_cells" (
    "cell_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "cell_number" TEXT NOT NULL,
    "zone" TEXT,
    "row" TEXT,
    "column" TEXT,
    "level" TEXT,
    "capacity" DECIMAL(10,2) NOT NULL,
    "current_usage" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "temperature" DECIMAL(5,2),
    "humidity" DECIMAL(5,2),
    "status" "CellStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "warehouse_cells_pkey" PRIMARY KEY ("cell_id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "warehouse_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" JSONB,
    "location" TEXT,
    "capacity" INTEGER,
    "max_occupancy" INTEGER,
    "status" TEXT,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("warehouse_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_cells_warehouse_id_cell_number_key" ON "warehouse_cells"("warehouse_id", "cell_number");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_name_key" ON "warehouses"("name");

-- CreateIndex
CREATE INDEX "idx_inventory_cell" ON "inventory"("cell_id");

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_cells" ADD CONSTRAINT "warehouse_cells_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;
