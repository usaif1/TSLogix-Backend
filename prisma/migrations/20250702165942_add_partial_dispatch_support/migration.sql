-- AlterEnum
ALTER TYPE "InventoryStatus" ADD VALUE 'HOLD';

-- AlterEnum
ALTER TYPE "OrderStatusDeparture" ADD VALUE 'PARTIALLY_DISPATCHED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SystemAction" ADD VALUE 'DEPARTURE_ORDER_PARTIALLY_DISPATCHED';
ALTER TYPE "SystemAction" ADD VALUE 'DEPARTURE_ORDER_DISPATCH_COMPLETED';
ALTER TYPE "SystemAction" ADD VALUE 'INVENTORY_HELD';
ALTER TYPE "SystemAction" ADD VALUE 'INVENTORY_UNHELD';

-- AlterTable
ALTER TABLE "departure_order_products" ADD COLUMN     "dispatched_packages" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dispatched_pallets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dispatched_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dispatched_volume" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "dispatched_weight" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "remaining_packages" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "remaining_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "remaining_weight" DECIMAL(10,2) NOT NULL DEFAULT 0;
