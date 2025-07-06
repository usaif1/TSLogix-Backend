# Field Consistency & Data Flow Guide - TSLogix Backend

## Overview

This document tracks field consistency and data flow throughout the TSLogix application lifecycle to ensure data integrity and proper parameter propagation across different stages.

## Core Data Flow Stages

### 1. Entry Order → Inventory Allocation → Quality Control → Departure Order

```
ENTRY ORDER PRODUCT → INVENTORY ALLOCATION → QUALITY TRANSITION → DEPARTURE ALLOCATION
```

## Field Mapping & Consistency Rules

### Entry Order Product → Inventory Allocation
**Purpose**: When products are received and allocated to warehouse cells

| Entry Order Product Field | Inventory Allocation Field | Notes | Status |
|---------------------------|---------------------------|-------|---------|
| `entry_order_product_id` | `entry_order_product_id` | Primary reference | ✅ Consistent |
| `entry_order_id` | `entry_order_id` | Order reference | ✅ Consistent |
| `product_id` | N/A (via entry_order_product) | Product reference | ✅ Consistent |
| `inventory_quantity` | `inventory_quantity` | Allocated quantity | ✅ Consistent |
| `package_quantity` | `package_quantity` | Package count | ✅ Consistent |
| `quantity_pallets` | `quantity_pallets` | Pallet count | ✅ Consistent |
| `weight_kg` | `weight_kg` | Physical weight | ✅ Consistent |
| `volume_m3` | `volume_m3` | Physical volume | ✅ Consistent |
| `insured_value` | N/A (kept in source) | Financial value | ✅ Preserved |
| `lot_series` | N/A (kept in source) | Batch/lot tracking | ✅ Preserved |
| `expiration_date` | N/A (kept in source) | Expiry tracking | ✅ Preserved |
| `presentation` | N/A (kept in source) | Product presentation | ✅ Preserved |
| N/A | `cell_id` | NEW: Storage location | ✅ Added |
| N/A | `quality_status` | NEW: Quality state (CUARENTENA) | ✅ Added |
| N/A | `product_status` | NEW: Product condition | ✅ Added |
| N/A | `allocated_by` | NEW: User who allocated | ✅ Added |
| N/A | `allocated_at` | NEW: Allocation timestamp | ✅ Added |

### Inventory Allocation → Quality Control Transition
**Purpose**: When quality status changes (CUARENTENA → APROBADO/RECHAZADOS/etc.)

| Source Field | Target Field | Notes | Status |
|-------------|-------------|-------|---------|
| `allocation_id` | `allocation_id` | Reference to allocation | ✅ Consistent |
| `quality_status` (old) | `previous_status` | Previous quality state | ✅ Tracked |
| `quality_status` (new) | `new_status` | New quality state | ✅ Tracked |
| N/A | `performed_by` | NEW: User who changed status | ✅ Added |
| N/A | `performed_at` | NEW: Change timestamp | ✅ Added |
| N/A | `observations` | NEW: Quality control notes | ✅ Added |

### Inventory Allocation → Departure Allocation
**Purpose**: When products are selected for departure/dispatch

| Source Field | Target Field | Notes | Status |
|-------------|-------------|-------|---------|
| `allocation_id` | `source_allocation_id` | Reference to source | ✅ Consistent |
| `inventory_quantity` | `allocated_quantity` | Quantity to dispatch | ⚠️ NAMING CHANGE |
| `package_quantity` | `allocated_packages` | Package count | ⚠️ NAMING CHANGE |
| `quantity_pallets` | `allocated_pallets` | Pallet count | ⚠️ NAMING CHANGE |
| `weight_kg` | `allocated_weight` | Weight allocation | ⚠️ NAMING CHANGE |
| `volume_m3` | `allocated_volume` | Volume allocation | ⚠️ NAMING CHANGE |
| `cell_id` | `cell_id` | Source cell location | ✅ Consistent |
| N/A | `departure_order_id` | NEW: Target departure order | ✅ Added |
| N/A | `departure_order_product_id` | NEW: Target product line | ✅ Added |
| N/A | `allocated_by` | NEW: User who allocated | ✅ Added |

### Departure Order Product → Departure Allocation
**Purpose**: Requested quantities vs actual allocated quantities

| Departure Order Product Field | Departure Allocation Field | Notes | Status |
|------------------------------|---------------------------|-------|---------|
| `departure_order_product_id` | `departure_order_product_id` | Product line reference | ✅ Consistent |
| `departure_order_id` | `departure_order_id` | Order reference | ✅ Consistent |
| `requested_quantity` | `allocated_quantity` | Quantity mapping | ⚠️ SEMANTIC CHANGE |
| `requested_packages` | `allocated_packages` | Package mapping | ⚠️ SEMANTIC CHANGE |
| `requested_pallets` | `allocated_pallets` | Pallet mapping | ⚠️ SEMANTIC CHANGE |
| `requested_weight` | `allocated_weight` | Weight mapping | ⚠️ SEMANTIC CHANGE |
| `requested_volume` | `allocated_volume` | Volume mapping | ⚠️ SEMANTIC CHANGE |

## Critical Consistency Rules

### 1. **Quantity Conservation Rule**
```
Entry Product Quantity ≥ Sum of Inventory Allocations
Sum of Inventory Allocations ≥ Sum of Departure Allocations
```

### 2. **Financial Value Preservation Rule**
```
Entry Product insured_value MUST be preserved and accessible throughout lifecycle
Reports MUST use insured_value as financial_value
```

### 3. **Quality Status Transition Rule**
```
CUARENTENA → (APROBADO | RECHAZADOS | DEVOLUCIONES | CONTRAMUESTRAS)
Only APROBADO products can be allocated for departure
```

### 4. **Traceability Rule**
```
Every departure allocation MUST trace back to source inventory allocation
Every inventory allocation MUST trace back to entry order product
Every quality transition MUST be logged with user and timestamp
```

### 5. **Cell Assignment Rule**
```
Products can only be allocated to cells with compatible storage requirements
Cell assignments MUST be tracked throughout the lifecycle
```

## Field Naming Consistency Issues & Solutions

### ⚠️ Inconsistent Naming Patterns Found

| Context | Inconsistent Fields | Recommended Solution |
|---------|-------------------|---------------------|
| Quantities | `inventory_quantity` vs `allocated_quantity` vs `requested_quantity` | Standardize to `quantity` with context prefix |
| Packages | `package_quantity` vs `allocated_packages` vs `requested_packages` | Standardize to `packages` with context prefix |
| Weight | `weight_kg` vs `allocated_weight` vs `requested_weight` | Standardize to `weight_kg` everywhere |
| Volume | `volume_m3` vs `allocated_volume` vs `requested_volume` | Standardize to `volume_m3` everywhere |
| User References | `allocated_by` vs `performed_by` vs `created_by` | Standardize to `action_by` pattern |

### 🔧 Proposed Field Standardization

#### Option A: Context-Prefixed Fields
```sql
-- Entry Order Product
entry_quantity, entry_packages, entry_weight_kg, entry_volume_m3

-- Inventory Allocation  
allocated_quantity, allocated_packages, allocated_weight_kg, allocated_volume_m3

-- Departure Order Product (Requested)
requested_quantity, requested_packages, requested_weight_kg, requested_volume_m3

-- Departure Order Product (Dispatched)
dispatched_quantity, dispatched_packages, dispatched_weight_kg, dispatched_volume_m3

-- Departure Allocation (Actual)
source_quantity, source_packages, source_weight_kg, source_volume_m3
```

#### Option B: Consistent Base Names (Current Approach)
```sql
-- All contexts use same base field names
quantity_units, package_quantity, weight_kg, volume_m3
-- Context determined by table/relationship
```

## Data Validation Checkpoints

### 1. **Entry Stage Validation**
- [ ] All required fields populated from entry order product
- [ ] Financial values (insured_value) properly captured
- [ ] Product identification (lot_series, expiration_date) preserved
- [ ] Physical measurements (weight, volume) consistent

### 2. **Allocation Stage Validation**
- [ ] Inventory allocation quantities ≤ entry product quantities
- [ ] Cell assignments match product storage requirements
- [ ] Quality status initialized to CUARENTENA
- [ ] User tracking (allocated_by) properly captured

### 3. **Quality Control Stage Validation**
- [ ] Quality transitions properly logged with timestamps
- [ ] Previous and new status captured in transitions
- [ ] User accountability (performed_by) tracked
- [ ] Business rules enforced (only APROBADO can be dispatched)

### 4. **Departure Stage Validation**
- [ ] Departure allocations reference valid inventory allocations
- [ ] Allocated quantities ≤ available inventory quantities
- [ ] Quality status = APROBADO for departure allocations
- [ ] Traceability chain intact (departure → inventory → entry)

## Monitoring & Consistency Checks

### Automated Validation Queries

#### 1. Quantity Conservation Check
```sql
-- Check if entry quantities match allocated quantities
SELECT 
  eop.entry_order_product_id,
  eop.inventory_quantity as entry_qty,
  SUM(ia.inventory_quantity) as allocated_qty,
  (eop.inventory_quantity - SUM(ia.inventory_quantity)) as difference
FROM entry_order_products eop
LEFT JOIN inventory_allocations ia ON ia.entry_order_product_id = eop.entry_order_product_id
GROUP BY eop.entry_order_product_id, eop.inventory_quantity
HAVING difference != 0;
```

#### 2. Quality Status Consistency Check
```sql
-- Check for invalid quality transitions
SELECT 
  qct.*
FROM quality_control_transitions qct
WHERE (qct.previous_status, qct.new_status) NOT IN (
  ('CUARENTENA', 'APROBADO'),
  ('CUARENTENA', 'RECHAZADOS'),
  ('CUARENTENA', 'DEVOLUCIONES'),
  ('CUARENTENA', 'CONTRAMUESTRAS'),
  ('APROBADO', 'DEVOLUCIONES'),
  ('DEVOLUCIONES', 'APROBADO')
);
```

#### 3. Departure Allocation Traceability Check
```sql
-- Check for departure allocations without proper source tracing
SELECT 
  da.departure_allocation_id,
  da.source_allocation_id,
  ia.allocation_id,
  ia.quality_status
FROM departure_allocations da
LEFT JOIN inventory_allocations ia ON ia.allocation_id = da.source_allocation_id
WHERE ia.allocation_id IS NULL 
   OR ia.quality_status != 'APROBADO';
```

#### 4. Financial Value Preservation Check
```sql
-- Check for missing or zero financial values
SELECT 
  eop.entry_order_product_id,
  eop.insured_value,
  p.product_code,
  p.name as product_name
FROM entry_order_products eop
JOIN products p ON p.product_id = eop.product_id
WHERE eop.insured_value IS NULL 
   OR eop.insured_value = 0;
```

## Field Evolution Tracking

### Version 1.0 - Initial Implementation
- [x] Basic field mapping between entry and inventory
- [x] Quality status tracking
- [x] User accountability fields

### Version 1.1 - Reports Enhancement (Current)
- [x] Fixed financial_value to use insured_value in reports
- [x] Standardized quantity field usage in departure allocations
- [x] Added comprehensive field validation

### Version 1.2 - Planned Improvements
- [ ] Standardize field naming across all contexts
- [ ] Add automated consistency validation triggers
- [ ] Implement field change audit logging
- [ ] Add data integrity constraints at database level

## Best Practices for Field Consistency

### 1. **New Feature Development**
- Always map existing fields before adding new ones
- Preserve financial values (insured_value) throughout lifecycle
- Maintain traceability chain integrity
- Use consistent naming patterns for similar fields

### 2. **Database Schema Changes**
- Document field mappings before making changes
- Ensure backward compatibility for existing data
- Update all related queries and reports
- Add validation checks for new relationships

### 3. **API Development**
- Use consistent field names in API responses
- Map internal field names to user-friendly names when needed
- Preserve data types throughout the transformation chain
- Document field transformations in API documentation

### 4. **Report Development**
- Always use source fields for calculations (e.g., insured_value for financial values)
- Maintain field consistency across different report types
- Document data source for each report field
- Validate calculated fields against source data

---

**Note**: This document should be updated whenever:
- New tables or fields are added
- Field mappings change
- Business rules for data flow are modified
- Inconsistencies are discovered and resolved