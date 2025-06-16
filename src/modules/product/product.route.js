// src/modules/product/product.route.ts
const express = require('express');
const router = express.Router();
const productController = require('./product.controller');

// router.use(authenticateToken);

// IMPORTANT: Define static routes before dynamic ones.
// This prevents static routes (e.g., '/form-fields') from being interpreted as dynamic parameters (e.g., '/:id').
router.get('/form-fields', productController.getFormFields);

// ✅ NEW: Category system routes
router.get('/categories', productController.getProductCategories);
router.get('/subcategories1', productController.getSubCategories1);
router.get('/subcategories2', productController.getSubCategories2);

// ✅ DEPRECATED: Keep old routes for backward compatibility
router.get('/product-lines', productController.getProductLines);
router.get('/groups', productController.getGroups);
router.get('/temperature-ranges', productController.getTemperatureRanges);

router.route('/')
  .post(productController.createProduct)
  .get(productController.getAllProducts);

router.route('/:id')
  .get(productController.getProductById)
  .put(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;


