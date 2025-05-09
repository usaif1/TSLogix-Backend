const {
  PrismaClient,
  MovementType,
  InventoryStatus,
  CellStatus,
} = require("@prisma/client");
const prisma = new PrismaClient();

/** Create a new inventory log entry */
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

/** Get all logs by entry order */
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

/** Get all logs by departure order */
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

/** Get a single log by ID */
async function getInventoryLogById(logId) {
  return prisma.inventoryLog.findUnique({
    where: { log_id: logId },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true } },
    },
  });
}

/** Get all logs with optional filters */
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
      entry_order: { select: { entry_order_no: true, entry_order_id: true } },
    },
    orderBy: { timestamp: filters.sort === "asc" ? "asc" : "desc" },
  });
}

/** Get statistics counts per movement type */
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
 * Allocate pallets from an entry order into available row-A cells,
 * log each pallet storage, and mark cells occupied.
 */
async function addInventoryAndLog({
  entry_order_id,
  user_id,
  warehouse_id = null,
  notes = null,
}) {
  // Fetch entry order to get pallets and product
  const entry = await prisma.entryOrder.findUnique({
    where: { entry_order_id },
    select: { palettes: true, product_id: true },
  });
  if (!entry) throw new Error(`EntryOrder ${entry_order_id} not found`);

  const palletCount = parseInt(entry.palettes, 10);
  if (isNaN(palletCount) || palletCount < 1)
    throw new Error(`Invalid pallets count: ${entry.palettes}`);

  // Select available row 'A' cells
  const cells = await prisma.warehouseCell.findMany({
    where: { warehouse_id, status: CellStatus.AVAILABLE, row: "A" },
    orderBy: [{ bay: "asc" }, { position: "asc" }],
    take: palletCount,
  });
  if (cells.length < palletCount)
    throw new Error(`Not enough available cells for ${palletCount} pallets`);

  // Generate cell labels for logging
  const cellLabels = cells
    .map(
      (cell) =>
        `${cell.row}.${String(cell.bay).padStart(2, "0")}.${String(
          cell.position
        ).padStart(2, "0")}`
    )
    .join(", ");

  // Prepare transactional operations
  const inventoryOps = cells.map((cell) =>
    // upsert to avoid duplicate inventory per cell
    prisma.inventory.upsert({
      where: {
        product_wh_cell_idx: {
          product_id: entry.product_id,
          warehouse_id,
          cell_id: cell.id,
        },
      },
      create: {
        product_id: entry.product_id,
        entry_order_id,
        warehouse_id,
        cell_id: cell.id,
        quantity: 1,
        expiration_date: null,
        status: InventoryStatus.AVAILABLE,
      },
      update: {
        // increment quantity if already exists
        quantity: { increment: 1 },
      },
    })
  );

  const cellUpdateOps = cells.map((cell) =>
    prisma.warehouseCell.update({
      where: { id: cell.id },
      data: { currentUsage: 1, status: CellStatus.OCCUPIED },
    })
  );

  // Single log entry summarizing all pallets
  const logOp = prisma.inventoryLog.create({
    data: {
      user_id,
      product_id: entry.product_id,
      quantity_change: palletCount,
      movement_type: MovementType.ENTRY,
      entry_order_id,
      departure_order_id: null,
      warehouse_id,
      cell_id: null,
      notes: notes
        ? `${notes} @ ${cellLabels}`
        : `Stored ${palletCount} pallets in cells: ${cellLabels}`,
    },
  });

  // Execute all operations in one transaction
  const results = await prisma.$transaction([
    ...inventoryOps,
    ...cellUpdateOps,
    logOp,
  ]);

  // Extract created inventories and the single log
  const inventories = results.slice(0, palletCount);
  const log = results[results.length - 1];

  return { inventories, log };
}

/** Fetch all warehouses */
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

/** Fetch warehouse cells with optional status filter */
async function getWarehouseCells(warehouseId = null, status = null) {
  const where = {};
  if (warehouseId) where.warehouse_id = warehouseId;
  if (status) where.status = status;
  return prisma.warehouseCell.findMany({
    where,
    select: {
      id: true,
      warehouse_id: true,
      row: true,
      bay: true,
      position: true,
      capacity: true,
      currentUsage: true,
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
