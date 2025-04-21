/*
  Warnings:

  - You are about to drop the column `product` on the `entry_orders` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InventoryStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "InventoryStatus" ADD VALUE 'PENDING_INSPECTION';
ALTER TYPE "InventoryStatus" ADD VALUE 'QUARANTINED';
ALTER TYPE "InventoryStatus" ADD VALUE 'RETURNED';
ALTER TYPE "InventoryStatus" ADD VALUE 'DISPOSED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MovementType" ADD VALUE 'RETURN';
ALTER TYPE "MovementType" ADD VALUE 'DISPOSAL';
ALTER TYPE "MovementType" ADD VALUE 'RECALL';
ALTER TYPE "MovementType" ADD VALUE 'INSPECTION';

-- AlterTable
ALTER TABLE "departure_orders" ADD COLUMN     "product_id" TEXT;

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "product",
ADD COLUMN     "product_id" TEXT;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;
