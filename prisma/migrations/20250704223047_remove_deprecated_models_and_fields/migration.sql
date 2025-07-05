/*
  Warnings:

  - You are about to drop the column `type_id` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `active_state_id` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `product_line_id` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `storage_conditions` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `unit_volume` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `unit_weight` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `customer_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_names` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_lines` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_type_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_active_state_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_group_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_product_line_id_fkey";

-- DropIndex
DROP INDEX "idx_customer_type";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "type_id";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "active_state_id",
DROP COLUMN "group_id",
DROP COLUMN "product_line_id",
DROP COLUMN "storage_conditions",
DROP COLUMN "unit_volume",
DROP COLUMN "unit_weight";

-- DropTable
DROP TABLE "customer_types";

-- DropTable
DROP TABLE "group_names";

-- DropTable
DROP TABLE "product_lines";
