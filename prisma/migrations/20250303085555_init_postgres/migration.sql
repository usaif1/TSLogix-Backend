/*
  Warnings:

  - The primary key for the `departure_orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bill_of_lading_url` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `carrier_name` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `departure_date` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `destination_country` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_delivery` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `export_license_number` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `insurance_amount` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_method` on the `departure_orders` table. All the data in the column will be lost.
  - You are about to drop the column `tracking_number` on the `departure_orders` table. All the data in the column will be lost.
  - The primary key for the `entry_orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `actual_arrival` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `customs_declaration_number` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `entry_port` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `expected_arrival` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `inspection_report_url` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `inspection_required` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `items` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `origin_country` on the `entry_orders` table. All the data in the column will be lost.
  - You are about to drop the column `storage_location` on the `entry_orders` table. All the data in the column will be lost.
  - The primary key for the `orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `due_date` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `reference_number` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `orders` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `mfa_secret` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_reset_expiry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_reset_token` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `departure_order_id` to the `departure_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entry_order_id` to the `entry_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_list` to the `entry_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `orders` table without a default value. This is not possible if the table is not empty.
  - The required column `order_id` was added to the `orders` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `order_type` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organisation_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organisation_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.
  - The required column `user_id` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "DocumentApplicableTo" AS ENUM ('ENTRY', 'DEPARTURE', 'BOTH');

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_orderId_fkey";

-- DropForeignKey
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_orderId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_orderTypeId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- DropIndex
DROP INDEX "users_userId_key";

-- AlterTable
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_pkey",
DROP COLUMN "bill_of_lading_url",
DROP COLUMN "carrier_name",
DROP COLUMN "departure_date",
DROP COLUMN "destination_country",
DROP COLUMN "estimated_delivery",
DROP COLUMN "export_license_number",
DROP COLUMN "insurance_amount",
DROP COLUMN "orderId",
DROP COLUMN "shipping_method",
DROP COLUMN "tracking_number",
ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "departure_order_id" TEXT NOT NULL,
ADD COLUMN     "exit_option_id" TEXT,
ADD COLUMN     "label_id" TEXT,
ADD COLUMN     "shipping_details" JSONB,
ADD CONSTRAINT "departure_orders_pkey" PRIMARY KEY ("departure_order_id");

-- AlterTable
ALTER TABLE "entry_orders" DROP CONSTRAINT "entry_orders_pkey",
DROP COLUMN "actual_arrival",
DROP COLUMN "customs_declaration_number",
DROP COLUMN "entry_port",
DROP COLUMN "expected_arrival",
DROP COLUMN "inspection_report_url",
DROP COLUMN "inspection_required",
DROP COLUMN "items",
DROP COLUMN "orderId",
DROP COLUMN "origin_country",
DROP COLUMN "storage_location",
ADD COLUMN     "document_type_id" TEXT,
ADD COLUMN     "entry_order_id" TEXT NOT NULL,
ADD COLUMN     "origin_id" TEXT,
ADD COLUMN     "product_list" JSONB NOT NULL,
ADD COLUMN     "supplier_id" TEXT,
ADD CONSTRAINT "entry_orders_pkey" PRIMARY KEY ("entry_order_id");

-- AlterTable
ALTER TABLE "orders" DROP CONSTRAINT "orders_pkey",
DROP COLUMN "due_date",
DROP COLUMN "id",
DROP COLUMN "metadata",
DROP COLUMN "notes",
DROP COLUMN "organizationId",
DROP COLUMN "priority",
DROP COLUMN "reference_number",
DROP COLUMN "updated_at",
DROP COLUMN "userId",
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "order_id" TEXT NOT NULL,
ADD COLUMN     "order_type" TEXT NOT NULL,
ADD COLUMN     "organisation_id" TEXT NOT NULL,
ALTER COLUMN "orderTypeId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "first_name",
DROP COLUMN "id",
DROP COLUMN "last_login",
DROP COLUMN "last_name",
DROP COLUMN "mfa_secret",
DROP COLUMN "organizationId",
DROP COLUMN "password_hash",
DROP COLUMN "password_reset_expiry",
DROP COLUMN "password_reset_token",
DROP COLUMN "phone",
DROP COLUMN "roleId",
DROP COLUMN "status",
DROP COLUMN "updated_at",
DROP COLUMN "userId",
ADD COLUMN     "active_state_id" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "organisation_id" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- DropTable
DROP TABLE "organizations";

-- DropTable
DROP TABLE "roles";

-- CreateTable
CREATE TABLE "origins" (
    "origin_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" TEXT,

    CONSTRAINT "origins_pkey" PRIMARY KEY ("origin_id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "document_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicable_to" "DocumentApplicableTo" NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("document_type_id")
);

-- CreateTable
CREATE TABLE "exit_options" (
    "exit_option_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "carrier_details" JSONB,

    CONSTRAINT "exit_options_pkey" PRIMARY KEY ("exit_option_id")
);

-- CreateTable
CREATE TABLE "customer_types" (
    "customer_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discount_rate" DECIMAL(5,2),

    CONSTRAINT "customer_types_pkey" PRIMARY KEY ("customer_type_id")
);

-- CreateTable
CREATE TABLE "labels" (
    "label_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shipping_requirements" JSONB,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("label_id")
);

-- CreateTable
CREATE TABLE "product_lines" (
    "product_line_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "temperature_id" TEXT,

    CONSTRAINT "product_lines_pkey" PRIMARY KEY ("product_line_id")
);

-- CreateTable
CREATE TABLE "group_names" (
    "group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_category" TEXT,

    CONSTRAINT "group_names_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "countries" (
    "country_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso_code" CHAR(2),

    CONSTRAINT "countries_pkey" PRIMARY KEY ("country_id")
);

-- CreateTable
CREATE TABLE "temperatures" (
    "temperature_id" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "min_celsius" INTEGER,
    "max_celsius" INTEGER,

    CONSTRAINT "temperatures_pkey" PRIMARY KEY ("temperature_id")
);

-- CreateTable
CREATE TABLE "active_states" (
    "state_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "active_states_pkey" PRIMARY KEY ("state_id")
);

-- CreateTable
CREATE TABLE "organisations" (
    "organisation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" JSONB,
    "tax_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("organisation_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" TEXT,
    "document_types" JSONB,
    "active_state_id" TEXT,
    "maintenance_notes" TEXT,
    "last_maintenance_date" DATE,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "billing_address" JSONB,
    "active_state_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_line_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "active_state_id" TEXT,
    "maintenance_schedule" JSONB,
    "last_maintenance_date" DATE,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "origins_name_key" ON "origins"("name");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "exit_options_name_key" ON "exit_options"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customer_types_name_key" ON "customer_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "labels_name_key" ON "labels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_lines_name_key" ON "product_lines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "group_names_name_key" ON "group_names"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso_code_key" ON "countries"("iso_code");

-- CreateIndex
CREATE UNIQUE INDEX "temperatures_range_key" ON "temperatures"("range");

-- CreateIndex
CREATE UNIQUE INDEX "active_states_name_key" ON "active_states"("name");

-- CreateIndex
CREATE INDEX "idx_supplier_country" ON "suppliers"("country_id");

-- CreateIndex
CREATE INDEX "idx_customer_type" ON "customers"("type_id");

-- CreateIndex
CREATE INDEX "idx_product_maintenance" ON "products"("last_maintenance_date");

-- CreateIndex
CREATE INDEX "idx_order_creation" ON "orders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "origins" ADD CONSTRAINT "origins_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("country_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_lines" ADD CONSTRAINT "product_lines_temperature_id_fkey" FOREIGN KEY ("temperature_id") REFERENCES "temperatures"("temperature_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("organisation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_active_state_id_fkey" FOREIGN KEY ("active_state_id") REFERENCES "active_states"("state_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("country_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_active_state_id_fkey" FOREIGN KEY ("active_state_id") REFERENCES "active_states"("state_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "customer_types"("customer_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_active_state_id_fkey" FOREIGN KEY ("active_state_id") REFERENCES "active_states"("state_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_lines"("product_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group_names"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("country_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_active_state_id_fkey" FOREIGN KEY ("active_state_id") REFERENCES "active_states"("state_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("organisation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_orderTypeId_fkey" FOREIGN KEY ("orderTypeId") REFERENCES "order_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_entry_order_id_fkey" FOREIGN KEY ("entry_order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_origin_id_fkey" FOREIGN KEY ("origin_id") REFERENCES "origins"("origin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("document_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_departure_order_id_fkey" FOREIGN KEY ("departure_order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_exit_option_id_fkey" FOREIGN KEY ("exit_option_id") REFERENCES "exit_options"("exit_option_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("label_id") ON DELETE SET NULL ON UPDATE CASCADE;
