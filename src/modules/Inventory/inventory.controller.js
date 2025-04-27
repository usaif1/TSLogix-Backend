const inventoryService = require("./inventory.service");

/**
 * Create a new inventory record
 */
async function createInventory(req, res) {
  try {
    const data = req.body;
    // Validate required fields
    if (!data.product_id || data.quantity == null) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    const newInventory = await inventoryService.createInventory(data);
    return res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: newInventory,
    });
  } catch (error) {
    console.error("Error in createInventory controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create inventory",
      error: error.message,
    });
  }
}

/**
 * Get all inventory records
 */
async function getAllInventories(req, res) {
  try {
    const { product_id } = req.query;
    const inventories = await inventoryService.getAllInventories({
      product_id,
    });
    return res.status(200).json({
      success: true,
      message: "Inventories retrieved successfully",
      data: inventories,
      count: inventories.length,
    });
  } catch (error) {
    console.error("Error in getAllInventories controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventories",
      error: error.message,
    });
  }
}

/**
 * Get inventory by ID
 */
async function getInventoryById(req, res) {
  try {
    const { id } = req.params;
    const inventory = await inventoryService.getInventoryById(id);
    return res.status(200).json({
      success: true,
      message: "Inventory retrieved successfully",
      data: inventory,
    });
  } catch (error) {
    console.error("Error in getInventoryById controller:", error);
    if (error.message === "Inventory not found") {
      return res
        .status(404)
        .json({
          success: false,
          message: "Inventory not found",
          error: error.message,
        });
    }
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to retrieve inventory",
        error: error.message,
      });
  }
}

/**
 * Update inventory
 */
async function updateInventory(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.quantity == null) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity is required" });
    }

    const updated = await inventoryService.updateInventory(id, data);
    return res
      .status(200)
      .json({
        success: true,
        message: "Inventory updated successfully",
        data: updated,
      });
  } catch (error) {
    console.error("Error in updateInventory controller:", error);
    if (error.message.includes("Record to update not found")) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Inventory not found",
          error: error.message,
        });
    }
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to update inventory",
        error: error.message,
      });
  }
}

/**
 * Delete inventory
 */
async function deleteInventory(req, res) {
  try {
    const { id } = req.params;
    const deleted = await inventoryService.deleteInventory(id);
    return res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteInventory controller:", error);
    if (error.message.includes("Record to delete does not exist")) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Inventory not found",
          error: error.message,
        });
    }
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete inventory",
        error: error.message,
      });
  }
}


async function auditInventory(req, res) {
    try {
      const { id } = req.params;
      const { newStatus, reason, quantityAdjustment } = req.body;
      const userId = req.user.id;
  
      if (!newStatus || !Object.values(InventoryStatus).includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inventory status"
        });
      }
  
      const result = await inventoryService.processAudit(
        id,
        {
          newStatus,
          reason,
          quantityAdjustment,
          userId
        }
      );
  
      return res.status(200).json({
        success: true,
        message: "Inventory audit completed",
        data: result
      });
    } catch (error) {
        console.error("Error in auditInventory controller:", error);
        if (error.message.includes("Record to update not found")) {
            return res.status(404).json({
            success: false,
            message: "Inventory not found",
            error: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to audit inventory",
            error: error.message
        });
    }
  }

module.exports = {
  createInventory,
  getAllInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
  auditInventory
};
