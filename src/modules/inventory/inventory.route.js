const express = require("express");
const router = express.Router();
const controller = require("./inventory.controller");

router.post("/", controller.createLog);
router.get("/entry-order/:entry_order_id", controller.getByEntryOrder);
router.get(
  "/departure-order/:departure_order_id",
  controller.getByDepartureOrder
);
router.get("/:log_id", controller.getLogById);
router.get("/", controller.getAllLogs);
router.get("/statistics/summary", controller.getStats);

module.exports = router;
