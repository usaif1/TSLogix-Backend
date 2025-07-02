# New Direct Dispatch Flow Implementation

## Overview

The dispatch flow has been updated to allow dispatching approved departure orders by selecting specific inventory, similar to how cell assignment works in entry orders. This enhances the traditional workflow by adding inventory selection to approved departure orders before dispatch.

## New Flow vs Old Flow

### Old Flow
1. Create departure order (PENDING status)
2. Admin/Warehouse Incharge approves the order
3. Dispatch the order (auto-allocate inventory using FIFO)

### New Flow (Enhanced Dispatch)
1. Create departure order (PENDING status)
2. Admin/Warehouse Incharge approves the order  
3. **NEW**: View approved departure orders ready for dispatch
4. **NEW**: Select specific inventory to fulfill the approved order
5. Dispatch with selected inventory

## New API Endpoints

### 1. Get Approved Departure Orders for Dispatch
```
GET /api/departure/approved-departure-orders?warehouseId={warehouse_id}
```

**Purpose**: Fetch approved departure orders that are ready for dispatch with available inventory

**Query Parameters**:
- `warehouseId` (optional): Filter by specific warehouse

**Response**: List of approved departure orders with:
- Departure order details (number, date, customer/client)
- Products requested in the order
- Available inventory locations per product (FIFO sorted by expiry date)
- Fulfillment status (can fulfill, partial fulfillment percentage)

**Example Response**:
```json
{
  "success": true,
  "message": "Approved departure orders for dispatch fetched successfully",
  "count": 3,
  "data": [
    {
      "departure_order_id": "do_123",
      "departure_order_no": "OS202501001",
      "registration_date": "2025-01-15T10:00:00Z",
      "order_status": "APPROVED",
      "customer": {
        "name": "Customer ABC"
      },
      "warehouse": {
        "warehouse_id": "wh_001",
        "name": "Main Warehouse"
      },
      "destination_point": "Customer Location",
      "products_to_dispatch": [
        {
          "departure_order_product_id": "dop_456",
          "product_id": "prod_789",
          "product_code": "PROD001",
          "product_name": "Product Name",
          "requested_quantity": 100,
          "requested_weight": 150.5,
          "available_quantity": 120,
          "available_weight": 180.0,
          "can_fulfill": true,
          "fulfillment_percentage": 100,
          "available_locations": [
            {
              "inventory_id": "inv_123",
              "cell_reference": "A.01.01",
              "warehouse_name": "Main Warehouse",
              "available_quantity": 50,
              "available_weight": 75.25,
              "expiration_date": "2025-06-15",
              "days_to_expiry": 120,
              "lot_series": "LOT001",
              "entry_order_no": "EO202501001"
            }
          ],
          "dispatch_priority": "NORMAL"
        }
      ],
      "can_fully_fulfill": true,
      "overall_fulfillment_percentage": 100,
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

### 3. Dispatch Approved Departure Order with Inventory Selection
```
POST /api/departure/dispatch-approved-order
```

**Purpose**: Dispatch an approved departure order using selected inventory

**Request Body**:
```json
{
  "departure_order_id": "do_123",
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
  "dispatch_notes": "Dispatched with selected inventory"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Approved departure order dispatched successfully",
  "departure_order": {
    "departure_order_id": "do_123",
    "departure_order_no": "OS202501001",
    "order_status": "APPROVED",
    "dispatch_status": "DISPATCHED",
    "workflow_status": "DISPATCHED",
    "dispatch_method": "APPROVED_ORDER_DISPATCH",
    "was_pre_approved": true
  },
  "summary": {
    "total_products_dispatched": 1,
    "total_inventory_selections": 2,
    "total_quantity_dispatched": 80,
    "total_weight_dispatched": 120.75,
    "cells_affected": 2,
    "cells_depleted": 0
  },
  "workflow_info": {
    "flow_type": "APPROVED_DEPARTURE_ORDER_DISPATCH",
    "approval_required": false,
    "status_progression": "APPROVED → DISPATCHED",
    "dispatch_method": "INVENTORY_SELECTION_FROM_APPROVED_ORDER"
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

### 2. Approved Departure Orders Screen
```javascript
// After warehouse selection, fetch approved departure orders
const warehouseId = selectedWarehouse.warehouse_id;
const response = await fetch(`/api/departure/approved-departure-orders?warehouseId=${warehouseId}`);
const approvedOrders = response.data;

// Display approved departure orders with fulfillment status
approvedOrders.forEach(order => {
  console.log(`Departure Order: ${order.departure_order_no}`);
  console.log(`Customer: ${order.customer?.name || order.client?.company_name}`);
  console.log(`Can Fulfill: ${order.can_fully_fulfill ? 'Yes' : 'Partial'} (${order.overall_fulfillment_percentage}%)`);
  
  order.products_to_dispatch.forEach(product => {
    console.log(`  Product: ${product.product_code} - Requested: ${product.requested_quantity}, Available: ${product.available_quantity}`);
    
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
// Build inventory selections for the approved departure order
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

### 4. Dispatch Approved Order
```javascript
// Dispatch the approved departure order
const dispatchData = {
  departure_order_id: selectedDepartureOrder.departure_order_id,
  inventory_selections: inventorySelections,
  dispatch_notes: "Dispatched with selected inventory locations"
};

const response = await fetch('/api/departure/dispatch-approved-order', {
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
- **CLIENT users**: Only see their own approved departure orders
- **WAREHOUSE_INCHARGE/ADMIN**: See all approved departure orders
- Automatic filtering of orders and inventory

### 3. Fulfillment Analysis
- Shows whether each product can be fully fulfilled
- Calculates fulfillment percentages
- Identifies partial fulfillment scenarios

### 4. Enhanced Approval Workflow
- Works with existing approval workflow
- Adds inventory selection step after approval
- Maintains traceability and audit trails

### 5. Comprehensive Tracking
- Spanish language event logging for audit trails
- Tracks inventory movements and cell updates
- Complete traceability from order creation to dispatch

## Error Handling

### Common Validation Errors
```json
{
  "success": false,
  "message": "Departure Order ID is required and cannot be empty"
}
```

```json
{
  "success": false,
  "message": "Cannot dispatch departure order with status: PENDING. Order must be approved first."
}
```

```json
{
  "success": false,
  "message": "Departure order has already been dispatched"
}
```

### Inventory Validation Errors
```json
{
  "success": false,
  "message": "Dispatched quantity (120) exceeds requested quantity (100) for product PROD001"
}
```

## Benefits of Enhanced Flow

1. **⚡ Controlled Dispatch**: Select specific inventory for approved orders
2. **📦 Inventory Visibility**: See exactly what's available before dispatch
3. **🔄 FIFO Compliance**: Automatic expiry-based selection suggestions
4. **⏱️ Real-time**: Immediate inventory updates
5. **🎯 Familiar**: Similar to cell assignment flow users already know
6. **🔀 Flexible**: Can dispatch partial orders or select optimal inventory
7. **📋 Traceable**: Complete audit trail from order to dispatch

## Migration Notes

- Existing workflow enhanced, not replaced
- New endpoints are additive, no breaking changes
- Both old auto-dispatch and new inventory selection can coexist
- Frontend can switch between flows based on user preference

## Workflow Comparison

| Step | Old Flow | New Enhanced Flow |
|------|----------|-------------------|
| 1 | Create departure order | Create departure order |
| 2 | Approve order | Approve order |
| 3 | Auto-dispatch (FIFO) | **NEW**: Select specific inventory |
| 4 | - | Dispatch with selected inventory |

The new flow adds inventory selection control while maintaining the approval workflow integrity. 