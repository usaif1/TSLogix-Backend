-- CreateEnum
CREATE TYPE "CellRole" AS ENUM ('STANDARD', 'DAMAGED', 'EXPIRED', 'RETURNS');

-- AlterTable
ALTER TABLE "warehouse_cells" ADD COLUMN     "cell_role" "CellRole" NOT NULL DEFAULT 'STANDARD';
