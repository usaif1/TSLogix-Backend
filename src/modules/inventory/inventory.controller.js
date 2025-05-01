const {
  PrismaClient,
  MovementType,
  InventoryStatus,
  CellStatus,
} = require("@prisma/client");
const prisma = new PrismaClient();
const inventoryService = require("./inventory.service");

/**
 * Create a new inventory log entry
 */
async function createLog(req, res) {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const log = await inventoryService.createInventoryLog(data);
    return res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get all inventory logs for a given entry order
 */
async function getByEntryOrder(req, res) {
  try {
    const logs = await inventoryService.getLogsByEntryOrder(
      req.params.entry_order_id
    );
    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get all inventory logs for a given departure order
 */
async function getByDepartureOrder(req, res) {
  try {
    const logs = await inventoryService.getLogsByDepartureOrder(
      req.params.departure_order_id
    );
    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get an inventory log by its ID
 */
async function getLogById(req, res) {
  try {
    const log = await inventoryService.getInventoryLogById(req.params.log_id);
    if (!log)
      return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: log });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get all inventory logs with optional filters
 */
async function getAllLogs(req, res) {
  try {
    const logs = await inventoryService.getAllInventoryLogs(req.query);
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get inventory log statistics
 */
async function getStats(req, res) {
  try {
    const stats = await inventoryService.getInventoryLogStatistics();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Add inventory and log the movement in one transaction
 */
async function addInventoryAndLog(req, res) {
  try {
    const {
      product_id,
      quantity,
      entry_order_id,
      warehouse_id,
      cell_id,
      notes,
    } = req.body;
    const user_id = req.user.id;
    const result = await inventoryService.addInventoryAndLog({
      product_id,
      quantity,
      entry_order_id: entry_order_id || null,
      user_id,
      warehouse_id: warehouse_id || null,
      cell_id: cell_id || null,
      notes: notes || null,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Fetch all warehouses
 */
async function fetchWarehouses(req, res) {
  try {
    const warehouses = await inventoryService.getAllWarehouses();
    return res.json({ success: true, data: warehouses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Fetch warehouse cells, optionally filtered by status
 */
async function fetchCells(req, res) {
  try {
    const warehouseId = req.params.warehouse_id || null;
    const statusParam = req.query.status;
    let statusFilter = null;
    if (statusParam && CellStatus[statusParam]) {
      statusFilter = CellStatus[statusParam];
    }
    const cells = await inventoryService.getWarehouseCells(
      warehouseId,
      statusFilter
    );
    return res.json({ success: true, count: cells.length, data: cells });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  createLog,
  getByEntryOrder,
  getByDepartureOrder,
  getLogById,
  getAllLogs,
  getStats,
  addInventoryAndLog,
  fetchWarehouses,
  fetchCells,
};
