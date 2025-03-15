/*
  Warnings:

  - You are about to drop the column `exitOptionExit_option_id` on the `departure_orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "departure_orders" DROP CONSTRAINT "departure_orders_exitOptionExit_option_id_fkey";

-- AlterTable
ALTER TABLE "departure_orders" DROP COLUMN "exitOptionExit_option_id",
ADD COLUMN     "exit_option_id" TEXT;

-- AddForeignKey
ALTER TABLE "departure_orders" ADD CONSTRAINT "departure_orders_exit_option_id_fkey" FOREIGN KEY ("exit_option_id") REFERENCES "exit_options"("exit_option_id") ON DELETE SET NULL ON UPDATE CASCADE;
