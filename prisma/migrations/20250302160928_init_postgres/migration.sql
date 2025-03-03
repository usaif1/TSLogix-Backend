-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'CLIENT', 'STAFF');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state_province" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "tax_id" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "permissions" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "last_login" TIMESTAMP(3),
    "mfa_secret" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expiry" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderTypeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" INTEGER,
    "reference_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" TEXT,

    CONSTRAINT "order_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_orders" (
    "orderId" TEXT NOT NULL,
    "origin_country" TEXT NOT NULL,
    "entry_port" TEXT,
    "customs_declaration_number" TEXT,
    "expected_arrival" TIMESTAMP(3),
    "actual_arrival" TIMESTAMP(3),
    "storage_location" TEXT,
    "inspection_required" BOOLEAN NOT NULL DEFAULT false,
    "inspection_report_url" TEXT,
    "items" TEXT,

    CONSTRAINT "entry_orders_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "departure_orders" (
    "orderId" TEXT NOT NULL,
    "destination_country" TEXT NOT NULL,
    "carrier_name" TEXT,
    "tracking_number" TEXT,
    "shipping_method" TEXT,
    "departure_date" TIMESTAMP(3),
    "estimated_delivery" TIMESTAMP(3),
    "insurance_amount" DOUBLE PRECISION,
    "export_license_number" TEXT,
    "bill_of_lading_url" TEXT,

    CONSTRAINT "departure_orders_pkey" PRIMARY KEY ("orderId")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "order_types_name_key" ON "order_types"("name");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_orderTypeId_fkey" FOREIGN KEY ("orderTypeId") REFERENCES "order_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_orders" ADD CONSTRAINT "entry_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
