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
    const organisationId = req.query.organisationId || null;
    
    // ✅ FIXED: The JWT token stores role as a string directly (from auth.service.js)
    const userRole = req.user?.role; // Role is stored directly as string in JWT
    const userOrgId = req.user?.organisation_id;
    
    const data = await departureService.getAllDepartureOrders(search, organisationId, userRole, userOrgId);
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
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    if (!entryOrderProductId) {
      return res.status(400).json({
        success: false,
        message: "Entry Order Product ID is required",
      });
    }
    
    const data = await departureService.getAvailableCellsForProduct(
      entryOrderProductId,
      warehouseId || null,
      userRole,
      userId
    );
    
    return res.status(200).json({ 
      success: true,
      message: userRole === "CLIENT" 
        ? "Available inventory in your assigned cells fetched successfully"
        : "Available cells fetched successfully", 
      count: data.length,
      data,
      user_role: userRole,
      filtered_by_client_assignments: userRole === "CLIENT"
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
    const departureData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // ✅ LOG: Departure order creation process started
    await req.logEvent(
      'DEPARTURE_ORDER_CREATION_STARTED',
      'DepartureOrder',
      'NEW_DEPARTURE_ORDER',
      `Started creating new departure order for client: ${departureData.client_id}`,
      null,
      {
        client_id: departureData.client_id,
        warehouse_id: departureData.warehouse_id,
        departure_date_time: departureData.departure_date_time,
        transport_type: departureData.transport_type,
        destination: departureData.destination,
        created_by: userId,
        creator_role: userRole,
        creation_timestamp: new Date().toISOString(),
        products_count: departureData.products ? departureData.products.length : 0,
        has_special_instructions: !!departureData.special_instructions,
        has_temperature_requirements: !!departureData.temperature_requirements,
        total_estimated_weight: departureData.total_weight,
        total_estimated_volume: departureData.total_volume
      },
      { operation_type: 'DEPARTURE_ORDER_MANAGEMENT', action_type: 'CREATION_START' }
    );

    const result = await departureService.createDepartureOrder(departureData);

    // ✅ LOG: Successful departure order creation
    await req.logEvent(
      'DEPARTURE_ORDER_CREATED',
      'DepartureOrder',
      result.departure_order_id,
      `Successfully created departure order ${result.departure_order_no}`,
      null,
      {
        departure_order_id: result.departure_order_id,
        departure_order_no: result.departure_order_no,
        client_id: result.client_id,
        client_name: result.client_name,
        warehouse_id: result.warehouse_id,
        warehouse_name: result.warehouse_name,
        departure_date_time: result.departure_date_time,
        transport_type: result.transport_type,
        destination: result.destination,
        status: result.status,
        created_by: userId,
        creator_role: userRole,
        created_at: result.created_at,
        products_allocated: result.products ? result.products.length : 0,
        total_weight: result.total_weight,
        total_volume: result.total_volume,
        total_pallets: result.total_pallets,
        inventory_allocations_created: result.inventory_allocations_count || 0,
        business_impact: 'DEPARTURE_ORDER_READY_FOR_PROCESSING'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_MANAGEMENT', 
        action_type: 'CREATION_SUCCESS',
        business_impact: 'DEPARTURE_ORDER_SCHEDULED',
        next_steps: 'WAREHOUSE_CAN_PREPARE_SHIPMENT'
      }
    );

    return res.status(201).json({ 
      success: true,
      message: "Departure Order created successfully", 
      data: result 
    });
  } catch (error) {
    console.error("Error creating departure order:", error);
    
    // ✅ LOG: Departure order creation failure
    await req.logError(error, {
      controller: 'departure',
      action: 'createDepartureOrder',
      departure_data: {
        client_id: req.body.client_id,
        warehouse_id: req.body.warehouse_id,
        departure_date_time: req.body.departure_date_time,
        transport_type: req.body.transport_type,
        destination: req.body.destination,
        products_count: req.body.products ? req.body.products.length : 0
      },
      user_id: req.user?.id,
      user_role: req.user?.role,
      error_context: 'DEPARTURE_ORDER_CREATION_FAILED'
    });
    
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

/**
 * ✅ NEW: Get departure inventory summary by warehouse
 */
async function getDepartureInventorySummary(req, res) {
  try {
    const { warehouseId } = req.query;
    
    const data = await departureService.getDepartureInventorySummary(warehouseId || null);
    
    return res.status(200).json({ 
      success: true,
      message: "Departure inventory summary fetched successfully", 
      ...data
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get FIFO locations for a specific product
 */
async function getFifoLocationsForProduct(req, res) {
  try {
    const { productId } = req.params;
    const { warehouseId } = req.query;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
    
    const data = await departureService.getFifoLocationsForProduct(productId, warehouseId || null);
    
    return res.status(200).json({ 
      success: true,
      message: "FIFO locations for product fetched successfully", 
      count: data.length,
      product_id: productId,
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
 * ✅ NEW: Get suggested FIFO allocation for a product with requested quantity
 */
async function getSuggestedFifoAllocation(req, res) {
  try {
    const { productId } = req.params;
    const { requestedQuantity, requestedWeight, warehouseId } = req.query;
    
    if (!productId || !requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and requested quantity are required",
      });
    }
    
    const data = await departureService.getSuggestedFifoAllocation(
      productId, 
      parseInt(requestedQuantity),
      requestedWeight ? parseFloat(requestedWeight) : null,
      warehouseId || null
    );
    
    return res.status(200).json({ 
      success: true,
      message: "FIFO allocation suggestion generated successfully", 
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
 * ✅ NEW: Get next departure order number
 */
async function getCurrentDepartureOrderNo(req, res) {
  try {
    const nextOrderNo = await departureService.getCurrentDepartureOrderNo();
    
    return res.status(200).json({ 
      success: true,
      message: "Next departure order number generated successfully", 
      departure_order_no: nextOrderNo
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
  validateMultipleCells,
  getDepartureOrderById,
  getDepartureInventorySummary,
  getCurrentDepartureOrderNo,
  getFifoLocationsForProduct,
  getSuggestedFifoAllocation,

};

