/*
  Warnings:

  - You are about to drop the column `exit_option_id` on the `departure_orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_exit_option_id_fkey";

-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "exit_option_id",
ADD COLUMN     "arrival_point" TEXT,
ADD COLUMN     "date_and_time_of_transfer" TIMESTAMP(3),
ADD COLUMN     "departure_order_no" TEXT,
ADD COLUMN     "document_date" TIMESTAMP(3),
ADD COLUMN     "document_no" TEXT,
ADD COLUMN     "document_status" TEXT,
ADD COLUMN     "document_type_id" TEXT,
ADD COLUMN     "exitOptionExit_option_id" TEXT,
ADD COLUMN     "id_responsible" TEXT,
ADD COLUMN     "observation" TEXT,
ADD COLUMN     "order_progress" TEXT,
ADD COLUMN     "personnel_in_charge_id" TEXT,
ADD COLUMN     "registration_date" TIMESTAMP(3),
ADD COLUMN     "responsible_for_collection" TEXT;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("document_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_personnel_in_charge_id_fkey" FOREIGN KEY ("personnel_in_charge_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_exitOptionExit_option_id_fkey" FOREIGN KEY ("exitOptionExit_option_id") REFERENCES "exit_options"("exit_option_id") ON DELETE SET NULL ON UPDATE CASCADE;
