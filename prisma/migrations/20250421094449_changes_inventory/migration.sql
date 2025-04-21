/*
  Warnings:

  - A unique constraint covering the columns `[product_id,location_id,expiration_date]` on the table `inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "idx_inventory_product_location";

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_location_id_expiration_date_key" ON "inventory"("product_id", "location_id", "expiration_date");
