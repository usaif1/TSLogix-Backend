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
    return res.status(200).json({ 
      success: true,
      message: "Departure orders fetched successfully", 
      count: data.length,
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get products with available inventory grouped by entry order product
 */
async function getProductsWithInventory(req, res) {
  try {
    const { warehouseId } = req.query;
    const data = await departureService.getProductsWithInventory(warehouseId || null);
    return res.status(200).json({ 
      success: true,
      message: "Products with inventory fetched successfully", 
      count: data.length,
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get available cells for a specific entry order product
 */
async function getAvailableCellsForProduct(req, res) {
  try {
    const { entryOrderProductId } = req.params;
    const { warehouseId } = req.query;
    
    if (!entryOrderProductId) {
      return res.status(400).json({
        success: false,
        message: "Entry Order Product ID is required",
      });
    }
    
    const data = await departureService.getAvailableCellsForProduct(
      entryOrderProductId,
      warehouseId || null
    );
    
    return res.status(200).json({ 
      success: true,
      message: "Available cells fetched successfully", 
      count: data.length,
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

// Validate selected cell
async function validateSelectedCell(req, res) {
  try {
    const { inventory_id, requested_qty, requested_weight } = req.body;
    
    if (!inventory_id || !requested_qty || !requested_weight) {
      return res.status(400).json({
        success: false,
        message: "inventory_id, requested_qty, and requested_weight are required",
      });
    }
    
    const data = await departureService.validateSelectedCell(
      inventory_id,
      parseInt(requested_qty),
      parseFloat(requested_weight)
    );
    
    return res.status(200).json({ 
      success: true,
      message: "Cell validation successful", 
      data 
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Validate multiple cell selections for bulk departure
 */
async function validateMultipleCells(req, res) {
  try {
    const { inventory_selections } = req.body;
    
    if (!inventory_selections || !Array.isArray(inventory_selections) || inventory_selections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "inventory_selections array is required",
      });
    }
    
    const validations = [];
    for (const selection of inventory_selections) {
      try {
        const validation = await departureService.validateSelectedCell(
          selection.inventory_id,
          parseInt(selection.requested_qty),
          parseFloat(selection.requested_weight)
        );
        validations.push({ ...validation, valid: true });
      } catch (error) {
        validations.push({
          inventory_id: selection.inventory_id,
          valid: false,
          error: error.message,
        });
      }
    }
    
    const allValid = validations.every(v => v.valid);
    const totalQty = validations.filter(v => v.valid).reduce((sum, v) => sum + v.requested_qty, 0);
    const totalWeight = validations.filter(v => v.valid).reduce((sum, v) => sum + v.requested_weight, 0);
    
    return res.status(200).json({ 
      success: true,
      message: allValid ? "All cell validations successful" : "Some validations failed",
      all_valid: allValid,
      total_qty: totalQty,
      total_weight: totalWeight,
      validations 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

// Create new Departure Order with product tracking
async function createDepartureOrder(req, res) {
  try {
    const result = await departureService.createDepartureOrder(req.body);
    return res.status(201).json({ 
      success: true,
      message: "Departure Order created successfully", 
      ...result 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get departure order details by ID
 */
async function getDepartureOrderById(req, res) {
  try {
    const { departureOrderId } = req.params;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    const data = await departureService.getDepartureOrderById(departureOrderId);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Departure order not found",
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: "Departure order details fetched successfully", 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
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
  validateMultipleCells, // NEW
  getDepartureOrderById, // NEW
};