const express = require("express");
const departureController = require("./departure.controller");

const router = express.Router();

// Form data endpoints
router.get("/departure-formfields", departureController.getDepartureFormFields);
router.get("/departure-exit-options", departureController.getDepartureExitOptions);
router.get("/current-departure-order-no", departureController.getCurrentDepartureOrderNo);

// Departure order management
router.get("/departure-orders", departureController.getAllDepartureOrders);
router.post("/create-departure-order", departureController.createDepartureOrder);
router.get("/departure-orders/:departureOrderId", departureController.getDepartureOrderById);

// ✅ NEW: FIFO Product-wise departure flow
router.get("/products/:productId/fifo-locations", departureController.getFifoLocationsForProduct);
router.get("/products/:productId/fifo-allocation", departureController.getSuggestedFifoAllocation);

// Inventory management endpoints for departure (product-based flow)
router.get("/products-with-inventory", departureController.getProductsWithInventory);
router.get("/cells-for-entry-product/:entryOrderProductId", departureController.getAvailableCellsForProduct);

// ✅ NEW: Departure inventory summary
router.get("/inventory-summary", departureController.getDepartureInventorySummary);

// Cell validation endpoints
router.post("/validate-cell", departureController.validateSelectedCell);
router.post("/validate-multiple-cells", departureController.validateMultipleCells);

module.exports = router;