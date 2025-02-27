-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);
INSERT INTO "new_organizations" ("address", "city", "contact_email", "contact_phone", "country", "created_at", "id", "name", "postal_code", "state_province", "status", "tax_id", "updated_at") SELECT "address", "city", "contact_email", "contact_phone", "country", "created_at", "id", "name", "postal_code", "state_province", "status", "tax_id", "updated_at" FROM "organizations";
DROP TABLE "organizations";
ALTER TABLE "new_organizations" RENAME TO "organizations";
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
