const express = require("express");
const router = express.Router();
const auditController = require("./audit.controller");

// Create audit routes
router.post("/", auditController.createAudit);
router.post("/bulk", auditController.createBulkAudits);

// Get audit data routes
router.get("/statistics/summary", auditController.getAuditStatistics);
router.get(
  "/entry-orders/pending",
  auditController.getEntryOrdersWithPendingAudits
);
router.get("/entry-order/:entry_order_id", auditController.getEntryOrderAudits);
router.get(
  "/entry-order/:entry_order_id/pending",
  auditController.getPendingProductAudits
);
router.get("/:audit_id", auditController.getAuditById);
router.get("/", auditController.getAllAudits);

module.exports = router;
