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

module.exports = {
  createLog,
  addInventoryAndLog,
  getStats,
  getByEntryOrder,
  getByDepartureOrder,
  getLogById,
  getAllLogs,
  fetchWarehouses,
  fetchCells,
};
