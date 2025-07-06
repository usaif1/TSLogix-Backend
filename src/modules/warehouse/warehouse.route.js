const express = require("express");
const router = express.Router();
const {
  allocatePallets,
  listWarehouseCells,
  listWarehouses,
  getWarehouseReport,
} = require("./warehouse.controller");

// Allocate pallets to cells
router.post("/allocate", allocatePallets);

// List all cells (optional warehouse filter)
router.get("/cells", listWarehouseCells);

router.get("/warehouses", listWarehouses);

// ✅ NEW: Warehouse report endpoint
router.get("/report", getWarehouseReport);

module.exports = router;
