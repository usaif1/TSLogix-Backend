/*
  Warnings:

  - The values [COMMERCIAL,INDIVIDUAL] on the enum `ClientType` will be removed. If these variants are still used in the database, this will fail.
  - The values [PRIVATE,PUBLIC] on the enum `CompanyType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClientType_new" AS ENUM ('JURIDICO', 'NATURAL');
ALTER TABLE "clients" ALTER COLUMN "client_type" TYPE "ClientType_new" USING ("client_type"::text::"ClientType_new");
ALTER TYPE "ClientType" RENAME TO "ClientType_old";
ALTER TYPE "ClientType_new" RENAME TO "ClientType";
DROP TYPE "ClientType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CompanyType_new" AS ENUM ('PRIVADO', 'PUBLICO');
ALTER TABLE "clients" ALTER COLUMN "company_type" TYPE "CompanyType_new" USING ("company_type"::text::"CompanyType_new");
ALTER TYPE "CompanyType" RENAME TO "CompanyType_old";
ALTER TYPE "CompanyType_new" RENAME TO "CompanyType";
DROP TYPE "CompanyType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_client_user_id_fkey";

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "auto_password_hash" DROP NOT NULL,
ALTER COLUMN "auto_username" DROP NOT NULL,
ALTER COLUMN "client_user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "client_users" (
    "client_user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("client_user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_users_user_id_key" ON "client_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_username_key" ON "client_users"("username");

-- CreateIndex
CREATE INDEX "idx_client_users_client_id" ON "client_users"("client_id");

-- CreateIndex
CREATE INDEX "idx_client_users_is_primary" ON "client_users"("is_primary");

-- CreateIndex
CREATE INDEX "idx_client_users_is_active" ON "client_users"("is_active");

-- CreateIndex
CREATE INDEX "idx_client_users_created_by" ON "client_users"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_client_primary_unique" ON "client_users"("client_id", "is_primary");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
