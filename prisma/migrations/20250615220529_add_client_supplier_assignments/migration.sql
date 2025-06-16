-- CreateTable
CREATE TABLE "client_supplier_assignments" (
    "assignment_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "client_supplier_code" TEXT,
    "preferred_supplier" BOOLEAN NOT NULL DEFAULT false,
    "credit_limit" DECIMAL(10,2),
    "payment_terms" TEXT,
    "notes" TEXT,
    "primary_contact" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,

    CONSTRAINT "client_supplier_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateIndex
CREATE INDEX "idx_client_supplier_assignments" ON "client_supplier_assignments"("client_id");

-- CreateIndex
CREATE INDEX "idx_supplier_client_assignments" ON "client_supplier_assignments"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_supplier_assigner" ON "client_supplier_assignments"("assigned_by");

-- CreateIndex
CREATE INDEX "idx_client_supplier_active" ON "client_supplier_assignments"("is_active");

-- CreateIndex
CREATE INDEX "idx_preferred_supplier" ON "client_supplier_assignments"("preferred_supplier");

-- CreateIndex
CREATE UNIQUE INDEX "client_supplier_assignments_client_id_supplier_id_key" ON "client_supplier_assignments"("client_id", "supplier_id");

-- AddForeignKey
ALTER TABLE "client_supplier_assignments" ADD CONSTRAINT "client_supplier_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_supplier_assignments" ADD CONSTRAINT "client_supplier_assignments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_supplier_assignments" ADD CONSTRAINT "client_supplier_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
