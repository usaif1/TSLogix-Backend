-- CreateEnum
CREATE TYPE "QualityControlStatus" AS ENUM ('CUARENTENA', 'APROBADO', 'DEVOLUCIONES', 'CONTRAMUESTRAS', 'RECHAZADOS');

-- CreateEnum
CREATE TYPE "SystemAction" AS ENUM ('ENTRY_ORDER_CREATED', 'ENTRY_ORDER_REVIEWED', 'ENTRY_ORDER_APPROVED', 'ENTRY_ORDER_REJECTED', 'INVENTORY_ALLOCATED', 'QUALITY_STATUS_CHANGED', 'INVENTORY_MOVED', 'DEPARTURE_ORDER_CREATED', 'DEPARTURE_ORDER_REVIEWED', 'DEPARTURE_ORDER_APPROVED', 'DEPARTURE_ALLOCATED', 'PRODUCT_DISPATCHED', 'CELL_ASSIGNED', 'CELL_UPDATED', 'USER_LOGIN', 'USER_LOGOUT');

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "last_modified_at" TIMESTAMP(3),
ADD COLUMN     "last_modified_by" TEXT,
ADD COLUMN     "quality_status" "QualityControlStatus" NOT NULL DEFAULT 'CUARENTENA',
ALTER COLUMN "status" SET DEFAULT 'QUARANTINED';

-- AlterTable
ALTER TABLE "inventory_allocations" ADD COLUMN     "last_modified_at" TIMESTAMP(3),
ADD COLUMN     "last_modified_by" TEXT,
ADD COLUMN     "quality_status" "QualityControlStatus" NOT NULL DEFAULT 'CUARENTENA';

-- CreateTable
CREATE TABLE "quality_control_transitions" (
    "transition_id" TEXT NOT NULL,
    "allocation_id" TEXT,
    "inventory_id" TEXT,
    "from_status" "QualityControlStatus",
    "to_status" "QualityControlStatus" NOT NULL,
    "quantity_moved" INTEGER NOT NULL,
    "package_quantity_moved" INTEGER NOT NULL,
    "weight_moved" DECIMAL(10,2) NOT NULL,
    "volume_moved" DECIMAL(10,2),
    "from_cell_id" TEXT,
    "to_cell_id" TEXT,
    "performed_by" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,

    CONSTRAINT "quality_control_transitions_pkey" PRIMARY KEY ("transition_id")
);

-- CreateTable
CREATE TABLE "system_audit_logs" (
    "audit_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "SystemAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" TEXT,

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("audit_id")
);

-- CreateIndex
CREATE INDEX "idx_audit_user_time" ON "system_audit_logs"("user_id", "performed_at");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "system_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_action_time" ON "system_audit_logs"("action", "performed_at");

-- AddForeignKey
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_transitions" ADD CONSTRAINT "quality_control_transitions_allocation_id_fkey" FOREIGN KEY ("allocation_id") REFERENCES "inventory_allocations"("allocation_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_transitions" ADD CONSTRAINT "quality_control_transitions_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("inventory_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_transitions" ADD CONSTRAINT "quality_control_transitions_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_transitions" ADD CONSTRAINT "quality_control_transitions_from_cell_id_fkey" FOREIGN KEY ("from_cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_transitions" ADD CONSTRAINT "quality_control_transitions_to_cell_id_fkey" FOREIGN KEY ("to_cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_audit_logs" ADD CONSTRAINT "system_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
