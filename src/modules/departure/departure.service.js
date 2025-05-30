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

// Fetch departure orders with product details
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
      packaging_list: true,
      // NEW: Include departure products
      departureProducts: {
        select: {
          departure_order_product_id: true,
          product: {
            select: {
              product_code: true,
              name: true,
            },
          },
          packaging_quantity: true,
          weight: true,
          packaging_type: true,
          packaging_status: true,
        },
      },
    },
  });
}

/**
 * NEW: Get products with available inventory grouped by entry order product
 */
async function getProductsWithInventory(warehouseId = null) {
  const whereClause = {
    status: InventoryStatus.AVAILABLE,
    quantity: { gt: 0 },
  };
  
  if (warehouseId) {
    whereClause.warehouse_id = String(warehouseId);
  }

  // Get inventory grouped by entry order product
  const inventory = await prisma.inventory.findMany({
    where: whereClause,
    include: {
      product: {
        select: {
          product_id: true,
          product_code: true,
          name: true,
          product_line: { select: { name: true } },
          group: { select: { name: true } },
        },
      },
      entry_order_product: {
        select: {
          entry_order_product_id: true,
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
          audit_status: true,
          expiration_date: true,
          entry_order: {
            select: {
              entry_order_no: true,
              lot_series: true,
              supplier: {
                select: {
                  name: true,
                },
              },
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
      cell: {
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
      { entry_order_product: { entry_order: { entry_date: "asc" } } },
      { cell: { row: "asc" } },
      { cell: { bay: "asc" } },
      { cell: { position: "asc" } },
    ],
  });

  // Group by entry order product for better organization
  const groupedInventory = inventory.reduce((acc, inv) => {
    const key = `${inv.entry_order_product_id}_${inv.product_id}`;
    
    if (!acc[key]) {
      acc[key] = {
        entry_order_product_id: inv.entry_order_product_id,
        product_id: inv.product_id,
        product_code: inv.product.product_code,
        product_name: inv.product.name,
        product_line: inv.product.product_line?.name,
        group_name: inv.product.group?.name,
        packaging_type: inv.entry_order_product?.packaging_type,
        packaging_status: inv.entry_order_product?.packaging_status,
        packaging_code: inv.entry_order_product?.packaging_code,
        audit_status: inv.entry_order_product?.audit_status,
        expiration_date: inv.entry_order_product?.expiration_date,
        entry_order_no: inv.entry_order_product?.entry_order?.entry_order_no,
        lot_series: inv.entry_order_product?.entry_order?.lot_series,
        supplier_name: inv.entry_order_product?.entry_order?.supplier?.name,
        total_quantity: 0,
        total_packaging: 0,
        total_weight: 0,
        total_volume: 0,
        locations: [],
        warehouses: new Set(),
      };
    }
    
    acc[key].total_quantity += inv.quantity;
    acc[key].total_packaging += inv.packaging_quantity;
    acc[key].total_weight += parseFloat(inv.weight || 0);
    acc[key].total_volume += parseFloat(inv.volume || 0);
    acc[key].warehouses.add(inv.warehouse.name);
    
    acc[key].locations.push({
      inventory_id: inv.inventory_id,
      cell_id: inv.cell_id,
      cell_reference: `${inv.cell.row}.${String(inv.cell.bay).padStart(2, '0')}.${String(inv.cell.position).padStart(2, '0')}`,
      warehouse_name: inv.warehouse.name,
      warehouse_id: inv.warehouse_id,
      available_packaging: inv.packaging_quantity,
      available_weight: parseFloat(inv.weight),
      available_volume: inv.volume ? parseFloat(inv.volume) : null,
    });
    
    return acc;
  }, {});

  // Convert to array and format
  return Object.values(groupedInventory).map(item => ({
    ...item,
    warehouses: Array.from(item.warehouses),
    location_count: item.locations.length,
  }));
}

/**
 * NEW: Get available cells for a specific entry order product
 */
async function getAvailableCellsForProduct(entryOrderProductId, warehouseId = null) {
  const whereClause = {
    entry_order_product_id: String(entryOrderProductId),
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
        },
      },
      entry_order_product: {
        select: {
          entry_order_product_id: true,
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
          expiration_date: true,
          entry_order: {
            select: {
              entry_order_id: true,
              entry_order_no: true,
              lot_series: true,
              admission_date_time: true,
            },
          },
        },
      },
      product: {
        select: {
          product_id: true,
          product_code: true,
          name: true,
        },
      },
      warehouse: {
        select: {
          warehouse_id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { cell: { row: 'asc' } },
      { cell: { bay: 'asc' } },
      { cell: { position: 'asc' } },
    ],
  });

  // Format for frontend display
  return inventory.map(inv => ({
    inventory_id: inv.inventory_id,
    cell_id: inv.cell_id,
    cell_reference: `${inv.cell.row}.${String(inv.cell.bay).padStart(2, '0')}.${String(inv.cell.position).padStart(2, '0')}`,
    warehouse_name: inv.warehouse.name,
    warehouse_id: inv.warehouse_id,
    product_code: inv.product.product_code,
    product_name: inv.product.name,
    packaging_type: inv.entry_order_product?.packaging_type,
    packaging_status: inv.entry_order_product?.packaging_status,
    available_packaging: inv.packaging_quantity,
    available_weight: parseFloat(inv.weight),
    available_volume: inv.volume ? parseFloat(inv.volume) : null,
    expiration_date: inv.entry_order_product?.expiration_date,
    entry_order_no: inv.entry_order_product?.entry_order?.entry_order_no,
    lot_series: inv.entry_order_product?.entry_order?.lot_series,
    admission_date: inv.entry_order_product?.entry_order?.admission_date_time,
  }));
}

// Validate selected cell has enough inventory
async function validateSelectedCell(inventory_id, requested_qty, requested_weight) {
  const inventory = await prisma.inventory.findUnique({
    where: { inventory_id },
    include: {
      cell: {
        select: { 
          id: true,
          row: true, 
          bay: true, 
          position: true,
        },
      },
      entry_order_product: {
        select: {
          entry_order_product_id: true,
          packaging_type: true,
          packaging_status: true,
          entry_order: {
            select: { 
              entry_order_no: true,
            },
          },
        },
      },
      product: {
        select: {
          product_code: true,
          name: true,
        },
      },
      warehouse: {
        select: {
          warehouse_id: true,
          name: true,
        },
      },
    },
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
    warehouse_id: inventory.warehouse_id,
    warehouse_name: inventory.warehouse.name,
    entry_order_product_id: inventory.entry_order_product_id,
    entry_order_no: inventory.entry_order_product?.entry_order?.entry_order_no,
    product_code: inventory.product.product_code,
    product_name: inventory.product.name,
    packaging_type: inventory.entry_order_product?.packaging_type,
    packaging_status: inventory.entry_order_product?.packaging_status,
    requested_qty,
    requested_weight,
    remaining_qty: inventory.packaging_quantity - requested_qty,
    remaining_weight: parseFloat(inventory.weight) - requested_weight,
    will_be_empty: (inventory.packaging_quantity - requested_qty) <= 0,
  };
}

/**
 * NEW: Create Departure order with product-based inventory tracking
 */
async function createDepartureOrder(departureData) {
  const { 
    inventory_selections, // Array of {inventory_id, requested_qty, requested_weight}
    ...orderData 
  } = departureData;
  
  if (!inventory_selections || inventory_selections.length === 0) {
    throw new Error("At least one inventory selection is required");
  }
  
  // Validate all selected cells
  const validatedCells = [];
  for (const selection of inventory_selections) {
    const validated = await validateSelectedCell(
      selection.inventory_id, 
      parseInt(selection.requested_qty), 
      parseFloat(selection.requested_weight)
    );
    validatedCells.push(validated);
  }
  
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

    // 2. Calculate totals from selections
    const totalQty = validatedCells.reduce((sum, cell) => sum + cell.requested_qty, 0);
    const totalWeight = validatedCells.reduce((sum, cell) => sum + cell.requested_weight, 0);

    // 3. Create departure order
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
        total_qty: totalQty,
        total_volume: parseFloat(orderData.total_volume) || 0,
        palettes: orderData.palettes ? orderData.palettes.toString() : null,
        total_weight: totalWeight,
        insured_value: orderData.insured_value ? parseFloat(orderData.insured_value) : null,
        product_description: orderData.product_description || null,
        departure_date: toUTC(orderData.departure_date),
        type: orderData.type || null,
        departure_transfer_note: orderData.departure_transfer_note || null,
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

    // 4. Create departure products for each unique entry order product
    const productGroups = validatedCells.reduce((groups, cell) => {
      const key = cell.entry_order_product_id;
      if (!groups[key]) {
        groups[key] = {
          entry_order_product_id: cell.entry_order_product_id,
          product_code: cell.product_code,
          product_name: cell.product_name,
          packaging_type: cell.packaging_type,
          packaging_status: cell.packaging_status,
          total_qty: 0,
          total_weight: 0,
          cells: [],
        };
      }
      groups[key].total_qty += cell.requested_qty;
      groups[key].total_weight += cell.requested_weight;
      groups[key].cells.push(cell);
      return groups;
    }, {});

    const departureProducts = [];
    for (const [entryOrderProductId, group] of Object.entries(productGroups)) {
      const departureProduct = await tx.departureOrderProduct.create({
        data: {
          departure_order_id: newDepartureOrder.departure_order_id,
          entry_order_product_id: entryOrderProductId,
          packaging_quantity: group.total_qty,
          weight: group.total_weight,
          packaging_type: group.packaging_type,
          packaging_status: group.packaging_status,
          status: "PENDING",
        },
      });
      departureProducts.push(departureProduct);
    }

    // 5. Update inventory for all selected cells
    const cellAllocations = [];
    for (const cell of validatedCells) {
      // Update inventory
      await tx.inventory.update({
        where: { inventory_id: cell.inventory_id },
        data: {
          quantity: { decrement: cell.requested_qty },
          packaging_quantity: { decrement: cell.requested_qty },
          weight: { decrement: cell.requested_weight },
          status: cell.will_be_empty ? InventoryStatus.DEPLETED : InventoryStatus.AVAILABLE,
        },
      });

      // Create cell assignment for tracking
      await tx.cellAssignment.create({
        data: {
          departure_order_id: newDepartureOrder.departure_order_id,
          cell_id: cell.cell_id,
          assigned_by: orderData.created_by,
          packaging_quantity: cell.requested_qty,
          weight: cell.requested_weight,
          status: "COMPLETED",
        },
      });

      // Update cell status
      if (cell.will_be_empty) {
        await tx.warehouseCell.update({
          where: { id: cell.cell_id },
          data: {
            status: CellStatus.AVAILABLE,
            currentUsage: 0,
            current_packaging_qty: 0,
            current_weight: 0,
          },
        });
      } else {
        await tx.warehouseCell.update({
          where: { id: cell.cell_id },
          data: {
            current_packaging_qty: { decrement: cell.requested_qty },
            current_weight: { decrement: cell.requested_weight },
          },
        });
      }

      // Create inventory log
      await tx.inventoryLog.create({
        data: {
          user_id: orderData.created_by,
          product_id: String(orderData.product_id),
          movement_type: MovementType.DEPARTURE,
          quantity_change: -cell.requested_qty,
          packaging_change: -cell.requested_qty,
          weight_change: -cell.requested_weight,
          departure_order_id: newDepartureOrder.departure_order_id,
          entry_order_product_id: cell.entry_order_product_id,
          warehouse_id: cell.warehouse_id,
          cell_id: cell.cell_id,
          packaging_type: cell.packaging_type,
          packaging_status: cell.packaging_status,
          notes: `Departure: ${cell.requested_qty} packages (${cell.requested_weight}kg) from cell ${cell.cell_reference} for order ${orderData.departure_order_no}`,
        },
      });

      cellAllocations.push({
        cell_reference: cell.cell_reference,
        warehouse_name: cell.warehouse_name,
        entry_order_no: cell.entry_order_no,
        product_code: cell.product_code,
        departed_qty: cell.requested_qty,
        departed_weight: cell.requested_weight,
        remaining_qty: cell.remaining_qty,
        remaining_weight: cell.remaining_weight,
        cell_depleted: cell.will_be_empty,
      });
    }

    return {
      departureOrder: newDepartureOrder,
      departureProducts,
      cellAllocations,
      totals: {
        total_qty: totalQty,
        total_weight: totalWeight,
        cells_affected: validatedCells.length,
        cells_depleted: validatedCells.filter(c => c.will_be_empty).length,
      },
    };
  });
}

/**
 * NEW: Get departure order details with products
 */
async function getDepartureOrderById(departureOrderId) {
  return await prisma.departureOrder.findUnique({
    where: { departure_order_id: departureOrderId },
    include: {
      customer: { select: { name: true } },
      documentType: { select: { name: true } },
      warehouse: { select: { name: true } },
      departureProducts: {
        include: {
          entry_order_product: {
            include: {
              product: {
                select: {
                  product_code: true,
                  name: true,
                },
              },
              entry_order: {
                select: {
                  entry_order_no: true,
                  lot_series: true,
                },
              },
            },
          },
        },
      },
      cellAssignments: {
        include: {
          cell: {
            select: {
              row: true,
              bay: true,
              position: true,
            },
          },
        },
      },
    },
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
  getDepartureOrderById, // NEW
};