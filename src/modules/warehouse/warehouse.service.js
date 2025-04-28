const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  /**
   * Create a new warehouse
   */
  async createWarehouse(data) {
    try {
      return await prisma.warehouse.create({ data });
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw new Error(`Error creating warehouse: ${error.message}`);
    }
  },

  /**
   * Retrieve all warehouses, optionally filtering by name
   */
  async getAllWarehouses(filters = {}) {
    try {
      const where = {};
      if (filters.name) where.name = { contains: filters.name, mode: 'insensitive' };
      return await prisma.warehouse.findMany({
        where,
        include: { cells: true, inventory: true }
      });
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw new Error(`Error fetching warehouses: ${error.message}`);
    }
  },

  /**
   * Retrieve a warehouse by its ID, including cells
   */
  async getWarehouseById(id) {
    try {
      const record = await prisma.warehouse.findUnique({
        where: { warehouse_id: id },
        include: { cells: true }
      });
      if (!record) throw new Error('Warehouse not found');
      return record;
    } catch (error) {
      console.error(`Error fetching warehouse ${id}:`, error);
      throw new Error(error.message.includes('not found') ? 'Warehouse not found' : error.message);
    }
  },

  /**
   * Update a warehouse's details
   */
  async updateWarehouse(id, data) {
    try {
      return await prisma.warehouse.update({ where: { warehouse_id: id }, data });
    } catch (error) {
      console.error(`Error updating warehouse ${id}:`, error);
      throw new Error(error.message);
    }
  },

  /**
   * Delete a warehouse
   */
  async deleteWarehouse(id) {
    try {
      return await prisma.warehouse.delete({ where: { warehouse_id: id } });
    } catch (error) {
      console.error(`Error deleting warehouse ${id}:`, error);
      throw new Error(error.message);
    }
  },

  /**
   * Assign a new cell to a warehouse and create related inventory/log entries
   * @param {string} warehouseId
   * @param {object} cellData - { cell_number, capacity, current_usage = 0 }
   * @param {string} userId - ID performing the assignment
   */
  async assignCellToWarehouse(warehouseId, cellData, userId) {
    return await prisma.$transaction(async (tx) => {
      // Ensure warehouse exists
      const wh = await tx.warehouse.findUnique({ where: { warehouse_id: warehouseId } });
      if (!wh) throw new Error('Warehouse not found');

      const { cell_number, capacity, current_usage = 0, product_id } = cellData;
      if (!cell_number || capacity == null) throw new Error('Cell number and capacity are required');
      if (capacity < 0 || current_usage < 0) throw new Error('Capacity and current usage must be non-negative');
      if (current_usage > capacity) throw new Error('Current usage cannot exceed capacity');

      // Ensure unique cell number
      const existing = await tx.warehouseCell.findUnique({
        where: { warehouse_id_cell_number: { warehouse_id: warehouseId, cell_number } }
      });
      if (existing) throw new Error(`Cell '${cell_number}' already exists in this warehouse`);

      // Create the cell
      const cell = await tx.warehouseCell.create({ data: { ...cellData, warehouse_id: warehouseId } });

      // If initial stock, create inventory and log
      if (product_id && current_usage > 0) {
        // Inventory entry
        const inventory = await tx.inventory.create({
          data: {
            product_id,
            cell_id: cell.cell_id,
            warehouse_id: warehouseId,
            quantity: current_usage,
            status: 'AVAILABLE'
          }
        });

        // Inventory log entry
        await tx.inventoryLog.create({
          data: {
            user_id: userId,
            product_id,
            quantity_change: current_usage,
            movement_type: 'ENTRY',
            entry_order_id: null,
            departure_order_id: null,
            warehouse_id: warehouseId,
            cell_id: cell.cell_id,
            notes: `Assigned cell '${cell_number}' with ${current_usage} units`
          }
        });
      }

      return cell;
    });
  }
};