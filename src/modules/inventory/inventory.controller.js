const inventoryService = require("./inventory.service");
const { CellStatus } = require("@prisma/client");

/** Get approved entry orders ready for inventory assignment */
async function getApprovedEntryOrdersForInventory(req, res) {
  try {
    const userRole = req.user?.role;
    const organisationId = req.user?.organisation_id;

    // Only warehouse and admin can access
    if (userRole !== "WAREHOUSE" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only warehouse staff can access inventory assignment." 
      });
    }

    const orders = await inventoryService.getApprovedEntryOrdersForInventory(organisationId);
    
    return res.json({
      success: true,
      count: orders.length,
      data: orders,
      message: "Approved entry orders ready for inventory assignment",
    });
  } catch (err) {
    console.error("Error fetching approved entry orders:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Get specific entry order products for inventory assignment */
async function getEntryOrderProductsForInventory(req, res) {
  try {
    const { entryOrderId } = req.params;
    const userRole = req.user?.role;

    // Only warehouse and admin can access
    if (userRole !== "WAREHOUSE" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only warehouse staff can access inventory assignment." 
      });
    }

    const products = await inventoryService.getEntryOrderProductsForInventory(entryOrderId);
    
    return res.json({
      success: true,
      count: products.length,
      data: products,
      message: "Entry order products ready for inventory assignment",
    });
  } catch (err) {
    console.error("Error fetching entry order products:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Assign a specific product to a warehouse cell */
async function assignProductToCell(req, res) {
  try {
    const {
      entry_order_product_id,
      cell_id,
      inventory_quantity,
      package_quantity,
      quantity_pallets,
      presentation,
      weight_kg,
      volume_m3,
      guide_number,
      product_status,
      uploaded_documents,
      observations,
      warehouse_id,
    } = req.body;

    const userRole = req.user?.role;

    // Only warehouse and admin can assign
    if (userRole !== "WAREHOUSE" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only warehouse staff can assign inventory." 
      });
    }

    // Validate required fields
    if (!entry_order_product_id || !cell_id || !inventory_quantity || !package_quantity || !presentation || !weight_kg || !warehouse_id || !product_status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: entry_order_product_id, cell_id, inventory_quantity, package_quantity, presentation, weight_kg, warehouse_id, product_status",
      });
    }

    const result = await inventoryService.assignProductToCell({
      entry_order_product_id,
      cell_id,
      warehouse_id,
      assigned_by: req.user.id,
      inventory_quantity,
      package_quantity,
      quantity_pallets,
      presentation,
      weight_kg,
      volume_m3,
      guide_number,
      product_status,
      uploaded_documents,
      observations,
    });

    return res.status(200).json({
      success: true,
      data: {
        allocation: result.allocation,
        cellReference: result.cellReference,
        product: result.product,
      },
      message: `Successfully assigned ${inventory_quantity} units (${package_quantity} packages) of ${result.product.product_code} to cell ${result.cellReference}`,
    });
  } catch (err) {
    console.error("assignProductToCell error:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Get available cells for a specific warehouse */
async function getAvailableCellsForWarehouse(req, res) {
  try {
    const { warehouse_id } = req.params;
    
    if (!warehouse_id) {
      return res.status(400).json({
        success: false,
        message: "Warehouse ID is required",
      });
    }

    const cells = await inventoryService.getAvailableCells(warehouse_id);
    
    return res.json({
      success: true,
      count: cells.length,
      data: cells,
      message: `Available cells in warehouse`,
    });
  } catch (err) {
    console.error("Error fetching available cells:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Get inventory summary */
async function getInventorySummary(req, res) {
  try {
    const summary = await inventoryService.getInventorySummary(req.query);
    
    return res.json({
      success: true,
      count: summary.length,
      data: summary,
    });
  } catch (err) {
    console.error("Error fetching inventory summary:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Fetch all warehouses */
async function fetchWarehouses(req, res) {
  try {
    const warehouses = await inventoryService.getAllWarehouses();
    return res.json({ 
      success: true, 
      data: warehouses 
    });
  } catch (err) {
    console.error("Error fetching warehouses:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Fetch warehouse cells with optional status filter */
async function fetchCells(req, res) {
  try {
    const warehouseId = req.params.warehouse_id;
    const statusParam = req.query.status;
    const statusFilter = statusParam && CellStatus[statusParam] ? CellStatus[statusParam] : null;
    
    const cells = await inventoryService.getWarehouseCells(warehouseId, statusFilter);
    
    return res.json({ 
      success: true, 
      count: cells.length, 
      data: cells 
    });
  } catch (err) {
    console.error("Error fetching cells:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Get inventory allocations in quarantine for quality control */
async function getQuarantineInventory(req, res) {
  try {
    const userRole = req.user?.role;
    const { warehouse_id } = req.query;

    // Only warehouse and admin can access
    if (userRole !== "WAREHOUSE" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only warehouse staff can access quality control." 
      });
    }

    const quarantineItems = await inventoryService.getQuarantineInventory(warehouse_id);
    
    return res.json({
      success: true,
      count: quarantineItems.length,
      data: quarantineItems.map(item => ({
        ...item,
        cellReference: `${item.cell.row}.${String(item.cell.bay).padStart(2, "0")}.${String(item.cell.position).padStart(2, "0")}`,
        allocator_name: `${item.allocator.first_name || ""} ${item.allocator.last_name || ""}`.trim(),
        warehouse_name: item.cell.warehouse.name,
      })),
      message: "Quarantine inventory retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching quarantine inventory:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** ✅ NEW: Get inventory allocations by any quality status (dynamic) */
async function getInventoryByQualityStatus(req, res) {
  try {
    const userRole = req.user?.role;
    const { quality_status, warehouse_id } = req.query;

    // Only warehouse and admin can access
    if (userRole !== "WAREHOUSE" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only warehouse staff can access quality control." 
      });
    }

    // Validate required parameter
    if (!quality_status) {
      return res.status(400).json({
        success: false,
        message: "quality_status parameter is required. Valid values: CUARENTENA, APROBADO, DEVOLUCIONES, CONTRAMUESTRAS, RECHAZADOS",
      });
    }

    const inventoryItems = await inventoryService.getInventoryByQualityStatus(quality_status, warehouse_id);
    
    // Transform data for better readability
    const transformedData = inventoryItems.map(item => ({
      ...item,
      cellReference: `${item.cell.row}.${String(item.cell.bay).padStart(2, "0")}.${String(item.cell.position).padStart(2, "0")}`,
      allocator_name: `${item.allocator.first_name || ""} ${item.allocator.last_name || ""}`.trim(),
      last_modifier_name: item.lastModifier ? `${item.lastModifier.first_name || ""} ${item.lastModifier.last_name || ""}`.trim() : null,
      warehouse_name: item.cell.warehouse.name,
      warehouse_location: item.cell.warehouse.location,
      supplier_name: item.entry_order_product.supplier?.name,
      creator_name: `${item.entry_order_product.entry_order.creator.first_name || ""} ${item.entry_order_product.entry_order.creator.last_name || ""}`.trim(),
      organisation_name: item.entry_order_product.entry_order.creator.organisation.name,
      
      // Summary fields
      total_quantity: item.inventory?.current_quantity || item.inventory_quantity,
      total_packages: item.inventory?.current_package_quantity || item.package_quantity,
      total_weight: item.inventory?.current_weight || item.weight_kg,
      total_volume: item.inventory?.current_volume || item.volume_m3,
    }));

    // Get summary statistics
    const summary = {
      total_items: transformedData.length,
      total_quantity: transformedData.reduce((sum, item) => sum + (item.total_quantity || 0), 0),
      total_packages: transformedData.reduce((sum, item) => sum + (item.total_packages || 0), 0),
      total_weight: transformedData.reduce((sum, item) => sum + parseFloat(item.total_weight || 0), 0),
      total_volume: transformedData.reduce((sum, item) => sum + parseFloat(item.total_volume || 0), 0),
      warehouses: [...new Set(transformedData.map(item => item.warehouse_name))],
      products: [...new Set(transformedData.map(item => item.entry_order_product.product.product_code))].length,
    };

    return res.json({
      success: true,
      count: transformedData.length,
      data: transformedData,
      summary: summary,
      filters: {
        quality_status: quality_status,
        warehouse_id: warehouse_id || "all",
      },
      message: `Inventory with quality status '${quality_status}' retrieved successfully`,
    });
  } catch (err) {
    console.error("Error fetching inventory by quality status:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Transition inventory from quarantine to other quality states */
async function transitionQualityStatus(req, res) {
  try {
    const {
      allocation_id,
      to_status,
      quantity_to_move,
      package_quantity_to_move,
      weight_to_move,
      volume_to_move,
      reason,
      notes,
      new_cell_id,
    } = req.body;

    const userRole = req.user?.role;

    // Only warehouse and admin can perform quality transitions
    if (userRole !== "WAREHOUSE" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only warehouse staff can perform quality transitions." 
      });
    }

    // Validate required fields
    if (!allocation_id || !to_status || !quantity_to_move || !reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: allocation_id, to_status, quantity_to_move, reason",
      });
    }

    // Validate transition status
    const validStatuses = ["APROBADO", "DEVOLUCIONES", "CONTRAMUESTRAS", "RECHAZADOS"];
    if (!validStatuses.includes(to_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid to_status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // ✅ FIXED: Properly handle numeric fields to avoid NaN
    const parsedQuantity = parseInt(quantity_to_move);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity_to_move must be a positive number",
      });
    }

    // Handle optional numeric fields - only pass if they're valid numbers
    const transitionData = {
      allocation_id,
      to_status,
      quantity_to_move: parsedQuantity,
      reason,
      notes,
      new_cell_id,
      performed_by: req.user.id,
    };

    // Only add optional quantities if they're provided and valid
    if (package_quantity_to_move !== undefined && package_quantity_to_move !== null && package_quantity_to_move !== '') {
      const parsedPackages = parseInt(package_quantity_to_move);
      if (!isNaN(parsedPackages)) {
        transitionData.package_quantity_to_move = parsedPackages;
      }
    }

    if (weight_to_move !== undefined && weight_to_move !== null && weight_to_move !== '') {
      const parsedWeight = parseFloat(weight_to_move);
      if (!isNaN(parsedWeight)) {
        transitionData.weight_to_move = parsedWeight;
      }
    }

    if (volume_to_move !== undefined && volume_to_move !== null && volume_to_move !== '') {
      const parsedVolume = parseFloat(volume_to_move);
      if (!isNaN(parsedVolume)) {
        transitionData.volume_to_move = parsedVolume;
      }
    }

    const result = await inventoryService.transitionQualityStatus(transitionData);

    return res.status(200).json({
      success: true,
      data: {
        transition: result.transition,
        cellReference: result.cellReference,
      },
      message: `Successfully transitioned ${parsedQuantity} units from quarantine to ${to_status}`,
    });
  } catch (err) {
    console.error("transitionQualityStatus error:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Get available inventory for departure orders (only approved items) */
async function getAvailableInventoryForDeparture(req, res) {
  try {
    const userRole = req.user?.role;

    // Only warehouse, admin, and customers can view available inventory
    if (!["WAREHOUSE", "ADMIN", "CUSTOMER"].includes(userRole)) {
      return res.status(403).json({ 
        message: "Access denied." 
      });
    }

    const availableInventory = await inventoryService.getAvailableInventoryForDeparture(req.query);
    
    return res.json({
      success: true,
      count: availableInventory.length,
      data: availableInventory.map(item => ({
        ...item,
        cellReference: `${item.cell.row}.${String(item.cell.bay).padStart(2, "0")}.${String(item.cell.position).padStart(2, "0")}`,
        entry_order_no: item.allocation?.entry_order_product?.entry_order?.entry_order_no,
        lot_series: item.allocation?.entry_order_product?.lot_series,
        expiration_date: item.allocation?.entry_order_product?.expiration_date,
      })),
      message: "Available inventory for departure retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching available inventory for departure:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/** Get audit trail for inventory operations */
async function getInventoryAuditTrail(req, res) {
  try {
    const userRole = req.user?.role;

    // Only admin and warehouse can view audit trails
    if (userRole !== "WAREHOUSE" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only admin and warehouse staff can view audit trails." 
      });
    }

    const auditTrail = await inventoryService.getInventoryAuditTrail(req.query);
    
    return res.json({
      success: true,
      count: auditTrail.length,
      data: auditTrail.map(log => ({
        ...log,
        user_name: `${log.user.first_name || ""} ${log.user.last_name || ""}`.trim(),
      })),
      message: "Inventory audit trail retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching inventory audit trail:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * ✅ NEW: Validate inventory synchronization across the system
 */
async function validateInventorySynchronization(req, res) {
  try {
    const { autoFix = false, warehouseId } = req.query;
    
    // Convert string to boolean
    const shouldAutoFix = autoFix === 'true' || autoFix === true;
    
    console.log(`🔧 Starting inventory synchronization validation (autoFix: ${shouldAutoFix})...`);
    
    const result = await inventoryService.validateInventorySynchronization({
      autoFix: shouldAutoFix,
      warehouseId: warehouseId || null
    });
    
    return res.status(200).json({
      success: true,
      message: result.totalIssues > 0 ? 
        `Found ${result.totalIssues} synchronization issues${shouldAutoFix ? `, applied ${result.autoFixesApplied} fixes` : ''}` :
        "All inventory quantities are properly synchronized",
      data: result,
      recommendations: result.totalIssues > 0 ? [
        result.highSeverity > 0 ? "🚨 HIGH PRIORITY: Manual intervention required for data integrity issues" : null,
        result.mediumSeverity > 0 ? "⚠️ MEDIUM PRIORITY: Check allocation vs inventory discrepancies" : null,
        result.lowSeverity > 0 && !shouldAutoFix ? "💡 TIP: Use autoFix=true to automatically fix minor cell synchronization issues" : null,
        "🔄 Consider running this validation regularly to maintain data integrity"
      ].filter(Boolean) : [
        "✅ System is properly synchronized",
        "🔄 Run this check regularly to maintain data integrity"
      ]
    });
  } catch (error) {
    console.error("❌ Error in validateInventorySynchronization:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ✅ NEW: Get cells filtered by quality status destination
async function getCellsByQualityStatus(req, res) {
  try {
    const { quality_status, warehouse_id } = req.query;
    
    if (!quality_status) {
      return res.status(400).json({
        success: false,
        message: "Quality status is required"
      });
    }

    // Validate quality status
    const validStatuses = ["CUARENTENA", "APROBADO", "DEVOLUCIONES", "CONTRAMUESTRAS", "RECHAZADOS"];
    if (!validStatuses.includes(quality_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid quality status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const cells = await inventoryService.getCellsByQualityStatus(quality_status, warehouse_id);
    
    res.json({
      success: true,
      data: {
        quality_status,
        warehouse_id: warehouse_id || "all",
        cells_count: cells.length,
        cells
      }
    });
  } catch (error) {
    console.error("❌ Error getting cells by quality status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cells by quality status",
      error: error.message
    });
  }
}

module.exports = {
  getApprovedEntryOrdersForInventory,
  getEntryOrderProductsForInventory,
  assignProductToCell,
  getAvailableCellsForWarehouse,
  getInventorySummary,
  fetchWarehouses,
  fetchCells,
  // ✅ NEW: Quality control endpoints
  getQuarantineInventory,
  getInventoryByQualityStatus, // ✅ NEW: Dynamic quality status endpoint
  transitionQualityStatus,
  getAvailableInventoryForDeparture,
  getInventoryAuditTrail,
  validateInventorySynchronization,
  getCellsByQualityStatus, // ✅ NEW: Cell filtering endpoint
};