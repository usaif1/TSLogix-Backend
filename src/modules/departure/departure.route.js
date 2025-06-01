const express = require("express");
const departureController = require("./departure.controller");

const router = express.Router();

// Form data endpoints
router.get("/departure-formfields", departureController.getDepartureFormFields);
router.get("/departure-exit-options", departureController.getDepartureExitOptions);

// Departure order management
router.get("/departure-orders", departureController.getAllDepartureOrders);
router.post("/create-departure-order", departureController.createDepartureOrder);
router.get("/departure-orders/:departureOrderId", departureController.getDepartureOrderById);

// Inventory management endpoints for departure (product-based flow)
router.get("/products-with-inventory", departureController.getProductsWithInventory);
router.get("/cells-for-entry-product/:entryOrderProductId", departureController.getAvailableCellsForProduct);

// Cell validation endpoints
router.post("/validate-cell", departureController.validateSelectedCell);
router.post("/validate-multiple-cells", departureController.validateMultipleCells);

module.exports = router;