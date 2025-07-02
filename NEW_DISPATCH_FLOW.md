# New Direct Dispatch Flow Implementation

## Overview

The dispatch flow has been updated to allow dispatching directly from approved inventory, similar to how cell assignment works in entry orders. This bypasses the traditional "create order → approve → dispatch" workflow and allows for immediate dispatch from available inventory.

## New Flow vs Old Flow

### Old Flow
1. Create departure order (PENDING status)
2. Admin/Warehouse Incharge approves the order
3. Allocate inventory to the approved order
4. Dispatch the order

### New Flow (Direct Dispatch)
1. View approved entry orders with available inventory
2. Select warehouse to dispatch from
3. Select specific inventory items to dispatch
4. Create and dispatch immediately (auto-approved)

## New API Endpoints

### 1. Get Approved Entry Orders for Dispatch
```
GET /api/departure/approved-entry-orders?warehouseId={warehouse_id}
```

**Purpose**: Fetch approved entry orders that have available inventory ready for dispatch

**Query Parameters**:
- `warehouseId` (optional): Filter by specific warehouse

**Response**: List of approved entry orders with:
- Entry order details (number, date, supplier)
- Products with available inventory
- Available locations per product (FIFO sorted by expiry date)
- Dispatch priority (URGENT, HIGH, NORMAL based on expiry dates)

**Example Response**:
```json
{
  "success": true,
  "message": "Approved entry orders for dispatch fetched successfully",
  "count": 5,
  "data": [
    {
      "entry_order_id": "eo_123",
      "entry_order_no": "EO202501001",
      "entry_date_time": "2025-01-15T10:00:00Z",
      "status": "APPROVED",
      "supplier": {
        "name": "Supplier ABC",
        "company_name": "ABC Corp"
      },
      "products_with_inventory": [
        {
          "entry_order_product_id": "eop_456",
          "product_id": "prod_789",
          "product_code": "PROD001",
          "product_name": "Product Name",
          "available_quantity": 100,
          "available_weight": 150.5,
          "available_locations": [
            {
              "inventory_id": "inv_123",
              "cell_reference": "A.01.01",
              "warehouse_name": "Main Warehouse",
              "available_quantity": 50,
              "available_weight": 75.25,
              "expiration_date": "2025-06-15",
              "days_to_expiry": 120,
              "is_near_expiry": false,
              "lot_series": "LOT001"
            }
          ],
          "dispatch_priority": "NORMAL"
        }
      ],
      "can_dispatch": true
    }
  ]
}
```

### 2. Get Warehouse Dispatch Summary
```
GET /api/departure/warehouse-dispatch-summary
```

**Purpose**: Get summary of all warehouses with available inventory for dispatch

**Response**: Summary of warehouses with:
- Total quantity and weight available
- Number of unique products
- Dispatch capability status

**Example Response**:
```json
{
  "success": true,
  "message": "Warehouse dispatch summary fetched successfully",
  "count": 3,
  "data": [
    {
      "warehouse_id": "wh_001",
      "warehouse_name": "Main Warehouse",
      "warehouse_location": "Location A",
      "total_quantity": 1500,
      "total_weight": 2250.75,
      "total_products": 25,
      "can_dispatch": true
    }
  ],
  "summary": {
    "total_warehouses": 3,
    "total_quantity": 5000,
    "total_weight": 7500.25,
    "total_products": 75,
    "warehouses_with_inventory": 3
  }
}
```

### 3. Create and Dispatch from Inventory (Direct Dispatch)
```
POST /api/departure/dispatch-from-inventory
```

**Purpose**: Create departure order and dispatch immediately from selected inventory

**Request Body**:
```json
{
  "warehouse_id": "wh_001",
  "client_id": "client_123", // or customer_id
  "dispatch_document_number": "DISP-2025-001",
  "document_date": "2025-01-15",
  "departure_date_time": "2025-01-15T14:00:00Z",
  "destination_point": "Customer Location",
  "transport_type": "TRUCK",
  "carrier_name": "Transport Company",
  "document_type_ids": ["CUSTOMER_DISPATCH_NOTE"],
  "inventory_selections": [
    {
      "inventory_id": "inv_123",
      "dispatch_quantity": 50,
      "dispatch_weight": 75.25,
      "dispatch_notes": "Handle with care"
    },
    {
      "inventory_id": "inv_456",
      "dispatch_quantity": 30,
      "dispatch_weight": 45.5,
      "dispatch_notes": "Fragile items"
    }
  ],
  "dispatch_notes": "Direct dispatch from warehouse",
  "observations": "Special handling required"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Inventory dispatched successfully using direct dispatch flow",
  "departure_order": {
    "departure_order_id": "do_789",
    "departure_order_no": "OS202501001",
    "order_status": "APPROVED",
    "dispatch_status": "DISPATCHED",
    "workflow_status": "DISPATCHED",
    "dispatch_method": "DIRECT_FROM_INVENTORY",
    "bypassed_approval": true,
    "auto_approved": true
  },
  "departure_products": [
    {
      "product_id": "prod_789",
      "product_code": "PROD001",
      "product_name": "Product Name",
      "requested_quantity": 80,
      "requested_weight": 120.75,
      "selections_count": 2
    }
  ],
  "inventory_selections": [
    {
      "inventory_id": "inv_123",
      "cell_reference": "A.01.01",
      "warehouse_name": "Main Warehouse",
      "product_code": "PROD001",
      "requested_qty": 50,
      "requested_weight": 75.25,
      "will_be_empty": false
    }
  ],
  "summary": {
    "total_products": 1,
    "total_inventory_selections": 2,
    "total_quantity_dispatched": 80,
    "total_weight_dispatched": 120.75,
    "cells_affected": 2,
    "cells_depleted": 0
  },
  "workflow_info": {
    "flow_type": "DIRECT_DISPATCH_FROM_INVENTORY",
    "approval_bypassed": true,
    "status_progression": "CREATED → APPROVED → DISPATCHED (immediate)",
    "dispatch_method": "INVENTORY_SELECTION_BASED"
  }
}
```

## Frontend Implementation Flow

### 1. Warehouse Selection Screen
```javascript
// Fetch warehouse summary
const response = await fetch('/api/departure/warehouse-dispatch-summary');
const warehouses = response.data;

// Display warehouses with inventory counts
warehouses.forEach(warehouse => {
  console.log(`${warehouse.warehouse_name}: ${warehouse.total_products} products, ${warehouse.total_quantity} units`);
});
```

### 2. Entry Orders and Products Screen
```javascript
// After warehouse selection, fetch approved entry orders
const warehouseId = selectedWarehouse.warehouse_id;
const response = await fetch(`/api/departure/approved-entry-orders?warehouseId=${warehouseId}`);
const entryOrders = response.data;

// Display entry orders with products
entryOrders.forEach(entryOrder => {
  console.log(`Entry Order: ${entryOrder.entry_order_no}`);
  entryOrder.products_with_inventory.forEach(product => {
    console.log(`  Product: ${product.product_code} - ${product.available_quantity} units available`);
    
    // Show available locations (FIFO sorted)
    product.available_locations.forEach(location => {
      console.log(`    Location: ${location.cell_reference} - ${location.available_quantity} units`);
      console.log(`    Expiry: ${location.expiration_date} (${location.days_to_expiry} days)`);
    });
  });
});
```

### 3. Inventory Selection Screen
```javascript
// Build inventory selections array
const inventorySelections = [];

selectedLocations.forEach(location => {
  inventorySelections.push({
    inventory_id: location.inventory_id,
    dispatch_quantity: location.selectedQuantity,
    dispatch_weight: location.selectedWeight,
    dispatch_notes: location.notes || ""
  });
});
```

### 4. Dispatch Creation
```javascript
// Create dispatch order
const dispatchData = {
  warehouse_id: selectedWarehouse.warehouse_id,
  client_id: selectedClient.client_id,
  dispatch_document_number: "DISP-2025-001",
  document_date: new Date().toISOString(),
  departure_date_time: selectedDateTime,
  destination_point: destinationAddress,
  transport_type: "TRUCK",
  carrier_name: carrierName,
  inventory_selections: inventorySelections,
  dispatch_notes: "Direct dispatch from inventory selection"
};

const response = await fetch('/api/departure/dispatch-from-inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dispatchData)
});

const result = await response.json();
console.log(`Dispatch completed: ${result.departure_order.departure_order_no}`);
```

## Key Features

### 1. FIFO with Expiry Priority
- Products are automatically sorted by expiration date (earliest first)
- Secondary sort by entry date for FIFO compliance
- Urgency indicators (URGENT, HIGH, NORMAL) based on expiry dates

### 2. Role-Based Access Control
- **CLIENT users**: Only see products assigned to their client account
- **WAREHOUSE_INCHARGE/ADMIN**: See all available inventory
- Automatic filtering of inventory and entry orders

### 3. Real-time Inventory Validation
- Validates inventory availability before dispatch
- Checks cell capacity and product status
- Ensures quality-approved inventory only

### 4. Automatic Order Creation
- Bypasses approval workflow for immediate dispatch
- Auto-generates departure order numbers
- Creates order in DISPATCHED status immediately

### 5. Comprehensive Tracking
- Spanish language event logging for audit trails
- Tracks inventory movements and cell updates
- Complete traceability from entry to dispatch

## Error Handling

### Common Validation Errors
```json
{
  "success": false,
  "message": "Dispatch Document Number is required and cannot be empty"
}
```

```json
{
  "success": false,
  "message": "Inventory Selections is required - at least one inventory selection must be provided"
}
```

```json
{
  "success": false,
  "message": "Either Customer or Client must be selected"
}
```

### Inventory Validation Errors
```json
{
  "success": false,
  "message": "Insufficient quantity in cell A.01.01. Available: 50, Requested: 75"
}
```

## Benefits of New Flow

1. **Faster Dispatch**: No approval workflow needed
2. **Inventory-Driven**: Start from what's actually available
3. **FIFO Compliance**: Automatic expiry-based selection
4. **Real-time**: Immediate inventory updates
5. **Simplified**: Similar to cell assignment flow users already know
6. **Flexible**: Can dispatch from multiple locations in one order

## Migration Notes

- Old workflow still available for traditional order creation
- New endpoints are additive, no breaking changes
- Both flows can coexist in the same system
- Frontend can switch between flows based on user preference 