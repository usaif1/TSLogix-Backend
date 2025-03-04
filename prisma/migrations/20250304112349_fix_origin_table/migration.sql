/*
  Warnings:

  - You are about to drop the column `country_id` on the `origins` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "origins" DROP CONSTRAINT "origins_country_id_fkey";

-- AlterTable
ALTER TABLE "origins" DROP COLUMN "country_id";
