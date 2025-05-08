const {
  PrismaClient,
  CellStatus,
  MovementType,
  InventoryStatus,
} = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Assign N pallets in a given row of a warehouse,
 * filling A.01.01 → A.01.10, then A.02.01 → etc.
 */
async function assignPallets(
  warehouse_id,
  row,
  palletCount,
  product_id,
  user_id
) {
  return await prisma.$transaction(async (tx) => {
    const wh = await tx.warehouse.findUnique({ where: { warehouse_id } });
    if (!wh) throw new Error("Warehouse not found");
    if (!row) throw new Error("Row code is required");
    if (palletCount < 1) throw new Error("palletCount must be ≥ 1");

    const freeSlots = await tx.warehouseCell.findMany({
      where: { warehouse_id, row, kind: "NORMAL", status: "AVAILABLE" },
      orderBy: [{ bay: "asc" }, { position: "asc" }],
    });
    if (freeSlots.length < palletCount) {
      throw new Error(
        `Not enough free slots in row ${row}: requested ${palletCount}, found ${freeSlots.length}`
      );
    }

    const assigned = [];
    for (let i = 0; i < palletCount; i++) {
      const slot = freeSlots[i];
      await tx.inventory.create({
        data: {
          product_id,
          warehouse_id,
          cell_id: slot.id,
          quantity: 1,
          status: InventoryStatus.AVAILABLE,
        },
      });
      await tx.inventoryLog.create({
        data: {
          user_id,
          product_id,
          quantity_change: 1,
          movement_type: MovementType.ENTRY,
          warehouse_id,
          cell_id: slot.id,
          notes: `Stored 1 pallet in ${row}.${String(slot.bay).padStart(
            2,
            "0"
          )}.${String(slot.position).padStart(2, "0")}`,
        },
      });
      await tx.warehouseCell.update({
        where: { id: slot.id },
        data: { currentUsage: { increment: 1 }, status: CellStatus.OCCUPIED },
      });
      assigned.push(slot);
    }
    return assigned;
  });
}

/**
 * Fetch all cells, optionally filtering by warehouse
 */
async function getAllWarehouseCells(filter = {}) {
  const where = {};
  if (filter.warehouse_id) where.warehouse_id = filter.warehouse_id;
  return await prisma.warehouseCell.findMany({
    where,
    orderBy: [
      { warehouse_id: "asc" },
      { row: "asc" },
      { bay: "asc" },
      { position: "asc" },
    ],
  });
}

/**
 * Fetch all warehouses for dropdown
 */
async function fetchWarehouses() {
  return await prisma.warehouse.findMany({
    select: { warehouse_id: true, name: true },
  });
}

module.exports = { assignPallets, getAllWarehouseCells, fetchWarehouses };
