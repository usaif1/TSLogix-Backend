const express = require("express");
const processController = require("./entry.controller");

const router = express.Router();

router.get("/entry-formfields", processController.getEntryFormFields);
router.post("/create-entry-order", processController.createEntryOrder);
router.get("/entry-orders", processController.getAllEntryOrders);
router.get("/entry-order/:orderNo", processController.getEntryOrderByNo);
router.get("/current-order-number", processController.getCurrentEntryOrderNo);
router.get("/entry-orders/passed", processController.fetchPassedOrders);
module.exports = router;
