const {
  PrismaClient,
  InventoryStatus,
  MovementType,
  CellStatus,
  PackagingType,
  PackagingStatus,
} = require("@prisma/client");
const { toUTC } = require("../../utils/index");
const prisma = new PrismaClient();

function getPackagingTypesFromEnum() {
  return Object.values(PackagingType).map((type) => ({
    name: type,
    value: type,
    displayName: formatEnumName(type),
  }));
}

function getPackagingStatusFromEnum() {
  return Object.values(PackagingStatus).map((status) => ({
    name: status,
    value: status,
    displayName: formatEnumName(status),
  }));
}

// Helper function to format enum names for display
function formatEnumName(enumValue) {
  return enumValue
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// Packaging codes mapping (based on your schema comments)
function getPackagingCodes() {
  const packagingCodes = [];

  Object.values(PackagingType).forEach((type, typeIndex) => {
    Object.values(PackagingStatus).forEach((status, statusIndex) => {
      let baseCode;
      switch (status) {
        case "NORMAL":
          baseCode = 30;
          break;
        case "PARTIALLY_DAMAGED":
          baseCode = 40;
          break;
        case "DAMAGED":
          baseCode = 50;
          break;
        default:
          baseCode = 30;
      }

      packagingCodes.push({
        type,
        status,
        code: baseCode + typeIndex,
        description: `${formatEnumName(type)} - ${formatEnumName(status)}`,
      });
    });
  });

  return packagingCodes;
}

// Dropdown data for Departure form
async function getDepartureFormFields() {
  try {
    const [customers, documentTypes, users, warehouses, labels] =
      await Promise.all([
        prisma.customer.findMany({
          select: { customer_id: true, name: true },
        }),
        prisma.documentType.findMany({
          select: { document_type_id: true, name: true },
        }),
        prisma.user.findMany({
          select: { id: true, first_name: true, last_name: true },
        }),
        prisma.warehouse.findMany({
          select: { warehouse_id: true, name: true },
        }),
        prisma.label.findMany({
          select: { label_id: true, name: true },
        }),
      ]);

    return {
      customers,
      documentTypes,
      users,
      warehouses,
      labels,
      packagingTypes: getPackagingTypesFromEnum(),
      packagingStatuses: getPackagingStatusFromEnum(),
      packagingCodes: getPackagingCodes(),
    };
  } catch (error) {
    console.error("Error in getDepartureFormFields:", error);
    throw new Error(`Failed to fetch departure form fields: ${error.message}`);
  }
}

// Exit options
async function getDepartureExitOptions() {
  try {
    return await prisma.exitOption.findMany();
  } catch (error) {
    console.error("Error in getDepartureExitOptions:", error);
    throw new Error(`Failed to fetch exit options: ${error.message}`);
  }
}

// Get all departure orders
async function getAllDepartureOrders(searchQuery = "", organisationId = null, userRole = null, userOrgId = null) {
  try {
    const whereClause = {};
    
    // Add search filter if provided
    if (searchQuery) {
      whereClause.departure_order_no = { contains: searchQuery, mode: "insensitive" };
    }
    
    // ✅ ROLE-BASED ACCESS CONTROL
    // WAREHOUSE and ADMIN users can see all departure orders
    // Other users (like CUSTOMER) only see orders from their organization
    if (userRole && (userRole === 'WAREHOUSE' || userRole === 'ADMIN')) {
      // ✅ NEW LOGIC: ADMIN and WAREHOUSE users ALWAYS see all orders
      // They ignore any organizationId filter - they get full system visibility
      // No organization filtering for ADMIN/WAREHOUSE users
    } else {
      // Non-warehouse/admin users: filter by their organization or provided organisationId
      const filterOrgId = organisationId || userOrgId;
      if (filterOrgId) {
        whereClause.order = { organisation_id: filterOrgId };
      }
    }

    return await prisma.departureOrder.findMany({
      where: whereClause,
      orderBy: { order: { created_at: "desc" } }, // ✅ FIXED: Sort by creation time (newest first)
      select: {
        departure_order_id: true,
        departure_order_no: true,
        departure_date_time: true,
        destination_point: true,
        transport_type: true,
        carrier_name: true,
        total_volume: true,
        total_weight: true,
        total_pallets: true,
        order_status: true,
        documentType: { select: { name: true } },
        customer: { select: { name: true } },
        order: { 
          select: { 
            created_at: true,
            organisation_id: true,
            organisation: { select: { name: true } }
          } 
        },
        warehouse: { select: { name: true } },
        products: {
          select: {
            departure_order_product_id: true,
            product_code: true,
            lot_series: true,
            requested_quantity: true,
            requested_packages: true,
            requested_pallets: true,
            presentation: true,
            requested_weight: true,
            requested_volume: true,
            unit_price: true,
            total_value: true,
            temperature_requirement: true,
            special_handling: true,
            delivery_instructions: true,
            product: {
              select: {
                product_code: true,
                name: true,
                manufacturer: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllDepartureOrders:", error);
    throw new Error(`Failed to fetch departure orders: ${error.message}`);
  }
}

// ✅ UPDATED: Get products with available inventory from approved allocations
async function getProductsWithInventory(warehouseId = null) {
  try {
    // ✅ NEW: Query from InventoryAllocation with quality_status = APROBADO
    const whereClause = {
      quality_status: "APROBADO", // Only approved inventory for departure
      status: "ACTIVE",
    };

    if (warehouseId) {
      whereClause.cell = {
        warehouse_id: String(warehouseId)
      };
    }

    const allocations = await prisma.inventoryAllocation.findMany({
      where: whereClause,
      include: {
        entry_order_product: {
          include: {
            product: {
              select: {
                product_id: true,
                product_code: true,
                name: true,
                manufacturer: true,
                product_line: { select: { name: true } },
                group: { select: { name: true } },
              },
            },
            entry_order: {
              select: {
                entry_order_no: true,
                registration_date: true,
                creator: {
                  select: {
                    first_name: true,
                    last_name: true,
                    organisation: {
                      select: { name: true }
                    }
                  }
                }
              },
            },
            supplier: {
              select: {
                supplier_id: true,
                name: true,
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
            warehouse: {
              select: {
                warehouse_id: true,
                name: true,
                location: true,
              },
            },
          },
        },
        inventory: {
          select: {
            inventory_id: true,
            current_quantity: true,
            current_package_quantity: true,
            current_weight: true,
            current_volume: true,
            status: true,
            quality_status: true,
          },
        },
        allocator: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: [
        { entry_order_product: { product: { product_code: "asc" } } },
        { cell: { row: "asc" } },
        { cell: { bay: "asc" } },
        { cell: { position: "asc" } },
      ],
    });

    // ✅ Filter allocations that have available inventory
    const availableAllocations = allocations.filter(allocation => {
      const inventory = allocation.inventory[0]; // Should have one inventory record
      return inventory && 
             inventory.status === "AVAILABLE" && 
             inventory.current_quantity > 0;
    });

    // Group by entry order product
    const groupedInventory = availableAllocations.reduce((acc, allocation) => {
      const inventory = allocation.inventory[0];
      const key = `${allocation.entry_order_product_id}_${allocation.entry_order_product.product.product_id}`;

      if (!acc[key]) {
        acc[key] = {
          entry_order_product_id: allocation.entry_order_product_id,
          product_id: allocation.entry_order_product.product.product_id,
          product_code: allocation.entry_order_product.product.product_code,
          product_name: allocation.entry_order_product.product.name,
          manufacturer: allocation.entry_order_product.product.manufacturer,
          product_line: allocation.entry_order_product.product.product_line?.name,
          group_name: allocation.entry_order_product.product.group?.name,
          presentation: allocation.presentation,
          quality_status: allocation.quality_status,
          entry_order_no: allocation.entry_order_product.entry_order.entry_order_no,
          registration_date: allocation.entry_order_product.entry_order.registration_date,
          supplier_name: allocation.entry_order_product.supplier?.name,
          creator_name: `${allocation.entry_order_product.entry_order.creator.first_name || ""} ${allocation.entry_order_product.entry_order.creator.last_name || ""}`.trim(),
          organisation_name: allocation.entry_order_product.entry_order.creator.organisation.name,
          allocated_by: `${allocation.allocator.first_name || ""} ${allocation.allocator.last_name || ""}`.trim(),
          allocated_at: allocation.allocated_at,
          total_quantity: 0,
          total_packages: 0,
          total_weight: 0,
          total_volume: 0,
          locations: [],
          warehouses: new Set(),
        };
      }

      // Add quantities from current inventory
      acc[key].total_quantity += inventory.current_quantity;
      acc[key].total_packages += inventory.current_package_quantity;
      acc[key].total_weight += parseFloat(inventory.current_weight || 0);
      acc[key].total_volume += parseFloat(inventory.current_volume || 0);
      acc[key].warehouses.add(allocation.cell.warehouse.name);

      acc[key].locations.push({
        allocation_id: allocation.allocation_id,
        inventory_id: inventory.inventory_id,
        cell_id: allocation.cell_id,
        cell_reference: `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`,
        warehouse_name: allocation.cell.warehouse.name,
        warehouse_location: allocation.cell.warehouse.location,
        warehouse_id: allocation.cell.warehouse.warehouse_id,
        available_quantity: inventory.current_quantity,
        available_packages: inventory.current_package_quantity,
        available_weight: parseFloat(inventory.current_weight),
        available_volume: inventory.current_volume ? parseFloat(inventory.current_volume) : null,
        product_status: allocation.product_status,
        status_code: allocation.status_code,
        guide_number: allocation.guide_number,
        observations: allocation.observations,
      });

      return acc;
    }, {});

    return Object.values(groupedInventory).map((item) => ({
      ...item,
      warehouses: Array.from(item.warehouses),
      location_count: item.locations.length,
      can_depart: item.total_quantity > 0, // Can only depart if there's available quantity
    }));
  } catch (error) {
    console.error("Error in getProductsWithInventory:", error);
    throw new Error(
      `Failed to fetch products with inventory: ${error.message}`
    );
  }
}

// ✅ UPDATED: Get available cells for a specific entry order product from approved allocations
async function getAvailableCellsForProduct(
  entryOrderProductId,
  warehouseId = null
) {
  try {
    const whereClause = {
      entry_order_product_id: String(entryOrderProductId),
      quality_status: "APROBADO", // Only approved inventory for departure
      status: "ACTIVE",
    };

    if (warehouseId) {
      whereClause.cell = {
        warehouse_id: String(warehouseId)
      };
    }

    const allocations = await prisma.inventoryAllocation.findMany({
      where: whereClause,
      include: {
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
                location: true,
              },
            },
          },
        },
        entry_order_product: {
          include: {
            product: {
              select: {
                product_id: true,
                product_code: true,
                name: true,
                manufacturer: true,
              },
            },
            entry_order: {
              select: {
                entry_order_id: true,
                entry_order_no: true,
                registration_date: true,
                entry_date_time: true,
              },
            },
            supplier: {
              select: {
                supplier_id: true,
                name: true,
              },
            },
          },
        },
        inventory: {
          select: {
            inventory_id: true,
            current_quantity: true,
            current_package_quantity: true,
            current_weight: true,
            current_volume: true,
            status: true,
            quality_status: true,
          },
        },
        allocator: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: [
        { cell: { row: "asc" } },
        { cell: { bay: "asc" } },
        { cell: { position: "asc" } },
      ],
    });

    // ✅ Filter allocations that have available inventory and return detailed info
    return allocations
      .filter(allocation => {
        const inventory = allocation.inventory[0];
        return inventory && 
               inventory.status === "AVAILABLE" && 
               inventory.current_quantity > 0;
      })
      .map((allocation) => {
        const inventory = allocation.inventory[0];
        return {
          allocation_id: allocation.allocation_id,
          inventory_id: inventory.inventory_id,
          cell_id: allocation.cell_id,
          cell_reference: `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`,
          warehouse_name: allocation.cell.warehouse.name,
          warehouse_location: allocation.cell.warehouse.location,
          warehouse_id: allocation.cell.warehouse.warehouse_id,
          product_code: allocation.entry_order_product.product.product_code,
          product_name: allocation.entry_order_product.product.name,
          manufacturer: allocation.entry_order_product.product.manufacturer,
          supplier_name: allocation.entry_order_product.supplier?.name,
          presentation: allocation.presentation,
          product_status: allocation.product_status,
          status_code: allocation.status_code,
          quality_status: allocation.quality_status,
          
          // Available quantities (current inventory)
          available_quantity: inventory.current_quantity,
          available_packages: inventory.current_package_quantity,
          available_weight: parseFloat(inventory.current_weight),
          available_volume: inventory.current_volume ? parseFloat(inventory.current_volume) : null,
          
          // Allocation details
          original_quantity: allocation.inventory_quantity,
          original_packages: allocation.package_quantity,
          original_weight: parseFloat(allocation.weight_kg),
          guide_number: allocation.guide_number,
          observations: allocation.observations,
          allocated_at: allocation.allocated_at,
          allocated_by: `${allocation.allocator.first_name || ""} ${allocation.allocator.last_name || ""}`.trim(),
          
          // Entry order details
          entry_order_no: allocation.entry_order_product.entry_order.entry_order_no,
          registration_date: allocation.entry_order_product.entry_order.registration_date,
          entry_date_time: allocation.entry_order_product.entry_order.entry_date_time,
        };
      });
  } catch (error) {
    console.error("Error in getAvailableCellsForProduct:", error);
    throw new Error(`Failed to fetch available cells: ${error.message}`);
  }
}

// ✅ UPDATED: Validate selected inventory with allocation-based system
async function validateSelectedCell(
  inventory_id,
  requested_qty,
  requested_weight
) {
  // ✅ NEW: Find inventory through allocation system
  const inventory = await prisma.inventory.findUnique({
    where: { inventory_id },
    include: {
      allocation: {
        include: {
          entry_order_product: {
            include: {
              product: {
                select: {
                  product_id: true,
                  product_code: true,
                  name: true,
                },
              },
              entry_order: {
                select: {
                  entry_order_no: true,
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
  });

  if (!inventory) {
    throw new Error(`Inventory not found`);
  }

  if (!inventory.allocation) {
    throw new Error(`Inventory allocation not found`);
  }

  const allocation = inventory.allocation;
  const cell = allocation.cell;

  if (inventory.status !== "AVAILABLE") {
    throw new Error(
      `Inventory in cell ${cell.row}.${cell.bay}.${cell.position} is not available (Status: ${inventory.status})`
    );
  }

  // ✅ Check quality status for departure eligibility
  if (inventory.quality_status !== "APROBADO" || allocation.quality_status !== "APROBADO") {
    throw new Error(
      `Inventory in cell ${cell.row}.${cell.bay}.${cell.position} has not been approved for departure (Status: ${inventory.quality_status})`
    );
  }

  if (inventory.current_package_quantity < requested_qty) {
    throw new Error(
      `Insufficient quantity in cell ${cell.row}.${cell.bay}.${cell.position}. Available: ${inventory.current_package_quantity}, Requested: ${requested_qty}`
    );
  }

  if (parseFloat(inventory.current_weight) < requested_weight) {
    throw new Error(
      `Insufficient weight in cell ${cell.row}.${cell.bay}.${cell.position}. Available: ${inventory.current_weight}kg, Requested: ${requested_weight}kg`
    );
  }

  return {
    inventory_id: inventory.inventory_id,
    allocation_id: allocation.allocation_id,
    cell_id: allocation.cell_id,
    cell_reference: `${cell.row}.${String(cell.bay).padStart(2, "0")}.${String(cell.position).padStart(2, "0")}`,
    warehouse_id: cell.warehouse.warehouse_id,
    warehouse_name: cell.warehouse.name,
    entry_order_product_id: allocation.entry_order_product_id,
    entry_order_no: allocation.entry_order_product.entry_order.entry_order_no,
    product_id: allocation.entry_order_product.product.product_id,
    product_code: allocation.entry_order_product.product.product_code,
    product_name: allocation.entry_order_product.product.name,
    presentation: allocation.presentation,
    product_status: allocation.product_status,
    status_code: allocation.status_code,
    quality_status: allocation.quality_status,
    requested_qty,
    requested_weight,
    remaining_qty: inventory.current_package_quantity - requested_qty,
    remaining_weight: parseFloat(inventory.current_weight) - requested_weight,
    will_be_empty: inventory.current_package_quantity - requested_qty <= 0,
    
    // Additional allocation info
    guide_number: allocation.guide_number,
    observations: allocation.observations,
    original_quantity: allocation.inventory_quantity,
    original_weight: parseFloat(allocation.weight_kg),
  };
}

// Create Departure order with product-based inventory tracking
async function createDepartureOrder(departureData) {
  const { inventory_selections, ...orderData } = departureData;

  if (!inventory_selections || inventory_selections.length === 0) {
    throw new Error("At least one inventory selection is required");
  }

  // ✅ FIXED: Enhanced validation to include packaging_code
  const validatedCells = [];
  for (const selection of inventory_selections) {
    const validated = await validateSelectedCell(
      selection.inventory_id,
      parseInt(selection.requested_qty),
      parseFloat(selection.requested_weight)
    );

    // ✅ FIXED: Add packaging_code from selection to validated cell
    validated.packaging_code = selection.packaging_code || 37; // Default to 37 if not provided
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
    const totalQty = validatedCells.reduce(
      (sum, cell) => sum + cell.requested_qty,
      0
    );
    const totalWeight = validatedCells.reduce(
      (sum, cell) => sum + cell.requested_weight,
      0
    );

    // 3. Validate foreign key references before creating departure order
    let validDocumentTypeId = null;
    if (orderData.document_type_id) {
      const documentType = await tx.departureDocumentType.findUnique({
        where: { document_type_id: String(orderData.document_type_id) }
      });
      if (documentType) {
        validDocumentTypeId = String(orderData.document_type_id);
      }
    }

    // Validate customer exists
    const customer = await tx.customer.findUnique({
      where: { customer_id: String(orderData.customer_id) }
    });
    if (!customer) {
      throw new Error(`Customer with ID ${orderData.customer_id} not found`);
    }

    // Validate warehouse exists
    const warehouse = await tx.warehouse.findUnique({
      where: { warehouse_id: String(orderData.warehouse_id) }
    });
    if (!warehouse) {
      throw new Error(`Warehouse with ID ${orderData.warehouse_id} not found`);
    }

    // Validate user exists
    const user = await tx.user.findUnique({
      where: { id: String(orderData.created_by) }
    });
    if (!user) {
      throw new Error(`User with ID ${orderData.created_by} not found`);
    }

    // Create departure order with validated IDs (✅ FIXED: Remove order_id, use relationships only)
    const newDepartureOrder = await tx.departureOrder.create({
      data: {
        departure_order_no: orderData.departure_order_no,
        registration_date: toUTC(orderData.registration_date) || new Date(),
        document_date: toUTC(orderData.document_date),
        departure_date_time: toUTC(orderData.departure_date), // ✅ FIXED: Frontend sends departure_date
        destination_point: orderData.arrival_point || null,  // ✅ FIXED: Keep as arrival_point (frontend sends this)
        transport_type: orderData.transport_type || null,    // ✅ FIXED: Match frontend field name
        carrier_name: orderData.carrier_name || null,       // ✅ FIXED: Match frontend field name
        total_volume: orderData.total_volume ? parseFloat(orderData.total_volume) : null,
        total_weight: totalWeight,
        total_pallets: orderData.total_pallets ? parseInt(orderData.total_pallets) : null, // ✅ FIXED: Match frontend field name
        observation: orderData.observations || null,        // ✅ FIXED: Frontend sends observations (plural)
        order_status: "PENDING",
        // ✅ FIXED: Use explicit connect syntax for relations
        customer: { 
          connect: { customer_id: String(orderData.customer_id) }
        },
        documentType: validDocumentTypeId ? {
          connect: { document_type_id: validDocumentTypeId }
        } : undefined,
        creator: {
          connect: { id: String(orderData.created_by) }
        },
        order: {
          connect: { order_id: newOrder.order_id }
        },
        warehouse: {
          connect: { warehouse_id: String(orderData.warehouse_id) }
        },
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

          // ✅ UPDATED: Create departure products with enhanced allocation data
      const departureProducts = [];
      const entryToDepartureProductMap = {}; // Map entry_order_product_id to departure_order_product_id

      for (const [entryOrderProductId, group] of Object.entries(productGroups)) {
        const departureProduct = await tx.departureOrderProduct.create({
          data: {
            departure_order_id: newDepartureOrder.departure_order_id,
            product_code: group.cells[0].product_code,
            product_id: group.cells[0].product_id,
            lot_series: group.cells[0].lot_series || null,
            requested_quantity: group.total_qty,
            requested_packages: group.total_qty,
            requested_pallets: orderData.total_pallets ? parseInt(orderData.total_pallets) : null, // ✅ FIXED: Match frontend field
            presentation: group.cells[0].presentation || "CAJA",
            requested_weight: group.total_weight,
            requested_volume: parseFloat(orderData.total_volume) || null,
            unit_price: orderData.unit_price ? parseFloat(orderData.unit_price) : null, // ✅ FIXED: Match frontend field
            total_value: orderData.unit_price ? parseFloat(orderData.unit_price) * group.total_qty : null, // ✅ FIXED: Match frontend field
            temperature_requirement: "AMBIENTE",
            special_handling: orderData.special_handling || null, // ✅ FIXED: Match frontend field
            delivery_instructions: orderData.delivery_instructions || null, // ✅ FIXED: Match frontend field
          },
        });

        departureProducts.push(departureProduct);

        // ✅ Store the mapping for inventory logs
        entryToDepartureProductMap[entryOrderProductId] =
          departureProduct.departure_order_product_id;
      }

    // 5. ✅ UPDATED: Update inventory using the new allocation-based system
    const cellAllocations = [];
    for (const cell of validatedCells) {
      // Update inventory (DECREMENT - removing from warehouse)
      await tx.inventory.update({
        where: { inventory_id: cell.inventory_id },
        data: {
          current_quantity: { decrement: cell.requested_qty },
          current_package_quantity: { decrement: cell.requested_qty },
          current_weight: { decrement: cell.requested_weight },
          status: cell.will_be_empty ? "DEPLETED" : "AVAILABLE",
        },
      });

      // Create cell assignment with packaging_code
      await tx.cellAssignment.create({
        data: {
          departure_order_id: newDepartureOrder.departure_order_id,
          cell_id: cell.cell_id,
          assigned_by: orderData.created_by,
          packaging_quantity: cell.requested_qty,
          weight: cell.requested_weight,
          packaging_code: cell.packaging_code,
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

      // ✅ FIXED: Create inventory log with departure_order_product_id
      await tx.inventoryLog.create({
        data: {
          user_id: orderData.created_by,
          product_id: cell.product_id,
          movement_type: MovementType.DEPARTURE,
          quantity_change: -cell.requested_qty,
          package_change: -cell.requested_qty,
          weight_change: -cell.requested_weight,
          departure_order_id: newDepartureOrder.departure_order_id,
          departure_order_product_id:
            entryToDepartureProductMap[cell.entry_order_product_id], // ✅ FIXED: Add this
          entry_order_product_id: cell.entry_order_product_id,
          warehouse_id: cell.warehouse_id,
          cell_id: cell.cell_id,
          product_status: cell.product_status || "PAL_NORMAL",
          status_code: cell.status_code || 37,
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
        cells_depleted: validatedCells.filter((c) => c.will_be_empty).length,
      },
    };
  });
}

// Get departure order details with products
async function getDepartureOrderById(departureOrderId) {
  try {
    return await prisma.departureOrder.findUnique({
      where: { departure_order_id: departureOrderId },
      include: {
        customer: { select: { name: true } },
        documentType: { select: { name: true } },
        warehouse: { select: { name: true } },
        products: {
          include: {
            product: {
              select: {
                product_code: true,
                name: true,
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
  } catch (error) {
    console.error("Error in getDepartureOrderById:", error);
    throw new Error(`Failed to fetch departure order: ${error.message}`);
  }
}

// ✅ NEW: Get departure inventory summary by warehouse
async function getDepartureInventorySummary(warehouseId = null) {
  try {
    const whereClause = {
      quality_status: "APROBADO", // Only approved inventory
      status: "ACTIVE",
    };

    if (warehouseId) {
      whereClause.cell = {
        warehouse_id: String(warehouseId)
      };
    }

    const allocations = await prisma.inventoryAllocation.findMany({
      where: whereClause,
      include: {
        entry_order_product: {
          include: {
            product: {
              select: {
                product_code: true,
                name: true,
                product_line: { select: { name: true } },
                group: { select: { name: true } },
              },
            },
            entry_order: {
              select: {
                entry_order_no: true,
                registration_date: true,
              },
            },
          },
        },
        cell: {
          select: {
            warehouse: {
              select: {
                warehouse_id: true,
                name: true,
              },
            },
          },
        },
        inventory: {
          select: {
            current_quantity: true,
            current_package_quantity: true,
            current_weight: true,
            current_volume: true,
            status: true,
          },
        },
      },
    });

    // Filter available inventory and create summary
    const availableAllocations = allocations.filter(allocation => {
      const inventory = allocation.inventory[0];
      return inventory && 
             inventory.status === "AVAILABLE" && 
             inventory.current_quantity > 0;
    });

    // Group by warehouse
    const warehouseSummary = availableAllocations.reduce((acc, allocation) => {
      const inventory = allocation.inventory[0];
      const warehouseId = allocation.cell.warehouse.warehouse_id;
      const warehouseName = allocation.cell.warehouse.name;

      if (!acc[warehouseId]) {
        acc[warehouseId] = {
          warehouse_id: warehouseId,
          warehouse_name: warehouseName,
          total_products: 0,
          total_entries: 0,
          total_quantity: 0,
          total_packages: 0,
          total_weight: 0,
          total_volume: 0,
          product_lines: new Set(),
          entry_orders: new Set(),
        };
      }

      acc[warehouseId].total_quantity += inventory.current_quantity;
      acc[warehouseId].total_packages += inventory.current_package_quantity;
      acc[warehouseId].total_weight += parseFloat(inventory.current_weight || 0);
      acc[warehouseId].total_volume += parseFloat(inventory.current_volume || 0);
      acc[warehouseId].product_lines.add(allocation.entry_order_product.product.product_line?.name || 'Unknown');
      acc[warehouseId].entry_orders.add(allocation.entry_order_product.entry_order.entry_order_no);

      return acc;
    }, {});

    // Convert to array and format
    const summary = Object.values(warehouseSummary).map(warehouse => ({
      ...warehouse,
      product_lines: Array.from(warehouse.product_lines),
      entry_orders: Array.from(warehouse.entry_orders),
      total_products: Array.from(warehouse.entry_orders).length,
      total_entries: Array.from(warehouse.entry_orders).length,
    }));

    // Overall totals
    const overallTotals = {
      total_warehouses: summary.length,
      total_approved_items: availableAllocations.length,
      total_quantity: summary.reduce((sum, w) => sum + w.total_quantity, 0),
      total_packages: summary.reduce((sum, w) => sum + w.total_packages, 0),
      total_weight: summary.reduce((sum, w) => sum + w.total_weight, 0),
      total_volume: summary.reduce((sum, w) => sum + w.total_volume, 0),
      total_entry_orders: [...new Set(availableAllocations.map(a => a.entry_order_product.entry_order.entry_order_no))].length,
    };

    return {
      summary: summary,
      totals: overallTotals,
      by_warehouse: warehouseId ? summary.filter(w => w.warehouse_id === warehouseId) : summary,
    };
  } catch (error) {
    console.error("Error in getDepartureInventorySummary:", error);
    throw new Error(`Failed to fetch departure inventory summary: ${error.message}`);
  }
}

// ✅ NEW: Get entry orders that have approved inventory available for departure
async function getEntryOrdersForDeparture(warehouseId = null) {
  try {
    const whereClause = {
      quality_status: "APROBADO", // Only approved inventory
      status: "ACTIVE",
    };

    if (warehouseId) {
      whereClause.cell = {
        warehouse_id: String(warehouseId)
      };
    }

    const allocations = await prisma.inventoryAllocation.findMany({
      where: whereClause,
      include: {
        entry_order_product: {
          include: {
            entry_order: {
              select: {
                entry_order_id: true,
                entry_order_no: true,
                registration_date: true,
                entry_date_time: true,
                document_date: true,
                observation: true,
                creator: {
                  select: {
                    first_name: true,
                    last_name: true,
                    organisation: {
                      select: { name: true }
                    }
                  }
                },
                origin: { select: { name: true } },
                documentType: { select: { name: true } },
              },
            },
          },
        },
        inventory: {
          select: {
            current_quantity: true,
            current_package_quantity: true,
            current_weight: true,
            status: true,
          },
        },
        cell: {
          select: {
            warehouse: {
              select: {
                warehouse_id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Filter allocations with available inventory
    const availableAllocations = allocations.filter(allocation => {
      const inventory = allocation.inventory[0];
      return inventory && 
             inventory.status === "AVAILABLE" && 
             inventory.current_quantity > 0;
    });

    // Group by entry order
    const groupedByEntryOrder = availableAllocations.reduce((acc, allocation) => {
      const entryOrder = allocation.entry_order_product.entry_order;
      const inventory = allocation.inventory[0];
      
      if (!acc[entryOrder.entry_order_id]) {
        acc[entryOrder.entry_order_id] = {
          entry_order_id: entryOrder.entry_order_id,
          entry_order_no: entryOrder.entry_order_no,
          registration_date: entryOrder.registration_date,
          entry_date_time: entryOrder.entry_date_time,
          document_date: entryOrder.document_date,
          observation: entryOrder.observation,
          creator_name: `${entryOrder.creator.first_name || ""} ${entryOrder.creator.last_name || ""}`.trim(),
          organisation_name: entryOrder.creator.organisation.name,
          origin_name: entryOrder.origin?.name,
          document_type_name: entryOrder.documentType?.name,
          available_products: 0,
          total_quantity: 0,
          total_packages: 0,
          total_weight: 0,
          warehouses: new Set(),
        };
      }

      acc[entryOrder.entry_order_id].available_products += 1;
      acc[entryOrder.entry_order_id].total_quantity += inventory.current_quantity;
      acc[entryOrder.entry_order_id].total_packages += inventory.current_package_quantity;
      acc[entryOrder.entry_order_id].total_weight += parseFloat(inventory.current_weight || 0);
      acc[entryOrder.entry_order_id].warehouses.add(allocation.cell.warehouse.name);

      return acc;
    }, {});

    return Object.values(groupedByEntryOrder).map(entryOrder => ({
      ...entryOrder,
      warehouses: Array.from(entryOrder.warehouses),
      can_depart: entryOrder.available_products > 0,
    }));
  } catch (error) {
    console.error("Error in getEntryOrdersForDeparture:", error);
    throw new Error(`Failed to fetch entry orders for departure: ${error.message}`);
  }
}

// ✅ UPDATED: Get products from a specific entry order for departure
async function getProductsByEntryOrder(entryOrderId, warehouseId = null) {
  try {
    const whereClause = {
      entry_order_product: {
        entry_order_id: String(entryOrderId)
      },
      quality_status: "APROBADO", // Only approved inventory
      status: "ACTIVE",
    };

    if (warehouseId) {
      whereClause.cell = {
        warehouse_id: String(warehouseId)
      };
    }

    const allocations = await prisma.inventoryAllocation.findMany({
      where: whereClause,
      include: {
        entry_order_product: {
          select: {
            entry_order_product_id: true,
            // ✅ Scalar fields that need to be selected
            lot_series: true,
            manufacturing_date: true,
            expiration_date: true,
            product: {
              select: {
                product_id: true,
                product_code: true,
                name: true,
                manufacturer: true,
                product_line: { select: { name: true } },
                group: { select: { name: true } },
              },
            },
            entry_order: {
              select: {
                entry_order_id: true,
                entry_order_no: true,
                registration_date: true,
                entry_date_time: true,
                document_date: true,
                uploaded_documents: true, // ✅ Documents
              },
            },
            supplier: {
              select: {
                supplier_id: true,
                name: true,
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
            warehouse: {
              select: {
                warehouse_id: true,
                name: true,
                location: true,
              },
            },
          },
        },
        inventory: {
          select: {
            inventory_id: true,
            current_quantity: true,
            current_package_quantity: true,
            current_weight: true,
            current_volume: true,
            status: true,
            quality_status: true,
          },
        },
        allocator: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: [
        { entry_order_product: { product: { product_code: "asc" } } },
        { cell: { row: "asc" } },
        { cell: { bay: "asc" } },
        { cell: { position: "asc" } },
      ],
    });

    // Filter allocations with available inventory
    const availableAllocations = allocations.filter(allocation => {
      const inventory = allocation.inventory[0];
      return inventory && 
             inventory.status === "AVAILABLE" && 
             inventory.current_quantity > 0;
    });

    // Transform to include all required fields
    return availableAllocations.map(allocation => {
      const inventory = allocation.inventory[0];
      const entryOrderProduct = allocation.entry_order_product;
      const product = entryOrderProduct.product;
      const entryOrder = entryOrderProduct.entry_order;
      
      return {
        // ✅ Core identification
        allocation_id: allocation.allocation_id,
        inventory_id: inventory.inventory_id,
        entry_order_product_id: allocation.entry_order_product_id,
        
        // ✅ Required fields as per user specification
        entry_order_no: entryOrder.entry_order_no, // Entry Order Number
        product_code: product.product_code, // Product Code
        product_name: product.name, // Product Name
        lot_number: entryOrderProduct.lot_series || entryOrder.lot_series, // LOT Number
        quantity_inventory_units: inventory.current_quantity, // Quantity Inventory Units
        packaging_quantity: inventory.current_package_quantity, // Packaging Quantity
        packaging_type: allocation.presentation, // Packaging Type
        cell_position: `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`, // Pallets/Cell Position
        entry_date_time: entryOrder.entry_date_time, // Entry Date & Time
        documents_uploaded: entryOrder.uploaded_documents, // Documents Upload
        
        // ✅ Additional product details
        manufacturer: product.manufacturer,
        product_line: product.product_line?.name,
        group_name: product.group?.name,
        supplier_name: entryOrderProduct.supplier?.name,
        
        // ✅ Inventory details
        available_weight: parseFloat(inventory.current_weight),
        available_volume: inventory.current_volume ? parseFloat(inventory.current_volume) : null,
        quality_status: allocation.quality_status,
        product_status: allocation.product_status,
        status_code: allocation.status_code,
        
        // ✅ Location details
        cell_id: allocation.cell_id,
        warehouse_id: allocation.cell.warehouse.warehouse_id,
        warehouse_name: allocation.cell.warehouse.name,
        warehouse_location: allocation.cell.warehouse.location,
        
        // ✅ Allocation tracking
        guide_number: allocation.guide_number,
        observations: allocation.observations,
        allocated_at: allocation.allocated_at,
        allocated_by: `${allocation.allocator.first_name || ""} ${allocation.allocator.last_name || ""}`.trim(),
        
        // ✅ Dates
        manufacturing_date: entryOrderProduct.manufacturing_date,
        expiration_date: entryOrderProduct.expiration_date,
        registration_date: entryOrder.registration_date,
        document_date: entryOrder.document_date,
        
        // ✅ Selection helpers
        can_depart: true,
        max_selectable_quantity: inventory.current_quantity,
        max_selectable_packages: inventory.current_package_quantity,
        max_selectable_weight: parseFloat(inventory.current_weight),
      };
    });
  } catch (error) {
    console.error("Error in getProductsByEntryOrder:", error);
    throw new Error(`Failed to fetch products by entry order: ${error.message}`);
  }
}

// ✅ NEW: Generate next departure order number
async function getCurrentDepartureOrderNo() {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const lastOrder = await prisma.departureOrder.findFirst({
    where: {
      departure_order_no: { startsWith: `DEP-${currentYear}` },
    },
    orderBy: { departure_date_time: "desc" },
  });

  let nextCount = 1;
  if (lastOrder?.departure_order_no) {
    const parts = lastOrder.departure_order_no.split("-");
    if (parts.length === 3 && !isNaN(parts[2])) {
      nextCount = parseInt(parts[2]) + 1;
    }
  }

  return `DEP-${currentYear}-${String(nextCount).padStart(4, "0")}`;
}

module.exports = {
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
  getProductsWithInventory,
  getAvailableCellsForProduct,
  validateSelectedCell,
  getDepartureOrderById,
  getDepartureInventorySummary,
  // ✅ NEW: Entry Order-centric flow
  getEntryOrdersForDeparture,
  getProductsByEntryOrder,
  getCurrentDepartureOrderNo,
};
