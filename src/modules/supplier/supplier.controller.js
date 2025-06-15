const supplierService = require('./supplier.service');

/**
 * Create a new supplier
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async function createSupplier(req, res) {
  try {
    const supplierData = req.body;
    
    // ✅ NEW: Validate required company_name field
    if (!supplierData.company_name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required"
      });
    }
    
    // ✅ DEPRECATED: Keep backward compatibility check for old 'name' field
    if (!supplierData.name && !supplierData.company_name) {
      return res.status(400).json({
        success: false,
        message: "Supplier name or company name is required"
      });
    }
    
    const newSupplier = await supplierService.createSupplier(supplierData);
    
    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: newSupplier
    });
  } catch (error) {
    console.error("Error in createSupplier controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create supplier",
      error: error.message
    });
  }
}

/**
 * Get all suppliers
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async function getAllSuppliers(req, res) {
  try {
    const search = req.query.search;
    const suppliers = await supplierService.getAllSuppliers(search);

    return res.status(200).json({
      success: true,
      message: "Suppliers retrieved successfully",
      data: suppliers,
      count: suppliers.length,
    });
  } catch (error) {
    console.error("Error in getAllSuppliers controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve suppliers",
      error: error.message,
    });
  }
}

/**
 * Get supplier by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async function getSupplierById(req, res) {
  try {
    const { id } = req.params;
    
    const supplier = await supplierService.getSupplierById(id);
    
    return res.status(200).json({
      success: true,
      message: "Supplier retrieved successfully",
      data: supplier
    });
  } catch (error) {
    console.error("Error in getSupplierById controller:", error);
    
    if (error.message === "Supplier not found") {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve supplier",
      error: error.message
    });
  }
}

/**
 * Update supplier
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async function updateSupplier(req, res) {
  try {
    const { id } = req.params;
    const supplierData = req.body;
    
    // ✅ NEW: Validate company_name if provided (not required for updates)
    // ✅ DEPRECATED: Keep backward compatibility check for old 'name' field
    if (!supplierData.company_name && !supplierData.name) {
      return res.status(400).json({
        success: false,
        message: "Company name or supplier name is required"
      });
    }
    
    const updatedSupplier = await supplierService.updateSupplier(id, supplierData);
    
    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: updatedSupplier
    });
  } catch (error) {
    console.error("Error in updateSupplier controller:", error);
    
    if (error.message.includes("Record to update not found")) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Failed to update supplier",
      error: error.message
    });
  }
}

/**
 * Delete supplier
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async function deleteSupplier(req, res) {
  try {
    const { id } = req.params;
    
    const deletedSupplier = await supplierService.deleteSupplier(id);
    
    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
      data: deletedSupplier
    });
  } catch (error) {
    console.error("Error in deleteSupplier controller:", error);
    
    if (error.message.includes("Record to delete does not exist")) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
        error: error.message
      });
    }
    
    if (error.message.includes("Cannot delete supplier with related entry order products")) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete supplier with related entry order products",
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
      error: error.message
    });
  }
}

/**
 * Get form fields: countries and supplier categories
 */
async function getFormFields(req, res) {
  try {
    const formFields = await supplierService.getFormFields();
    res.json(formFields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ✅ NEW: Get supplier categories
async function getSupplierCategories(req, res) {
  try {
    const categories = await supplierService.getSupplierCategories();
    
    return res.status(200).json({
      success: true,
      message: "Supplier categories retrieved successfully",
      data: categories
    });
  } catch (error) {
    console.error("Error in getSupplierCategories controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve supplier categories",
      error: error.message
    });
  }
}

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getFormFields,
  
  // ✅ NEW: Category system controller
  getSupplierCategories,
};