const express = require("express");
const departureController = require("./departure.controller");

const router = express.Router();

// Form data endpoints
router.get("/departure-formfields", departureController.getDepartureFormFields);
router.get("/departure-exit-options", departureController.getDepartureExitOptions);

// Departure order management
router.get("/departure-orders", departureController.getAllDepartureOrders);
router.post("/create-departure-order", departureController.createDepartureOrder);

// Inventory management endpoints for departure
router.get("/products-with-inventory", departureController.getProductsWithInventory);
router.get("/cells-for-product/:productId", departureController.getAvailableCellsForProduct);

// Cell validation endpoint
router.post("/validate-cell", departureController.validateSelectedCell);

module.exports = router;
