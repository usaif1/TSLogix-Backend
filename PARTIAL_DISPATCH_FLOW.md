# Partial Dispatch Flow Implementation

## Overview
The partial dispatch system allows warehouse managers to dispatch departure orders in multiple stages, supporting business scenarios where not all requested inventory can be dispatched at once, or when customers want to receive shipments in batches.

## Key Features Implemented

### 1. Database Schema Changes
- **New Order Status**: `PARTIALLY_DISPATCHED` in `OrderStatusDeparture` enum
- **New Inventory Status**: `HOLD` in `InventoryStatus` enum for reserving inventory
- **Enhanced DepartureOrderProduct Model**:
  - `dispatched_quantity` - tracks cumulative dispatched amount
  - `dispatched_packages` - tracks dispatched packages
  - `dispatched_weight` - tracks dispatched weight
  - `remaining_quantity` - calculated remaining amount
  - `remaining_packages` - calculated remaining packages
  - `remaining_weight` - calculated remaining weight

### 2. New System Actions
- `DEPARTURE_ORDER_PARTIALLY_DISPATCHED`
- `DEPARTURE_ORDER_DISPATCH_COMPLETED`
- `INVENTORY_HELD`
- `INVENTORY_UNHELD`

## Flow Description

### Complete 8-Step Workflow

1. **Create Entry Order** (PENDING)
2. **Approve Entry Order** (APPROVED)
3. **Assign to Cells** (ALLOCATED)
4. **Quality Check** (APROBADO - inventory becomes AVAILABLE)
5. **Create Departure Order** (PENDING)
6. **Approve Departure Order** (APPROVED)
7. **Get Approved Orders for Dispatch** (NEW - shows FIFO recommendations)
8. **Select Inventory and Dispatch** (PARTIALLY_DISPATCHED → COMPLETED)

### Partial Dispatch Logic

#### First Dispatch
```
Departure Order: APPROVED → PARTIALLY_DISPATCHED
- Manager selects specific inventory from FIFO recommendations
- System dispatches selected quantities
- Updates product dispatch tracking
- Holds remaining inventory for future dispatch
- Creates detailed audit logs
```

#### Subsequent Dispatches
```
Departure Order: PARTIALLY_DISPATCHED → PARTIALLY_DISPATCHED (or COMPLETED)
- System recalculates FIFO with held inventory priority
- Manager selects from available + held inventory
- Updates cumulative dispatch quantities
- Releases held inventory if fully dispatched
- Order becomes COMPLETED when all products fully dispatched
```

## API Endpoints

### Core Dispatch Endpoints
```
GET /api/departure/approved-departure-orders?warehouseId={id}
POST /api/departure/dispatch-approved-order
GET /api/departure/warehouse-dispatch-summary
```

### Partial Dispatch Support Endpoints
```
GET /api/departure/departure-orders/{id}/products/{productId}/recalculated-fifo?requestedQuantity={qty}
POST /api/departure/departure-orders/{id}/release-held-inventory
```

## FIFO Enhancement

### Priority System
1. **Expired inventory** (highest priority)
2. **Urgent** (≤ 7 days to expiry)
3. **Warning** (≤ 30 days to expiry)
4. **Normal** (> 30 days or no expiry)

### Held Inventory Integration
- Inventory held for specific departure order gets priority
- FIFO recalculation includes held inventory for that order
- Other orders cannot access held inventory

## Key Service Functions

### `dispatchApprovedDepartureOrder(dispatchData)`
**Enhanced Features:**
- Supports multiple dispatch events for same order
- Tracks cumulative dispatched quantities
- Automatically holds inventory for remaining quantities
- Updates order status based on completion level
- Creates detailed Spanish audit logs

### `holdInventoryForRemainingQuantities(tx, departureOrderId, productUpdates, userId)`
**Functionality:**
- Finds available inventory using FIFO for remaining quantities
- Updates inventory status to "HOLD"
- Creates tracking logs for held inventory
- Supports partial holding when insufficient inventory

### `getRecalculatedFifoInventoryForDeparture(departureOrderId, productId, requestedQuantity)`
**Features:**
- Recalculates FIFO including held inventory for specific order
- Prioritizes held inventory for the requesting order
- Excludes inventory held for other orders
- Provides real-time availability for partial dispatch

## Business Rules

### Quantity Validation
- Cannot dispatch more than requested quantity
- Can dispatch less than requested (partial dispatch)
- System tracks cumulative dispatched vs requested
- Remaining quantities are automatically calculated

### Inventory Reservation
- Inventory held for remaining quantities gets HOLD status
- Held inventory is exclusive to the specific departure order
- Automatic release when order is completed or cancelled
- FIFO priority maintained for held inventory

### Status Progression
```
APPROVED → PARTIALLY_DISPATCHED → PARTIALLY_DISPATCHED → ... → COMPLETED
```

### Manager Capabilities
- Can choose which inventory to dispatch (from FIFO recommendations)
- Can dispatch partial quantities per product
- Cannot modify remaining quantities (only dispatch them)
- Can dispatch in multiple sessions over time

## Example Scenarios

### Scenario 1: Insufficient Inventory
```
Order: 100kg Product A
Available: 60kg
First Dispatch: 60kg → Status: PARTIALLY_DISPATCHED
Remaining: 40kg (held for future dispatch)
When more inventory arrives → Complete remaining 40kg
```

### Scenario 2: Customer Request
```
Order: 500kg Product B
Customer wants: 200kg now, 300kg next week
First Dispatch: 200kg → Status: PARTIALLY_DISPATCHED
Held: 300kg reserved for this order
Second Dispatch: 300kg → Status: COMPLETED
```

### Scenario 3: Multiple Products
```
Order: Product A (100kg), Product B (50kg), Product C (200kg)
First Dispatch: Product A (100kg), Product B (30kg)
Status: PARTIALLY_DISPATCHED
Remaining: Product B (20kg), Product C (200kg) - both held
Second Dispatch: Product B (20kg), Product C (200kg)
Status: COMPLETED
```

## Audit Trail

### Spanish Language Logging
- All audit logs created in Spanish for compliance
- Detailed tracking of partial dispatch events
- User actions and system responses logged
- Inventory hold/release events tracked

### Metadata Captured
- Dispatch quantities and weights
- Cell locations affected
- User roles and permissions
- FIFO priority information
- Business impact assessments

## Integration Points

### Existing Systems
- Works with current approval workflow
- Compatible with client role restrictions
- Integrates with FIFO expiry tracking
- Maintains cell assignment logic

### Future Enhancements
- Integration with billing systems
- Advanced reporting for partial dispatches
- Customer notification systems
- Automated reorder triggers

## Testing Considerations

### Key Test Cases
1. Single product partial dispatch
2. Multiple product mixed dispatch
3. Multiple dispatch events for same order
4. Inventory holding and release
5. FIFO recalculation accuracy
6. Role-based access control
7. Error handling for edge cases

### Performance Considerations
- Transaction timeout increased to 60 seconds
- Optimized FIFO queries with pagination
- Efficient inventory hold/release operations
- Audit log size management

## Error Handling

### Common Scenarios
- Insufficient inventory for dispatch
- Invalid quantity selections
- Concurrent dispatch attempts
- Inventory already held by other orders
- Network timeouts during dispatch

### Recovery Mechanisms
- Automatic inventory release on errors
- Transaction rollback for data consistency
- Detailed error logging for debugging
- User-friendly error messages

## Deployment Notes

### Database Migration
- Migration: `20250702165942_add_partial_dispatch_support`
- Adds new enum values and fields
- Backward compatible with existing data
- Default values for new fields

### Configuration Changes
- No environment variables required
- No external service dependencies
- Uses existing Prisma transaction system
- Compatible with current authentication 