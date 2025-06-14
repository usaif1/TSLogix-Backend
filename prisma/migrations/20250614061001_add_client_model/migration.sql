-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('COMMERCIAL', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "EstablishmentType" AS ENUM ('SELECCIONAR', 'ALMACEN_ESPECIALIZADO', 'BOTICA', 'BOTIQUIN', 'DROGUERIA', 'FARMACIA', 'OTROS');

-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_customer_id_fkey";

-- AlterTable
ALTER TABLE "departure_orders" ADD COLUMN     "client_id" TEXT,
ALTER COLUMN "customer_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "clients" (
    "client_id" TEXT NOT NULL,
    "client_type" "ClientType" NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "cell_phone" TEXT,
    "active_state_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "company_name" TEXT,
    "company_type" "CompanyType",
    "establishment_type" "EstablishmentType" DEFAULT 'SELECCIONAR',
    "ruc" TEXT,
    "first_names" TEXT,
    "last_name" TEXT,
    "mothers_last_name" TEXT,
    "individual_id" TEXT,
    "date_of_birth" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "client_cell_assignments" (
    "assignment_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "cell_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER DEFAULT 1,
    "notes" TEXT,
    "max_capacity" DECIMAL(10,2),

    CONSTRAINT "client_cell_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateIndex
CREATE INDEX "idx_client_type" ON "clients"("client_type");

-- CreateIndex
CREATE INDEX "idx_client_company_type" ON "clients"("company_type");

-- CreateIndex
CREATE INDEX "idx_client_establishment_type" ON "clients"("establishment_type");

-- CreateIndex
CREATE INDEX "idx_client_active_state" ON "clients"("active_state_id");

-- CreateIndex
CREATE INDEX "idx_client_assignments" ON "client_cell_assignments"("client_id");

-- CreateIndex
CREATE INDEX "idx_cell_client_assignments" ON "client_cell_assignments"("cell_id");

-- CreateIndex
CREATE INDEX "idx_warehouse_client_assignments" ON "client_cell_assignments"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_cell_assignments_client_id_cell_id_key" ON "client_cell_assignments"("client_id", "cell_id");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_active_state_id_fkey" FOREIGN KEY ("active_state_id") REFERENCES "active_states"("state_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_cell_assignments" ADD CONSTRAINT "client_cell_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_cell_assignments" ADD CONSTRAINT "client_cell_assignments_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "warehouse_cells"("cell_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_cell_assignments" ADD CONSTRAINT "client_cell_assignments_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_cell_assignments" ADD CONSTRAINT "client_cell_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;
