const { PrismaClient, InventoryStatus, MovementType, CellStatus } = require("@prisma/client");
const { toUTC } = require("../../utils/index");
const prisma = new PrismaClient();

// Dropdown data for Departure form
async function getDepartureFormFields() {
  const [customers, documentTypes, users, packagingTypes, labels, warehouses] =
    await Promise.all([
      prisma.customer.findMany({ select: { customer_id: true, name: true } }),
      prisma.documentType.findMany({
        select: { document_type_id: true, name: true },
      }),
      prisma.user.findMany({
        select: { id: true, first_name: true, last_name: true },
      }),
      prisma.packagingType.findMany(),
      prisma.label.findMany(),
      prisma.warehouse.findMany({
        select: { warehouse_id: true, name: true },
      }),
    ]);
  return { customers, documentTypes, users, packagingTypes, labels, warehouses };
}

// Exit options
async function getDepartureExitOptions() {
  return await prisma.exitOption.findMany();
}

// Fetch departure orders
async function getAllDepartureOrders(searchQuery = "") {
  const whereClause = searchQuery
    ? { departure_order_no: { contains: searchQuery, mode: "insensitive" } }
    : {};
  return await prisma.departureOrder.findMany({
    where: whereClause,
    orderBy: { departure_date: "desc" },
    select: {
      departure_order_id: true,
      departure_order_no: true,
      documentType: { select: { name: true } },
      customer: { select: { name: true } },
      order: { select: { created_at: true } },
      palettes: true,
      total_qty: true,
      total_volume: true,
      total_weight: true,
      departure_date: true,
      arrival_point: true,
      type: true,
      insured_value: true,
      departure_transfer_note: true,
      product_description: true,
      packaging_list: true, // Include packaging list URL
    },
  });
}

// Get products with available inventory for departure
async function getProductsWithInventory(warehouseId = null) {
  const whereClause = {
    status: InventoryStatus.AVAILABLE,
    quantity: { gt: 0 },
  };
  
  if (warehouseId) {
    whereClause.warehouse_id = String(warehouseId);
  }

  const productsWithInventory = await prisma.inventory.groupBy({
    by: ['product_id'],
    where: whereClause,
    _sum: {
      quantity: true,
      packaging_quantity: true,
      weight: true,
      volume: true,
    },
    _count: {
      inventory_id: true,
    }
  });

  // Get product details
  const productIds = productsWithInventory.map(p => p.product_id);
  const products = await prisma.product.findMany({
    where: { product_id: { in: productIds } },
    select: {
      product_id: true,
      name: true,
      product_line: { select: { name: true } },
      group: { select: { name: true } },
    }
  });

  // Combine data
  return productsWithInventory.map(inv => {
    const product = products.find(p => p.product_id === inv.product_id);
    return {
      product_id: inv.product_id,
      product_name: product?.name,
      product_line: product?.product_line?.name,
      group_name: product?.group?.name,
      available_quantity: inv._sum.quantity,
      available_packaging: inv._sum.packaging_quantity,
      available_weight: inv._sum.weight,
      available_volume: inv._sum.volume,
      location_count: inv._count.inventory_id,
    };
  });
}

// Get available cells for a specific product (for single cell selection)
async function getAvailableCellsForProduct(productId, warehouseId = null) {
  const whereClause = {
    product_id: String(productId),
    status: InventoryStatus.AVAILABLE,
    quantity: { gt: 0 },
  };
  
  if (warehouseId) {
    whereClause.warehouse_id = String(warehouseId);
  }

  const inventory = await prisma.inventory.findMany({
    where: whereClause,
    include: {
      cell: {
        select: {
          id: true,
          row: true,
          bay: true,
          position: true,
          warehouse_id: true,
        }
      },
      entry_order: {
        select: {
          entry_order_id: true,
          entry_order_no: true,
          lot_series: true,
          expiration_date: true,
          admission_date_time: true,
        }
      },
      product: {
        select: {
          product_id: true,
          name: true,
        }
      }
    },
    orderBy: [
      { cell: { row: 'asc' } },
      { cell: { bay: 'asc' } },
      { cell: { position: 'asc' } }
    ]
  });

  // Format for frontend display
  return inventory.map(inv => ({
    inventory_id: inv.inventory_id,
    cell_id: inv.cell_id,
    cell_reference: `${inv.cell.row}.${String(inv.cell.bay).padStart(2, '0')}.${String(inv.cell.position).padStart(2, '0')}`,
    product_name: inv.product.name,
    available_packaging: inv.packaging_quantity,
    available_weight: parseFloat(inv.weight),
    available_volume: inv.volume ? parseFloat(inv.volume) : null,
    expiration_date: inv.expiration_date,
    entry_order_no: inv.entry_order?.entry_order_no,
    lot_series: inv.entry_order?.lot_series,
    admission_date: inv.entry_order?.admission_date_time,
  }));
}

// Validate selected cell has enough inventory
async function validateSelectedCell(inventory_id, requested_qty, requested_weight) {
  const inventory = await prisma.inventory.findUnique({
    where: { inventory_id },
    include: {
      cell: {
        select: { row: true, bay: true, position: true }
      },
      entry_order: {
        select: { entry_order_no: true }
      }
    }
  });
  
  if (!inventory) {
    throw new Error(`Inventory not found`);
  }
  
  if (inventory.status !== InventoryStatus.AVAILABLE) {
    throw new Error(`Inventory in cell ${inventory.cell.row}.${inventory.cell.bay}.${inventory.cell.position} is not available`);
  }
  
  if (inventory.packaging_quantity < requested_qty) {
    throw new Error(`Insufficient quantity in cell ${inventory.cell.row}.${inventory.cell.bay}.${inventory.cell.position}. Available: ${inventory.packaging_quantity}, Requested: ${requested_qty}`);
  }
  
  if (parseFloat(inventory.weight) < requested_weight) {
    throw new Error(`Insufficient weight in cell ${inventory.cell.row}.${inventory.cell.bay}.${inventory.cell.position}. Available: ${inventory.weight}kg, Requested: ${requested_weight}kg`);
  }
  
  return {
    inventory_id: inventory.inventory_id,
    cell_id: inventory.cell_id,
    cell_reference: `${inventory.cell.row}.${String(inventory.cell.bay).padStart(2, '0')}.${String(inventory.cell.position).padStart(2, '0')}`,
    entry_order_no: inventory.entry_order?.entry_order_no,
    requested_qty,
    requested_weight,
    remaining_qty: inventory.packaging_quantity - requested_qty,
    remaining_weight: parseFloat(inventory.weight) - requested_weight,
    will_be_empty: (inventory.packaging_quantity - requested_qty) <= 0
  };
}

// Create Departure order with single cell selection and update inventory
async function createDepartureOrder(departureData) {
  const { 
    inventory_id, 
    requested_qty, 
    requested_weight, 
    ...orderData 
  } = departureData;
  
  // Validate the selected cell
  const validatedCell = await validateSelectedCell(
    inventory_id, 
    parseInt(requested_qty), 
    parseFloat(requested_weight)
  );
  
  return await prisma.$transaction(async (tx) => {
    // 1. Create base order
    const newOrder = await tx.order.create({
      data: {
        order_type: orderData.order_type || "DEPARTURE",
        status: orderData.order_status || "PENDING",
        organisation_id: orderData.organisation_id,
        created_by: orderData.created_by,
      },
    });

    // 2. Create departure order - REMOVE status_id field
    const newDepartureOrder = await tx.departureOrder.create({
      data: {
        order_id: newOrder.order_id,
        departure_order_no: orderData.departure_order_no,
        registration_date: toUTC(orderData.registration_date),
        document_no: orderData.document_no,
        document_date: toUTC(orderData.document_date),
        date_and_time_of_transfer: toUTC(orderData.date_and_time_of_transfer),
        arrival_point: orderData.arrival_point,
        id_responsible: orderData.id_responsible,
        responsible_for_collection: orderData.responsible_for_collection || null,
        order_progress: orderData.order_progress || null,
        observation: orderData.observation || null,
        total_qty: parseInt(orderData.total_qty) || parseInt(requested_qty),
        total_volume: parseFloat(orderData.total_volume) || 0,
        palettes: orderData.palettes ? orderData.palettes.toString() : null,
        total_weight: parseFloat(orderData.total_weight) || parseFloat(requested_weight),
        insured_value: orderData.insured_value ? parseFloat(orderData.insured_value) : null,
        product_description: orderData.product_description || null,
        departure_date: toUTC(orderData.departure_date),
        type: orderData.type || null,
        departure_transfer_note: orderData.departure_transfer_note || null,
        product_id: String(orderData.product_id),
        customer_id: String(orderData.customer_id),
        document_type_id: String(orderData.document_type_id),
        personnel_in_charge_id: orderData.personnel_in_charge_id || null,
        packaging_id: orderData.packaging_id || null,
        label_id: orderData.label_id || null,
        document_status: orderData.document_status || null,
        warehouse_id: String(orderData.warehouse_id),
        packaging_list: orderData.packaging_list || null,
      },
    });

    // 3. Update inventory for the selected cell
    await tx.inventory.update({
      where: { inventory_id: validatedCell.inventory_id },
      data: {
        quantity: { decrement: validatedCell.requested_qty },
        packaging_quantity: { decrement: validatedCell.requested_qty },
        weight: { decrement: validatedCell.requested_weight },
        status: validatedCell.will_be_empty ? InventoryStatus.DEPLETED : InventoryStatus.AVAILABLE,
      },
    });

    // 4. Create cell assignment for tracking
    await tx.cellAssignment.create({
      data: {
        departure_order_id: newDepartureOrder.departure_order_id,
        cell_id: validatedCell.cell_id,
        assigned_by: orderData.created_by,
        packaging_quantity: validatedCell.requested_qty,
        weight: validatedCell.requested_weight,
        status: "COMPLETED",
      },
    });

    // 5. Update cell status if completely emptied
    if (validatedCell.will_be_empty) {
      await tx.warehouseCell.update({
        where: { id: validatedCell.cell_id },
        data: {
          status: CellStatus.AVAILABLE,
          currentUsage: 0,
          current_packaging_qty: 0,
          current_weight: 0,
        },
      });
    } else {
      // Update cell current quantities
      await tx.warehouseCell.update({
        where: { id: validatedCell.cell_id },
        data: {
          current_packaging_qty: { decrement: validatedCell.requested_qty },
          current_weight: { decrement: validatedCell.requested_weight },
        },
      });
    }

    // 6. Create inventory log
    await tx.inventoryLog.create({
      data: {
        user_id: orderData.created_by,
        product_id: String(orderData.product_id),
        movement_type: MovementType.DEPARTURE,
        quantity_change: -validatedCell.requested_qty,
        packaging_change: -validatedCell.requested_qty,
        weight_change: -validatedCell.requested_weight,
        departure_order_id: newDepartureOrder.departure_order_id,
        warehouse_id: String(orderData.warehouse_id),
        cell_id: validatedCell.cell_id,
        notes: `Departure: ${validatedCell.requested_qty} packages (${validatedCell.requested_weight}kg) from cell ${validatedCell.cell_reference} for order ${orderData.departure_order_no}`,
      },
    });

    return {
      departureOrder: newDepartureOrder,
      cellAllocation: {
        cell_reference: validatedCell.cell_reference,
        entry_order_no: validatedCell.entry_order_no,
        departed_qty: validatedCell.requested_qty,
        departed_weight: validatedCell.requested_weight,
        remaining_qty: validatedCell.remaining_qty,
        remaining_weight: validatedCell.remaining_weight,
        cell_depleted: validatedCell.will_be_empty
      }
    };
  });
}

module.exports = {
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
  getProductsWithInventory,
  getAvailableCellsForProduct,
  validateSelectedCell,
};
