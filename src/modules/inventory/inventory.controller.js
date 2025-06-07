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

module.exports = {
  getApprovedEntryOrdersForInventory,
  getEntryOrderProductsForInventory,
  assignProductToCell,
  getAvailableCellsForWarehouse,
  getInventorySummary,
  fetchWarehouses,
  fetchCells,
};