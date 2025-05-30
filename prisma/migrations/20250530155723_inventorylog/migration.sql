-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_cell_assignment_id_fkey" FOREIGN KEY ("cell_assignment_id") REFERENCES "cell_assignments"("assignment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_entry_order_product_id_fkey" FOREIGN KEY ("entry_order_product_id") REFERENCES "entry_order_products"("entry_order_product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_departure_order_product_id_fkey" FOREIGN KEY ("departure_order_product_id") REFERENCES "departure_order_products"("departure_order_product_id") ON DELETE SET NULL ON UPDATE CASCADE;
