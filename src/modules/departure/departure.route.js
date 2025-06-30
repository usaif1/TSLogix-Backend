const express = require("express");
const departureController = require("./departure.controller");

const router = express.Router();

// ✅ ENHANCED: Form data endpoints
router.get("/departure-formfields", departureController.getDepartureFormFields);
router.get("/departure-exit-options", departureController.getDepartureExitOptions);
router.get("/current-departure-order-no", departureController.getCurrentDepartureOrderNo);
router.get("/permissions", departureController.getDeparturePermissions);

// ✅ NEW: Expiry urgency dashboard for departure planning
router.get("/expiry-urgency-dashboard", departureController.getExpiryUrgencyDashboard);

// ✅ ENHANCED: Departure order management with approval workflow
router.get("/departure-orders", departureController.getAllDepartureOrders);
router.post("/create-departure-order", departureController.createDepartureOrder);
router.get("/departure-orders/:departureOrderId", departureController.getDepartureOrderById);

// ✅ NEW: Comprehensive departure order creation
router.post("/comprehensive-orders", departureController.createComprehensiveDepartureOrder);

// ✅ NEW: Get comprehensive departure orders
router.get("/comprehensive-orders", departureController.getComprehensiveDepartureOrders);

// ✅ NEW: Get single comprehensive departure order by order number
router.get("/comprehensive-orders/:orderNumber", departureController.getComprehensiveDepartureOrderByNumber);

// ✅ NEW: Approval workflow endpoints (WAREHOUSE_INCHARGE/ADMIN only)
router.post("/departure-orders/:departureOrderId/approve", departureController.approveDepartureOrder);
router.post("/departure-orders/:departureOrderId/reject", departureController.rejectDepartureOrder);
router.post("/departure-orders/:departureOrderId/request-revision", departureController.requestRevisionDepartureOrder);

// ✅ NEW: Dispatch endpoints (WAREHOUSE_INCHARGE/ADMIN only) - separate from approval
router.post("/departure-orders/:departureOrderId/dispatch", departureController.dispatchDepartureOrder);
router.post("/departure-orders/:departureOrderId/auto-dispatch", departureController.autoDispatchDepartureOrder);
router.post("/departure-orders/batch-dispatch", departureController.batchDispatchDepartureOrders);

// ✅ ENHANCED: EXPIRY-BASED FIFO Product-wise departure flow
router.get("/products/:productId/fifo-locations", departureController.getFifoLocationsForProduct);
router.get("/products/:productId/fifo-allocation", departureController.getSuggestedFifoAllocation);

// ✅ ENHANCED: Inventory management endpoints for departure (product-based flow with expiry FIFO)
router.get("/products-with-inventory", departureController.getProductsWithInventory);
router.get("/cells-for-entry-product/:entryOrderProductId", departureController.getAvailableCellsForProduct);

// ✅ ENHANCED: Departure inventory summary with expiry tracking
router.get("/inventory-summary", departureController.getDepartureInventorySummary);

// ✅ ENHANCED: Cell validation endpoints with expiry consideration
router.post("/validate-cell", departureController.validateSelectedCell);
router.post("/validate-multiple-cells", departureController.validateMultipleCells);

// ✅ NEW: Get audit trail for departure order
router.get("/departure-orders/:departureOrderId/audit-trail", departureController.getDepartureOrderAuditTrail);

// ✅ NEW: Allocation endpoints (WAREHOUSE_INCHARGE/ADMIN only)
router.get("/departure-orders/:departureOrderId/available-inventory", departureController.getAvailableInventoryForDeparture);
router.post("/departure-orders/:departureOrderId/allocate", departureController.createDepartureAllocations);

module.exports = router;