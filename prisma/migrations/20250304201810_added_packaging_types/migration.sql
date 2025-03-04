/*
  Warnings:

  - You are about to drop the column `iso_code` on the `countries` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "countries_iso_code_key";

-- AlterTable
ALTER TABLE "countries" DROP COLUMN "iso_code";
