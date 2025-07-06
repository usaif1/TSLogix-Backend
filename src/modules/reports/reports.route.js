const express = require("express");
const router = express.Router();
const {
  getWarehouseReport,
  getProductCategoryReport,
  getProductWiseReport,
  getCardexReport,
} = require("./reports.controller");

// Warehouse report endpoint
router.get("/warehouse", getWarehouseReport);

// Product category report endpoint
router.get("/product-category", getProductCategoryReport);

// Product-wise stock in/out report endpoint
router.get("/product-wise", getProductWiseReport);

// Cardex report endpoint
router.get("/cardex", getCardexReport);

module.exports = router;