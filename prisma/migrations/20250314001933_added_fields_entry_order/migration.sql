-- AlterTable
ALTER TABLE "entry_orders" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "entry_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entry_transfer_note" TEXT,
ADD COLUMN     "insured_value" DECIMAL(10,2),
ADD COLUMN     "palettes" TEXT,
ADD COLUMN     "product_description" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "type" TEXT;
