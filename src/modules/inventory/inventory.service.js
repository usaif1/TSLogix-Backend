const {
  PrismaClient,
  MovementType,
  InventoryStatus,
} = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a new inventory log entry
 */
async function createInventoryLog(logData) {
  return prisma.inventoryLog.create({
    data: {
      user_id: logData.user_id,
      product_id: logData.product_id,
      quantity_change: logData.quantity_change,
      movement_type: logData.movement_type,
      entry_order_id: logData.entry_order_id || null,
      departure_order_id: logData.departure_order_id || null,
      warehouse_id: logData.warehouse_id || null,
      cell_id: logData.cell_id || null,
      notes: logData.notes || null,
    },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true } },
    },
  });
}

/**
 * Get all inventory logs for a given entry order
 */
async function getLogsByEntryOrder(entryOrderId) {
  return prisma.inventoryLog.findMany({
    where: { entry_order_id: entryOrderId },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true } },
    },
    orderBy: { timestamp: "desc" },
  });
}

/**
 * Get all inventory logs for a given departure order
 */
async function getLogsByDepartureOrder(departureOrderId) {
  return prisma.inventoryLog.findMany({
    where: { departure_order_id: departureOrderId },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true } },
    },
    orderBy: { timestamp: "desc" },
  });
}

/**
 * Get a single inventory log by ID
 */
async function getInventoryLogById(logId) {
  return prisma.inventoryLog.findUnique({
    where: { log_id: logId },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true } },
    },
  });
}

/**
 * Get all inventory logs with optional filters
 */
async function getAllInventoryLogs(filters = {}) {
  const where = {};
  if (filters.movement_type) where.movement_type = filters.movement_type;
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.product_id) where.product_id = filters.product_id;
  if (filters.start_date && filters.end_date) {
    where.timestamp = {
      gte: new Date(filters.start_date),
      lte: new Date(filters.end_date),
    };
  }

  return prisma.inventoryLog.findMany({
    where,
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true } },
    },
    orderBy: { timestamp: filters.sort === "asc" ? "asc" : "desc" },
  });
}

/**
 * Get summary counts by movement type
 */
async function getInventoryLogStatistics() {
  const [entries, departures, transfers, adjustments, total] =
    await prisma.$transaction([
      prisma.inventoryLog.count({
        where: { movement_type: MovementType.ENTRY },
      }),
      prisma.inventoryLog.count({
        where: { movement_type: MovementType.DEPARTURE },
      }),
      prisma.inventoryLog.count({
        where: { movement_type: MovementType.TRANSFER },
      }),
      prisma.inventoryLog.count({
        where: { movement_type: MovementType.ADJUSTMENT },
      }),
      prisma.inventoryLog.count(),
    ]);
  return { entries, departures, transfers, adjustments, total };
}

/**
 * Add inventory record and log the movement in a single transaction
 */
async function addInventoryAndLog({
  product_id,
  quantity,
  entry_order_id = null,
  user_id,
  warehouse_id = null,
  cell_id = null,
  notes = null,
}) {
  return prisma.$transaction(async (tx) => {
    // Upsert inventory: increment if exists, else create new
    const inventoryRecord = await tx.inventory.upsert({
      where: {
        product_wh_cell_idx: {
          product_id,
          warehouse_id,
          cell_id,
        },
      },
      create: {
        product_id,
        entry_order_id,
        warehouse_id,
        cell_id,
        quantity,
        expiration_date: null,
        status: InventoryStatus.AVAILABLE,
      },
      update: {
        quantity: { increment: quantity },
      },
    });

    // Create the log entry
    const log = await tx.inventoryLog.create({
      data: {
        user_id,
        product_id,
        quantity_change: quantity,
        movement_type: MovementType.ENTRY,
        entry_order_id,
        departure_order_id: null,
        warehouse_id,
        cell_id,
        notes,
      },
    });

    return { inventory: inventoryRecord, log };
  });
}

/**
 * Fetch all warehouses
 */
async function getAllWarehouses() {
  return prisma.warehouse.findMany({
    select: {
      warehouse_id: true,
      name: true,
      location: true,
      capacity: true,
      status: true,
    },
  });
}

/**
 * Fetch warehouse cells, optionally filtered by status
 */
async function getWarehouseCells(warehouseId = null, status = null) {
  const where = {};
  if (warehouseId) where.warehouse_id = warehouseId;
  if (status) where.status = status;

  return prisma.warehouseCell.findMany({
    where,
    select: {
      cell_id: true,
      warehouse_id: true,
      cell_number: true,
      zone: true,
      row: true,
      column: true,
      level: true,
      capacity: true,
      current_usage: true,
      status: true,
    },
  });
}

module.exports = {
  createInventoryLog,
  getLogsByEntryOrder,
  getLogsByDepartureOrder,
  getInventoryLogById,
  getAllInventoryLogs,
  getInventoryLogStatistics,
  addInventoryAndLog,
  getAllWarehouses,
  getWarehouseCells,
};
