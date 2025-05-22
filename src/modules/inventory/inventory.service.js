const {
  PrismaClient,
  MovementType,
  InventoryStatus,
  CellStatus,
  AuditResult,
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
 * Assign a portion of an entry order to a warehouse cell
 */
async function assignToCell(assignmentData) {
  const {
    entry_order_id,
    cell_id,
    assigned_by,
    packaging_quantity,
    weight,
    volume,
    warehouse_id,    
  } = assignmentData;

  return await prisma.$transaction(async (tx) => {
    // 1. Validate entry order exists and audit passed
    const entryOrder = await tx.entryOrder.findUnique({
      where: { entry_order_id },
    });
    if (!entryOrder) {
      throw new Error("Entry order not found");
    }
    if (entryOrder.audit_status !== AuditResult.PASSED) {
      throw new Error(
        "Cannot assign inventory for entry orders that have not passed audit"
      );
    }

    // 3. Check remaining quantities
    if (entryOrder.remaining_packaging_qty < packaging_quantity) {
      throw new Error(
        `Not enough remaining packaging quantity. Available: ${entryOrder.remaining_packaging_qty}`
      );
    }
    if (parseFloat(entryOrder.remaining_weight) < parseFloat(weight)) {
      throw new Error(
        `Not enough remaining weight. Available: ${entryOrder.remaining_weight}`
      );
    }

    // 4. Verify cell
    const cell = await tx.warehouseCell.findUnique({
      where: { id: cell_id },
    });
    if (!cell) {
      throw new Error("Cell not found");
    }
    if (cell.status !== "AVAILABLE") {
      throw new Error("Cell is not available for assignment");
    }

    // 5. Create assignment
    const assignment = await tx.cellAssignment.create({
      data: {
        entry_order_id,
        cell_id,
        assigned_by,
        packaging_quantity: parseInt(packaging_quantity),
        weight: parseFloat(weight),
        volume: volume ? parseFloat(volume) : null,
        status: "ACTIVE",
      },
    });

    // 6. Upsert inventory
    await tx.inventory.upsert({
      where: {
        product_wh_cell_idx: {
          product_id: entryOrder.product_id,
          warehouse_id: warehouse_id,
          cell_id,
        },
      },
      update: {
        quantity: { increment: parseInt(packaging_quantity) },
        packaging_quantity: { increment: parseInt(packaging_quantity) },
        weight: { increment: parseFloat(weight) },
        status: "AVAILABLE",
      },
      create: {
        product_id: entryOrder.product_id,
        entry_order_id,
        warehouse_id,
        cell_id,
        quantity: parseInt(packaging_quantity),
        packaging_quantity: parseInt(packaging_quantity),
        weight: parseFloat(weight),
        volume: volume ? parseFloat(volume) : null,
        status: "AVAILABLE",
        expiration_date: entryOrder.expiration_date,
      },
    });

    // 7. Update cell status
    await tx.warehouseCell.update({
      where: { id: cell_id },
      data: {
        status: "OCCUPIED",
        currentUsage: 1,
        current_packaging_qty: parseInt(packaging_quantity),
        current_weight: parseFloat(weight),
      },
    });

    // 8. Log inventory movement
    const cellRef = `${cell.row}.${String(cell.bay).padStart(2, "0")}.${String(
      cell.position
    ).padStart(2, "0")}`;
    await tx.inventoryLog.create({
      data: {
        user_id: assigned_by,
        product_id: entryOrder.product_id,
        movement_type: "ENTRY",
        quantity_change: parseInt(packaging_quantity),
        packaging_change: parseInt(packaging_quantity),
        weight_change: parseFloat(weight),
        entry_order_id,
        warehouse_id,
        cell_id,
        cell_assignment_id: assignment.assignment_id,
        notes: `Assigned ${packaging_quantity} packages (${parseFloat(
          weight
        ).toFixed(2)} kg) to cell ${cellRef}`,
      },
    });

    // 9. Update entry order
    const updatedEntry = await tx.entryOrder.update({
      where: { entry_order_id },
      data: {
        remaining_packaging_qty: {
          decrement: parseInt(packaging_quantity),
        },
        remaining_weight: {
          decrement: parseFloat(weight),
        },
      },
    });

    return {
      assignment,
      cellReference: cellRef,
      remainingPackaging: updatedEntry.remaining_packaging_qty,
      remainingWeight: updatedEntry.remaining_weight,
    };
  });
}

/**
 * Get available cells in a warehouse for assignment
 */
async function getAvailableCells(warehouseId) {
  const availableCells = await prisma.warehouseCell.findMany({
    where: {
      warehouse_id: warehouseId,
      status: "AVAILABLE",
    },
    orderBy: [
      { row: 'asc' },
      { bay: 'asc' },
      { position: 'asc' }
    ],
    select: {
      id: true,
      row: true,
      bay: true,
      position: true,
      kind: true,
      capacity: true
    }
  });

  // Format cell references for easier consumption
  return availableCells.map(cell => ({
    cell_id: cell.id,
    cellReference: `${cell.row}.${String(cell.bay).padStart(2, '0')}.${String(cell.position).padStart(2, '0')}`,
    kind: cell.kind,
    capacity: cell.capacity
  }));
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
  assignToCell,
  getAvailableCells,
  getAllWarehouses,
  getWarehouseCells,
};
