const warehouseService = require("./warehouse.service");

module.exports = {
  async createWarehouse(req, res) {
    try {
      const { name, address, location, capacity, max_occupancy, status } =
        req.body;
      if (!name)
        return res
          .status(400)
          .json({ success: false, message: "Warehouse name is required" });
      const newWh = await warehouseService.createWarehouse({
        name,
        address,
        location,
        capacity,
        max_occupancy,
        status,
      });
      res
        .status(201)
        .json({ success: true, message: "Warehouse created", data: newWh });
    } catch (error) {
      console.error("createWarehouse error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAllWarehouses(req, res) {
    try {
      const warehouses = await warehouseService.getAllWarehouses({
        name: req.query.name,
      });
      res.json({ success: true, data: warehouses, count: warehouses.length });
    } catch (error) {
      console.error("getAllWarehouses error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getWarehouseById(req, res) {
    try {
      const wh = await warehouseService.getWarehouseById(req.params.id);
      res.json({ success: true, data: wh });
    } catch (error) {
      console.error("getWarehouseById error:", error);
      if (error.message === "Warehouse not found")
        return res.status(404).json({ success: false, message: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateWarehouse(req, res) {
    try {
      const updated = await warehouseService.updateWarehouse(
        req.params.id,
        req.body
      );
      res.json({ success: true, message: "Warehouse updated", data: updated });
    } catch (error) {
      console.error("updateWarehouse error:", error);
      if (error.message.includes("Record to update not found"))
        return res
          .status(404)
          .json({ success: false, message: "Warehouse not found" });
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteWarehouse(req, res) {
    try {
      await warehouseService.deleteWarehouse(req.params.id);
      res.json({ success: true, message: "Warehouse deleted" });
    } catch (error) {
      console.error("deleteWarehouse error:", error);
      if (error.message.includes("Record to delete does not exist"))
        return res
          .status(404)
          .json({ success: false, message: "Warehouse not found" });
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async assignCell(req, res) {
    try {
      const userId = req.user && req.user.id;
      const cell = await warehouseService.assignCellToWarehouse(
        req.params.id,
        req.body,
        userId
      );
      res
        .status(201)
        .json({ success: true, message: "Cell assigned", data: cell });
    } catch (error) {
      console.error("assignCell error:", error);
      if (/not found|exists/.test(error.message))
        return res.status(400).json({ success: false, message: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
