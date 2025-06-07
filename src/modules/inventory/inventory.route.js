const express = require("express");
const router = express.Router();
const controller = require("./inventory.controller");

// Get approved entry orders ready for inventory assignment
router.get("/approved-entry-orders", controller.getApprovedEntryOrdersForInventory);

// Get specific entry order products for inventory assignment
router.get("/entry-order/:entryOrderId/products", controller.getEntryOrderProductsForInventory);

// Assign a specific product to a warehouse cell
router.post("/assign-product", controller.assignProductToCell);

// Get inventory summary with filters
router.get("/summary", controller.getInventorySummary);

// Get available cells for a specific warehouse
router.get("/warehouses/:warehouse_id/available-cells", controller.getAvailableCellsForWarehouse);

// Fetch all warehouses and cells
router.get("/warehouses", controller.fetchWarehouses);
router.get("/warehouses/:warehouse_id/cells", controller.fetchCells);

module.exports = router;