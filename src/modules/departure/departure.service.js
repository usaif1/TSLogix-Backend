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
    if (userRole && (userRole === 'WAREHOUSE_INCHARGE' || userRole === 'ADMIN')) {
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

// ✅ UPDATED: Get products with available inventory from approved allocations (FIFO approach)
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
                entry_date_time: true, // ✅ FIFO: Sort by entry date
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
        { entry_order_product: { entry_order: { entry_date_time: "asc" } } }, // ✅ FIFO: Oldest first
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

    // ✅ NEW: Group by product (not entry order) with FIFO locations
    const groupedInventory = availableAllocations.reduce((acc, allocation) => {
      const inventory = allocation.inventory[0];
      const product = allocation.entry_order_product.product;
      const key = product.product_id; // Group by product_id only

      if (!acc[key]) {
        acc[key] = {
          product_id: product.product_id,
          product_code: product.product_code,
          product_name: product.name,
          manufacturer: product.manufacturer,
          product_line: product.product_line?.name,
          group_name: product.group?.name,
          total_quantity: 0,
          total_packages: 0,
          total_weight: 0,
          total_volume: 0,
          entry_orders: new Set(),
          suppliers: new Set(),
          warehouses: new Set(),
          fifo_locations: [], // ✅ FIFO sorted locations
        };
      }

      // Add quantities from current inventory
      acc[key].total_quantity += inventory.current_quantity;
      acc[key].total_packages += inventory.current_package_quantity;
      acc[key].total_weight += parseFloat(inventory.current_weight || 0);
      acc[key].total_volume += parseFloat(inventory.current_volume || 0);
      acc[key].entry_orders.add(allocation.entry_order_product.entry_order.entry_order_no);
      acc[key].suppliers.add(allocation.entry_order_product.supplier?.name || 'N/A');
      acc[key].warehouses.add(allocation.cell.warehouse.name);

      // ✅ Add location with FIFO data (already sorted by entry_date_time)
      acc[key].fifo_locations.push({
        allocation_id: allocation.allocation_id,
        inventory_id: inventory.inventory_id,
        entry_order_product_id: allocation.entry_order_product_id,
        cell_id: allocation.cell_id,
        cell_reference: `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`,
        warehouse_name: allocation.cell.warehouse.name,
        warehouse_location: allocation.cell.warehouse.location,
        warehouse_id: allocation.cell.warehouse.warehouse_id,
        entry_order_no: allocation.entry_order_product.entry_order.entry_order_no,
        entry_date_time: allocation.entry_order_product.entry_order.entry_date_time, // ✅ FIFO key
        supplier_name: allocation.entry_order_product.supplier?.name,
        presentation: allocation.presentation,
        available_quantity: inventory.current_quantity,
        available_packages: inventory.current_package_quantity,
        available_weight: parseFloat(inventory.current_weight),
        available_volume: inventory.current_volume ? parseFloat(inventory.current_volume) : null,
        product_status: allocation.product_status,
        status_code: allocation.status_code,
        guide_number: allocation.guide_number,
        observations: allocation.observations,
        allocated_by: `${allocation.allocator.first_name || ""} ${allocation.allocator.last_name || ""}`.trim(),
        allocated_at: allocation.allocated_at,
      });

      return acc;
    }, {});

    return Object.values(groupedInventory).map((item) => ({
      ...item,
      entry_orders: Array.from(item.entry_orders),
      suppliers: Array.from(item.suppliers),
      warehouses: Array.from(item.warehouses),
      location_count: item.fifo_locations.length,
      oldest_entry_date: item.fifo_locations[0]?.entry_date_time, // ✅ FIFO: Oldest entry
      newest_entry_date: item.fifo_locations[item.fifo_locations.length - 1]?.entry_date_time,
      can_depart: item.total_quantity > 0,
    }));
  } catch (error) {
    console.error("Error in getProductsWithInventory:", error);
    throw new Error(
      `Failed to fetch products with inventory: ${error.message}`
    );
  }
}

// ✅ NEW: Get FIFO locations for a specific product
async function getFifoLocationsForProduct(productId, warehouseId = null) {
  try {
    const whereClause = {
      entry_order_product: {
        product_id: String(productId)
      },
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
              },
            },
            entry_order: {
              select: {
                entry_order_id: true,
                entry_order_no: true,
                entry_date_time: true, // ✅ FIFO key
                registration_date: true,
                document_date: true,
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
        { entry_order_product: { entry_order: { entry_date_time: "asc" } } }, // ✅ FIFO: Oldest first
        { cell: { row: "asc" } },
        { cell: { bay: "asc" } },
        { cell: { position: "asc" } },
      ],
    });

    // ✅ Filter allocations that have available inventory and return FIFO sorted
    return allocations
      .filter(allocation => {
        const inventory = allocation.inventory[0];
        return inventory && 
               inventory.status === "AVAILABLE" && 
               inventory.current_quantity > 0;
      })
      .map((allocation) => {
        const inventory = allocation.inventory[0];
        const entryOrder = allocation.entry_order_product.entry_order;
        
        return {
          allocation_id: allocation.allocation_id,
          inventory_id: inventory.inventory_id,
          entry_order_product_id: allocation.entry_order_product_id,
          cell_id: allocation.cell_id,
          cell_reference: `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`,
          warehouse_name: allocation.cell.warehouse.name,
          warehouse_location: allocation.cell.warehouse.location,
          warehouse_id: allocation.cell.warehouse.warehouse_id,
          
          // ✅ Product details
          product_code: allocation.entry_order_product.product.product_code,
          product_name: allocation.entry_order_product.product.name,
          manufacturer: allocation.entry_order_product.product.manufacturer,
          supplier_name: allocation.entry_order_product.supplier?.name,
          presentation: allocation.presentation,
          product_status: allocation.product_status,
          status_code: allocation.status_code,
          quality_status: allocation.quality_status,
          
          // ✅ FIFO details
          entry_order_no: entryOrder.entry_order_no,
          entry_date_time: entryOrder.entry_date_time, // ✅ FIFO sort key
          registration_date: entryOrder.registration_date,
          document_date: entryOrder.document_date,
          fifo_rank: allocation.entry_order_product.entry_order.entry_date_time, // For sorting
          
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
        };
      });
  } catch (error) {
    console.error("Error in getFifoLocationsForProduct:", error);
    throw new Error(`Failed to fetch FIFO locations: ${error.message}`);
  }
}

// ✅ NEW: Get suggested FIFO allocation for a product (automatic FIFO selection)
async function getSuggestedFifoAllocation(productId, requestedQuantity, requestedWeight = null, warehouseId = null) {
  try {
    const fifoLocations = await getFifoLocationsForProduct(productId, warehouseId);
    
    if (fifoLocations.length === 0) {
      throw new Error(`No approved inventory found for product ${productId}`);
    }

    const suggestions = [];
    let remainingQuantity = requestedQuantity;
    let remainingWeight = requestedWeight;

    // ✅ FIFO allocation logic
    for (const location of fifoLocations) {
      if (remainingQuantity <= 0) break;

      const allocateQty = Math.min(remainingQuantity, location.available_packages);
      const allocateWeight = remainingWeight 
        ? Math.min(remainingWeight, location.available_weight)
        : (allocateQty / location.available_packages) * location.available_weight;

      suggestions.push({
        inventory_id: location.inventory_id,
        allocation_id: location.allocation_id,
        entry_order_product_id: location.entry_order_product_id,
        cell_id: location.cell_id,
        cell_reference: location.cell_reference,
        warehouse_name: location.warehouse_name,
        entry_order_no: location.entry_order_no,
        entry_date_time: location.entry_date_time,
        product_code: location.product_code,
        product_name: location.product_name,
        requested_qty: allocateQty,
        requested_weight: allocateWeight,
        available_qty: location.available_packages,
        available_weight: location.available_weight,
        fifo_rank: location.entry_date_time,
        will_be_empty: allocateQty >= location.available_packages,
      });

      remainingQuantity -= allocateQty;
      if (remainingWeight) remainingWeight -= allocateWeight;
    }

    const totalAllocated = suggestions.reduce((sum, s) => sum + s.requested_qty, 0);
    const totalWeightAllocated = suggestions.reduce((sum, s) => sum + s.requested_weight, 0);

    return {
      product_id: productId,
      requested_quantity: requestedQuantity,
      allocated_quantity: totalAllocated,
      requested_weight: requestedWeight,
      allocated_weight: totalWeightAllocated,
      fully_allocated: remainingQuantity <= 0,
      remaining_quantity: Math.max(0, remainingQuantity),
      remaining_weight: requestedWeight ? Math.max(0, remainingWeight) : null,
      suggestions: suggestions,
      locations_used: suggestions.length,
      oldest_entry_date: suggestions[0]?.entry_date_time,
      newest_entry_date: suggestions[suggestions.length - 1]?.entry_date_time,
    };
  } catch (error) {
    console.error("Error in getSuggestedFifoAllocation:", error);
    throw new Error(`Failed to generate FIFO allocation: ${error.message}`);
  }
}

// ✅ UPDATED: Get departure inventory summary by warehouse (product-wise)
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
                product_id: true,
                product_code: true,
                name: true,
                product_line: { select: { name: true } },
                group: { select: { name: true } },
              },
            },
            entry_order: {
              select: {
                entry_order_no: true,
                entry_date_time: true,
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

    // ✅ Group by warehouse and product
    const warehouseSummary = availableAllocations.reduce((acc, allocation) => {
      const inventory = allocation.inventory[0];
      const warehouseId = allocation.cell.warehouse.warehouse_id;
      const warehouseName = allocation.cell.warehouse.name;
      const product = allocation.entry_order_product.product;

      if (!acc[warehouseId]) {
        acc[warehouseId] = {
          warehouse_id: warehouseId,
          warehouse_name: warehouseName,
          unique_products: new Set(),
          total_quantity: 0,
          total_packages: 0,
          total_weight: 0,
          total_volume: 0,
          product_lines: new Set(),
          entry_orders: new Set(),
          oldest_entry: null,
          newest_entry: null,
        };
      }

      acc[warehouseId].unique_products.add(product.product_id);
      acc[warehouseId].total_quantity += inventory.current_quantity;
      acc[warehouseId].total_packages += inventory.current_package_quantity;
      acc[warehouseId].total_weight += parseFloat(inventory.current_weight || 0);
      acc[warehouseId].total_volume += parseFloat(inventory.current_volume || 0);
      acc[warehouseId].product_lines.add(product.product_line?.name || 'Unknown');
      acc[warehouseId].entry_orders.add(allocation.entry_order_product.entry_order.entry_order_no);

      // ✅ Track FIFO dates
      const entryDate = new Date(allocation.entry_order_product.entry_order.entry_date_time);
      if (!acc[warehouseId].oldest_entry || entryDate < acc[warehouseId].oldest_entry) {
        acc[warehouseId].oldest_entry = entryDate;
      }
      if (!acc[warehouseId].newest_entry || entryDate > acc[warehouseId].newest_entry) {
        acc[warehouseId].newest_entry = entryDate;
      }

      return acc;
    }, {});

    // Convert to array and format
    const summary = Object.values(warehouseSummary).map(warehouse => ({
      ...warehouse,
      unique_products: warehouse.unique_products.size,
      product_lines: Array.from(warehouse.product_lines),
      entry_orders: Array.from(warehouse.entry_orders),
      total_entries: Array.from(warehouse.entry_orders).length,
      // ✅ FIFO information
      oldest_entry_date: warehouse.oldest_entry,
      newest_entry_date: warehouse.newest_entry,
      inventory_age_days: warehouse.oldest_entry 
        ? Math.floor((new Date() - warehouse.oldest_entry) / (1000 * 60 * 60 * 24))
        : 0,
    }));

    // Overall totals with FIFO info
    const allDates = availableAllocations.map(a => new Date(a.entry_order_product.entry_order.entry_date_time));
    const overallTotals = {
      total_warehouses: summary.length,
      total_approved_items: availableAllocations.length,
      total_unique_products: [...new Set(availableAllocations.map(a => a.entry_order_product.product.product_id))].length,
      total_quantity: summary.reduce((sum, w) => sum + w.total_quantity, 0),
      total_packages: summary.reduce((sum, w) => sum + w.total_packages, 0),
      total_weight: summary.reduce((sum, w) => sum + w.total_weight, 0),
      total_volume: summary.reduce((sum, w) => sum + w.total_volume, 0),
      total_entry_orders: [...new Set(availableAllocations.map(a => a.entry_order_product.entry_order.entry_order_no))].length,
      // ✅ Overall FIFO information
      oldest_inventory_date: allDates.length > 0 ? new Date(Math.min(...allDates)) : null,
      newest_inventory_date: allDates.length > 0 ? new Date(Math.max(...allDates)) : null,
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

// ✅ UPDATED: Get available cells for a specific entry order product from approved allocations
async function getAvailableCellsForProduct(
  entryOrderProductId,
  warehouseId = null,
  userRole = null,
  userId = null
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

    // ✅ NEW: If user is a CLIENT, only show inventory in cells assigned to them
    if (userRole === "CLIENT" && userId) {
      // Get the client record for this user
      const clientUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (clientUser) {
        // Find the corresponding client record
        const client = await prisma.client.findFirst({
          where: { email: clientUser.email },
          select: { client_id: true }
        });

        if (client) {
          // Get cell IDs assigned to this client
          const clientCellAssignments = await prisma.clientCellAssignment.findMany({
            where: {
              client_id: client.client_id,
              is_active: true,
              ...(warehouseId ? { warehouse_id: warehouseId } : {})
            },
            select: { cell_id: true }
          });

          const assignedCellIds = clientCellAssignments.map(assignment => assignment.cell_id);
          
          if (assignedCellIds.length === 0) {
            // Client has no assigned cells, return empty array
            return [];
          }

          // Filter by assigned cells
          whereClause.cell_id = { in: assignedCellIds };
        } else {
          // User doesn't have a corresponding client record, return empty
          return [];
        }
      } else {
        // User not found, return empty
        return [];
      }
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
        { entry_order_product: { entry_order: { entry_date_time: "asc" } } }, // ✅ FIFO
        { cell: { row: "asc" } },
        { cell: { bay: "asc" } },
        { cell: { position: "asc" } },
      ],
    });

    // ✅ Filter allocations that have available inventory and return detailed info
    const result = allocations
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
          
          // Entry order details with FIFO
          entry_order_no: allocation.entry_order_product.entry_order.entry_order_no,
          registration_date: allocation.entry_order_product.entry_order.registration_date,
          entry_date_time: allocation.entry_order_product.entry_order.entry_date_time, // ✅ FIFO key
          fifo_rank: allocation.entry_order_product.entry_order.entry_date_time,
        };
      });

    return result;
  } catch (error) {
    console.error("Error in getAvailableCellsForProduct:", error);
    throw new Error(`Failed to fetch available cells: ${error.message}`);
  }
}

// Create Departure order with product-based inventory tracking
async function createDepartureOrder(departureData) {
  const { inventory_selections, ...orderData } = departureData;

  // ✅ MANDATORY FIELD VALIDATION
  const requiredFields = {
    departure_order_no: "Dispatch Order Number",
    customer_id: "Customer",
    warehouse_id: "Warehouse", 
    departure_date: "Dispatch Date & Time",
    created_by: "Created By User",
    organisation_id: "Organisation",
    document_number: "Dispatch Document Number", // ✅ NEW: Make mandatory
    document_date: "Document Date", // ✅ NEW: Make mandatory
  };

  // Validate required main fields
  for (const [field, displayName] of Object.entries(requiredFields)) {
    if (!orderData[field]) {
      throw new Error(`${displayName} is required and cannot be empty`);
    }
  }

  if (!inventory_selections || inventory_selections.length === 0) {
    throw new Error("At least one inventory selection is required");
  }

  // ✅ VALIDATE EACH INVENTORY SELECTION has required fields
  for (let i = 0; i < inventory_selections.length; i++) {
    const selection = inventory_selections[i];
    const selectionRequiredFields = {
      inventory_id: "Inventory ID",
      requested_qty: "Quantity Inventory units", // ✅ FIXED: Use requested_qty not requested_quantity
      requested_weight: "Weight",
      // packaging_code is optional - will be derived from product status if not provided
    };

    for (const [field, displayName] of Object.entries(selectionRequiredFields)) {
      if (!selection[field] && selection[field] !== 0) {
        throw new Error(`Selection ${i + 1}: ${displayName} is required`);
      }
    }

    // ✅ VALIDATE numeric fields
    // ✅ FIXED: Use correct field names from frontend payload
    if (parseInt(selection.requested_qty) <= 0) {
      throw new Error(`Selection ${i + 1}: Quantity must be greater than 0`);
    }
    if (parseFloat(selection.requested_weight) <= 0) {
      throw new Error(`Selection ${i + 1}: Weight must be greater than 0`);
    }
  }

  // ✅ FIXED: Enhanced validation to include packaging_code
  const validatedCells = [];
  for (const selection of inventory_selections) {
    const validated = await validateSelectedCell(
      selection.inventory_id,
      parseInt(selection.requested_qty), // ✅ FIXED: Use requested_qty not requested_quantity
      parseFloat(selection.requested_weight)
    );

    // ✅ PACKAGING CODE: Use from selection if provided, otherwise derive from inventory
    if (selection.packaging_code) {
      validated.packaging_code = parseInt(selection.packaging_code);
    } else {
      // ✅ DERIVE packaging code from product status and presentation
      const statusMapping = {
        'PAL_NORMAL': 30, 'CAJ_NORMAL': 31, 'SAC_NORMAL': 32, 'UNI_NORMAL': 33,
        'PAQ_NORMAL': 34, 'TAM_NORMAL': 35, 'BUL_NORMAL': 36, 'OTR_NORMAL': 37,
        'PAL_DANADA': 40, 'CAJ_DANADA': 41, 'SAC_DANADO': 42, 'UNI_DANADA': 43,
        'PAQ_DANADO': 44, 'TAM_DANADO': 45, 'BUL_DANADO': 46, 'OTR_DANADO': 47,
      };
      validated.packaging_code = statusMapping[validated.product_status] || 31; // Default to CAJ_NORMAL
    }
    
    // ✅ CAPTURE ADDITIONAL MANDATORY INFO from inventory/allocation
    const allocationInfo = await prisma.inventoryAllocation.findUnique({
      where: { allocation_id: validated.allocation_id },
      include: {
        entry_order_product: {
          include: {
            entry_order: {
              select: {
                entry_order_no: true,
                entry_date_time: true,
                document_date: true,
              }
            },
            product: {
              select: {
                product_code: true,
                name: true,
              }
            }
          }
        },
        cell: {
          select: {
            row: true,
            bay: true,
            position: true,
          }
        }
      }
    });

    if (!allocationInfo) {
      throw new Error(`Allocation not found for inventory ${selection.inventory_id}`);
    }

    // ✅ ADD MANDATORY TRACEABILITY INFO
    validated.entry_order_no = allocationInfo.entry_order_product.entry_order.entry_order_no;
    validated.entry_date_time = allocationInfo.entry_order_product.entry_order.entry_date_time;
    validated.entry_document_date = allocationInfo.entry_order_product.entry_order.document_date;
    validated.product_code = allocationInfo.entry_order_product.product.product_code;
    validated.product_name = allocationInfo.entry_order_product.product.name;
    validated.lot_series = allocationInfo.entry_order_product.lot_series || "N/A";
    validated.presentation = allocationInfo.presentation;
    validated.pallets_position = `${allocationInfo.cell.row}.${String(allocationInfo.cell.bay).padStart(2, "0")}.${String(allocationInfo.cell.position).padStart(2, "0")}`;
    
    validatedCells.push(validated);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. ✅ FIXED: Validate organisation exists BEFORE creating order
    const organisation = await tx.organisation.findUnique({
      where: { organisation_id: String(orderData.organisation_id) }
    });
    if (!organisation) {
      throw new Error(`Organisation with ID ${orderData.organisation_id} not found`);
    }

    // 2. Create base order
    const newOrder = await tx.order.create({
      data: {
        order_type: orderData.order_type || "DEPARTURE",
        status: orderData.order_status || "PENDING",
        organisation_id: orderData.organisation_id,
        created_by: orderData.created_by,
      },
    });

    // 3. Calculate totals from selections
    const totalQty = validatedCells.reduce(
      (sum, cell) => sum + cell.requested_qty,
      0
    );
    const totalWeight = validatedCells.reduce(
      (sum, cell) => sum + cell.requested_weight,
      0
    );
    const totalPackages = validatedCells.reduce(
      (sum, cell) => sum + cell.requested_qty, // Assuming packages = quantity
      0
    );

    // 4. Validate foreign key references before creating departure order
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

    // ✅ ENHANCED: Create departure order with ALL MANDATORY FIELDS
    const newDepartureOrder = await tx.departureOrder.create({
      data: {
        departure_order_no: orderData.departure_order_no, // ✅ MANDATORY: Dispatch Order Number
        registration_date: toUTC(orderData.registration_date) || new Date(),
        document_date: toUTC(orderData.document_date), // ✅ MANDATORY: Document Date
        departure_date_time: toUTC(orderData.departure_date), // ✅ MANDATORY: Dispatch Date & Time
        destination_point: orderData.arrival_point || null,
        transport_type: orderData.transport_type || null,
        carrier_name: orderData.carrier_name || null,
        total_volume: orderData.total_volume ? parseFloat(orderData.total_volume) : null,
        total_weight: totalWeight, // ✅ CALCULATED: Total weight from selections
        total_pallets: orderData.total_pallets ? parseInt(orderData.total_pallets) : null, // ✅ MANDATORY: Pallets/Position Quantity
        observation: orderData.observations || null,
        order_status: "PENDING",
        
        // ✅ MANDATORY: Documents Upload - store as JSON
        uploaded_documents: orderData.uploaded_documents ? {
          dispatch_document_number: orderData.document_number, // ✅ MANDATORY: Dispatch Document Number
          documents: orderData.uploaded_documents,
          uploaded_at: new Date().toISOString(),
          uploaded_by: orderData.created_by
        } : {
          dispatch_document_number: orderData.document_number, // ✅ MANDATORY: Even if no files
          documents: [],
          uploaded_at: new Date().toISOString(),
          uploaded_by: orderData.created_by
        },
        
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

    // 5. Create departure products for each unique PRODUCT (not entry order product) WITH ALL MANDATORY FIELDS
    const productGroups = validatedCells.reduce((groups, cell) => {
      const key = cell.product_code; // ✅ FIXED: Group by product_code to avoid constraint violation
      if (!groups[key]) {
        groups[key] = {
          product_code: cell.product_code, // ✅ MANDATORY: Product Code
          product_id: cell.product_id,
          product_name: cell.product_name, // ✅ MANDATORY: Product Name
          lot_series: cell.lot_series, // ✅ MANDATORY: Lot Number (use first one found)
          presentation: cell.presentation, // ✅ MANDATORY: Packaging type
          entry_order_nos: [cell.entry_order_no], // ✅ MANDATORY: Entry Order Numbers (multiple possible)
          entry_date_times: [cell.entry_date_time], // ✅ MANDATORY: Entry Dates (multiple possible)
          entry_order_product_ids: [cell.entry_order_product_id], // Track all source entry products
          pallets_positions: [], // ✅ MANDATORY: Pallets / Position Quantity
          total_qty: 0,
          total_weight: 0,
          cells: [],
        };
      } else {
        // ✅ FIXED: For additional cells of same product, merge data
        if (!groups[key].entry_order_nos.includes(cell.entry_order_no)) {
          groups[key].entry_order_nos.push(cell.entry_order_no);
        }
        if (!groups[key].entry_date_times.some(dt => dt?.getTime() === cell.entry_date_time?.getTime())) {
          groups[key].entry_date_times.push(cell.entry_date_time);
        }
        if (!groups[key].entry_order_product_ids.includes(cell.entry_order_product_id)) {
          groups[key].entry_order_product_ids.push(cell.entry_order_product_id);
        }
      }
      groups[key].total_qty += cell.requested_qty; // ✅ MANDATORY: Quantity Inventory units
      groups[key].total_weight += cell.requested_weight;
      groups[key].pallets_positions.push(cell.pallets_position); // ✅ MANDATORY: Position info
      groups[key].cells.push(cell);
      return groups;
    }, {});

    // ✅ UPDATED: Create departure products with ALL MANDATORY TRACEABILITY
    const departureProducts = [];
    const entryToDepartureProductMap = {}; // Map entry_order_product_id to departure_order_product_id

    for (const [productCode, group] of Object.entries(productGroups)) {
      const departureProduct = await tx.departureOrderProduct.create({
        data: {
          departure_order_id: newDepartureOrder.departure_order_id,
          product_code: group.product_code, // ✅ MANDATORY: Product Code
          product_id: group.product_id,
          lot_series: group.lot_series, // ✅ MANDATORY: Lot Number (first one)
          requested_quantity: group.total_qty, // ✅ MANDATORY: Quantity Inventory units
          requested_packages: group.total_qty, // ✅ MANDATORY: Packaging Quantity
          requested_pallets: Math.ceil(group.total_qty / 200), // ✅ CALCULATED: Pallets from quantity
          presentation: group.presentation, // ✅ MANDATORY: Packaging type
          requested_weight: group.total_weight,
          requested_volume: parseFloat(orderData.total_volume) || null,
          unit_price: orderData.unit_price ? parseFloat(orderData.unit_price) : null,
          total_value: orderData.unit_price ? parseFloat(orderData.unit_price) * group.total_qty : null,
          temperature_requirement: "AMBIENTE",
          special_handling: orderData.special_handling || null,
          delivery_instructions: orderData.delivery_instructions || null,
        },
      });

      departureProducts.push({
        ...departureProduct,
        // ✅ ADD MANDATORY TRACEABILITY INFO to response (merged from multiple sources)
        product_name: group.product_name, // ✅ MANDATORY: Product Name
        entry_order_nos: group.entry_order_nos.join(', '), // ✅ MANDATORY: Entry Order Numbers (multiple)
        entry_date_times: group.entry_date_times.map(dt => dt?.toISOString()).join(', '), // ✅ MANDATORY: Entry Dates
        dispatch_date_time: newDepartureOrder.departure_date_time, // ✅ MANDATORY: Dispatch Date & Time
        dispatch_document_number: orderData.document_number, // ✅ MANDATORY: Dispatch Document Number
        pallets_positions: group.pallets_positions.join(', '), // ✅ MANDATORY: Pallets / Position Quantity
      });

      // ✅ FIXED: Store mapping for ALL entry order products in this group
      for (const entryOrderProductId of group.entry_order_product_ids) {
        entryToDepartureProductMap[entryOrderProductId] =
          departureProduct.departure_order_product_id;
      }
    }

    // 6. ✅ UPDATED: Update inventory using the new allocation-based system with proper synchronization
    const cellAllocations = [];
    for (const cell of validatedCells) {
      // ✅ FIXED: Calculate proportional package quantity based on actual package to quantity ratio
      const originalPackageRatio = cell.available_package_qty > 0 ? 
        cell.available_package_qty / cell.available_qty : 1;
      const requestedPackageQty = Math.ceil(cell.requested_qty * originalPackageRatio);
      
      // ✅ FIXED: Calculate proportional volume if available
      const originalVolumeRatio = cell.available_volume > 0 ? 
        cell.available_volume / cell.available_qty : 0;
      const requestedVolume = cell.requested_qty * originalVolumeRatio;

      // Update inventory (DECREMENT - removing from warehouse) with proper synchronization
      await tx.inventory.update({
        where: { inventory_id: cell.inventory_id },
        data: {
          current_quantity: { decrement: cell.requested_qty },
          current_package_quantity: { decrement: requestedPackageQty }, // ✅ FIXED: Use calculated package qty
          current_weight: { decrement: cell.requested_weight },
          current_volume: requestedVolume > 0 ? { decrement: requestedVolume } : undefined,
          status: cell.will_be_empty ? "DEPLETED" : "AVAILABLE",
        },
      });

      // Create cell assignment with packaging_code
      await tx.cellAssignment.create({
        data: {
          departure_order_id: newDepartureOrder.departure_order_id,
          cell_id: cell.cell_id,
          assigned_by: orderData.created_by,
          packaging_quantity: requestedPackageQty, // ✅ FIXED: Use calculated package qty
          weight: cell.requested_weight,
          packaging_code: cell.packaging_code, // ✅ MANDATORY: From validated selection
          status: "COMPLETED",
        },
      });

      // ✅ FIXED: Update cell status with proper synchronization
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
            current_packaging_qty: { decrement: requestedPackageQty }, // ✅ FIXED: Use calculated package qty
            current_weight: { decrement: cell.requested_weight },
            currentUsage: requestedVolume > 0 ? { decrement: requestedVolume } : undefined,
          },
        });
      }

      // ✅ ENHANCED: Create inventory log with proper synchronization
      await tx.inventoryLog.create({
        data: {
          user_id: orderData.created_by,
          product_id: cell.product_id,
          movement_type: MovementType.DEPARTURE,
          quantity_change: -cell.requested_qty,
          package_change: -requestedPackageQty, // ✅ FIXED: Use calculated package qty
          weight_change: -cell.requested_weight,
          volume_change: requestedVolume > 0 ? -requestedVolume : null,
          departure_order_id: newDepartureOrder.departure_order_id,
          departure_order_product_id:
            entryToDepartureProductMap[cell.entry_order_product_id],
          entry_order_product_id: cell.entry_order_product_id,
          warehouse_id: cell.warehouse_id,
          cell_id: cell.cell_id,
          product_status: cell.product_status || "PAL_NORMAL",
          status_code: cell.status_code || 37,
          // ✅ ENHANCED: Complete traceability notes with ALL MANDATORY INFO including sync details
          notes: `DEPARTURE: ${cell.requested_qty} units (${requestedPackageQty} packages, ${cell.requested_weight} kg) of ${cell.product_code} (${cell.product_name}) | ` +
                 `Lot: ${cell.lot_series} | Entry Order: ${cell.entry_order_no} | ` +
                 `Entry Date: ${cell.entry_date_time} | Dispatch Date: ${newDepartureOrder.departure_date_time} | ` +
                 `Position: ${cell.pallets_position} | Document: ${orderData.document_number} | ` +
                 `Dispatch Order: ${newDepartureOrder.departure_order_no}`,
        },
      });

      cellAllocations.push({
        cell_reference: cell.cell_reference,
        warehouse_name: cell.warehouse_name,
        entry_order_no: cell.entry_order_no,
        product_code: cell.product_code,
        product_name: cell.product_name, // ✅ ADD: Product Name
        lot_series: cell.lot_series, // ✅ ADD: Lot Number
        departed_qty: cell.requested_qty,
        departed_packages: requestedPackageQty, // ✅ FIXED: Add calculated package qty
        departed_weight: cell.requested_weight,
        departed_volume: requestedVolume, // ✅ ADD: Volume tracking
        remaining_qty: cell.remaining_qty,
        remaining_weight: cell.remaining_weight,
        cell_depleted: cell.will_be_empty,
        packaging_code: cell.packaging_code, // ✅ ADD: Packaging Code
        pallets_position: cell.pallets_position, // ✅ ADD: Position info
        entry_date_time: cell.entry_date_time, // ✅ ADD: Entry Date & Time
        dispatch_date_time: newDepartureOrder.departure_date_time, // ✅ ADD: Dispatch Date & Time
      });
    }

    return {
      departureOrder: {
        ...newDepartureOrder,
        // ✅ ADD MANDATORY FIELDS to response for verification
        dispatch_order_number: newDepartureOrder.departure_order_no, // ✅ MANDATORY
        dispatch_document_number: orderData.document_number, // ✅ MANDATORY
        dispatch_date_time: newDepartureOrder.departure_date_time, // ✅ MANDATORY
        has_documents_upload: !!orderData.uploaded_documents, // ✅ MANDATORY check
        total_products: departureProducts.length,
        total_packaging_quantity: totalPackages, // ✅ MANDATORY
      },
      departureProducts, // ✅ Already enhanced with mandatory fields
      cellAllocations, // ✅ Already enhanced with mandatory fields
      totals: {
        total_qty: totalQty,
        total_weight: totalWeight,
        total_packages: totalPackages, // ✅ ADD: Packaging Quantity
        cells_affected: validatedCells.length,
        cells_depleted: validatedCells.filter((c) => c.will_be_empty).length,
      },
      // ✅ MANDATORY COMPLIANCE SUMMARY
      mandatory_fields_captured: {
        dispatch_order_number: newDepartureOrder.departure_order_no,
        product_codes: [...new Set(validatedCells.map(c => c.product_code))],
        product_names: [...new Set(validatedCells.map(c => c.product_name))],
        lot_numbers: [...new Set(validatedCells.map(c => c.lot_series))],
        quantity_inventory_units: totalQty,
        packaging_quantities: totalPackages,
        packaging_types: [...new Set(validatedCells.map(c => c.presentation))],
        dispatch_document_number: orderData.document_number,
        pallets_positions: [...new Set(validatedCells.map(c => c.pallets_position))],
        entry_date_times: [...new Set(validatedCells.map(c => c.entry_date_time))],
        dispatch_date_time: newDepartureOrder.departure_date_time,
        entry_order_numbers: [...new Set(validatedCells.map(c => c.entry_order_no))],
        documents_uploaded: !!orderData.uploaded_documents,
      }
    };
  }, {
    maxWait: 30000, // 30 seconds
    timeout: 30000, // 30 seconds
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

  // ✅ NEW: Validate synchronization between requested quantity and weight
  if (inventory.current_package_quantity > 0 && parseFloat(inventory.current_weight) > 0) {
    const currentWeightPerUnit = parseFloat(inventory.current_weight) / inventory.current_package_quantity;
    const requestedWeightPerUnit = requested_weight / requested_qty;
    
    // Allow 10% tolerance for weight per unit ratio variations
    const tolerance = currentWeightPerUnit * 0.1;
    
    if (Math.abs(requestedWeightPerUnit - currentWeightPerUnit) > tolerance) {
      throw new Error(
        `Weight to quantity ratio out of sync. Current: ${currentWeightPerUnit.toFixed(3)} kg/unit, ` +
        `Requested: ${requestedWeightPerUnit.toFixed(3)} kg/unit. ` +
        `Expected weight for ${requested_qty} units: ${(requested_qty * currentWeightPerUnit).toFixed(2)} kg`
      );
    }
  }

  // ✅ NEW: Validate that the remaining quantities will be synchronized
  const remainingQty = inventory.current_package_quantity - requested_qty;
  const remainingWeight = parseFloat(inventory.current_weight) - requested_weight;
  
  if (remainingQty > 0 && remainingWeight <= 0) {
    throw new Error(
      `Invalid operation would leave quantity (${remainingQty}) without corresponding weight`
    );
  }
  
  if (remainingWeight > 0.01 && remainingQty <= 0) {
    throw new Error(
      `Invalid operation would leave weight (${remainingWeight.toFixed(2)} kg) without corresponding quantity`
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

// ✅ NEW: Generate next departure order number in format OS202501
// OS = Departure Order prefix, 2025 = full year, 01 = incremental count
async function getCurrentDepartureOrderNo() {
  const currentYear = new Date().getFullYear().toString(); // Full 4-digit year
  const yearPrefix = `OS${currentYear}`;
  
  const lastOrder = await prisma.departureOrder.findFirst({
    where: {
      departure_order_no: { startsWith: yearPrefix },
    },
    orderBy: { departure_date_time: "desc" },
  });

  let nextCount = 1;
  if (lastOrder?.departure_order_no) {
    // Extract count from format like "OS202501" -> "01"
    const countPart = lastOrder.departure_order_no.substring(yearPrefix.length);
    if (!isNaN(countPart)) {
      nextCount = parseInt(countPart) + 1;
    }
  }

  return `${yearPrefix}${String(nextCount).padStart(2, "0")}`;
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
  getCurrentDepartureOrderNo,
  // ✅ NEW: FIFO Product-wise functions
  getFifoLocationsForProduct,
  getSuggestedFifoAllocation,
};
