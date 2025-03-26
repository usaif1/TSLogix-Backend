const ProductService = require("./product.service");

/**
 * Create a new product
 */
async function createProduct(req, res) {
  try {
    const product = await ProductService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Get all products
 */
async function getAllProducts(req, res) {
  try {
    const filters = {
      product_line_id: req.query.product_line_id,
      group_id: req.query.group_id,
      name: req.query.name,
    };

    const products = await ProductService.getAllProducts(filters);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get product by ID
 */
async function getProductById(req, res) {
  try {
    const product = await ProductService.getProductById(req.params.id);
    product
      ? res.json(product)
      : res.status(404).json({ error: "Product not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update product
 */
async function updateProduct(req, res) {
  try {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Delete product
 */
async function deleteProduct(req, res) {
  try {
    await ProductService.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get product lines
 */
async function getProductLines(req, res) {
  try {
    const productLines = await ProductService.getProductLines();
    res.json(productLines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get product groups
 */
async function getGroups(req, res) {
  try {
    const groups = await ProductService.getGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get temperature ranges
 */
async function getTemperatureRanges(req, res) {
  try {
    const ranges = await ProductService.getTemperatureRanges();
    res.json(ranges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get form fields: productLines, groups, and temperatureRanges
 */
async function getFormFields(req, res) {
  try {
    const formFields = await ProductService.getFormFields();
    res.json(formFields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductLines,
  getGroups,
  getTemperatureRanges,
  getFormFields,
};
