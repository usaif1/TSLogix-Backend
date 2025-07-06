const { assignPallets, getAllWarehouseCells, fetchWarehouses, generateWarehouseReport } = require("./warehouse.service");

async function allocatePallets(req, res) {
  const { warehouse_id, row, palletCount, product_id } = req.body;
  const user_id = req.user?.id || req.body.user_id;
  try {
    const slots = await assignPallets(
      warehouse_id,
      row,
      palletCount,
      product_id,
      user_id
    );
    return res.status(201).json({ message: "Pallets assigned", slots });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function listWarehouseCells(req, res) {
  try {
    const filter = {};
    if (req.query.warehouse_id) filter.warehouse_id = req.query.warehouse_id;
    
    // ✅ NEW: Add user context for client-based filtering
    const userContext = {
      userId: req.user?.id,
      userRole: req.user?.role // JWT token includes role name directly
    };
    
    const allCells = await getAllWarehouseCells(filter, userContext);
    
    // Apply additional filters based on query parameters
    let filteredCells = allCells;
    
    // Filter by assignment status
    if (req.query.assigned_to_client !== undefined) {
      const isAssigned = req.query.assigned_to_client === 'true';
      filteredCells = filteredCells.filter(cell => cell.is_assigned_to_client === isAssigned);
    }
    
    // Filter by cell status
    if (req.query.status) {
      filteredCells = filteredCells.filter(cell => cell.status === req.query.status);
    }
    
    // Filter by cell role
    if (req.query.cell_role) {
      filteredCells = filteredCells.filter(cell => cell.cell_role === req.query.cell_role);
    }
    
    // Get summary statistics
    const summary = {
      total_cells: allCells.length,
      filtered_cells: filteredCells.length,
      assigned_to_clients: allCells.filter(cell => cell.is_assigned_to_client).length,
      unassigned_cells: allCells.filter(cell => !cell.is_assigned_to_client).length,
      available_cells: allCells.filter(cell => cell.status === 'AVAILABLE').length,
      occupied_cells: allCells.filter(cell => cell.status === 'OCCUPIED').length,
      cells_with_inventory: allCells.filter(cell => cell.has_inventory).length,
      // ✅ NEW: Add user context info
      user_role: userContext.userRole,
      is_client_filtered: userContext.userRole && !['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userContext.userRole)
    };
    
    return res.status(200).json({ 
      success: true,
      message: "Cells fetched successfully", 
      data: filteredCells,
      summary
    });
  } catch (err) {
    return res
      .status(500)
      .json({ 
        success: false,
        message: "Error fetching cells", 
        error: err.message 
      });
  }
}

async function listWarehouses(req, res) {
  try {
    // ✅ NEW: Add user context for client-based filtering
    const userContext = {
      userId: req.user?.id,
      userRole: req.user?.role // JWT token includes role name directly
    };
    
    const list = await fetchWarehouses(userContext);
    
    return res.status(200).json({ 
      success: true,
      message: "Warehouses fetched successfully", 
      count: list.length,
      data: list,
      // ✅ NEW: Add filtering context info
      user_role: userContext.userRole,
      is_client_filtered: userContext.userRole && !['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userContext.userRole)
    });
  } catch (err) {
    console.error("Error fetching warehouses:", err);
    return res.status(500).json({ 
      success: false,
      message: "Error fetching warehouses", 
      error: err.message 
    });
  }
}

async function getWarehouseReport(req, res) {
  try {
    // ✅ Extract filter parameters from query string
    const filters = {
      date_from: req.query.date_from || null,
      date_to: req.query.date_to || null,
      customer_name: req.query.customer_name || null,
      customer_code: req.query.customer_code || null,
      product_name: req.query.product_name || null,
      product_code: req.query.product_code || null,
      warehouse_id: req.query.warehouse_id || null,
      quality_status: req.query.quality_status || null
    };

    // ✅ Get user context from JWT token
    const userContext = {
      userId: req.user?.id,
      userRole: req.user?.role
    };

    console.log(`📊 WAREHOUSE REPORT REQUEST: User ${userContext.userId} (${userContext.userRole}) requesting report with filters:`, filters);

    // ✅ Generate the warehouse report
    const reportResult = await generateWarehouseReport(filters, userContext);

    if (!reportResult.success) {
      return res.status(500).json({
        success: false,
        message: reportResult.message,
        error: reportResult.error
      });
    }

    // ✅ Return successful response
    return res.status(200).json({
      success: true,
      message: reportResult.message,
      data: reportResult.data,
      summary: reportResult.summary,
      filters_applied: reportResult.filters_applied,
      user_role: reportResult.user_role,
      is_client_filtered: reportResult.is_client_filtered,
      report_generated_at: reportResult.report_generated_at,
      processing_time_ms: reportResult.processing_time_ms
    });

  } catch (error) {
    console.error("Error in getWarehouseReport controller:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating warehouse report",
      error: error.message
    });
  }
}

module.exports = { allocatePallets, listWarehouseCells, listWarehouses, getWarehouseReport };
