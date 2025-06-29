/*
  Warnings:

  - The values [PROCESSING,READY,SHIPPED,DELIVERED] on the enum `OrderStatusDeparture` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `document_type_id` on the `departure_orders` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatusDeparture_new" AS ENUM ('PENDING', 'APPROVED', 'REVISION', 'REJECTED', 'DISPATCHED', 'COMPLETED');
ALTER TABLE "departure_orders" ALTER COLUMN "order_status" DROP DEFAULT;
ALTER TABLE "departure_orders" ALTER COLUMN "order_status" TYPE "OrderStatusDeparture_new" USING ("order_status"::text::"OrderStatusDeparture_new");
ALTER TYPE "OrderStatusDeparture" RENAME TO "OrderStatusDeparture_old";
ALTER TYPE "OrderStatusDeparture_new" RENAME TO "OrderStatusDeparture";
DROP TYPE "OrderStatusDeparture_old";
ALTER TABLE "departure_orders" ALTER COLUMN "order_status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_document_type_id_fkey";

-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "document_type_id",
ADD COLUMN     "dispatch_document_number" TEXT,
ADD COLUMN     "dispatch_notes" TEXT,
ADD COLUMN     "dispatch_status" TEXT NOT NULL DEFAULT 'NOT_DISPATCHED',
ADD COLUMN     "dispatched_at" TIMESTAMP(3),
ADD COLUMN     "dispatched_by" TEXT,
ADD COLUMN     "document_type_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_dispatched_by_fkey" FOREIGN KEY ("dispatched_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
