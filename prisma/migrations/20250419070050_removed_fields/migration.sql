/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cycle_count_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cycle_counts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `physical_count_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `physical_counts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cycle_count_entries" DROP CONSTRAINT "cycle_count_entries_cycle_count_id_fkey";

-- DropForeignKey
ALTER TABLE "physical_count_entries" DROP CONSTRAINT "physical_count_entries_physical_count_id_fkey";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "cycle_count_entries";

-- DropTable
DROP TABLE "cycle_counts";

-- DropTable
DROP TABLE "physical_count_entries";

-- DropTable
DROP TABLE "physical_counts";
