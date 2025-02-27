/*
  Warnings:

  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - Added the required column `userId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "last_login" DATETIME,
    "mfa_secret" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expiry" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_users" ("created_at", "first_name", "id", "last_login", "last_name", "mfa_secret", "organizationId", "password_hash", "password_reset_expiry", "password_reset_token", "phone", "roleId", "status", "updated_at") SELECT "created_at", "first_name", "id", "last_login", "last_name", "mfa_secret", "organizationId", "password_hash", "password_reset_expiry", "password_reset_token", "phone", "roleId", "status", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
