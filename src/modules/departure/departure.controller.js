const departureService = require("./departure.service");

// Dropdown fields for Departure form
async function getDepartureFormFields(req, res) {
  try {
    const data = await departureService.getDepartureFormFields();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Exit options for Departure
async function getDepartureExitOptions(req, res) {
  try {
    const data = await departureService.getDepartureExitOptions();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Fetch all Departure Orders
async function getAllDepartureOrders(req, res) {
  try {
    const search = req.query.orderNo || "";
    const data = await departureService.getAllDepartureOrders(search);
    return res.status(200).json({ message: "Data fetched successfully", data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Get products with available inventory
async function getProductsWithInventory(req, res) {
  try {
    const { warehouseId } = req.query;
    const data = await departureService.getProductsWithInventory(warehouseId || null);
    return res.status(200).json({ 
      message: "Products with inventory fetched successfully", 
      data 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Get available cells for a specific product
async function getAvailableCellsForProduct(req, res) {
  try {
    const { productId } = req.params;
    const { warehouseId } = req.query;
    const data = await departureService.getAvailableCellsForProduct(
      productId,
      warehouseId || null
    );
    return res.status(200).json({ 
      message: "Available cells fetched successfully", 
      data 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Validate selected cell
async function validateSelectedCell(req, res) {
  try {
    const { inventory_id, requested_qty, requested_weight } = req.body;
    const data = await departureService.validateSelectedCell(
      inventory_id,
      parseInt(requested_qty),
      parseFloat(requested_weight)
    );
    return res.status(200).json({ 
      message: "Cell validation successful", 
      data 
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// Create new Departure Order
async function createDepartureOrder(req, res) {
  try {
    const result = await departureService.createDepartureOrder(req.body);
    return res
      .status(201)
      .json({ message: "Departure Order created successfully", ...result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
  getProductsWithInventory,
  getAvailableCellsForProduct,
  validateSelectedCell,
};
