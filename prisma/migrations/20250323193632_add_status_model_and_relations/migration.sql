/*
  Warnings:

  - You are about to drop the column `status` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `entry_orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "status",
ADD COLUMN     "status_id" TEXT;

-- AlterTable
ALTER TABLE "entry_orders" DROP COLUMN "status",
ADD COLUMN     "status_id" TEXT;

-- CreateTable
CREATE TABLE "statuses" (
    "status_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("status_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "statuses_name_key" ON "statuses"("name");

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("status_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("status_id") ON DELETE SET NULL ON UPDATE CASCADE;
