-- CreateTable
CREATE TABLE "packaging_types" (
    "packaging_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "packaging_types_pkey" PRIMARY KEY ("packaging_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packaging_types_name_key" ON "packaging_types"("name");
