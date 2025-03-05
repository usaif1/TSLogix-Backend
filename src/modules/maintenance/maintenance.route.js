// src/modules/organisation/organisation.route.js
const express = require("express");
const maintenanceController = require("./maintenance.controller");

const router = express.Router();

// Route to add a new organisation
router.post("/add-supplier", maintenanceController.addSupplier);

module.exports = router;
