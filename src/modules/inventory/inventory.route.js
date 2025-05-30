const express = require("express");
const router = express.Router();
const controller = require("./inventory.controller");

// Allocate pallets and log in one operation (legacy)
router.post("/add", controller.addInventoryAndLog);

// Create a new inventory log entry
router.post("/", controller.createLog);

// NEW: Assign a specific product to a warehouse cell
router.post("/assign-product", controller.assignProductToCell);

// Get summary statistics for inventory logs
router.get("/statistics/summary", controller.getStats);

// NEW: Get inventory summary with filters
router.get("/summary", controller.getInventorySummary);

// NEW: Get products ready for assignment (no warehouse filter)
router.get("/products/ready-for-assignment", controller.getProductsReadyForAssignment);

// NEW: Get available cells for a specific warehouse
router.get("/warehouses/:warehouse_id/available-cells", controller.getAvailableCellsForWarehouse);

// Get logs by entry‐order, departure‐order, or specific product
router.get("/entry-order/:entry_order_id", controller.getByEntryOrder);
router.get("/departure-order/:departure_order_id", controller.getByDepartureOrder);
router.get("/entry-order-product/:entry_order_product_id", controller.getByEntryOrderProduct);

// Fetch all warehouses and cells
router.get("/warehouses", controller.fetchWarehouses);
router.get("/warehouses/:warehouse_id/cells", controller.fetchCells);

// Get a single log by its ID
router.get("/:log_id", controller.getLogById);

// Get all inventory logs
router.get("/", controller.getAllLogs);

module.exports = router;