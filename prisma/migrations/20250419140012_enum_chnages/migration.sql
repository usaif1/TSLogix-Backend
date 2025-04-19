/*
  Warnings:

  - The values [PICKING,DAMAGED] on the enum `LocationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "InventoryStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
BEGIN;
CREATE TYPE "LocationType_new" AS ENUM ('STORAGE', 'LOADING', 'UNLOADING', 'TRANSIT', 'REPACKAGING', 'INSPECTION', 'RETURN', 'REPAIR', 'WAREHOUSE', 'DISTRIBUTION');
ALTER TABLE "locations" ALTER COLUMN "type" TYPE "LocationType_new" USING ("type"::text::"LocationType_new");
ALTER TYPE "LocationType" RENAME TO "LocationType_old";
ALTER TYPE "LocationType_new" RENAME TO "LocationType";
DROP TYPE "LocationType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "MovementType" ADD VALUE 'TRANSFER';
