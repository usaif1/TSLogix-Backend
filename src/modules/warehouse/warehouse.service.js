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
 * Fetch all cells with client assignment status, optionally filtering by warehouse
 */
async function getAllWarehouseCells(filter = {}) {
  const where = {};
  if (filter.warehouse_id) where.warehouse_id = filter.warehouse_id;
  
  const cells = await prisma.warehouseCell.findMany({
    where,
    include: {
      warehouse: {
        select: {
          warehouse_id: true,
          name: true,
          location: true
        }
      },
      clientCellAssignments: {
        where: { is_active: true },
        include: {
          client: {
            select: {
              client_id: true,
              client_type: true,
              company_name: true,
              first_names: true,
              last_name: true,
              email: true
            }
          },
          assignedBy: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      },
      inventory: {
        select: {
          inventory_id: true,
          current_quantity: true,
          status: true,
          product: {
            select: {
              product_code: true,
              name: true
            }
          }
        },
        take: 5 // Limit to show recent inventory
      },
      _count: {
        select: {
          inventory: true,
          clientCellAssignments: {
            where: { is_active: true }
          }
        }
      }
    },
    orderBy: [
      { warehouse_id: "asc" },
      { row: "asc" },
      { bay: "asc" },
      { position: "asc" },
    ],
  });

  // Transform data to include client assignment status
  return cells.map(cell => {
    const activeAssignment = cell.clientCellAssignments[0] || null;
    const clientInfo = activeAssignment ? {
      client_id: activeAssignment.client.client_id,
      client_name: activeAssignment.client.client_type === "COMMERCIAL" 
        ? activeAssignment.client.company_name 
        : `${activeAssignment.client.first_names} ${activeAssignment.client.last_name}`,
      client_type: activeAssignment.client.client_type,
      client_email: activeAssignment.client.email,
      assigned_by: `${activeAssignment.assignedBy.first_name} ${activeAssignment.assignedBy.last_name}`,
      assigned_at: activeAssignment.assigned_at,
      priority: activeAssignment.priority,
      notes: activeAssignment.notes
    } : null;

    return {
      ...cell,
      cell_location: `${cell.row}.${cell.bay}.${cell.position}`,
      is_assigned_to_client: !!activeAssignment,
      client_assignment: clientInfo,
      has_inventory: cell._count.inventory > 0,
      inventory_count: cell._count.inventory,
      assignment_count: cell._count.clientCellAssignments
    };
  });
}

/**
 * Fetch all warehouses for dropdown with detailed information
 */
async function fetchWarehouses() {
  return await prisma.warehouse.findMany({
    select: { 
      warehouse_id: true, 
      name: true,
      location: true,
      capacity: true,
      max_occupancy: true,
      status: true,
      _count: {
        select: {
          cells: true,
          inventory: true
        }
      }
    },
    orderBy: { name: "asc" }
  });
}

module.exports = { assignPallets, getAllWarehouseCells, fetchWarehouses };
