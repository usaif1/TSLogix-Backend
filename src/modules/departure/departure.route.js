const express = require("express");
const processController = require("./departure.controller");

const router = express.Router();

router.get("/departure-formfields", processController.getDepartureFormFields);
router.get(
  "/departure-exit-options",
  processController.getDepartureExitOptions
);
router.get("/departure-orders", processController.getAllDepartureOrders);
router.post("/create-departure-order", processController.createDepartureOrder);
module.exports = router;
