-- Step 1: Remove foreign key constraint temporarily
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_created_by_fkey";

-- Step 2: Add new nullable column
ALTER TABLE "users" ADD COLUMN "id" UUID;

-- Step 3: Generate UUIDs for existing records
UPDATE "users" SET "id" = gen_random_uuid();

-- Step 4: Add not-null constraint after population
ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL;

-- Step 5: Create new primary key constraint
ALTER TABLE "users" 
DROP CONSTRAINT "users_pkey",
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- Step 6: Ensure user_id uniqueness before creating index
DELETE FROM "users" a
USING "users" b
WHERE a.ctid < b.ctid
AND a.user_id = b.user_id;

-- Step 7: Create unique index for user_id
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- Step 8: Convert orders.created_by to UUID type
ALTER TABLE "orders" 
ALTER COLUMN "created_by" TYPE UUID USING "created_by"::UUID;

-- Step 9: Recreate foreign key constraint
ALTER TABLE "orders" 
ADD CONSTRAINT "orders_created_by_fkey" 
FOREIGN KEY ("created_by") 
REFERENCES "users"("id") 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- Step 10: Add default for future inserts
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();