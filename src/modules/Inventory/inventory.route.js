const express = require("express");
const router = express.Router();
const inventoryController = require("../Inventory/inventory.controller");

router
  .route("/")
  .post(inventoryController.createInventory)
  .get(inventoryController.getAllInventories);

router
  .route("/:id")
  .get(inventoryController.getInventoryById)
  .put(inventoryController.updateInventory)
  .delete(inventoryController.deleteInventory);

router
  .route("/:id/audit")
  .post(inventoryController.auditInventory);

module.exports = router;
