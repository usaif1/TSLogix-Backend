-- AlterTable
ALTER TABLE "entry_order_product_audits" ADD COLUMN     "updated_packaging_code" INTEGER,
ADD COLUMN     "updated_packaging_status" "PackagingStatus",
ADD COLUMN     "updated_packaging_type" "PackagingType";
