# Complete Inventory to Departure Flow - Step by Step Example

## Overview
This document shows the complete lifecycle of inventory from entry to departure dispatch, with real examples and API calls.

## 🚀 Complete Flow Diagram

```
📦 ENTRY ORDER → 🏪 CELL ALLOCATION → ✅ QUALITY CHECK → 📋 DEPARTURE ORDER → ✅ APPROVAL → 🚚 DISPATCH
```

---

## **STEP 1: Inventory Entry (Entry Order Creation)**

### 1.1 Create Entry Order
A supplier delivers goods to the warehouse.

**API Call:**
```http
POST /api/entry/entry-orders
```

**Request:**
```json
{
  "entry_order_no": "EO202501001",
  "supplier_id": "supplier_001",
  "entry_date_time": "2025-01-15T10:00:00Z",
  "registration_date": "2025-01-15T09:30:00Z",
  "document_date": "2025-01-14",
  "warehouse_id": "wh_001",
  "created_by": "user_001",
  "organisation_id": "org_001",
  "products": [
    {
      "product_id": "prod_001",
      "product_code": "PROD001",
      "quantity": 200,
      "package_quantity": 200,
      "weight": 300.5,
      "lot_series": "LOT20250115001",
      "manufacturing_date": "2025-01-10",
      "expiration_date": "2025-07-15",
      "presentation": "CAJA",
      "unit_price": 25.50
    },
    {
      "product_id": "prod_002", 
      "product_code": "PROD002",
      "quantity": 150,
      "package_quantity": 150,
      "weight": 225.0,
      "lot_series": "LOT20250115002",
      "manufacturing_date": "2025-01-12",
      "expiration_date": "2025-06-20",
      "presentation": "CAJA",
      "unit_price": 18.75
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Entry order created successfully",
  "entry_order": {
    "entry_order_id": "eo_123456",
    "entry_order_no": "EO202501001",
    "status": "PENDING",
    "total_products": 2,
    "total_quantity": 350,
    "total_weight": 525.5
  }
}
```

---

## **STEP 2: Entry Order Approval**

### 2.1 Admin/Warehouse Incharge Approves Entry Order

**API Call:**
```http
POST /api/entry/entry-orders/eo_123456/approve
```

**Request:**
```json
{
  "approval_comments": "All documentation verified. Products approved for warehouse entry."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Entry order approved successfully",
  "entry_order": {
    "entry_order_id": "eo_123456",
    "status": "APPROVED",
    "approved_by": "admin_001",
    "approved_at": "2025-01-15T11:30:00Z"
  }
}
```

---

## **STEP 3: Cell Assignment (Inventory Allocation)**

### 3.1 Get Approved Entry Orders for Cell Assignment

**API Call:**
```http
GET /api/entry/approved-entry-orders
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "entry_order_id": "eo_123456",
      "entry_order_no": "EO202501001",
      "status": "APPROVED",
      "supplier": {
        "name": "ABC Pharmaceuticals"
      },
      "products": [
        {
          "entry_order_product_id": "eop_001",
          "product_code": "PROD001",
          "product_name": "Medicine A",
          "quantity": 200,
          "weight": 300.5,
          "expiration_date": "2025-07-15",
          "lot_series": "LOT20250115001"
        },
        {
          "entry_order_product_id": "eop_002", 
          "product_code": "PROD002",
          "product_name": "Medicine B",
          "quantity": 150,
          "weight": 225.0,
          "expiration_date": "2025-06-20",
          "lot_series": "LOT20250115002"
        }
      ]
    }
  ]
}
```

### 3.2 Get Available Cells for Assignment

**API Call:**
```http
GET /api/entry/warehouses/wh_001/available-cells?entryOrderProductId=eop_001
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "cell_id": "cell_001",
      "cell_reference": "A.01.01",
      "warehouse_name": "Main Warehouse",
      "current_capacity": 0,
      "max_capacity": 500,
      "available_capacity": 500,
      "status": "AVAILABLE",
      "can_allocate": true
    },
    {
      "cell_id": "cell_002",
      "cell_reference": "A.01.02", 
      "warehouse_name": "Main Warehouse",
      "current_capacity": 100,
      "max_capacity": 500,
      "available_capacity": 400,
      "status": "PARTIALLY_OCCUPIED",
      "can_allocate": true
    }
  ]
}
```

### 3.3 Assign Products to Cells

**API Call:**
```http
POST /api/entry/assign-cells
```

**Request:**
```json
{
  "entry_order_id": "eo_123456",
  "cell_assignments": [
    {
      "entry_order_product_id": "eop_001",
      "cell_id": "cell_001",
      "inventory_quantity": 200,
      "package_quantity": 200,
      "weight_kg": 300.5,
      "presentation": "CAJA",
      "product_status": "PAL_NORMAL",
      "status_code": 31,
      "guide_number": "GN001",
      "observations": "Stored in optimal conditions"
    },
    {
      "entry_order_product_id": "eop_002",
      "cell_id": "cell_002", 
      "inventory_quantity": 150,
      "package_quantity": 150,
      "weight_kg": 225.0,
      "presentation": "CAJA",
      "product_status": "PAL_NORMAL",
      "status_code": 31,
      "guide_number": "GN002",
      "observations": "Temperature controlled storage"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cell assignments completed successfully",
  "assignments": [
    {
      "allocation_id": "alloc_001",
      "cell_reference": "A.01.01",
      "product_code": "PROD001",
      "allocated_quantity": 200,
      "status": "ACTIVE"
    },
    {
      "allocation_id": "alloc_002",
      "cell_reference": "A.01.02",
      "product_code": "PROD002", 
      "allocated_quantity": 150,
      "status": "ACTIVE"
    }
  ]
}
```

---

## **STEP 4: Quality Control Check**

### 4.1 Quality Team Approves Inventory

**API Call:**
```http
POST /api/inventory/allocations/approve-quality
```

**Request:**
```json
{
  "allocation_ids": ["alloc_001", "alloc_002"],
  "quality_status": "APROBADO",
  "quality_comments": "All products passed quality inspection",
  "approved_by": "quality_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quality approval completed",
  "approved_allocations": 2,
  "inventory_status": "AVAILABLE"
}
```

**📊 Current Inventory Status:**
```
Cell A.01.01: 200 units PROD001 (AVAILABLE, APROBADO)
Cell A.01.02: 150 units PROD002 (AVAILABLE, APROBADO)
```

---

## **STEP 5: Departure Order Creation**

### 5.1 Create Departure Order

**API Call:**
```http
POST /api/departure/departure-orders
```

**Request:**
```json
{
  "departure_order_no": "OS202501001",
  "client_id": "client_001",
  "warehouse_id": "wh_001",
  "departure_date_time": "2025-01-16T14:00:00Z",
  "document_date": "2025-01-16",
  "dispatch_document_number": "DISP-2025-001",
  "destination_point": "Client Pharmacy Network",
  "transport_type": "TRUCK",
  "carrier_name": "Express Logistics",
  "total_pallets": 2,
  "document_type_ids": ["CUSTOMER_DISPATCH_NOTE"],
  "created_by": "user_002",
  "organisation_id": "org_001",
  "products": [
    {
      "product_id": "prod_001",
      "product_code": "PROD001",
      "lot_series": "LOT20250115001",
      "requested_quantity": 120,
      "requested_packages": 120,
      "requested_weight": 180.3,
      "presentation": "CAJA"
    },
    {
      "product_id": "prod_002",
      "product_code": "PROD002", 
      "lot_series": "LOT20250115002",
      "requested_quantity": 80,
      "requested_packages": 80,
      "requested_weight": 120.0,
      "presentation": "CAJA"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Departure order created successfully and is pending approval",
  "departure_order": {
    "departure_order_id": "do_789012",
    "departure_order_no": "OS202501001",
    "order_status": "PENDING",
    "workflow_status": "PENDING_APPROVAL",
    "total_products": 2,
    "total_requested_quantity": 200,
    "total_requested_weight": 300.3
  }
}
```

---

## **STEP 6: Departure Order Approval**

### 6.1 Admin/Warehouse Incharge Approves Departure Order

**API Call:**
```http
POST /api/departure/departure-orders/do_789012/approve
```

**Request:**
```json
{
  "approval_comments": "Order reviewed and approved for dispatch. All products available in inventory."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Departure order approved successfully",
  "departure_order": {
    "departure_order_id": "do_789012",
    "order_status": "APPROVED",
    "workflow_status": "APPROVED",
    "approved_by": "admin_001",
    "approved_at": "2025-01-16T10:30:00Z",
    "can_be_dispatched": true
  }
}
```

---

## **STEP 7: New Dispatch Flow - Get Approved Orders Ready for Dispatch**

### 7.1 Get Approved Departure Orders with Available Inventory

**API Call:**
```http
GET /api/departure/approved-departure-orders?warehouseId=wh_001
```

**Response:**
```json
{
  "success": true,
  "message": "Approved departure orders for dispatch fetched successfully",
  "count": 1,
  "data": [
    {
      "departure_order_id": "do_789012",
      "departure_order_no": "OS202501001",
      "order_status": "APPROVED",
      "client": {
        "company_name": "City Pharmacy Chain",
        "client_type": "PHARMACY"
      },
      "destination_point": "Client Pharmacy Network",
      "dispatch_document_number": "DISP-2025-001",
      "products_to_dispatch": [
        {
          "departure_order_product_id": "dop_001",
          "product_code": "PROD001",
          "product_name": "Medicine A",
          "requested_quantity": 120,
          "requested_weight": 180.3,
          "available_quantity": 200,
          "available_weight": 300.5,
          "can_fulfill": true,
          "fulfillment_percentage": 100,
          "available_locations": [
            {
              "inventory_id": "inv_001",
              "allocation_id": "alloc_001",
              "cell_reference": "A.01.01",
              "warehouse_name": "Main Warehouse",
              "available_quantity": 200,
              "available_weight": 300.5,
              "expiration_date": "2025-07-15",
              "days_to_expiry": 181,
              "lot_series": "LOT20250115001",
              "entry_order_no": "EO202501001",
              "is_near_expiry": false,
              "dispatch_priority": "NORMAL"
            }
          ]
        },
        {
          "departure_order_product_id": "dop_002",
          "product_code": "PROD002",
          "product_name": "Medicine B", 
          "requested_quantity": 80,
          "requested_weight": 120.0,
          "available_quantity": 150,
          "available_weight": 225.0,
          "can_fulfill": true,
          "fulfillment_percentage": 100,
          "available_locations": [
            {
              "inventory_id": "inv_002",
              "allocation_id": "alloc_002",
              "cell_reference": "A.01.02",
              "warehouse_name": "Main Warehouse",
              "available_quantity": 150,
              "available_weight": 225.0,
              "expiration_date": "2025-06-20",
              "days_to_expiry": 156,
              "lot_series": "LOT20250115002",
              "entry_order_no": "EO202501001",
              "is_near_expiry": false,
              "dispatch_priority": "NORMAL"
            }
          ]
        }
      ],
      "can_fully_fulfill": true,
      "overall_fulfillment_percentage": 100,
      "can_dispatch": true
    }
  ]
}
```

---

## **STEP 8: Inventory Selection for Dispatch**

### 8.1 Frontend User Selects Specific Inventory

Based on the available locations, the user selects:

```javascript
// User selects specific inventory for dispatch
const inventorySelections = [
  {
    inventory_id: "inv_001",        // From cell A.01.01
    dispatch_quantity: 120,         // Requested quantity for PROD001
    dispatch_weight: 180.3,         // Requested weight for PROD001
    dispatch_notes: "FIFO - earliest expiry"
  },
  {
    inventory_id: "inv_002",        // From cell A.01.02  
    dispatch_quantity: 80,          // Requested quantity for PROD002
    dispatch_weight: 120.0,         // Requested weight for PROD002
    dispatch_notes: "Good condition, temperature controlled"
  }
];
```

### 8.2 Dispatch Approved Order with Selected Inventory

**API Call:**
```http
POST /api/departure/dispatch-approved-order
```

**Request:**
```json
{
  "departure_order_id": "do_789012",
  "inventory_selections": [
    {
      "inventory_id": "inv_001",
      "dispatch_quantity": 120,
      "dispatch_weight": 180.3,
      "dispatch_notes": "FIFO - earliest expiry"
    },
    {
      "inventory_id": "inv_002",
      "dispatch_quantity": 80, 
      "dispatch_weight": 120.0,
      "dispatch_notes": "Good condition, temperature controlled"
    }
  ],
  "dispatch_notes": "Order dispatched with optimal FIFO inventory selection"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Approved departure order dispatched successfully",
  "departure_order": {
    "departure_order_id": "do_789012",
    "departure_order_no": "OS202501001",
    "order_status": "APPROVED",
    "dispatch_status": "DISPATCHED",
    "workflow_status": "DISPATCHED",
    "dispatched_by": "user_003",
    "dispatched_at": "2025-01-16T15:30:00Z",
    "dispatch_method": "APPROVED_ORDER_DISPATCH"
  },
  "summary": {
    "total_products_dispatched": 2,
    "total_inventory_selections": 2,
    "total_quantity_dispatched": 200,
    "total_weight_dispatched": 300.3,
    "cells_affected": 2,
    "cells_depleted": 0
  },
  "inventory_selections": [
    {
      "inventory_id": "inv_001",
      "cell_reference": "A.01.01",
      "product_code": "PROD001",
      "dispatched_qty": 120,
      "remaining_qty": 80,
      "will_be_empty": false
    },
    {
      "inventory_id": "inv_002", 
      "cell_reference": "A.01.02",
      "product_code": "PROD002",
      "dispatched_qty": 80,
      "remaining_qty": 70,
      "will_be_empty": false
    }
  ]
}
```

---

## **FINAL INVENTORY STATUS**

### After Dispatch:
```
📦 Cell A.01.01: 80 units PROD001 remaining (was 200, dispatched 120)
📦 Cell A.01.02: 70 units PROD002 remaining (was 150, dispatched 80)

🚚 Dispatched Order OS202501001:
   - 120 units PROD001 (LOT20250115001)
   - 80 units PROD002 (LOT20250115002)
   - Total: 200 units, 300.3 kg
   - Destination: Client Pharmacy Network
   - Status: DISPATCHED
```

---

## **📊 Complete Flow Summary**

| Step | Action | Status | API Endpoint | Result |
|------|--------|--------|--------------|---------|
| 1 | Create Entry Order | PENDING | `POST /api/entry/entry-orders` | Entry order created |
| 2 | Approve Entry Order | APPROVED | `POST /api/entry/entry-orders/{id}/approve` | Ready for allocation |
| 3 | Assign to Cells | ALLOCATED | `POST /api/entry/assign-cells` | Inventory in cells |
| 4 | Quality Check | APROBADO | `POST /api/inventory/allocations/approve-quality` | Available for dispatch |
| 5 | Create Departure Order | PENDING | `POST /api/departure/departure-orders` | Departure order created |
| 6 | Approve Departure Order | APPROVED | `POST /api/departure/departure-orders/{id}/approve` | Ready for dispatch |
| 7 | View Available Orders | - | `GET /api/departure/approved-departure-orders` | See dispatch options |
| 8 | Select & Dispatch | DISPATCHED | `POST /api/departure/dispatch-approved-order` | Order completed |

---

## **🎯 Key Benefits of This Flow**

### ✅ **Complete Traceability**
- Every product tracked from entry to dispatch
- Lot numbers maintained throughout
- FIFO compliance with expiry date priority

### ✅ **Quality Control**
- Quality approval required before availability
- Only approved inventory can be dispatched

### ✅ **Approval Workflow**
- Entry orders must be approved before allocation
- Departure orders must be approved before dispatch
- Role-based access control throughout

### ✅ **Inventory Selection Control**
- See exactly what inventory is available
- Choose specific cells/lots for dispatch
- Optimize for FIFO, expiry dates, or other criteria

### ✅ **Real-time Updates**
- Inventory quantities updated immediately
- Cell status changes reflected instantly
- Complete audit trail maintained

This flow ensures complete control and visibility from the moment goods enter the warehouse until they're dispatched to customers! 🚀 