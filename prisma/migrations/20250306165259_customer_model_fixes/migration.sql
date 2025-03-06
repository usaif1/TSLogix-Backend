-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_type_id_fkey";

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "type_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "customer_types"("customer_type_id") ON DELETE SET NULL ON UPDATE CASCADE;
