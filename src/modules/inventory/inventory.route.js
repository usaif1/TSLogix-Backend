const express = require('express');
const router = express.Router();
const controller = require('./inventory.controller');

// Allocate pallets and log in one operation
router.post('/add', controller.addInventoryAndLog);

// Create a new inventory log entry
router.post('/', controller.createLog);

// Get summary statistics for inventory logs
router.get('/statistics/summary', controller.getStats);

// Get logs by entry-order or departure-order
router.get('/entry-order/:entry_order_id', controller.getByEntryOrder);
router.get('/departure-order/:departure_order_id', controller.getByDepartureOrder);

// Fetch all warehouses and available cells (must be before '/:log_id')
router.get('/warehouses', controller.fetchWarehouses);
router.get('/warehouses/:warehouse_id/cells', controller.fetchCells);

// Get a single log by its ID
router.get('/:log_id', controller.getLogById);

// Get all inventory logs
router.get('/', controller.getAllLogs);

module.exports = router;