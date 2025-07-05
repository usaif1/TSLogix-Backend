/*
  Warnings:

  - The values [HOLD] on the enum `InventoryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PARTIALLY_DISPATCHED] on the enum `OrderStatusDeparture` will be removed. If these variants are still used in the database, this will fail.
  - The values [DEPARTURE_ORDER_PARTIALLY_DISPATCHED,DEPARTURE_ORDER_DISPATCH_COMPLETED,INVENTORY_HELD,INVENTORY_UNHELD] on the enum `SystemAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `dispatched_packages` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `dispatched_pallets` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `dispatched_quantity` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `dispatched_volume` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `dispatched_weight` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_packages` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_quantity` on the `departure_order_products` table. All the data in the column will be lost.
  - You are about to drop the column `remaining_weight` on the `departure_order_products` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InventoryStatus_new" AS ENUM ('AVAILABLE', 'RESERVED', 'DAMAGED', 'DEPLETED', 'EXPIRED', 'IN_TRANSIT', 'PENDING_INSPECTION', 'QUARANTINED', 'RETURNED', 'DISPOSED');
ALTER TABLE "inventory" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "inventory" ALTER COLUMN "status" TYPE "InventoryStatus_new" USING ("status"::text::"InventoryStatus_new");
ALTER TYPE "InventoryStatus" RENAME TO "InventoryStatus_old";
ALTER TYPE "InventoryStatus_new" RENAME TO "InventoryStatus";
DROP TYPE "InventoryStatus_old";
ALTER TABLE "inventory" ALTER COLUMN "status" SET DEFAULT 'QUARANTINED';
COMMIT;

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

-- AlterEnum
BEGIN;
CREATE TYPE "SystemAction_new" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_LOGIN_FAILED', 'USER_SESSION_EXPIRED', 'USER_PASSWORD_CHANGED', 'USER_PROFILE_UPDATED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'USER_ROLE_CHANGED', 'ENTRY_ORDER_CREATED', 'ENTRY_ORDER_UPDATED', 'ENTRY_ORDER_DELETED', 'ENTRY_ORDER_REVIEWED', 'ENTRY_ORDER_APPROVED', 'ENTRY_ORDER_REJECTED', 'ENTRY_ORDER_STATUS_CHANGED', 'ENTRY_ORDER_PRODUCT_ADDED', 'ENTRY_ORDER_PRODUCT_UPDATED', 'ENTRY_ORDER_PRODUCT_REMOVED', 'DEPARTURE_ORDER_CREATED', 'DEPARTURE_ORDER_UPDATED', 'DEPARTURE_ORDER_DELETED', 'DEPARTURE_ORDER_REVIEWED', 'DEPARTURE_ORDER_APPROVED', 'DEPARTURE_ORDER_REJECTED', 'DEPARTURE_ORDER_STATUS_CHANGED', 'DEPARTURE_ORDER_PRODUCT_ADDED', 'DEPARTURE_ORDER_PRODUCT_UPDATED', 'DEPARTURE_ORDER_PRODUCT_REMOVED', 'DEPARTURE_ORDER_DISPATCHED', 'INVENTORY_ALLOCATED', 'INVENTORY_DEALLOCATED', 'INVENTORY_MOVED', 'INVENTORY_ADJUSTED', 'INVENTORY_COUNTED', 'INVENTORY_RESERVED', 'INVENTORY_RELEASED', 'INVENTORY_DAMAGED', 'INVENTORY_RETURNED', 'INVENTORY_EXPIRED', 'QUALITY_STATUS_CHANGED', 'QUALITY_INSPECTION_STARTED', 'QUALITY_INSPECTION_COMPLETED', 'QUALITY_SAMPLE_TAKEN', 'QUALITY_BATCH_APPROVED', 'QUALITY_BATCH_REJECTED', 'CELL_CREATED', 'CELL_UPDATED', 'CELL_DELETED', 'CELL_ASSIGNED', 'CELL_UNASSIGNED', 'CELL_STATUS_CHANGED', 'CELL_CAPACITY_CHANGED', 'WAREHOUSE_CREATED', 'WAREHOUSE_UPDATED', 'WAREHOUSE_DELETED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED', 'CLIENT_ACTIVATED', 'CLIENT_DEACTIVATED', 'CLIENT_CELL_ASSIGNED', 'CLIENT_CELL_UNASSIGNED', 'CLIENT_PROFILE_VIEWED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'PRODUCT_ACTIVATED', 'PRODUCT_DEACTIVATED', 'PRODUCT_PRICE_CHANGED', 'PRODUCT_SPECIFICATION_CHANGED', 'SUPPLIER_CREATED', 'SUPPLIER_UPDATED', 'SUPPLIER_DELETED', 'SUPPLIER_ACTIVATED', 'SUPPLIER_DEACTIVATED', 'SUPPLIER_CONTACT_UPDATED', 'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED', 'CUSTOMER_ACTIVATED', 'CUSTOMER_DEACTIVATED', 'REPORT_GENERATED', 'REPORT_EXPORTED', 'REPORT_VIEWED', 'DASHBOARD_ACCESSED', 'SYSTEM_BACKUP_CREATED', 'SYSTEM_BACKUP_RESTORED', 'SYSTEM_SETTINGS_CHANGED', 'SYSTEM_MAINTENANCE_STARTED', 'SYSTEM_MAINTENANCE_COMPLETED', 'DATA_IMPORTED', 'DATA_EXPORTED', 'DATA_SYNCHRONIZED', 'AUDIT_STARTED', 'AUDIT_COMPLETED', 'COMPLIANCE_CHECK_PERFORMED', 'ALERT_TRIGGERED', 'NOTIFICATION_SENT', 'REMINDER_SENT', 'FILE_UPLOADED', 'FILE_DOWNLOADED', 'FILE_DELETED', 'DOCUMENT_GENERATED', 'API_CALL_MADE', 'INTEGRATION_SYNC', 'WEBHOOK_TRIGGERED', 'ERROR_OCCURRED', 'EXCEPTION_HANDLED', 'SYSTEM_ERROR_LOGGED');
ALTER TABLE "system_audit_logs" ALTER COLUMN "action" TYPE "SystemAction_new" USING ("action"::text::"SystemAction_new");
ALTER TYPE "SystemAction" RENAME TO "SystemAction_old";
ALTER TYPE "SystemAction_new" RENAME TO "SystemAction";
DROP TYPE "SystemAction_old";
COMMIT;

-- AlterTable
ALTER TABLE "departure_order_products" DROP COLUMN "dispatched_packages",
DROP COLUMN "dispatched_pallets",
DROP COLUMN "dispatched_quantity",
DROP COLUMN "dispatched_volume",
DROP COLUMN "dispatched_weight",
DROP COLUMN "remaining_packages",
DROP COLUMN "remaining_quantity",
DROP COLUMN "remaining_weight";
