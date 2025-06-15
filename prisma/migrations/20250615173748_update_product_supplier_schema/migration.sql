/*
  Warnings:

  - The values [CUSTOMER,WAREHOUSE] on the enum `RoleName` will be removed. If these variants are still used in the database, this will fail.
  - The values [DEPARTURE_ALLOCATED,PRODUCT_DISPATCHED] on the enum `SystemAction` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[client_user_id]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[auto_username]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `auto_password_hash` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `auto_username` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_user_id` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_name` to the `suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleName_new" AS ENUM ('ADMIN', 'WAREHOUSE_INCHARGE', 'PHARMACIST', 'WAREHOUSE_ASSISTANT', 'CLIENT');
ALTER TABLE "roles" ALTER COLUMN "name" TYPE "RoleName_new" USING ("name"::text::"RoleName_new");
ALTER TYPE "RoleName" RENAME TO "RoleName_old";
ALTER TYPE "RoleName_new" RENAME TO "RoleName";
DROP TYPE "RoleName_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SystemAction_new" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_LOGIN_FAILED', 'USER_SESSION_EXPIRED', 'USER_PASSWORD_CHANGED', 'USER_PROFILE_UPDATED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'USER_ROLE_CHANGED', 'ENTRY_ORDER_CREATED', 'ENTRY_ORDER_UPDATED', 'ENTRY_ORDER_DELETED', 'ENTRY_ORDER_REVIEWED', 'ENTRY_ORDER_APPROVED', 'ENTRY_ORDER_REJECTED', 'ENTRY_ORDER_STATUS_CHANGED', 'ENTRY_ORDER_PRODUCT_ADDED', 'ENTRY_ORDER_PRODUCT_UPDATED', 'ENTRY_ORDER_PRODUCT_REMOVED', 'DEPARTURE_ORDER_CREATED', 'DEPARTURE_ORDER_UPDATED', 'DEPARTURE_ORDER_DELETED', 'DEPARTURE_ORDER_REVIEWED', 'DEPARTURE_ORDER_APPROVED', 'DEPARTURE_ORDER_REJECTED', 'DEPARTURE_ORDER_STATUS_CHANGED', 'DEPARTURE_ORDER_PRODUCT_ADDED', 'DEPARTURE_ORDER_PRODUCT_UPDATED', 'DEPARTURE_ORDER_PRODUCT_REMOVED', 'DEPARTURE_ORDER_DISPATCHED', 'INVENTORY_ALLOCATED', 'INVENTORY_DEALLOCATED', 'INVENTORY_MOVED', 'INVENTORY_ADJUSTED', 'INVENTORY_COUNTED', 'INVENTORY_RESERVED', 'INVENTORY_RELEASED', 'INVENTORY_DAMAGED', 'INVENTORY_RETURNED', 'INVENTORY_EXPIRED', 'QUALITY_STATUS_CHANGED', 'QUALITY_INSPECTION_STARTED', 'QUALITY_INSPECTION_COMPLETED', 'QUALITY_SAMPLE_TAKEN', 'QUALITY_BATCH_APPROVED', 'QUALITY_BATCH_REJECTED', 'CELL_CREATED', 'CELL_UPDATED', 'CELL_DELETED', 'CELL_ASSIGNED', 'CELL_UNASSIGNED', 'CELL_STATUS_CHANGED', 'CELL_CAPACITY_CHANGED', 'WAREHOUSE_CREATED', 'WAREHOUSE_UPDATED', 'WAREHOUSE_DELETED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED', 'CLIENT_ACTIVATED', 'CLIENT_DEACTIVATED', 'CLIENT_CELL_ASSIGNED', 'CLIENT_CELL_UNASSIGNED', 'CLIENT_PROFILE_VIEWED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'PRODUCT_ACTIVATED', 'PRODUCT_DEACTIVATED', 'PRODUCT_PRICE_CHANGED', 'PRODUCT_SPECIFICATION_CHANGED', 'SUPPLIER_CREATED', 'SUPPLIER_UPDATED', 'SUPPLIER_DELETED', 'SUPPLIER_ACTIVATED', 'SUPPLIER_DEACTIVATED', 'SUPPLIER_CONTACT_UPDATED', 'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED', 'CUSTOMER_ACTIVATED', 'CUSTOMER_DEACTIVATED', 'REPORT_GENERATED', 'REPORT_EXPORTED', 'REPORT_VIEWED', 'DASHBOARD_ACCESSED', 'SYSTEM_BACKUP_CREATED', 'SYSTEM_BACKUP_RESTORED', 'SYSTEM_SETTINGS_CHANGED', 'SYSTEM_MAINTENANCE_STARTED', 'SYSTEM_MAINTENANCE_COMPLETED', 'DATA_IMPORTED', 'DATA_EXPORTED', 'DATA_SYNCHRONIZED', 'AUDIT_STARTED', 'AUDIT_COMPLETED', 'COMPLIANCE_CHECK_PERFORMED', 'ALERT_TRIGGERED', 'NOTIFICATION_SENT', 'REMINDER_SENT', 'FILE_UPLOADED', 'FILE_DOWNLOADED', 'FILE_DELETED', 'DOCUMENT_GENERATED', 'API_CALL_MADE', 'INTEGRATION_SYNC', 'WEBHOOK_TRIGGERED', 'ERROR_OCCURRED', 'EXCEPTION_HANDLED', 'SYSTEM_ERROR_LOGGED');
ALTER TABLE "system_audit_logs" ALTER COLUMN "action" TYPE "SystemAction_new" USING ("action"::text::"SystemAction_new");
ALTER TYPE "SystemAction" RENAME TO "SystemAction_old";
ALTER TYPE "SystemAction_new" RENAME TO "SystemAction";
DROP TYPE "SystemAction_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "client_cell_assignments" DROP CONSTRAINT "client_cell_assignments_client_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_group_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_product_line_id_fkey";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "auto_password_hash" TEXT NOT NULL,
ADD COLUMN     "auto_username" TEXT NOT NULL,
ADD COLUMN     "client_user_id" TEXT NOT NULL,
ADD COLUMN     "created_by" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "subcategory1_id" TEXT,
ADD COLUMN     "subcategory2_id" TEXT,
ADD COLUMN     "uploaded_documents" JSONB,
ALTER COLUMN "product_line_id" DROP NOT NULL,
ALTER COLUMN "group_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "category" TEXT,
ADD COLUMN     "company_name" TEXT NOT NULL,
ADD COLUMN     "contact_no" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "registered_address" TEXT,
ADD COLUMN     "tax_id" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assigned_clients" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "product_categories" (
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "product_subcategories1" (
    "subcategory1_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_subcategories1_pkey" PRIMARY KEY ("subcategory1_id")
);

-- CreateTable
CREATE TABLE "product_subcategories2" (
    "subcategory2_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subcategory1_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_subcategories2_pkey" PRIMARY KEY ("subcategory2_id")
);

-- CreateTable
CREATE TABLE "client_product_assignments" (
    "assignment_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "client_product_code" TEXT,
    "client_price" DECIMAL(10,2),
    "notes" TEXT,
    "max_order_quantity" INTEGER,
    "min_order_quantity" INTEGER,

    CONSTRAINT "client_product_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_subcategories1_category_id_name_key" ON "product_subcategories1"("category_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_subcategories2_subcategory1_id_name_key" ON "product_subcategories2"("subcategory1_id", "name");

-- CreateIndex
CREATE INDEX "idx_client_product_assignments" ON "client_product_assignments"("client_id");

-- CreateIndex
CREATE INDEX "idx_product_client_assignments" ON "client_product_assignments"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_assigner" ON "client_product_assignments"("assigned_by");

-- CreateIndex
CREATE INDEX "idx_client_product_active" ON "client_product_assignments"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "client_product_assignments_client_id_product_id_key" ON "client_product_assignments"("client_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_user_id_key" ON "clients"("client_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_auto_username_key" ON "clients"("auto_username");

-- CreateIndex
CREATE INDEX "idx_client_created_by" ON "clients"("created_by");

-- CreateIndex
CREATE INDEX "idx_product_category" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_product_subcategory1" ON "products"("subcategory1_id");

-- CreateIndex
CREATE INDEX "idx_product_subcategory2" ON "products"("subcategory2_id");

-- CreateIndex
CREATE INDEX "idx_product_manufacturer" ON "products"("manufacturer");

-- AddForeignKey
ALTER TABLE "product_subcategories1" ADD CONSTRAINT "product_subcategories1_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subcategories2" ADD CONSTRAINT "product_subcategories2_subcategory1_id_fkey" FOREIGN KEY ("subcategory1_id") REFERENCES "product_subcategories1"("subcategory1_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_cell_assignments" ADD CONSTRAINT "client_cell_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_product_assignments" ADD CONSTRAINT "client_product_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_product_assignments" ADD CONSTRAINT "client_product_assignments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_product_assignments" ADD CONSTRAINT "client_product_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_subcategory1_id_fkey" FOREIGN KEY ("subcategory1_id") REFERENCES "product_subcategories1"("subcategory1_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_subcategory2_id_fkey" FOREIGN KEY ("subcategory2_id") REFERENCES "product_subcategories2"("subcategory2_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group_names"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_lines"("product_line_id") ON DELETE SET NULL ON UPDATE CASCADE;
