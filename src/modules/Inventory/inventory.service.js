const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createInventory(data) {
  try {
    return await prisma.inventory.create({ data });
  } catch (error) {
    console.error("Error creating inventory:", error);
    throw new Error(`Error creating inventory: ${error.message}`);
  }
}

async function getAllInventories(filters = {}) {
  try {
    const where = {};
    if (filters.product_id) where.product_id = filters.product_id;
    return await prisma.inventory.findMany({
      where,
      include: { product: true, location: true, entry_order: true },
    });
  } catch (error) {
    console.error("Error fetching inventories:", error);
    throw new Error(`Error fetching inventories: ${error.message}`);
  }
}

async function getInventoryById(id) {
  try {
    const record = await prisma.inventory.findUnique({
      where: { inventory_id: id },
      include: { product: true, location: true, entry_order: true },
    });
    if (!record) throw new Error("Inventory not found");
    return record;
  } catch (error) {
    console.error(`Error fetching inventory with ID ${id}:`, error);
    throw new Error(
      error.message.includes("not found")
        ? "Inventory not found"
        : `Error fetching inventory: ${error.message}`
    );
  }
}

async function updateInventory(id, data) {
  try {
    return await prisma.inventory.update({ where: { inventory_id: id }, data });
  } catch (error) {
    console.error(`Error updating inventory with ID ${id}:`, error);
    throw new Error(error.message);
  }
}

async function deleteInventory(id) {
  try {
    return await prisma.inventory.delete({ where: { inventory_id: id } });
  } catch (error) {
    console.error(`Error deleting inventory with ID ${id}:`, error);
    throw new Error(error.message);
  }
}


// inventory.service.js
async function processAudit(inventoryId, auditData) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get current inventory
      const inventory = await tx.inventory.findUnique({
        where: { inventory_id: inventoryId }
      });
  
      // 2. Update inventory status
      const updatedInventory = await tx.inventory.update({
        where: { inventory_id: inventoryId },
        data: {
          status: auditData.newStatus,
          quantity: auditData.quantityAdjustment ? 
            inventory.quantity + auditData.quantityAdjustment :
            inventory.quantity
        }
      });
  
      // 3. Create audit log
      await tx.inventoryLog.create({
        data: {
          product_id: inventory.product_id,
          quantity_change: auditData.quantityAdjustment || 0,
          movement_type: 'AUDIT_ADJUSTMENT',
          user_id: auditData.userId,
          notes: `Status changed to ${auditData.newStatus}. Reason: ${auditData.reason}`
        }
      });
  
      return updatedInventory;
    });
  }

module.exports = {
  createInventory,
  getAllInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
  processAudit,
};
