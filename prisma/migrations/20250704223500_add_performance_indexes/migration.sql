-- CreateIndex: Critical performance indexes for inventory operations
CREATE INDEX IF NOT EXISTS "idx_inventory_status_quality" ON "inventory"("status", "quality_status");
CREATE INDEX IF NOT EXISTS "idx_inventory_product_status" ON "inventory"("product_id", "status");
CREATE INDEX IF NOT EXISTS "idx_inventory_warehouse_status" ON "inventory"("warehouse_id", "status");
CREATE INDEX IF NOT EXISTS "idx_inventory_fifo_selection" ON "inventory"("product_id", "status", "quality_status");

-- CreateIndex: Entry/Departure order performance
CREATE INDEX IF NOT EXISTS "idx_entry_order_status_date" ON "entry_orders"("order_status", "registration_date");
CREATE INDEX IF NOT EXISTS "idx_departure_order_status_date" ON "departure_orders"("order_status", "registration_date");
CREATE INDEX IF NOT EXISTS "idx_departure_workflow" ON "departure_orders"("order_status", "registration_date", "warehouse_id");

-- CreateIndex: Entry order product expiry sorting (critical for FIFO)
CREATE INDEX IF NOT EXISTS "idx_entry_product_expiry" ON "entry_order_products"("product_id", "expiration_date", "manufacturing_date");
CREATE INDEX IF NOT EXISTS "idx_entry_product_lot_expiry" ON "entry_order_products"("product_id", "lot_series", "expiration_date");

-- CreateIndex: Audit log performance
CREATE INDEX IF NOT EXISTS "idx_audit_user_action_date" ON "system_audit_logs"("user_id", "action", "performed_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_entity_date" ON "system_audit_logs"("entity_type", "entity_id", "performed_at" DESC);

-- CreateIndex: Client assignment performance
CREATE INDEX IF NOT EXISTS "idx_client_product_active" ON "client_product_assignments"("client_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_client_supplier_active" ON "client_supplier_assignments"("client_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_product_client_active" ON "client_product_assignments"("product_id", "is_active");

-- CreateIndex: User assigned clients (GIN for array operations)
CREATE INDEX IF NOT EXISTS "idx_user_assigned_clients" ON "users" USING GIN("assigned_clients");

-- CreateIndex: Inventory allocation performance
CREATE INDEX IF NOT EXISTS "idx_allocation_entry_product" ON "inventory_allocations"("entry_order_product_id", "quality_status");
CREATE INDEX IF NOT EXISTS "idx_allocation_cell_status" ON "inventory_allocations"("cell_id", "quality_status");

-- CreateIndex: Departure allocation performance
CREATE INDEX IF NOT EXISTS "idx_departure_allocation_source" ON "departure_allocations"("source_allocation_id", "status");
CREATE INDEX IF NOT EXISTS "idx_departure_allocation_order" ON "departure_allocations"("departure_order_id", "status");

-- CreateIndex: Inventory logs performance
CREATE INDEX IF NOT EXISTS "idx_inventory_log_product_date" ON "inventory_logs"("product_id", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_inventory_log_user_date" ON "inventory_logs"("user_id", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_inventory_log_movement_date" ON "inventory_logs"("movement_type", "timestamp" DESC);

-- CreateIndex: Warehouse cell performance
CREATE INDEX IF NOT EXISTS "idx_cell_warehouse_status" ON "warehouse_cells"("warehouse_id", "status", "cell_role");
CREATE INDEX IF NOT EXISTS "idx_cell_capacity_usage" ON "warehouse_cells"("warehouse_id", "capacity", "currentUsage") WHERE "status" = 'AVAILABLE';

-- CreateIndex: Quality control transitions
CREATE INDEX IF NOT EXISTS "idx_quality_transition_allocation" ON "quality_control_transitions"("allocation_id", "performed_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_quality_transition_status" ON "quality_control_transitions"("to_status", "performed_at" DESC);

-- CreateIndex: Product search performance
CREATE INDEX IF NOT EXISTS "idx_product_search" ON "products"("name", "product_code", "manufacturer");
CREATE INDEX IF NOT EXISTS "idx_product_code_prefix" ON "products"("product_code" text_pattern_ops);

-- CreateIndex: Supplier performance
CREATE INDEX IF NOT EXISTS "idx_supplier_company_name" ON "suppliers"("company_name");
CREATE INDEX IF NOT EXISTS "idx_supplier_category" ON "suppliers"("category");

-- CreateIndex: Customer/Client performance
CREATE INDEX IF NOT EXISTS "idx_client_type_status" ON "clients"("client_type", "active_state_id");
CREATE INDEX IF NOT EXISTS "idx_client_company_name" ON "clients"("company_name") WHERE "client_type" = 'JURIDICO';
CREATE INDEX IF NOT EXISTS "idx_client_individual_id" ON "clients"("individual_id") WHERE "client_type" = 'NATURAL'; 