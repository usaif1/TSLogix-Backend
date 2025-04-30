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
  const log = await prisma.inventoryLog.create({
    data: {
      user_id: logData.user_id,
      product_id: logData.product_id,
      quantity_change: logData.quantity_change,
      movement_type: logData.movement_type,
      entry_order_id: logData.entry_order_id,
      departure_order_id: logData.departure_order_id,
      warehouse_id: logData.warehouse_id,
      cell_id: logData.cell_id,
      notes: logData.notes,
    },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true } },
    },
  });

  return log;
}

/**
 * Get all inventory logs for a given entry order
 */
async function getLogsByEntryOrder(entry_order_id) {
  return prisma.inventoryLog.findMany({
    where: { entry_order_id },
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
async function getLogsByDepartureOrder(departure_order_id) {
  return prisma.inventoryLog.findMany({
    where: { departure_order_id },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true } },
    },
    orderBy: { timestamp: "desc" },
  });
}

/**
 * Get an inventory log by its ID
 */
async function getInventoryLogById(log_id) {
  return prisma.inventoryLog.findUnique({
    where: { log_id },
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
 * Get inventory log statistics
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

module.exports = {
  createInventoryLog,
  getLogsByEntryOrder,
  getLogsByDepartureOrder,
  getInventoryLogById,
  getAllInventoryLogs,
  getInventoryLogStatistics,
};
