/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `roleRole_id` on the `users` table. All the data in the column will be lost.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleRole_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
DROP COLUMN "roleRole_id",
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "role_id" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;
