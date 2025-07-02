# Departure Flow - Frontend Implementation Guide

## Complete Flow Overview

### 8-Step Departure Workflow
```
1. Entry Order Creation (PENDING)
2. Entry Order Approval (APPROVED) 
3. Cell Assignment (ALLOCATED)
4. Quality Check (APROBADO)
5. Departure Order Creation (PENDING) 
6. Departure Order Approval (APPROVED)
7. Dispatch Selection (NEW FLOW)
8. Partial/Complete Dispatch (PARTIALLY_DISPATCHED/COMPLETED)
```

## API Endpoints Reference

### Core Departure Order Management
```typescript
// Get form fields and dropdowns
GET /api/departure/departure-formfields
Response: {
  clients: Client[],
  documentTypes: DocumentType[],
  users: User[],
  warehouses: Warehouse[],
  labels: Label[],
  departureStatuses: StatusOption[]
}

// Get all departure orders with filters
GET /api/departure/departure-orders?status={status}&organisationId={id}
Response: {
  success: boolean,
  count: number,
  data: DepartureOrder[]
}

// Create departure order
POST /api/departure/create-departure-order
Content-Type: multipart/form-data
Body: DepartureOrderCreateData + files[]

// Approve departure order (WAREHOUSE_INCHARGE/ADMIN only)
POST /api/departure/departure-orders/{id}/approve
Body: { comments?: string }

// Reject departure order
POST /api/departure/departure-orders/{id}/reject  
Body: { comments: string }
```

### Dispatch Flow (NEW)
```typescript
// Step 1: Get approved orders ready for dispatch
GET /api/departure/approved-departure-orders?warehouseId={id}
Response: {
  success: boolean,
  data: ApprovedDepartureOrder[]
}

// Step 2: Get warehouse summary 
GET /api/departure/warehouse-dispatch-summary
Response: {
  success: boolean,
  data: WarehouseSummary[]
}

// Step 3: Dispatch approved order (with partial support)
POST /api/departure/dispatch-approved-order
Content-Type: multipart/form-data
Body: DispatchData + files[]

// Step 4: Get recalculated FIFO for partial dispatch
GET /api/departure/departure-orders/{orderId}/products/{productId}/recalculated-fifo?requestedQuantity={qty}
Response: RecalculatedFifoData

// Step 5: Release held inventory (if needed)
POST /api/departure/departure-orders/{orderId}/release-held-inventory
Body: { reason: string }
```

## Data Structures

### DepartureOrder Interface
```typescript
interface DepartureOrder {
  departure_order_id: string;
  departure_order_no: string;
  order_status: 'PENDING' | 'APPROVED' | 'REVISION' | 'REJECTED' | 'PARTIALLY_DISPATCHED' | 'COMPLETED';
  review_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  dispatch_status: string;
  registration_date: string;
  departure_date_time?: string;
  destination_point?: string;
  transport_type?: string;
  carrier_name?: string;
  total_volume?: number;
  total_weight?: number;
  total_pallets?: number;
  dispatch_document_number?: string;
  document_type_ids: string[];
  uploaded_documents?: DocumentMetadata[];
  
  // Relations
  customer?: { name: string };
  client?: {
    company_name?: string;
    first_names?: string;
    last_name?: string;
    client_type: string;
  };
  warehouse?: { name: string };
  creator: { first_name: string; last_name: string };
  reviewer?: { first_name: string; last_name: string };
  dispatcher?: { first_name: string; last_name: string };
  
  // Products
  products: DepartureOrderProduct[];
}
```

### DepartureOrderProduct Interface
```typescript
interface DepartureOrderProduct {
  departure_order_product_id: string;
  product_code: string;
  product_id: string;
  lot_series?: string;
  
  // Requested quantities
  requested_quantity: number;
  requested_packages: number;
  requested_pallets?: number;
  requested_weight: number;
  requested_volume?: number;
  
  // Dispatch tracking (NEW)
  dispatched_quantity: number;
  dispatched_packages: number;
  dispatched_weight: number;
  dispatched_volume?: number;
  remaining_quantity: number;
  remaining_packages: number;
  remaining_weight: number;
  
  // Metadata
  presentation: string;
  unit_price?: number;
  total_value?: number;
  temperature_requirement: string;
  
  // Relations
  product: {
    product_id: string;
    product_code: string;
    name: string;
    manufacturer?: string;
  };
}
```

### ApprovedDepartureOrder Interface (Dispatch Flow)
```typescript
interface ApprovedDepartureOrder {
  departure_order_id: string;
  departure_order_no: string;
  order_status: 'APPROVED' | 'PARTIALLY_DISPATCHED';
  registration_date: string;
  departure_date_time?: string;
  customer?: { name: string };
  client?: ClientInfo;
  warehouse?: { name: string };
  creator: UserInfo;
  destination_point?: string;
  transport_type?: string;
  carrier_name?: string;
  
  // Dispatch-ready products with inventory
  products_to_dispatch: ProductWithInventory[];
  
  // Summary
  total_products: number;
  total_requested_quantity: number;
  total_available_quantity: number;
  total_requested_weight: number;
  total_available_weight: number;
  can_fully_fulfill: boolean;
  overall_fulfillment_percentage: number;
  has_urgent_items: boolean;
  has_high_priority_items: boolean;
  can_dispatch: boolean;
}
```

### ProductWithInventory Interface
```typescript
interface ProductWithInventory {
  departure_order_product_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  manufacturer?: string;
  lot_series?: string;
  
  // Requested vs Available
  requested_quantity: number;
  requested_packages: number;
  requested_weight: number;
  available_quantity: number;
  available_weight: number;
  
  // Fulfillment analysis
  can_fulfill: boolean;
  fulfillment_percentage: number;
  
  // FIFO locations (sorted by expiry)
  available_locations: InventoryLocation[];
  location_count: number;
  warehouses: string[];
  
  // Urgency info
  earliest_expiry?: string;
  has_near_expiry: boolean;
  has_expired: boolean;
  dispatch_priority: 'URGENT' | 'HIGH' | 'NORMAL';
}
```

### InventoryLocation Interface  
```typescript
interface InventoryLocation {
  allocation_id: string;
  inventory_id: string;
  cell_id: string;
  cell_reference: string; // "A.01.05"
  warehouse_name: string;
  warehouse_id: string;
  
  // Available quantities
  available_quantity: number;
  available_packages: number;
  available_weight: number;
  available_volume?: number;
  
  // Product info
  presentation: string;
  product_status: string;
  quality_status: string;
  inventory_status: 'AVAILABLE' | 'HOLD'; // NEW
  
  // FIFO info
  expiration_date?: string;
  manufacturing_date?: string;
  lot_series?: string;
  entry_order_no: string;
  entry_date_time: string;
  days_to_expiry?: number;
  is_near_expiry: boolean;
  is_expired: boolean;
  is_held_for_this_order?: boolean; // NEW
  fifo_priority: 1 | 2 | 3 | 4; // 1=expired, 2=urgent, 3=warning, 4=normal
}
```

### DispatchData Interface
```typescript
interface DispatchData {
  departure_order_id: string;
  dispatched_by: string; // Set automatically by backend
  dispatch_notes?: string;
  inventory_selections: InventorySelection[];
  document_types?: string[]; // For file uploads
}

interface InventorySelection {
  inventory_id: string;
  departure_order_product_id: string;
  dispatch_quantity: number;
  dispatch_weight: number;
  dispatch_notes?: string;
}
```

## UI Component Structure

### 1. Departure Order Management Page
```typescript
// DepartureOrdersPage.tsx
interface DepartureOrdersPageProps {
  userRole: string;
  userId: string;
}

// Key features:
- Filter by status (PENDING, APPROVED, PARTIALLY_DISPATCHED, COMPLETED)
- Role-based visibility (CLIENT sees only their orders)
- Status badges with color coding
- Action buttons based on status and role
```

### 2. Dispatch Selection Page (NEW)
```typescript
// DispatchSelectionPage.tsx
interface DispatchSelectionPageProps {
  warehouseId?: string;
  userRole: string;
  userId: string;
}

// Key features:
- List of approved departure orders ready for dispatch
- Fulfillment percentage indicators
- Urgency badges (URGENT/HIGH/NORMAL)
- "Start Dispatch" action for each order
```

### 3. Dispatch Execution Page (NEW)
```typescript
// DispatchExecutionPage.tsx
interface DispatchExecutionPageProps {
  departureOrderId: string;
  userRole: string;
  userId: string;
}

// Key features:
- Product list with requested vs available quantities
- FIFO location recommendations (sorted by expiry)
- Inventory selection with quantity inputs
- Partial dispatch support
- Real-time fulfillment calculation
- Document upload capability
```

### 4. FIFO Location Selector Component
```typescript
// FifoLocationSelector.tsx
interface FifoLocationSelectorProps {
  productId: string;
  departureOrderId: string;
  requestedQuantity: number;
  onSelectionChange: (selections: InventorySelection[]) => void;
}

// Key features:
- Visual FIFO recommendations
- Expiry date warnings (red/yellow/green)
- Cell reference display
- Quantity selectors with validation
- Running total calculation
- Held inventory indicators
```

## State Management

### Redux Store Structure
```typescript
interface DepartureState {
  // Order management
  orders: {
    items: DepartureOrder[];
    loading: boolean;
    filters: {
      status?: string;
      warehouseId?: string;
      search?: string;
    };
  };
  
  // Dispatch flow (NEW)
  dispatch: {
    approvedOrders: ApprovedDepartureOrder[];
    currentDispatch?: {
      orderId: string;
      products: ProductWithInventory[];
      selections: InventorySelection[];
      totalQuantity: number;
      totalWeight: number;
    };
    warehouseSummary: WarehouseSummary[];
    loading: boolean;
  };
  
  // UI state
  ui: {
    selectedWarehouse?: string;
    showPartialDispatchModal: boolean;
    fifoRecalculating: boolean;
  };
}
```

### Actions
```typescript
// Order actions
const fetchDepartureOrders = (filters?: OrderFilters) => ThunkAction;
const approveDepartureOrder = (orderId: string, comments?: string) => ThunkAction;
const rejectDepartureOrder = (orderId: string, comments: string) => ThunkAction;

// Dispatch actions (NEW)
const fetchApprovedOrders = (warehouseId?: string) => ThunkAction;
const startDispatch = (orderId: string) => ThunkAction;
const addInventorySelection = (selection: InventorySelection) => ThunkAction;
const removeInventorySelection = (inventoryId: string) => ThunkAction;
const executeDispatch = (dispatchData: DispatchData) => ThunkAction;
const recalculateFifo = (orderId: string, productId: string, quantity: number) => ThunkAction;
```

## UI Flow Implementation

### Flow 1: Order Creation → Approval
```typescript
// 1. Create Order Form
const CreateDepartureOrderForm = () => {
  const [formData, setFormData] = useState<DepartureOrderCreateData>();
  const [files, setFiles] = useState<File[]>([]);
  
  const handleSubmit = async () => {
    const formData = new FormData();
    // Add form fields and files
    await dispatch(createDepartureOrder(formData));
  };
};

// 2. Approval Interface (WAREHOUSE_INCHARGE/ADMIN only)
const OrderApprovalCard = ({ order }: { order: DepartureOrder }) => {
  const canApprove = userRole === 'WAREHOUSE_INCHARGE' || userRole === 'ADMIN';
  
  if (order.order_status === 'PENDING' && canApprove) {
    return (
      <div>
        <button onClick={() => approveOrder(order.departure_order_id)}>
          Approve
        </button>
        <button onClick={() => rejectOrder(order.departure_order_id)}>
          Reject
        </button>
      </div>
    );
  }
};
```

### Flow 2: Dispatch Selection (NEW)
```typescript
// 1. Approved Orders List
const ApprovedOrdersList = () => {
  const { approvedOrders, loading } = useSelector(state => state.departure.dispatch);
  
  useEffect(() => {
    dispatch(fetchApprovedOrders(selectedWarehouse));
  }, [selectedWarehouse]);
  
  return (
    <div>
      {approvedOrders.map(order => (
        <ApprovedOrderCard 
          key={order.departure_order_id}
          order={order}
          onStartDispatch={() => router.push(`/dispatch/${order.departure_order_id}`)}
        />
      ))}
    </div>
  );
};

// 2. Order Card with Fulfillment Info
const ApprovedOrderCard = ({ order, onStartDispatch }) => {
  const urgencyBadge = order.has_urgent_items ? 'URGENT' : 
                      order.has_high_priority_items ? 'HIGH' : 'NORMAL';
  
  return (
    <Card>
      <CardHeader>
        <h3>{order.departure_order_no}</h3>
        <Badge variant={urgencyBadge}>{urgencyBadge}</Badge>
      </CardHeader>
      <CardContent>
        <div>Fulfillment: {order.overall_fulfillment_percentage}%</div>
        <div>Products: {order.total_products}</div>
        <div>Requested: {order.total_requested_quantity} units</div>
        <div>Available: {order.total_available_quantity} units</div>
      </CardContent>
      <CardActions>
        <Button 
          onClick={onStartDispatch}
          disabled={!order.can_dispatch}
        >
          Start Dispatch
        </Button>
      </CardActions>
    </Card>
  );
};
```

### Flow 3: Dispatch Execution (NEW)
```typescript
// 1. Main Dispatch Page
const DispatchExecutionPage = ({ orderId }) => {
  const [order, setOrder] = useState<ApprovedDepartureOrder>();
  const [selections, setSelections] = useState<InventorySelection[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const handleExecuteDispatch = async () => {
    const dispatchData: DispatchData = {
      departure_order_id: orderId,
      inventory_selections: selections,
      dispatch_notes: dispatchNotes
    };
    
    const formData = new FormData();
    formData.append('data', JSON.stringify(dispatchData));
    files.forEach(file => formData.append('documents', file));
    
    await dispatch(executeDispatch(formData));
  };
  
  return (
    <div>
      <OrderSummary order={order} />
      <ProductDispatchList 
        products={order.products_to_dispatch}
        selections={selections}
        onSelectionChange={setSelections}
      />
      <DispatchSummary selections={selections} />
      <DispatchActions 
        onExecute={handleExecuteDispatch}
        disabled={selections.length === 0}
      />
    </div>
  );
};

// 2. Product Dispatch Component
const ProductDispatchList = ({ products, selections, onSelectionChange }) => {
  return (
    <div>
      {products.map(product => (
        <ProductDispatchCard
          key={product.departure_order_product_id}
          product={product}
          currentSelections={selections.filter(s => 
            s.departure_order_product_id === product.departure_order_product_id
          )}
          onSelectionChange={(productSelections) => {
            // Update selections for this product
            const otherSelections = selections.filter(s => 
              s.departure_order_product_id !== product.departure_order_product_id
            );
            onSelectionChange([...otherSelections, ...productSelections]);
          }}
        />
      ))}
    </div>
  );
};

// 3. FIFO Location Selector
const FifoLocationSelector = ({ product, onSelectionChange }) => {
  const [selectedQuantities, setSelectedQuantities] = useState<{[inventoryId: string]: number}>({});
  
  const handleQuantityChange = (inventoryId: string, quantity: number) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [inventoryId]: quantity
    }));
    
    // Convert to selection format
    const selections = Object.entries(selectedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([inventoryId, quantity]) => ({
        inventory_id: inventoryId,
        departure_order_product_id: product.departure_order_product_id,
        dispatch_quantity: quantity,
        dispatch_weight: calculateWeight(inventoryId, quantity),
      }));
    
    onSelectionChange(selections);
  };
  
  return (
    <div>
      <h4>FIFO Recommendations (Sorted by Expiry)</h4>
      {product.available_locations.map(location => (
        <LocationRow
          key={location.inventory_id}
          location={location}
          selectedQuantity={selectedQuantities[location.inventory_id] || 0}
          onQuantityChange={(qty) => handleQuantityChange(location.inventory_id, qty)}
        />
      ))}
    </div>
  );
};
```

## Partial Dispatch Handling

### Partial Dispatch Indicator
```typescript
const PartialDispatchBadge = ({ product }: { product: DepartureOrderProduct }) => {
  const isPartial = product.dispatched_quantity > 0 && product.remaining_quantity > 0;
  const isComplete = product.remaining_quantity === 0;
  
  if (isComplete) {
    return <Badge variant="success">Fully Dispatched</Badge>;
  } else if (isPartial) {
    return (
      <Badge variant="warning">
        Partial: {product.dispatched_quantity}/{product.requested_quantity}
      </Badge>
    );
  } else {
    return <Badge variant="default">Pending Dispatch</Badge>;
  }
};
```

### Recalculated FIFO for Partial Orders
```typescript
const useRecalculatedFifo = (orderId: string, productId: string, requestedQuantity: number) => {
  const [fifoData, setFifoData] = useState<RecalculatedFifoData>();
  const [loading, setLoading] = useState(false);
  
  const recalculate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/departure/departure-orders/${orderId}/products/${productId}/recalculated-fifo`,
        { params: { requestedQuantity } }
      );
      setFifoData(response.data.data);
    } finally {
      setLoading(false);
    }
  }, [orderId, productId, requestedQuantity]);
  
  useEffect(() => {
    if (requestedQuantity > 0) {
      recalculate();
    }
  }, [recalculate, requestedQuantity]);
  
  return { fifoData, loading, recalculate };
};
```

## Error Handling

### Common Error Scenarios
```typescript
interface DispatchError {
  type: 'VALIDATION' | 'INVENTORY' | 'NETWORK' | 'PERMISSION';
  message: string;
  details?: any;
}

// Error handling in dispatch execution
const handleDispatchError = (error: any) => {
  if (error.message.includes('exceeds requested quantity')) {
    showError({
      type: 'VALIDATION',
      message: 'Dispatch quantity cannot exceed requested quantity',
      details: error.message
    });
  } else if (error.message.includes('insufficient inventory')) {
    showError({
      type: 'INVENTORY', 
      message: 'Insufficient inventory available for dispatch',
      details: error.message
    });
  } else if (error.message.includes('must be approved')) {
    showError({
      type: 'VALIDATION',
      message: 'Order must be approved before dispatch',
      details: error.message
    });
  }
  // ... handle other error types
};
```

## Validation Rules

### Client-Side Validation
```typescript
const validateDispatchSelections = (selections: InventorySelection[]): ValidationResult => {
  const errors: string[] = [];
  
  // Check if any selections exist
  if (selections.length === 0) {
    errors.push('At least one inventory selection is required');
  }
  
  // Validate quantities
  selections.forEach((selection, index) => {
    if (selection.dispatch_quantity <= 0) {
      errors.push(`Selection ${index + 1}: Quantity must be greater than 0`);
    }
    if (selection.dispatch_weight <= 0) {
      errors.push(`Selection ${index + 1}: Weight must be greater than 0`);
    }
  });
  
  // Group by product and check totals
  const productTotals = selections.reduce((acc, selection) => {
    const productId = selection.departure_order_product_id;
    acc[productId] = (acc[productId] || 0) + selection.dispatch_quantity;
    return acc;
  }, {} as Record<string, number>);
  
  // Validate against requested quantities (this should be checked on backend too)
  Object.entries(productTotals).forEach(([productId, totalQuantity]) => {
    const product = currentOrder.products.find(p => p.departure_order_product_id === productId);
    if (product && totalQuantity > product.remaining_quantity) {
      errors.push(`Product ${product.product_code}: Dispatch quantity (${totalQuantity}) exceeds remaining quantity (${product.remaining_quantity})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Role-Based Access Control

### Permission Checking
```typescript
const useDispatchPermissions = (userRole: string) => {
  return {
    canViewApprovedOrders: ['ADMIN', 'WAREHOUSE_INCHARGE', 'PHARMACIST'].includes(userRole),
    canDispatch: ['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userRole),
    canApproveOrders: ['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userRole),
    canCreateOrders: true, // All roles can create
    canViewAllOrders: ['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userRole),
    canReleaseHeldInventory: ['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userRole)
  };
};

// Usage in components
const DispatchPage = () => {
  const { userRole } = useAuth();
  const permissions = useDispatchPermissions(userRole);
  
  if (!permissions.canDispatch) {
    return <AccessDenied message="You don't have permission to dispatch orders" />;
  }
  
  // ... rest of component
};
```

## Real-time Updates

### WebSocket Integration (Optional)
```typescript
const useDispatchUpdates = (orderId: string) => {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/departure-updates/${orderId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'INVENTORY_UPDATED':
          dispatch(refreshInventoryData());
          break;
        case 'ORDER_STATUS_CHANGED':
          dispatch(updateOrderStatus(update.data));
          break;
        case 'PARTIAL_DISPATCH_COMPLETED':
          dispatch(refreshOrderData());
          showNotification('Partial dispatch completed successfully');
          break;
      }
    };
    
    return () => ws.close();
  }, [orderId, dispatch]);
};
```

This comprehensive guide provides everything needed to implement the departure flow frontend, including partial dispatch support, FIFO recommendations, and proper error handling. 