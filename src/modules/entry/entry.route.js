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

// ✅ UPDATED: Changed from "passed" to "approved" orders (removed audit flow)
router.get("/entry-orders/approved", entryController.getApprovedEntryOrders);

// ✅ NEW: Review routes for Admin workflow
router.put("/entry-order/:orderNo/review", entryController.reviewEntryOrder);

// ✅ NEW: Get orders by status for different user roles
router.get("/entry-orders/status/:status", entryController.getEntryOrdersByStatus);

module.exports = router;