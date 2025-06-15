const express = require("express");
const router = express.Router();
const eventLogController = require("./eventlog.controller");

// System-wide event logs
router.get("/", eventLogController.getSystemEventLogs);
router.get("/statistics", eventLogController.getEventLogStatistics);
router.get("/dashboard", eventLogController.getEventLogDashboard);
router.get("/filters", eventLogController.getEventLogFilters);
router.get("/export", eventLogController.exportEventLogs);

// Advanced search
router.post("/search", eventLogController.searchEventLogs);

// Specific log details
router.get("/:logId", eventLogController.getEventLogById);

// Entity-specific logs
router.get("/entity/:entityType/:entityId", eventLogController.getEntityEventLogs);

// User-specific logs
router.get("/user/:userId", eventLogController.getUserEventLogs);

module.exports = router; 