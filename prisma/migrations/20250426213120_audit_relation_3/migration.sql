-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('PASSED', 'FAILED', 'PENDING');

-- AlterTable
ALTER TABLE "entry_orders" ADD COLUMN     "audit_status" "AuditResult" DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "inventory_logs" ADD COLUMN     "audit_id" TEXT;

-- CreateTable
CREATE TABLE "entry_order_audits" (
    "audit_id" TEXT NOT NULL,
    "entry_order_id" TEXT NOT NULL,
    "audited_by" TEXT NOT NULL,
    "audit_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audit_result" "AuditResult" NOT NULL,
    "comments" TEXT,

    CONSTRAINT "entry_order_audits_pkey" PRIMARY KEY ("audit_id")
);

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "entry_order_audits"("audit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_order_audits" ADD CONSTRAINT "entry_order_audits_entry_order_id_fkey" FOREIGN KEY ("entry_order_id") REFERENCES "entry_orders"("entry_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_order_audits" ADD CONSTRAINT "entry_order_audits_audited_by_fkey" FOREIGN KEY ("audited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
