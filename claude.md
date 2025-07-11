# TSLogix Backend - Development Guide for Claude

## Project Overview

TSLogix Backend is a sophisticated pharmaceutical warehouse management system built with Node.js, Express, and Prisma ORM. It manages the complete pharmaceutical supply chain from entry orders through quality control to dispatch.

## Quick Setup & Important Commands

### Development Commands
```bash
npm run dev          # Start development server with nodemon
npm run lint         # Run ESLint for code quality  
npm run typecheck    # Run TypeScript type checking
npm run studio       # Open Prisma Studio for database management
```

### Environment Variables (Required)
```bash
DATABASE_URL=postgresql://...              # PostgreSQL connection
JWT_SECRET=your_jwt_secret                 # JWT signing secret
SUPABASE_URL=https://...                   # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...              # Supabase service key
PORT=3000                                  # Server port
```

## Architecture & Key Concepts

### Module Structure
```
src/modules/
   auth/           # JWT authentication & user management
   entry/          # Entry orders (stock in)
   departure/      # Departure orders (stock out) 
   inventory/      # Inventory allocations & quality control
   warehouse/      # Warehouse cells & management
   client/         # Client & customer management
   product/        # Product catalog
   reports/        # Comprehensive reporting system
   audit/          # Audit trail
   eventlog/       # Event logging
```

### Core Workflow
```
=� ENTRY ORDER � <� CELL ALLOCATION �  QUALITY CHECK � =� DEPARTURE ORDER � =� DISPATCH
```

## Database Schema Key Points

### Important Model Relationships
- **EntryOrderProduct** � **InventoryAllocation** (1:many)
- **InventoryAllocation** � **DepartureAllocation** (1:many) 
- **DepartureOrderProduct** � **DepartureAllocation** (1:many)
- **Products** have hierarchical categories (Category � SubCategory1 � SubCategory2)

### Critical Field Names (Prisma Access)
```javascript
// Model access uses camelCase
prisma.entryOrderProduct.findMany()
prisma.inventoryAllocation.findMany()
prisma.departureOrderProduct.findMany()

// Relationship fields use snake_case
include: {
  entry_order_product: true,    // NOT EntryOrderProduct
  product: {
    include: {
      category: true,             // NOT productCategory
      subcategory1: true,         // NOT productSubCategory1
    }
  }
}
```

### Quality Control States
```javascript
enum QualityControlStatus {
  CUARENTENA,     // Quarantine (initial state)
  APROBADO,       // Approved (ready for dispatch)
  DEVOLUCIONES,   // Returns
  CONTRAMUESTRAS, // Samples  
  RECHAZADOS      // Rejected
}
```

## API Endpoints Summary

### Reports System (Main Feature)
```bash
GET /reports/warehouse         # Complete warehouse inventory
GET /reports/product-category  # Quality status breakdown by product
GET /reports/product-wise      # Stock in/out movements with traceability
GET /reports/cardex           # Opening/closing balance with movements
```

### Core Operations
```bash
# Authentication
POST /auth/login
POST /auth/register

# Entry Management
GET  /entry/entry-orders
POST /entry/entry-orders
POST /entry/assign-cells

# Departure Management  
GET  /departure/departure-orders
POST /departure/departure-orders
POST /departure/dispatch

# Inventory Control
GET  /inventory/allocations
PUT  /inventory/quality-status
```

## Critical Data Fields & Consistency

### Financial Values
**� IMPORTANT**: Always use `insured_value` for financial calculations
```javascript
// Correct
financial_value: item.insured_value

// Wrong  
financial_value: item.financial_value  // This field doesn't exist
```

### Quantity Fields by Context
```javascript
// Entry Order Product
inventory_quantity, package_quantity

// Departure Order Product  
requested_quantity, dispatched_quantity
requested_packages, dispatched_packages

// Departure Allocation
allocated_quantity, allocated_packages

// Use parseFloat() for financial values to avoid string concatenation
const financialValue = parseFloat(item.insured_value) || 0;
```

### Field Mapping Consistency
See `FIELD_CONSISTENCY_GUIDE.md` for detailed field mapping rules and validation queries.

## Role-Based Access Control

```javascript
// Role hierarchy (from highest to lowest access)
ADMIN                 // Full system access
WAREHOUSE_INCHARGE    // Warehouse management, order approval  
PHARMACIST           // Quality control, inventory oversight
WAREHOUSE_ASSISTANT   // Limited to assigned clients
CLIENT               // Own orders only

// Access control implementation
if (userContext.userRole === 'CLIENT') {
  clientFilter = {
    entry_order: {
      OR: [
        { client_id: userContext.userId },
        { customer_id: userContext.userId }
      ]
    }
  };
}
```

## Common Patterns & Best Practices

### 1. Service Layer Pattern
```javascript
// Controller (handles HTTP)
async function getReport(req, res) {
  const filters = { /* extract from req.query */ };
  const userContext = { userId: req.user.id, userRole: req.user.role };
  const result = await generateReport(filters, userContext);
  res.json(result);
}

// Service (handles business logic)
async function generateReport(filters, userContext) {
  // Build queries, apply filters, role-based access
  const data = await prisma.model.findMany({ /* query */ });
  return { success: true, data };
}
```

### 2. Error Handling Pattern
```javascript
try {
  const result = await operation();
  return {
    success: true,
    message: "Operation successful",
    data: result
  };
} catch (error) {
  console.error("Error description:", error);
  return {
    success: false,
    message: "User-friendly error message", 
    error: error.message
  };
}
```

### 3. Query Building Pattern
```javascript
// Build where conditions dynamically
const whereConditions = {};

if (filters.date_from || filters.date_to) {
  const dateFilter = {};
  if (filters.date_from) dateFilter.gte = new Date(filters.date_from);
  if (filters.date_to) dateFilter.lte = new Date(filters.date_to);
  whereConditions.entry_order = { entry_date_time: dateFilter };
}

// Apply role-based filters
let clientFilter = {};
if (userContext.userRole === 'CLIENT') {
  clientFilter = { /* client-specific conditions */ };
}

const finalWhere = { ...whereConditions, ...clientFilter };
```

## Report Implementation Details

### Report Response Structure
```javascript
{
  success: true,
  message: "Report generated successfully",
  data: [...],                    // Main report data
  summary: {                      // Aggregated statistics
    total_records: 100,
    total_quantity: 5000,
    // ... other totals
  },
  filters_applied: {...},         // Echo of applied filters
  user_role: "WAREHOUSE_INCHARGE",
  is_client_filtered: false,
  report_generated_at: "2025-07-06T...",
  processing_time_ms: 1234
}
```

### Cardex Report Calculation
```javascript
// Opening Balance = All transactions before report period
// Stock In = Entries during report period  
// Stock Out = Departures during report period
// Closing Balance = Opening + Stock In - Stock Out

const reportDateFrom = new Date(filters.date_from);
const reportDateTo = new Date(filters.date_to);

if (entryDate < reportDateFrom) {
  // Add to opening balance
} else if (entryDate <= reportDateTo) {
  // Add to stock in
}
```

## Testing & Validation

### API Testing Commands
```bash
# Test with authentication
curl 'http://localhost:3000/reports/cardex?date_from=2025-06-30&date_to=2025-07-30' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Check specific product
curl 'http://localhost:3000/reports/product-category?product_name=Product+Name+3' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Data Validation Queries
```sql
-- Check quantity conservation
SELECT 
  eop.entry_order_product_id,
  eop.inventory_quantity as entry_qty,
  SUM(ia.inventory_quantity) as allocated_qty
FROM entry_order_products eop
LEFT JOIN inventory_allocations ia ON ia.entry_order_product_id = eop.entry_order_product_id
GROUP BY eop.entry_order_product_id, eop.inventory_quantity
HAVING entry_qty != COALESCE(SUM(ia.inventory_quantity), 0);
```

## Common Issues & Solutions

### 1. Prisma Field Names
```javascript
// L Wrong - Using PascalCase for relationships
include: { EntryOrderProduct: { Product: true } }

//  Correct - Using snake_case for relationships  
include: { entry_order_product: { product: true } }
```

### 2. Financial Value Concatenation
```javascript
// L Wrong - String concatenation
financial_value: item.insured_value + otherValue

//  Correct - Numeric addition
financial_value: parseFloat(item.insured_value) + parseFloat(otherValue)
```

### 3. Missing Quantity Fields
```javascript
// L Wrong - Using non-existent fields
quantity_units: item.quantity_units  // This field doesn't exist

//  Correct - Using proper field mapping
quantity_units: item.dispatched_quantity || item.requested_quantity || 0
```

### 4. Role-Based Access
```javascript
// L Wrong - No access control
const data = await prisma.model.findMany();

//  Correct - With role-based filtering
const clientFilter = userContext.userRole === 'CLIENT' ? 
  { client_id: userContext.userId } : {};
const data = await prisma.model.findMany({ where: clientFilter });
```

## Key Files for Reference

- **`FIELD_CONSISTENCY_GUIDE.md`** - Field mapping and data flow rules
- **`/src/modules/reports/reports.service.js`** - Report implementation examples
- **`/prisma/schema.prisma`** - Complete database schema
- **`/docs/`** - Business workflow documentation

## Development Workflow

1. **Before making changes**: Check `FIELD_CONSISTENCY_GUIDE.md` for affected fields
2. **Database changes**: Update schema, run migrations, update field mappings
3. **API changes**: Follow service layer pattern, implement role-based access
4. **Testing**: Use provided curl commands, validate data consistency
5. **Documentation**: Update field guides and API documentation

## Performance Considerations

- Use proper `include` statements instead of separate queries
- Implement pagination for large datasets  
- Add processing time tracking: `Date.now() - startTime`
- Use database indexes for frequently queried fields
- Cache frequently accessed reference data

---

This guide provides the essential information needed for developing and maintaining the TSLogix Backend system.