const inventoryService = require("./inventory.service");
const { CellStatus } = require("@prisma/client");

async function createLog(req, res) {
  try {
    const log = await inventoryService.createInventoryLog({
      ...req.body,
      user_id: req.user.id,
    });
    return res.status(201).json({ success: true, data: log });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function addInventoryAndLog(req, res) {
  try {
    const { entry_order_id, warehouse_id, notes } = req.body;
    const result = await inventoryService.addInventoryAndLog({
      entry_order_id,
      user_id: req.user.id,
      warehouse_id,
      notes,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getStats(req, res) {
  try {
    const stats = await inventoryService.getInventoryLogStatistics();
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getByEntryOrder(req, res) {
  try {
    const logs = await inventoryService.getLogsByEntryOrder(
      req.params.entry_order_id
    );
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getByDepartureOrder(req, res) {
  try {
    const logs = await inventoryService.getLogsByDepartureOrder(
      req.params.departure_order_id
    );
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** NEW: Get logs by specific entry order product */
async function getByEntryOrderProduct(req, res) {
  try {
    const logs = await inventoryService.getLogsByEntryOrderProduct(
      req.params.entry_order_product_id
    );
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getLogById(req, res) {
  try {
    const log = await inventoryService.getInventoryLogById(req.params.log_id);
    if (!log)
      return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: log });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getAllLogs(req, res) {
  try {
    const logs = await inventoryService.getAllInventoryLogs(req.query);
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function fetchWarehouses(req, res) {
  try {
    const whs = await inventoryService.getAllWarehouses();
    return res.json({ success: true, data: whs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function fetchCells(req, res) {
  try {
    const warehouseId = req.params.warehouse_id;
    const statusParam = req.query.status;
    const statusFilter =
      statusParam && CellStatus[statusParam] ? CellStatus[statusParam] : null;
    const cells = await inventoryService.getWarehouseCells(
      warehouseId,
      statusFilter
    );
    return res.json({ success: true, count: cells.length, data: cells });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** NEW: Assign a specific product to a warehouse cell */
async function assignProductToCell(req, res) {
  try {
    const {
      entry_order_product_id,
      cell_id,
      packaging_quantity,
      weight,
      volume,
      warehouse_id,
    } = req.body;

    // Validate required fields
    if (!entry_order_product_id || !cell_id || !packaging_quantity || !weight || !warehouse_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: entry_order_product_id, cell_id, packaging_quantity, weight, warehouse_id",
      });
    }

    const result = await inventoryService.assignProductToCell({
      entry_order_product_id,
      cell_id,
      warehouse_id,
      assigned_by: req.user.id,
      packaging_quantity,
      weight,
      volume,
    });

    return res.status(200).json({
      success: true,
      data: {
        assignment: result.assignment,
        cellReference: result.cellReference,
        remainingPackaging: result.remainingPackaging,
        remainingWeight: result.remainingWeight,
        product: result.product,
      },
      message: `Successfully assigned ${packaging_quantity} packages of ${result.product.product_code} to cell ${result.cellReference}`,
    });
  } catch (err) {
    console.error("assignProductToCell error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** NEW: Get products ready for assignment (no warehouse filter) */
async function getProductsReadyForAssignment(req, res) {
  try {
    // Don't filter by warehouse since warehouse is selected during assignment
    const products = await inventoryService.getProductsReadyForAssignment();
    
    return res.json({
      success: true,
      count: products.length,
      data: products,
      message: "Products ready for assignment (warehouse to be selected during assignment)",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** NEW: Get available cells for a specific warehouse */
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
      message: `Available cells in selected warehouse`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** NEW: Get inventory summary */
async function getInventorySummary(req, res) {
  try {
    const summary = await inventoryService.getInventorySummary(req.query);
    
    return res.json({
      success: true,
      count: summary.length,
      data: summary,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createLog,
  addInventoryAndLog,
  getStats,
  getByEntryOrder,
  getByDepartureOrder,
  getByEntryOrderProduct,
  getLogById,
  getAllLogs,
  fetchWarehouses,
  fetchCells,
  assignProductToCell,
  getAvailableCellsForWarehouse,
  getProductsReadyForAssignment,
  getInventorySummary,
};