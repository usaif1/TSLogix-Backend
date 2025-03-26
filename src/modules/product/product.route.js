// src/modules/product/product.route.ts
const express = require('express');
const router = express.Router();
const productController = require('./product.controller');

// router.use(authenticateToken);

// IMPORTANT: Define static routes before dynamic ones.
// This prevents static routes (e.g., '/form-fields') from being interpreted as dynamic parameters (e.g., '/:id').
router.get('/form-fields', productController.getFormFields);

router.route('/')
  .post(productController.createProduct)
  .get(productController.getAllProducts);

router.route('/:id')
  .get(productController.getProductById)
  .put(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;


