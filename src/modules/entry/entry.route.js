const express = require("express");
const entryController = require("./entry.controller");

const router = express.Router();

// Entry form and creation routes
router.get("/entry-formfields", entryController.getEntryFormFields);
router.post("/create-entry-order", entryController.createEntryOrder);
router.get("/current-order-number", entryController.getCurrentEntryOrderNo);

// Entry order listing and details routes
router.get("/entry-orders", entryController.getAllEntryOrders);
router.get("/entry-order/:orderNo", entryController.getEntryOrderByNo);
router.get("/entry-orders/passed", entryController.fetchPassedOrders);



module.exports = router;
