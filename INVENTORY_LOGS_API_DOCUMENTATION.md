# Enhanced Inventory Logs API Documentation

## Overview
The enhanced inventory logs API provides comprehensive filtering capabilities to track inventory movements, including dispatch operations and entry order activities. This API allows users to filter inventory logs by dispatch/departure orders, entry orders, and many other criteria.

## Endpoint
```
GET /inventory/audit-trail
```

## Authentication
- **Required**: Yes
- **Roles**: `WAREHOUSE_INCHARGE`, `ADMIN`
- **Header**: `Authorization: Bearer <jwt_token>`

## Query Parameters

### Movement Type Filters
| Parameter | Type | Description | Values |
|-----------|------|-------------|---------|
| `movement_type` | String | Filter by type of inventory movement | `ENTRY`, `DEPARTURE`, `ADJUSTMENT`, `TRANSFER` |

### Order-Specific Filters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `entry_order_id` | UUID | Filter logs for specific entry order | `f1b630e2-7962-4562-96d8-b03dff852478` |
| `departure_order_id` | UUID | Filter logs for specific departure/dispatch order | `018dfa82-90d0-4cec-af43-e2c953d49fd8` |

### Entity Filters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `product_id` | UUID | Filter by specific product | `380ccd59-8218-4653-b7fd-f42b36052e81` |
| `warehouse_id` | UUID | Filter by specific warehouse | `51f6e33a-cb55-4ebe-bf04-3b33c9bc3815` |
| `cell_id` | UUID | Filter by specific cell | `3ab6c976-a10b-4f19-a51f-f08d0bad5e71` |
| `user_id` | UUID | Filter by user who performed the action | `1c6dee4e-fda8-407f-83b2-ff42aa983182` |

### Date Range Filters
| Parameter | Type | Description | Format | Example |
|-----------|------|-------------|---------|---------|
| `date_from` | Date | Start date for filtering | `YYYY-MM-DD` | `2025-06-01` |
| `date_to` | Date | End date for filtering | `YYYY-MM-DD` | `2025-06-30` |

### Pagination
| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `limit` | Integer | Number of logs to return | `50` | `20` |
| `offset` | Integer | Number of logs to skip | `0` | `20` |

## Response Format

```json
{
  "success": true,
  "message": "Inventory movement logs retrieved successfully",
  "data": [
    {
      "log_id": "uuid",
      "timestamp": "2025-06-28T19:39:54.451Z",
      "movement_type": "ENTRY",
      "quantity_change": 60,
      "package_change": 12,
      "weight_change": 60.0,
      "volume_change": 120.0,
      "user": {
        "id": "uuid",
        "name": "Warehouse Incharge",
        "email": "wh.incharge1@tslogix.com",
        "role": "WAREHOUSE_INCHARGE"
      },
      "product": {
        "product_id": "uuid",
        "product_code": "PROD001",
        "name": "Product Name 1",
        "manufacturer": "Manufacturer ABC"
      },
      "entry_order": {
        "entry_order_id": "uuid",
        "entry_order_no": "OI202504",
        "registration_date": "2025-06-28T00:00:00.000Z",
        "creator_name": "Entry Creator"
      },
      "entry_order_product": {
        "entry_order_product_id": "uuid",
        "lot_series": "LOT123",
        "expiration_date": "2026-06-28T00:00:00.000Z",
        "manufacturing_date": "2025-01-15T00:00:00.000Z"
      },
      "departure_order": null,
      "departure_order_product": null,
      "warehouse": {
        "warehouse_id": "uuid",
        "name": "Almacén Ancón",
        "location": "Ancón, Lima"
      },
      "cell": {
        "id": "uuid",
        "row": "A",
        "bay": 1,
        "position": 7,
        "cell_reference": "A.01.07"
      },
      "allocation": {
        "allocation_id": "uuid",
        "quality_status": "CUARENTENA",
        "product_status": "GOOD"
      },
      "product_status": "GOOD",
      "status_code": "QC_PENDING",
      "notes": "Initial inventory allocation",
      "is_entry": true,
      "is_departure": false,
      "is_adjustment": false,
      "is_transfer": false,
      "is_inbound": true,
      "is_outbound": false,
      "quantity_abs": 60,
      "weight_abs": 60.0
    }
  ],
  "pagination": {
    "total_count": 12,
    "limit": 50,
    "offset": 0,
    "has_more": false
  },
  "summary": {
    "total_logs": 5,
    "entry_movements": 3,
    "departure_movements": 0,
    "adjustment_movements": 2,
    "total_inbound_quantity": 70,
    "total_outbound_quantity": 65,
    "total_inbound_weight": 190.0,
    "total_outbound_weight": 140.0
  },
  "filters_applied": {
    "movement_type": null,
    "entry_order_id": null,
    "departure_order_id": null,
    "product_id": null,
    "warehouse_id": null,
    "cell_id": null,
    "user_id": null,
    "date_from": null,
    "date_to": null
  },
  "available_filters": {
    "movement_type": ["ENTRY", "DEPARTURE", "ADJUSTMENT", "TRANSFER"],
    "filter_examples": {
      "dispatch_only": "?movement_type=DEPARTURE",
      "entry_only": "?movement_type=ENTRY",
      "specific_departure_order": "?departure_order_id=uuid",
      "specific_entry_order": "?entry_order_id=uuid",
      "specific_product": "?product_id=uuid",
      "specific_warehouse": "?warehouse_id=uuid",
      "specific_cell": "?cell_id=uuid",
      "specific_user": "?user_id=uuid",
      "date_range": "?date_from=2025-06-01&date_to=2025-06-30",
      "pagination": "?limit=20&offset=0"
    }
  }
}
```

## Usage Examples

### 1. Get All Dispatch/Departure Logs
```bash
curl 'http://localhost:3000/inventory/audit-trail?movement_type=DEPARTURE' \
  -H 'Authorization: Bearer <token>'
```

### 2. Get All Entry Logs
```bash
curl 'http://localhost:3000/inventory/audit-trail?movement_type=ENTRY' \
  -H 'Authorization: Bearer <token>'
```

### 3. Get Logs for Specific Entry Order
```bash
curl 'http://localhost:3000/inventory/audit-trail?entry_order_id=f1b630e2-7962-4562-96d8-b03dff852478' \
  -H 'Authorization: Bearer <token>'
```

### 4. Get Logs for Specific Departure Order
```bash
curl 'http://localhost:3000/inventory/audit-trail?departure_order_id=018dfa82-90d0-4cec-af43-e2c953d49fd8' \
  -H 'Authorization: Bearer <token>'
```

### 5. Get Logs for Specific Product
```bash
curl 'http://localhost:3000/inventory/audit-trail?product_id=380ccd59-8218-4653-b7fd-f42b36052e81' \
  -H 'Authorization: Bearer <token>'
```

### 6. Get Logs for Date Range
```bash
curl 'http://localhost:3000/inventory/audit-trail?date_from=2025-06-01&date_to=2025-06-30' \
  -H 'Authorization: Bearer <token>'
```

### 7. Get Logs for Specific Warehouse
```bash
curl 'http://localhost:3000/inventory/audit-trail?warehouse_id=51f6e33a-cb55-4ebe-bf04-3b33c9bc3815' \
  -H 'Authorization: Bearer <token>'
```

### 8. Combined Filters with Pagination
```bash
curl 'http://localhost:3000/inventory/audit-trail?movement_type=ENTRY&warehouse_id=51f6e33a-cb55-4ebe-bf04-3b33c9bc3815&limit=10&offset=0' \
  -H 'Authorization: Bearer <token>'
```

## Common Use Cases

### Dispatch Tracking
- **Filter by dispatch orders**: Use `movement_type=DEPARTURE` to see all dispatch activities
- **Specific dispatch order**: Use `departure_order_id=<uuid>` to track a specific dispatch
- **Dispatch by date**: Combine `movement_type=DEPARTURE` with date range filters

### Entry Order Tracking  
- **Filter by entry orders**: Use `movement_type=ENTRY` to see all entry activities
- **Specific entry order**: Use `entry_order_id=<uuid>` to track a specific entry order
- **Entry by date**: Combine `movement_type=ENTRY` with date range filters

### Product Traceability
- **Product movement history**: Use `product_id=<uuid>` to see all movements for a product
- **Product in specific warehouse**: Combine `product_id` with `warehouse_id`
- **Product dispatch history**: Combine `product_id` with `movement_type=DEPARTURE`

### Warehouse Operations
- **Warehouse activity**: Use `warehouse_id=<uuid>` to see all activities in a warehouse
- **Cell-specific logs**: Use `cell_id=<uuid>` to see activities in a specific cell
- **User activity**: Use `user_id=<uuid>` to see activities by a specific user

### Audit and Compliance
- **Date range audits**: Use `date_from` and `date_to` for compliance reporting
- **Movement type analysis**: Use `movement_type` to analyze specific types of activities
- **Complete traceability**: Combine multiple filters for comprehensive auditing

## Response Data Structure

### Log Entry Fields
- **Basic Info**: `log_id`, `timestamp`, `movement_type`
- **Quantities**: `quantity_change`, `package_change`, `weight_change`, `volume_change`
- **User Info**: Complete user details with role information
- **Product Info**: Product details including code, name, manufacturer
- **Order Info**: Entry order and departure order details when applicable
- **Location Info**: Warehouse and cell information with references
- **Status Info**: Product status, quality status, and status codes
- **Classification**: Boolean flags for movement types and directions

### Summary Statistics
- **Movement Counts**: Breakdown by movement type
- **Quantity Totals**: Inbound vs outbound quantities and weights
- **Log Counts**: Total logs returned and available

### Pagination Info
- **Navigation**: Total count, current limit/offset, has_more flag
- **Control**: Supports standard pagination patterns

## Error Handling

### Common Errors
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: User role not authorized (requires WAREHOUSE_INCHARGE or ADMIN)
- **400 Bad Request**: Invalid query parameters
- **500 Internal Server Error**: Database or server issues

### Error Response Format
```json
{
  "success": false,
  "message": "Error description"
}
```

## Performance Considerations

- **Indexing**: Logs are indexed by timestamp, movement_type, and order IDs for fast filtering
- **Pagination**: Use pagination for large datasets to avoid timeout issues
- **Date Ranges**: Limit date ranges for better performance on large datasets
- **Specific Filters**: More specific filters (like specific order IDs) perform better than broad filters

## Integration Notes

- **Real-time Data**: Logs are created in real-time as inventory operations occur
- **Consistency**: All inventory movements are automatically logged
- **Audit Trail**: Complete audit trail maintained for compliance and traceability
- **Export Capabilities**: Data can be exported for reporting and analysis 