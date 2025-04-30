const inventoryService = require("./inventory.service");

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

async function getAllLogs(req, res) {
  try {
    const logs = await inventoryService.getAllInventoryLogs(req.query);
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getStats(req, res) {
  try {
    const stats = await inventoryService.getInventoryLogStatistics();
    return res.json({ success: true, data: stats });
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
  };
