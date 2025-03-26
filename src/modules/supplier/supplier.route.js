const express = require('express');
const router = express.Router();
const supplierController = require('./supplier.controller');



// IMPORTANT: Define static routes before dynamic ones.
// This prevents static routes (e.g., '/form-fields') from being interpreted as dynamic parameters (e.g., '/:id').
router.get('/form-fields', supplierController.getFormFields);

router.route('/')
  .post(supplierController.createSupplier)
  .get(supplierController.getAllSuppliers);

router.route('/:id')
  .get(supplierController.getSupplierById)
  .put(supplierController.updateSupplier)
  .delete(supplierController.deleteSupplier);

module.exports = router;