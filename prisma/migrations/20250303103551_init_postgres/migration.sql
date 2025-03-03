-- AlterTable
ALTER TABLE "users" ADD COLUMN     "roleRole_id" TEXT;

-- CreateTable
CREATE TABLE "roles" (
    "role_id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleRole_id_fkey" FOREIGN KEY ("roleRole_id") REFERENCES "roles"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;
