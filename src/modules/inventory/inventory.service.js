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
      packaging_change: logData.packaging_change || 0,
      weight_change: logData.weight_change || 0,
      movement_type: logData.movement_type,
      entry_order_id: logData.entry_order_id || null,
      departure_order_id: logData.departure_order_id || null,
      entry_order_product_id: logData.entry_order_product_id || null,
      departure_order_product_id: logData.departure_order_product_id || null,
      warehouse_id: logData.warehouse_id || null,
      cell_id: logData.cell_id || null,
      cell_assignment_id: logData.cell_assignment_id || null,
      product_audit_id: logData.product_audit_id || null,
      notes: logData.notes || null,
    },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true, product_code: true } },
      entryOrderProduct: {
        select: {
          entry_order_product_id: true,
          entry_order: {  // Fixed: Use snake_case as defined in schema
            select: {
              entry_order_no: true,
              entry_order_id: true,
            },
          },
        },
      },
    },
  });
}

/** Get all logs by entry order */
async function getLogsByEntryOrder(entryOrderId) {
  return prisma.inventoryLog.findMany({
    where: { entry_order_id: entryOrderId },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true, product_code: true } },
      entryOrderProduct: {
        select: {
          entry_order_product_id: true,
          packaging_type: true,
          packaging_status: true,
          audit_status: true,
        },
      },
      cell: {  // Fixed: Use 'cell' as defined in schema
        select: {
          id: true,
          row: true,
          bay: true,
          position: true,
        },
      },
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
      product: { select: { product_id: true, name: true, product_code: true } },
      departureOrderProduct: {
        select: {
          departure_order_product_id: true,
          packaging_type: true,
          packaging_status: true,
          total_qty: true,
          total_weight: true,
          // ✅ FIXED: Include the departure order details
          departure_order: {
            select: {
              departure_order_no: true,
              departure_order_id: true,
            },
          },
        },
      },
      cell: {
        select: {
          id: true,
          row: true,
          bay: true,
          position: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });
}

/** Get logs by specific entry order product */
async function getLogsByEntryOrderProduct(entryOrderProductId) {
  return prisma.inventoryLog.findMany({
    where: { entry_order_product_id: entryOrderProductId },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      product: { select: { product_id: true, name: true, product_code: true } },
      cell: {  // Fixed: Use 'cell' as defined in schema
        select: {
          id: true,
          row: true,
          bay: true,
          position: true,
        },
      },
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
      product: { select: { product_id: true, name: true, product_code: true } },
      entryOrderProduct: {
        select: {
          entry_order_product_id: true,
          packaging_type: true,
          packaging_status: true,
          audit_status: true,
          entry_order: {  // Fixed: Use snake_case as defined in schema
            select: {
              entry_order_no: true,
            },
          },
        },
      },
      cell: {  // Fixed: Use 'cell' as defined in schema
        select: {
          id: true,
          row: true,
          bay: true,
          position: true,
        },
      },
    },
  });
}

/** Get all logs with optional filters */
async function getAllInventoryLogs(filters = {}) {
  const where = {};
  if (filters.movement_type) where.movement_type = filters.movement_type;
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.product_id) where.product_id = filters.product_id;
  if (filters.entry_order_product_id) where.entry_order_product_id = filters.entry_order_product_id;
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
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
      product: { select: { product_id: true, name: true, product_code: true } },
      entryOrderProduct: {
        select: {
          entry_order_product_id: true,
          packaging_type: true,
          packaging_status: true,
          audit_status: true,
          entry_order: {  // Fixed: Use snake_case as defined in schema
            select: {
              entry_order_no: true,
              entry_order_id: true,
            },
          },
        },
      },
      departureOrderProduct: {
        select: {
          departure_order_product_id: true,
          departure_order: {  // Fixed: Use snake_case as defined in schema
            select: {
              departure_order_no: true,
              departure_order_id: true,
            },
          },
        },
      },
      cell: {  // Fixed: Use 'cell' as defined in schema
        select: {
          id: true,
          row: true,
          bay: true,
          position: true,
        },
      },
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
 * NEW: Assign a specific entry order product to a warehouse cell
 */
async function assignProductToCell(assignmentData) {
  const {
    entry_order_product_id,
    cell_id,
    assigned_by,
    packaging_quantity,
    weight,
    volume,
    warehouse_id,
  } = assignmentData;

  return await prisma.$transaction(async (tx) => {
    // 1. Validate entry order product exists and audit passed
    const entryOrderProduct = await tx.entryOrderProduct.findUnique({
      where: { entry_order_product_id },
      include: {
        product: {
          select: {
            product_id: true,
            product_code: true,
            name: true,
          },
        },
        entry_order: {  // Fixed: Use snake_case as defined in schema
          select: {
            entry_order_id: true,
            entry_order_no: true,
          },
        },
      },
    });

    if (!entryOrderProduct) {
      throw new Error("Entry order product not found");
    }

    if (entryOrderProduct.audit_status !== AuditResult.PASSED) {
      throw new Error(
        "Cannot assign inventory for products that have not passed audit"
      );
    }

    // 2. Check remaining quantities for this specific product
    if (entryOrderProduct.remaining_packaging_qty < packaging_quantity) {
      throw new Error(
        `Not enough remaining packaging quantity for this product. Available: ${entryOrderProduct.remaining_packaging_qty}`
      );
    }
    if (parseFloat(entryOrderProduct.remaining_weight) < parseFloat(weight)) {
      throw new Error(
        `Not enough remaining weight for this product. Available: ${entryOrderProduct.remaining_weight}`
      );
    }

    // 3. Verify cell
    const cell = await tx.warehouseCell.findUnique({
      where: { id: cell_id },
    });
    if (!cell) {
      throw new Error("Cell not found");
    }
    if (cell.status !== "AVAILABLE") {
      throw new Error("Cell is not available for assignment");
    }

    // 4. Create assignment (link to specific product)
    const assignment = await tx.cellAssignment.create({
      data: {
        entry_order_product_id,
        cell_id,
        assigned_by,
        packaging_quantity: parseInt(packaging_quantity),
        weight: parseFloat(weight),
        volume: volume ? parseFloat(volume) : null,
        status: "ACTIVE",
        packaging_type: entryOrderProduct.packaging_type,
        packaging_status: entryOrderProduct.packaging_status,
        packaging_code: entryOrderProduct.packaging_code,
      },
    });

    // 5. Upsert inventory (with product-specific information)
    await tx.inventory.upsert({
      where: {
        product_wh_cell_entry_idx: {  // Fixed: Use correct unique constraint name from schema
          product_id: entryOrderProduct.product_id,
          warehouse_id: warehouse_id,
          cell_id,
          entry_order_product_id,
        },
      },
      update: {
        quantity: { increment: parseInt(packaging_quantity) },
        packaging_quantity: { increment: parseInt(packaging_quantity) },
        weight: { increment: parseFloat(weight) },
        status: "AVAILABLE",
      },
      create: {
        product_id: entryOrderProduct.product_id,
        entry_order_id: entryOrderProduct.entry_order_id,
        entry_order_product_id,
        warehouse_id,
        cell_id,
        quantity: parseInt(packaging_quantity),
        packaging_quantity: parseInt(packaging_quantity),
        weight: parseFloat(weight),
        volume: volume ? parseFloat(volume) : null,
        status: "AVAILABLE",
        expiration_date: entryOrderProduct.expiration_date,
        packaging_type: entryOrderProduct.packaging_type,
        packaging_status: entryOrderProduct.packaging_status,
        packaging_code: entryOrderProduct.packaging_code,
      },
    });

    // 6. Update cell status
    await tx.warehouseCell.update({
      where: { id: cell_id },
      data: {
        status: "OCCUPIED",
        currentUsage: 1,
        current_packaging_qty: { increment: parseInt(packaging_quantity) },
        current_weight: { increment: parseFloat(weight) },
      },
    });

    // 7. Log inventory movement (with product-specific tracking)
    const cellRef = `${cell.row}.${String(cell.bay).padStart(2, "0")}.${String(
      cell.position
    ).padStart(2, "0")}`;
    
    await tx.inventoryLog.create({
      data: {
        user_id: assigned_by,
        product_id: entryOrderProduct.product_id,
        movement_type: "ENTRY",
        quantity_change: parseInt(packaging_quantity),
        packaging_change: parseInt(packaging_quantity),
        weight_change: parseFloat(weight),
        entry_order_id: entryOrderProduct.entry_order_id,
        entry_order_product_id,
        warehouse_id,
        cell_id,
        cell_assignment_id: assignment.assignment_id,
        packaging_type: entryOrderProduct.packaging_type,
        packaging_status: entryOrderProduct.packaging_status,
        packaging_code: entryOrderProduct.packaging_code,
        notes: `Assigned ${packaging_quantity} packages (${parseFloat(
          weight
        ).toFixed(2)} kg) of ${entryOrderProduct.product.product_code} to cell ${cellRef}`,
      },
    });

    // 8. Update entry order product quantities
    const updatedProduct = await tx.entryOrderProduct.update({
      where: { entry_order_product_id },
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
      remainingPackaging: updatedProduct.remaining_packaging_qty,
      remainingWeight: updatedProduct.remaining_weight,
      product: entryOrderProduct.product,
    };
  });
}

/**
 * Get available cells in a specific warehouse for assignment
 */
async function getAvailableCells(warehouseId) {
  if (!warehouseId) {
    throw new Error("Warehouse ID is required");
  }

  const availableCells = await prisma.warehouseCell.findMany({
    where: {
      warehouse_id: warehouseId,
      status: "AVAILABLE",
    },
    orderBy: [{ row: "asc" }, { bay: "asc" }, { position: "asc" }],
    select: {
      id: true,
      row: true,
      bay: true,
      position: true,
      kind: true,
      capacity: true,
      warehouse: {
        select: {
          warehouse_id: true,
          name: true,
        },
      },
    },
  });

  // Format cell references for easier consumption
  return availableCells.map((cell) => ({
    cell_id: cell.id,
    cellReference: `${cell.row}.${String(cell.bay).padStart(2, "0")}.${String(
      cell.position
    ).padStart(2, "0")}`,
    kind: cell.kind,
    capacity: cell.capacity,
    warehouse: cell.warehouse,
  }));
}

/**
 * NEW: Get products from entry orders that are ready for assignment (audit passed)
 */
async function getProductsReadyForAssignment() {
  const where = {
    audit_status: AuditResult.PASSED,
    remaining_packaging_qty: { gt: 0 },
  };

  return prisma.entryOrderProduct.findMany({
    where,
    select: {
      entry_order_product_id: true,
      remaining_packaging_qty: true,
      remaining_weight: true,
      packaging_type: true,
      packaging_status: true,
      packaging_code: true,
      expiration_date: true,
      product: {
        select: {
          product_id: true,
          product_code: true,
          name: true,
        },
      },
      entry_order: {  // Fixed: Use snake_case as defined in schema
        select: {
          entry_order_id: true,
          entry_order_no: true,
          supplier: {
            select: {
              name: true,
            },
          },
        },
      },
      // Include existing assignments (can be across multiple warehouses)
      cellAssignments: {
        where: { status: "ACTIVE" },
        select: {
          assignment_id: true,
          packaging_quantity: true,
          weight: true,
          cell: {
            select: {
              id: true,
              row: true,
              bay: true,
              position: true,
              warehouse: {
                select: {
                  warehouse_id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { entry_order: { entry_date: "asc" } },  // Fixed: Use snake_case
      { product: { product_code: "asc" } },
    ],
  });
}

/**
 * NEW: Get inventory summary by product and location
 */
async function getInventorySummary(filters = {}) {
  const where = {};
  
  if (filters.warehouse_id) where.warehouse_id = filters.warehouse_id;
  if (filters.product_id) where.product_id = filters.product_id;
  if (filters.status) where.status = filters.status;

  return prisma.inventory.findMany({
    where,
    include: {
      product: {
        select: {
          product_id: true,
          product_code: true,
          name: true,
        },
      },
      entry_order_product: {  // Fixed: Use snake_case as defined in schema
        select: {
          entry_order_product_id: true,
          packaging_type: true,
          packaging_status: true,
          audit_status: true,
          entry_order: {  // Fixed: Use snake_case as defined in schema
            select: {
              entry_order_no: true,
            },
          },
        },
      },
      warehouse: {
        select: {
          warehouse_id: true,
          name: true,
        },
      },
      cell: {  // Fixed: Use 'cell' as defined in schema
        select: {
          id: true,
          row: true,
          bay: true,
          position: true,
        },
      },
    },
    orderBy: [
      { product: { product_code: "asc" } },
      { cell: { row: "asc" } },  // Fixed: Use 'cell' as defined in schema
      { cell: { bay: "asc" } },
      { cell: { position: "asc" } },
    ],
  });
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
      current_packaging_qty: true,
      current_weight: true,
      status: true,
    },
    orderBy: [{ row: "asc" }, { bay: "asc" }, { position: "asc" }],
  });
}

module.exports = {
  createInventoryLog,
  getLogsByEntryOrder,
  getLogsByDepartureOrder,
  getLogsByEntryOrderProduct,
  getInventoryLogById,
  getAllInventoryLogs,
  getInventoryLogStatistics,
  assignProductToCell,
  getAvailableCells,
  getProductsReadyForAssignment,
  getInventorySummary,
  getAllWarehouses,
  getWarehouseCells,
};