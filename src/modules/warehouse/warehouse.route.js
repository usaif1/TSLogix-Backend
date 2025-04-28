const express = require('express');
const router = express.Router();
const warehouseController = require('./warehouse.controller');

function checkAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin role required' });
  next();
}

router
  .route('/')
  .post(checkAdmin, warehouseController.createWarehouse)
  .get(warehouseController.getAllWarehouses);

router
  .route('/:id')
  .get(warehouseController.getWarehouseById)
  .put(checkAdmin, warehouseController.updateWarehouse)
  .delete(checkAdmin, warehouseController.deleteWarehouse);

router
  .route('/:id/cells')
  .post(checkAdmin, warehouseController.assignCell);

module.exports = router;
