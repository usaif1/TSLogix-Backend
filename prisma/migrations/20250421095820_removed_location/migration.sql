/*
  Warnings:

  - A unique constraint covering the columns `[product_id,expiration_date]` on the table `inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "inventory_product_id_location_id_expiration_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_expiration_date_key" ON "inventory"("product_id", "expiration_date");
