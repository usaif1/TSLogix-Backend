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

// ✅ NEW: Entry Order-centric departure flow
router.get("/entry-orders-for-departure", departureController.getEntryOrdersForDeparture);
router.get("/entry-order/:entryOrderId/products", departureController.getProductsByEntryOrder);

// Inventory management endpoints for departure (product-based flow)
router.get("/products-with-inventory", departureController.getProductsWithInventory);
router.get("/cells-for-entry-product/:entryOrderProductId", departureController.getAvailableCellsForProduct);

// ✅ NEW: Departure inventory summary
router.get("/inventory-summary", departureController.getDepartureInventorySummary);

// Cell validation endpoints
router.post("/validate-cell", departureController.validateSelectedCell);
router.post("/validate-multiple-cells", departureController.validateMultipleCells);

module.exports = router;