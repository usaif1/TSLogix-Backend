const express = require("express");
const processController = require("./processes.controller");

const router = express.Router();

// route to get data for entry form dropdown fields
router.get("/entry-formfields", processController.getEntryFormFields);

// ✅ Route to create a new entry order
router.post("/create-entry-order", processController.createEntryOrder);

// ✅ Route to fetch all entry orders
router.get("/entry-orders", processController.getAllEntryOrders);

module.exports = router;
