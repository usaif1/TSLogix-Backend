-- CreateTable
CREATE TABLE "cycle_counts" (
    "cycle_count_id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "cycle_counts_pkey" PRIMARY KEY ("cycle_count_id")
);

-- CreateTable
CREATE TABLE "cycle_count_entries" (
    "cycle_count_entry_id" TEXT NOT NULL,
    "cycle_count_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "counted_qty" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycle_count_entries_pkey" PRIMARY KEY ("cycle_count_entry_id")
);

-- CreateTable
CREATE TABLE "physical_counts" (
    "physical_count_id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "physical_counts_pkey" PRIMARY KEY ("physical_count_id")
);

-- CreateTable
CREATE TABLE "physical_count_entries" (
    "physical_count_entry_id" TEXT NOT NULL,
    "physical_count_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "counted_qty" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_count_entries_pkey" PRIMARY KEY ("physical_count_entry_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "audit_log_id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("audit_log_id")
);

-- AddForeignKey
ALTER TABLE "cycle_count_entries" ADD CONSTRAINT "cycle_count_entries_cycle_count_id_fkey" FOREIGN KEY ("cycle_count_id") REFERENCES "cycle_counts"("cycle_count_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_count_entries" ADD CONSTRAINT "physical_count_entries_physical_count_id_fkey" FOREIGN KEY ("physical_count_id") REFERENCES "physical_counts"("physical_count_id") ON DELETE RESTRICT ON UPDATE CASCADE;
