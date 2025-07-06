const express = require("express");
const router = express.Router();
const {
  allocatePallets,
  listWarehouseCells,
  listWarehouses,
} = require("./warehouse.controller");

// Allocate pallets to cells
router.post("/allocate", allocatePallets);

// List all cells (optional warehouse filter)
router.get("/cells", listWarehouseCells);

router.get("/warehouses", listWarehouses);


module.exports = router;
