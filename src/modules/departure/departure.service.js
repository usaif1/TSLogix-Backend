const {
  PrismaClient,
  InventoryStatus,
  MovementType,
  CellStatus,
  PackagingType,
  PackagingStatus,
  OrderStatusDeparture,
  ReviewStatus,
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

// ✅ ENHANCED: Dropdown data for Departure form with document types
async function getDepartureFormFields(userRole = null, userId = null) {
  try {
    // ✅ NEW: Build client-specific filtering for users (same as entry order)
    let usersPromise;

    if (userRole === "CLIENT" && userId) {
      // For CLIENT users, get client_users_data from their client record
      const clientUser = await prisma.clientUser.findFirst({
        where: { 
          user_id: userId,
          is_active: true
        },
        include: {
          client: true
        }
      });

      if (clientUser?.client) {
        const clientId = clientUser.client.client_id;
        
        // ✅ NEW: Get simple client_users_data from the client record (as provided during creation)
        usersPromise = prisma.client.findUnique({
          where: { client_id: clientId },
          select: {
            client_users_data: true
          }
        }).then(client => {
          // Return the simple client_users_data as provided during creation
          // This will be the array like [{"name": "user 1"}, {"name": "user 2"}]
          return client?.client_users_data || [];
        });
      } else {
        // Client user account not found, return empty array
        usersPromise = Promise.resolve([]);
      }
    } else {
      // For non-CLIENT users (ADMIN, WAREHOUSE_INCHARGE, etc.), get all users
      usersPromise = prisma.user.findMany({
        where: {
          active_state: { name: "Active" },
        },
        select: {
          id: true,
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: { select: { name: true } },
        },
      });
    }

    const [clients, documentTypes, users, warehouses, labels] =
      await Promise.all([
        prisma.client.findMany({
          select: { 
            client_id: true,
            client_type: true,
            company_name: true,
            first_names: true,
            last_name: true,
            email: true,
            phone: true,
            cell_phone: true
          },
        }),
        // ✅ FIXED: Use same document types as entry order (DocumentType table, not DepartureDocumentType)
        prisma.documentType.findMany({
          select: {
            document_type_id: true,
            name: true,
            type: true,
            description: true,
          },
        }),
        usersPromise,
        prisma.warehouse.findMany({
          select: { warehouse_id: true, name: true },
        }),
        prisma.label.findMany({
          select: { label_id: true, name: true },
        }),
      ]);

    // ✅ FIXED: Use same document type options as entry order
    const documentTypeOptions = Object.values({
      PACKING_LIST: "Packing List",
      FACTURA: "Factura",
      CERTIFICADO_ANALISIS: "Certificado de Análisis",
      RRSS: "RRSS",
      PERMISO_ESPECIAL: "Permiso Especial",
      OTRO: "Otro",
    }).map((label, index) => ({
      value: Object.keys({
        PACKING_LIST: "Packing List",
        FACTURA: "Factura",
        CERTIFICADO_ANALISIS: "Certificado de Análisis",
        RRSS: "RRSS",
        PERMISO_ESPECIAL: "Permiso Especial",
        OTRO: "Otro",
      })[index],
      label,
    }));

    return {
      // ✅ REMOVED: customers (as requested)
      clients, // ✅ Support for new Client model
      documentTypes, // ✅ FIXED: Same as entry order
      users, // ✅ FIXED: Client users for CLIENT role, all users for others
      warehouses,
      labels,
      packagingTypes: getPackagingTypesFromEnum(),
      packagingStatuses: getPackagingStatusFromEnum(),
      packagingCodes: getPackagingCodes(),
      // ✅ FIXED: Same document type options as entry order
      documentTypeOptions,
      // ✅ NEW: Departure order statuses for workflow
      departureStatuses: [
        { value: 'PENDING', label: 'Pending Approval' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REVISION', label: 'Needs Revision' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'DISPATCHED', label: 'Dispatched' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
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

// ✅ ENHANCED: Get all departure orders with approval workflow filtering
async function getAllDepartureOrders(searchQuery = "", organisationId = null, userRole = null, userOrgId = null, status = null) {
  try {
    const whereClause = {};
    
    // Add search filter if provided
    if (searchQuery) {
      whereClause.departure_order_no = { contains: searchQuery, mode: "insensitive" };
    }

    // ✅ NEW: Filter by status if provided
    if (status) {
      whereClause.order_status = status;
    }
    
    // ✅ ROLE-BASED ACCESS CONTROL
    // WAREHOUSE and ADMIN users can see all departure orders
    // Other users (like CLIENT) only see orders from their organization or their own orders
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
        review_status: true,
        review_comments: true,
        reviewed_by: true,
        reviewed_at: true,
        dispatch_status: true,
        dispatched_by: true,
        dispatched_at: true,
        dispatch_document_number: true, // ✅ NEW: Mandatory field
        document_type_ids: true, // ✅ NEW: Multi-select document types
        uploaded_documents: true, // ✅ NEW: Document upload status
        customer: { select: { name: true } },
        client: { select: { company_name: true, first_names: true, last_name: true, client_type: true } }, // ✅ NEW: Client support
        order: { 
          select: { 
            created_at: true,
            organisation_id: true,
            organisation: { select: { name: true } }
          } 
        },
        warehouse: { select: { name: true } },
        creator: { select: { first_name: true, last_name: true } },
        reviewer: { select: { first_name: true, last_name: true } },
        dispatcher: { select: { first_name: true, last_name: true } },
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

// ✅ NEW: Get products with available inventory from approved allocations (EXPIRY-BASED FIFO)
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
                entry_date_time: true, // Secondary sort for FIFO
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
        { entry_order_product: { expiration_date: "asc" } }, // ✅ PRIMARY: EXPIRY-BASED FIFO (earliest expiry first)
        { entry_order_product: { entry_order: { entry_date_time: "asc" } } }, // ✅ SECONDARY: Oldest entry first
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

    // ✅ NEW: Group by product (not entry order) with EXPIRY-BASED FIFO locations
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
          fifo_locations: [], // ✅ EXPIRY-BASED FIFO sorted locations
          earliest_expiry: null, // ✅ NEW: Track earliest expiry
          latest_expiry: null, // ✅ NEW: Track latest expiry
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

      // ✅ NEW: Track expiry dates for FIFO priority
      const expiryDate = allocation.entry_order_product.expiration_date;
      if (expiryDate) {
        if (!acc[key].earliest_expiry || expiryDate < acc[key].earliest_expiry) {
          acc[key].earliest_expiry = expiryDate;
        }
        if (!acc[key].latest_expiry || expiryDate > acc[key].latest_expiry) {
          acc[key].latest_expiry = expiryDate;
        }
      }

      // ✅ Add location with EXPIRY-BASED FIFO data (already sorted by expiration_date)
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
        entry_date_time: allocation.entry_order_product.entry_order.entry_date_time, // ✅ SECONDARY FIFO key
        expiration_date: allocation.entry_order_product.expiration_date, // ✅ PRIMARY FIFO key
        manufacturing_date: allocation.entry_order_product.manufacturing_date,
        lot_series: allocation.entry_order_product.lot_series, // ✅ MANDATORY: Lot number
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
        // ✅ NEW: Expiry urgency calculation
        days_to_expiry: expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null,
        is_near_expiry: expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) <= 30 : false,
        is_expired: expiryDate ? expiryDate < new Date() : false,
      });

      return acc;
    }, {});

    return Object.values(groupedInventory).map((item) => ({
      ...item,
      entry_orders: Array.from(item.entry_orders),
      suppliers: Array.from(item.suppliers),
      warehouses: Array.from(item.warehouses),
      location_count: item.fifo_locations.length,
      earliest_entry_date: item.fifo_locations[0]?.entry_date_time, // ✅ SECONDARY: Oldest entry
      latest_entry_date: item.fifo_locations[item.fifo_locations.length - 1]?.entry_date_time,
      // ✅ NEW: Expiry-based prioritization
      days_to_earliest_expiry: item.earliest_expiry 
        ? Math.ceil((item.earliest_expiry - new Date()) / (1000 * 60 * 60 * 24)) 
        : null,
      has_near_expiry: item.fifo_locations.some(loc => loc.is_near_expiry),
      has_expired: item.fifo_locations.some(loc => loc.is_expired),
      urgent_dispatch_needed: item.fifo_locations.some(loc => loc.days_to_expiry <= 7), // ✅ Urgent if expires in 7 days
      can_depart: item.total_quantity > 0,
    }));
  } catch (error) {
    console.error("Error in getProductsWithInventory:", error);
    throw new Error(
      `Failed to fetch products with inventory: ${error.message}`
    );
  }
}

// ✅ NEW: Get EXPIRY-BASED FIFO locations for a specific product
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
                entry_date_time: true, // ✅ SECONDARY FIFO key
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
        { entry_order_product: { expiration_date: "asc" } }, // ✅ PRIMARY: EXPIRY-BASED FIFO (earliest expiry first)
        { entry_order_product: { entry_order: { entry_date_time: "asc" } } }, // ✅ SECONDARY: Oldest entry first
        { cell: { row: "asc" } },
        { cell: { bay: "asc" } },
        { cell: { position: "asc" } },
      ],
    });

    // ✅ Filter allocations that have available inventory and return EXPIRY-BASED FIFO sorted
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
        const expiryDate = allocation.entry_order_product.expiration_date;
        
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
          
          // ✅ EXPIRY-BASED FIFO details
          entry_order_no: entryOrder.entry_order_no,
          entry_date_time: entryOrder.entry_date_time, // ✅ SECONDARY FIFO sort key
          expiration_date: expiryDate, // ✅ PRIMARY FIFO sort key
          manufacturing_date: allocation.entry_order_product.manufacturing_date,
          lot_series: allocation.entry_order_product.lot_series, // ✅ MANDATORY: Lot number
          registration_date: entryOrder.registration_date,
          document_date: entryOrder.document_date,
          fifo_rank: expiryDate || entryOrder.entry_date_time, // For sorting
          
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
          
          // ✅ NEW: Expiry urgency calculation
          days_to_expiry: expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null,
          is_near_expiry: expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) <= 30 : false,
          is_expired: expiryDate ? expiryDate < new Date() : false,
          urgency_level: expiryDate ? (
            expiryDate < new Date() ? 'EXPIRED' :
            Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) <= 7 ? 'URGENT' :
            Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) <= 30 ? 'WARNING' : 'NORMAL'
          ) : 'UNKNOWN',
        };
      });
  } catch (error) {
    console.error("Error in getFifoLocationsForProduct:", error);
    throw new Error(`Failed to fetch EXPIRY-BASED FIFO locations: ${error.message}`);
  }
}

// ✅ NEW: Get suggested EXPIRY-BASED FIFO allocation for a product (automatic FIFO selection)
async function getSuggestedFifoAllocation(productId, requestedQuantity, requestedWeight = null, warehouseId = null) {
  try {
    const fifoLocations = await getFifoLocationsForProduct(productId, warehouseId);
    
    if (fifoLocations.length === 0) {
      throw new Error(`No approved inventory found for product ${productId}`);
    }

    const suggestions = [];
    let remainingQuantity = requestedQuantity;
    let remainingWeight = requestedWeight;

    // ✅ EXPIRY-BASED FIFO allocation logic (already sorted by expiration_date)
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
        expiration_date: location.expiration_date, // ✅ PRIMARY FIFO key
        manufacturing_date: location.manufacturing_date,
        lot_series: location.lot_series, // ✅ MANDATORY: Lot number
        product_code: location.product_code,
        product_name: location.product_name,
        requested_qty: allocateQty,
        requested_weight: allocateWeight,
        available_qty: location.available_packages,
        available_weight: location.available_weight,
        fifo_rank: location.expiration_date || location.entry_date_time,
        will_be_empty: allocateQty >= location.available_packages,
        // ✅ NEW: Expiry urgency information
        days_to_expiry: location.days_to_expiry,
        urgency_level: location.urgency_level,
        is_near_expiry: location.is_near_expiry,
        is_expired: location.is_expired,
      });

      remainingQuantity -= allocateQty;
      if (remainingWeight) remainingWeight -= allocateWeight;
    }

    const totalAllocated = suggestions.reduce((sum, s) => sum + s.requested_qty, 0);
    const totalWeightAllocated = suggestions.reduce((sum, s) => sum + s.requested_weight, 0);

    // ✅ NEW: Expiry analysis
    const hasExpiredItems = suggestions.some(s => s.is_expired);
    const hasNearExpiryItems = suggestions.some(s => s.is_near_expiry);
    const earliestExpiry = suggestions.reduce((earliest, s) => {
      if (!s.expiration_date) return earliest;
      if (!earliest || s.expiration_date < earliest) return s.expiration_date;
      return earliest;
    }, null);

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
      earliest_entry_date: suggestions[0]?.entry_date_time,
      latest_entry_date: suggestions[suggestions.length - 1]?.entry_date_time,
      // ✅ NEW: Expiry-based analysis
      earliest_expiry_date: earliestExpiry,
      has_expired_items: hasExpiredItems,
      has_near_expiry_items: hasNearExpiryItems,
      urgent_dispatch_recommended: hasExpiredItems || hasNearExpiryItems,
      expiry_priority: hasExpiredItems ? 'CRITICAL' : hasNearExpiryItems ? 'HIGH' : 'NORMAL',
    };
  } catch (error) {
    console.error("Error in getSuggestedFifoAllocation:", error);
    throw new Error(`Failed to generate EXPIRY-BASED FIFO allocation: ${error.message}`);
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

// ✅ ENHANCED: Create Departure order with approval workflow and mandatory fields
async function createDepartureOrder(departureData) {
  // ✅ MANDATORY FIELD VALIDATION for new workflow
  const requiredFields = {
    departure_order_no: "Departure Order Number", // ✅ MANDATORY
    departure_date_time: "Dispatch Date & Time", // ✅ MANDATORY
    created_by: "Created By User",
    organisation_id: "Organisation",
    dispatch_document_number: "Dispatch Document Number", // ✅ MANDATORY
    document_date: "Document Date",
    total_pallets: "Pallet/Position Quantity", // ✅ MANDATORY
    document_type_ids: "Document Types", // ✅ MANDATORY: Multi-select
    uploaded_documents: "Document Upload", // ✅ MANDATORY
  };

  // Validate required main fields
  for (const [field, displayName] of Object.entries(requiredFields)) {
    if (!departureData[field]) {
      // Special handling for arrays
      if (field === 'document_type_ids' && (!departureData[field] || departureData[field].length === 0)) {
        throw new Error(`${displayName} is required - at least one document type must be selected`);
      } else if (field !== 'document_type_ids' && (!departureData[field] || departureData[field] === '')) {
        throw new Error(`${displayName} is required and cannot be empty`);
      }
    }
  }

  // ✅ NEW: Validate either customer_id or client_id is provided
  if (!departureData.customer_id && !departureData.client_id) {
    throw new Error("Either Customer or Client must be selected");
  }

  // ✅ NEW: Validate warehouse assignment
  if (!departureData.warehouse_id) {
    throw new Error("Warehouse assignment is required");
  }

  // ✅ NEW: For creation, we don't require inventory selections yet - they're selected during dispatch
  // This allows for the approval workflow before actual inventory allocation

  return await prisma.$transaction(async (tx) => {
    // 1. Validate organisation exists
    const organisation = await tx.organisation.findUnique({
      where: { organisation_id: String(departureData.organisation_id) }
    });
    if (!organisation) {
      throw new Error(`Organisation with ID ${departureData.organisation_id} not found`);
    }

    // 2. Create base order
    const newOrder = await tx.order.create({
      data: {
        order_type: "DEPARTURE",
        status: "PENDING", // ✅ NEW: Start in PENDING for approval workflow
        organisation_id: departureData.organisation_id,
        created_by: departureData.created_by,
      },
    });

    // 3. Validate foreign key references
    let customerId = null;
    let clientId = null;

    if (departureData.customer_id) {
      const customer = await tx.customer.findUnique({
        where: { customer_id: String(departureData.customer_id) }
      });
      if (!customer) {
        throw new Error(`Customer with ID ${departureData.customer_id} not found`);
      }
      customerId = String(departureData.customer_id);
    }

    if (departureData.client_id) {
      const client = await tx.client.findUnique({
        where: { client_id: String(departureData.client_id) }
      });
      if (!client) {
        throw new Error(`Client with ID ${departureData.client_id} not found`);
      }
      clientId = String(departureData.client_id);
    }

    // Validate warehouse exists
    const warehouse = await tx.warehouse.findUnique({
      where: { warehouse_id: String(departureData.warehouse_id) }
    });
    if (!warehouse) {
      throw new Error(`Warehouse with ID ${departureData.warehouse_id} not found`);
    }

    // Validate user exists
    const user = await tx.user.findUnique({
      where: { id: String(departureData.created_by) }
    });
    if (!user) {
      throw new Error(`User with ID ${departureData.created_by} not found`);
    }

    // ✅ Validate document types exist
    for (const docTypeId of departureData.document_type_ids) {
      const docType = await tx.departureDocumentType.findUnique({
        where: { document_type_id: String(docTypeId) }
      });
      if (!docType) {
        throw new Error(`Document type with ID ${docTypeId} not found`);
      }
    }

    // ✅ ENHANCED: Create departure order with ALL MANDATORY FIELDS and approval workflow
    const newDepartureOrder = await tx.departureOrder.create({
      data: {
        departure_order_no: departureData.departure_order_no, // ✅ MANDATORY
        registration_date: new Date(),
        document_date: toUTC(departureData.document_date),
        departure_date_time: toUTC(departureData.departure_date_time), // ✅ MANDATORY
        created_by: departureData.created_by,
        
        // ✅ NEW: Approval workflow status
        order_status: OrderStatusDeparture.PENDING, // ✅ Start in PENDING for approval
        review_status: ReviewStatus.PENDING,
        
        // Basic order details
        destination_point: departureData.destination_point || null,
        transport_type: departureData.transport_type || null,
        carrier_name: departureData.carrier_name || null,
        total_volume: departureData.total_volume ? parseFloat(departureData.total_volume) : null,
        total_weight: departureData.total_weight ? parseFloat(departureData.total_weight) : null,
        total_pallets: parseInt(departureData.total_pallets), // ✅ MANDATORY
        observation: departureData.observations || null,
        
        // ✅ MANDATORY: Document fields
        dispatch_document_number: departureData.dispatch_document_number, // ✅ MANDATORY
        document_type_ids: departureData.document_type_ids, // ✅ MANDATORY: Multi-select
        
        // ✅ MANDATORY: Document uploads
        uploaded_documents: {
          dispatch_document_number: departureData.dispatch_document_number,
          document_types: departureData.document_type_ids,
          documents: departureData.uploaded_documents || [],
          uploaded_at: new Date().toISOString(),
          uploaded_by: departureData.created_by
        },
        
        // ✅ NEW: Dispatch tracking (separate from approval)
        dispatch_status: "NOT_DISPATCHED", // Will be updated when actually dispatched
        
        // Relations
        customer_id: customerId,
        client_id: clientId,
        warehouse_id: String(departureData.warehouse_id),
        label_id: departureData.label_id ? String(departureData.label_id) : null,
        exit_option_id: departureData.exit_option_id ? String(departureData.exit_option_id) : null,
        order_id: newOrder.order_id,
      },
      include: {
        customer: {
          select: {
            customer_id: true,
            name: true,
          }
        },
        client: {
          select: {
            client_id: true,
            company_name: true,
            first_names: true,
            last_name: true,
            client_type: true,
            email: true,
          }
        },
        warehouse: {
          select: {
            warehouse_id: true,
            name: true,
            location: true,
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
          }
        },
        order: {
          select: {
            order_id: true,
            order_type: true,
            status: true,
            created_at: true,
            organisation: {
              select: {
                organisation_id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    // ✅ NEW: Create departure products from provided product list (no inventory allocation yet)
    const departureProducts = [];
    if (departureData.products && departureData.products.length > 0) {
      for (const productData of departureData.products) {
        // Validate product exists
        const product = await tx.product.findUnique({
          where: { product_id: String(productData.product_id) }
        });
        if (!product) {
          throw new Error(`Product with ID ${productData.product_id} not found`);
        }

        const departureProduct = await tx.departureOrderProduct.create({
          data: {
            departure_order_id: newDepartureOrder.departure_order_id,
            product_code: productData.product_code, // ✅ MANDATORY
            product_id: String(productData.product_id),
            lot_series: productData.lot_series, // ✅ MANDATORY
            requested_quantity: parseInt(productData.requested_quantity), // ✅ MANDATORY
            requested_packages: parseInt(productData.requested_packages || productData.requested_quantity),
            requested_pallets: parseInt(productData.requested_pallets) || Math.ceil(productData.requested_quantity / 200),
            presentation: productData.presentation || "CAJA", // ✅ MANDATORY: Packaging type
            requested_weight: parseFloat(productData.requested_weight),
            requested_volume: productData.requested_volume ? parseFloat(productData.requested_volume) : null,
            unit_price: productData.unit_price ? parseFloat(productData.unit_price) : null,
            total_value: productData.unit_price ? parseFloat(productData.unit_price) * parseInt(productData.requested_quantity) : null,
            temperature_requirement: productData.temperature_requirement || "AMBIENTE",
            special_handling: productData.special_handling || null,
            delivery_instructions: productData.delivery_instructions || null,
          },
          include: {
            product: {
              select: {
                product_code: true,
                name: true,
                manufacturer: true,
              }
            }
          }
        });

        departureProducts.push({
          ...departureProduct,
          product_name: departureProduct.product.name, // ✅ MANDATORY
        });
      }
    }

    return {
      success: true,
      message: "Departure order created successfully and is pending approval",
      departure_order: {
        ...newDepartureOrder,
        // ✅ WORKFLOW STATUS
        workflow_status: "PENDING_APPROVAL",
        can_be_edited: newDepartureOrder.order_status === 'REVISION',
        can_be_approved: newDepartureOrder.order_status === 'PENDING',
        can_be_dispatched: newDepartureOrder.order_status === 'APPROVED',
        
        // ✅ MANDATORY FIELDS SUMMARY
        mandatory_fields_captured: {
          departure_order_number: newDepartureOrder.departure_order_no,
          dispatch_date_time: newDepartureOrder.departure_date_time,
          dispatch_document_number: newDepartureOrder.dispatch_document_number,
          pallet_position_quantity: newDepartureOrder.total_pallets,
          document_types_count: newDepartureOrder.document_type_ids.length,
          documents_uploaded: !!departureData.uploaded_documents,
          has_products: departureProducts.length > 0,
        }
      },
      departure_products: departureProducts,
      next_steps: [
        "Departure order is now pending approval by warehouse incharge or admin",
        "Once approved, inventory can be allocated and dispatched",
        "If revision is requested, the order can be edited and resubmitted"
      ],
      approval_workflow: {
        current_status: "PENDING",
        required_approvers: ["WAREHOUSE_INCHARGE", "ADMIN"],
        possible_actions: ["APPROVE", "REJECT", "REQUEST_REVISION"]
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

// ✅ NEW: Approve departure order (WAREHOUSE_INCHARGE/ADMIN only)
async function approveDepartureOrder(departureOrderId, userId, userRole, comments = null) {
  try {
    // ✅ Role validation
    if (!['WAREHOUSE_INCHARGE', 'ADMIN'].includes(userRole)) {
      throw new Error('Only warehouse incharge or admin can approve departure orders');
    }

    // Check if departure order exists and is in correct status
    const departureOrder = await prisma.departureOrder.findUnique({
      where: { departure_order_id: departureOrderId },
      include: {
        products: true,
        order: true,
      }
    });

    if (!departureOrder) {
      throw new Error('Departure order not found');
    }

    if (departureOrder.order_status !== 'PENDING') {
      throw new Error(`Cannot approve departure order with status: ${departureOrder.order_status}`);
    }

    // Update departure order status
    const updatedOrder = await prisma.departureOrder.update({
      where: { departure_order_id: departureOrderId },
      data: {
        order_status: 'APPROVED',
        review_status: 'APPROVED',
        review_comments: comments,
        reviewed_by: userId,
        reviewed_at: new Date(),
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                product_code: true,
                name: true,
              }
            }
          }
        },
        creator: {
          select: {
            first_name: true,
            last_name: true,
          }
        },
        client: {
          select: {
            company_name: true,
            first_names: true,
            last_name: true,
            client_type: true,
          }
        },
        customer: {
          select: {
            name: true,
          }
        }
      }
    });

    return {
      success: true,
      message: 'Departure order approved successfully',
      departure_order: updatedOrder,
      approved_by: userId,
      approved_at: new Date(),
      comments: comments,
    };
  } catch (error) {
    console.error("Error in approveDepartureOrder:", error);
    throw new Error(`Failed to approve departure order: ${error.message}`);
  }
}

// ✅ NEW: Reject departure order (WAREHOUSE_INCHARGE/ADMIN only)
async function rejectDepartureOrder(departureOrderId, userId, userRole, comments) {
  try {
    // ✅ Role validation
    if (!['WAREHOUSE_INCHARGE', 'ADMIN'].includes(userRole)) {
      throw new Error('Only warehouse incharge or admin can reject departure orders');
    }

    if (!comments || comments.trim().length === 0) {
      throw new Error('Rejection comments are required');
    }

    // Check if departure order exists and is in correct status
    const departureOrder = await prisma.departureOrder.findUnique({
      where: { departure_order_id: departureOrderId },
    });

    if (!departureOrder) {
      throw new Error('Departure order not found');
    }

    if (!['PENDING', 'REVISION'].includes(departureOrder.order_status)) {
      throw new Error(`Cannot reject departure order with status: ${departureOrder.order_status}`);
    }

    // Update departure order status
    const updatedOrder = await prisma.departureOrder.update({
      where: { departure_order_id: departureOrderId },
      data: {
        order_status: 'REJECTED',
        review_status: 'REJECTED',
        review_comments: comments,
        reviewed_by: userId,
        reviewed_at: new Date(),
      },
      include: {
        products: true,
        creator: {
          select: {
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    return {
      success: true,
      message: 'Departure order rejected',
      departure_order: updatedOrder,
      rejected_by: userId,
      rejected_at: new Date(),
      rejection_reason: comments,
    };
  } catch (error) {
    console.error("Error in rejectDepartureOrder:", error);
    throw new Error(`Failed to reject departure order: ${error.message}`);
  }
}

// ✅ NEW: Request revision for departure order (WAREHOUSE_INCHARGE/ADMIN only)
async function requestRevisionDepartureOrder(departureOrderId, userId, userRole, comments) {
  try {
    // ✅ Role validation
    if (!['WAREHOUSE_INCHARGE', 'ADMIN'].includes(userRole)) {
      throw new Error('Only warehouse incharge or admin can request revisions');
    }

    if (!comments || comments.trim().length === 0) {
      throw new Error('Revision comments are required');
    }

    // Check if departure order exists and is in correct status
    const departureOrder = await prisma.departureOrder.findUnique({
      where: { departure_order_id: departureOrderId },
    });

    if (!departureOrder) {
      throw new Error('Departure order not found');
    }

    if (departureOrder.order_status !== 'PENDING') {
      throw new Error(`Cannot request revision for departure order with status: ${departureOrder.order_status}`);
    }

    // Update departure order status
    const updatedOrder = await prisma.departureOrder.update({
      where: { departure_order_id: departureOrderId },
      data: {
        order_status: 'REVISION',
        review_status: 'NEEDS_REVISION',
        review_comments: comments,
        reviewed_by: userId,
        reviewed_at: new Date(),
      },
      include: {
        products: true,
        creator: {
          select: {
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    return {
      success: true,
      message: 'Revision requested for departure order',
      departure_order: updatedOrder,
      requested_by: userId,
      requested_at: new Date(),
      revision_notes: comments,
    };
  } catch (error) {
    console.error("Error in requestRevisionDepartureOrder:", error);
    throw new Error(`Failed to request revision: ${error.message}`);
  }
}

// ✅ NEW: Dispatch approved departure order (WAREHOUSE_INCHARGE/ADMIN only)
async function dispatchDepartureOrder(departureOrderId, userId, userRole, dispatchData = {}) {
  try {
    // ✅ Role validation
    if (!['WAREHOUSE_INCHARGE', 'ADMIN'].includes(userRole)) {
      throw new Error('Only warehouse incharge or admin can dispatch departure orders');
    }

    // Check if departure order exists and is approved
    const departureOrder = await prisma.departureOrder.findUnique({
      where: { departure_order_id: departureOrderId },
      include: {
        products: {
          include: {
            product: true,
          }
        },
      }
    });

    if (!departureOrder) {
      throw new Error('Departure order not found');
    }

    if (departureOrder.order_status !== 'APPROVED') {
      throw new Error(`Cannot dispatch departure order with status: ${departureOrder.order_status}. Order must be approved first.`);
    }

    if (departureOrder.dispatch_status === 'DISPATCHED') {
      throw new Error('Departure order has already been dispatched');
    }

    // ✅ MANDATORY: Validate that inventory selections are provided for dispatch
    if (!dispatchData.inventory_selections || dispatchData.inventory_selections.length === 0) {
      throw new Error('Inventory selections are required for dispatch');
    }

    // ✅ Validate each inventory selection
    const validatedCells = [];
    for (const selection of dispatchData.inventory_selections) {
      const validated = await validateSelectedCell(
        selection.inventory_id,
        parseInt(selection.requested_qty),
        parseFloat(selection.requested_weight)
      );
      validatedCells.push(validated);
    }

    // ✅ Process the actual dispatch (remove from inventory)
    const dispatchResult = await processInventoryDispatch(
      departureOrderId,
      validatedCells,
      userId,
      dispatchData
    );

    // Update departure order with dispatch information
    const updatedOrder = await prisma.departureOrder.update({
      where: { departure_order_id: departureOrderId },
      data: {
        order_status: 'DISPATCHED',
        dispatch_status: 'DISPATCHED',
        dispatched_by: userId,
        dispatched_at: new Date(),
        dispatch_notes: dispatchData.dispatch_notes || null,
      },
      include: {
        products: true,
        dispatcher: {
          select: {
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    return {
      success: true,
      message: 'Departure order dispatched successfully',
      departure_order: updatedOrder,
      dispatch_result: dispatchResult,
      dispatched_by: userId,
      dispatched_at: new Date(),
    };
  } catch (error) {
    console.error("Error in dispatchDepartureOrder:", error);
    throw new Error(`Failed to dispatch departure order: ${error.message}`);
  }
}

// ✅ NEW: Batch dispatch multiple approved departure orders
async function batchDispatchDepartureOrders(departureOrderIds, userId, userRole, batchDispatchData = {}) {
  try {
    // ✅ Role validation
    if (!['WAREHOUSE_INCHARGE', 'ADMIN'].includes(userRole)) {
      throw new Error('Only warehouse incharge or admin can dispatch departure orders');
    }

    if (!departureOrderIds || departureOrderIds.length === 0) {
      throw new Error('At least one departure order ID is required');
    }

    const results = [];
    const errors = [];

    // Process each departure order
    for (const departureOrderId of departureOrderIds) {
      try {
        const dispatchData = batchDispatchData[departureOrderId] || {};
        const result = await dispatchDepartureOrder(departureOrderId, userId, userRole, dispatchData);
        results.push({
          departure_order_id: departureOrderId,
          success: true,
          result: result,
        });
      } catch (error) {
        errors.push({
          departure_order_id: departureOrderId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Batch dispatch completed. ${results.length} successful, ${errors.length} failed.`,
      successful_dispatches: results,
      failed_dispatches: errors,
      total_processed: departureOrderIds.length,
      dispatched_by: userId,
      dispatched_at: new Date(),
    };
  } catch (error) {
    console.error("Error in batchDispatchDepartureOrders:", error);
    throw new Error(`Failed to batch dispatch departure orders: ${error.message}`);
  }
}

// ✅ NEW: Process inventory dispatch (remove from inventory cells)
async function processInventoryDispatch(departureOrderId, validatedCells, userId, dispatchData) {
  return await prisma.$transaction(async (tx) => {
    const cellAllocations = [];
    
    for (const cell of validatedCells) {
      // ✅ Calculate proportional package quantity
      const originalPackageRatio = cell.available_package_qty > 0 ? 
        cell.available_package_qty / cell.available_qty : 1;
      const requestedPackageQty = Math.ceil(cell.requested_qty * originalPackageRatio);
      
      // ✅ Calculate proportional volume if available
      const originalVolumeRatio = cell.available_volume > 0 ? 
        cell.available_volume / cell.available_qty : 0;
      const requestedVolume = cell.requested_qty * originalVolumeRatio;

      // Update inventory (DECREMENT - removing from warehouse)
      await tx.inventory.update({
        where: { inventory_id: cell.inventory_id },
        data: {
          current_quantity: { decrement: cell.requested_qty },
          current_package_quantity: { decrement: requestedPackageQty },
          current_weight: { decrement: cell.requested_weight },
          current_volume: requestedVolume > 0 ? { decrement: requestedVolume } : undefined,
          status: cell.will_be_empty ? "DEPLETED" : "AVAILABLE",
        },
      });

      // Create cell assignment with packaging_code
      await tx.cellAssignment.create({
        data: {
          departure_order_id: departureOrderId,
          cell_id: cell.cell_id,
          assigned_by: userId,
          packaging_quantity: requestedPackageQty,
          weight: cell.requested_weight,
          packaging_code: cell.packaging_code || 31, // Default packaging code
          status: "COMPLETED",
        },
      });

      // ✅ Update cell status
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
            current_packaging_qty: { decrement: requestedPackageQty },
            current_weight: { decrement: cell.requested_weight },
            currentUsage: requestedVolume > 0 ? { decrement: requestedVolume } : undefined,
          },
        });
      }

      // ✅ Create inventory log for traceability
      await tx.inventoryLog.create({
        data: {
          user_id: userId,
          product_id: cell.product_id,
          movement_type: MovementType.DEPARTURE,
          quantity_change: -cell.requested_qty,
          package_change: -requestedPackageQty,
          weight_change: -cell.requested_weight,
          volume_change: requestedVolume > 0 ? -requestedVolume : null,
          departure_order_id: departureOrderId,
          warehouse_id: cell.warehouse_id,
          cell_id: cell.cell_id,
          product_status: cell.product_status || "PAL_NORMAL",
          status_code: cell.status_code || 37,
          notes: `DISPATCH: ${cell.requested_qty} units (${requestedPackageQty} packages, ${cell.requested_weight} kg) of ${cell.product_code} (${cell.product_name}) | ` +
                 `Lot: ${cell.lot_series} | Entry Order: ${cell.entry_order_no} | ` +
                 `Expiry: ${cell.expiration_date} | Position: ${cell.cell_reference} | ` +
                 `Dispatch Notes: ${dispatchData.dispatch_notes || 'N/A'}`,
        },
      });

      cellAllocations.push({
        cell_reference: cell.cell_reference,
        warehouse_name: cell.warehouse_name,
        entry_order_no: cell.entry_order_no,
        product_code: cell.product_code,
        product_name: cell.product_name,
        lot_series: cell.lot_series,
        expiration_date: cell.expiration_date,
        dispatched_qty: cell.requested_qty,
        dispatched_packages: requestedPackageQty,
        dispatched_weight: cell.requested_weight,
        dispatched_volume: requestedVolume,
        remaining_qty: cell.remaining_qty,
        remaining_weight: cell.remaining_weight,
        cell_depleted: cell.will_be_empty,
        packaging_code: cell.packaging_code || 31,
      });
    }

    return {
      cellAllocations,
      totals: {
        total_qty: validatedCells.reduce((sum, c) => sum + c.requested_qty, 0),
        total_weight: validatedCells.reduce((sum, c) => sum + c.requested_weight, 0),
        total_packages: cellAllocations.reduce((sum, c) => sum + c.dispatched_packages, 0),
        cells_affected: validatedCells.length,
        cells_depleted: validatedCells.filter((c) => c.will_be_empty).length,
      },
    };
  }, {
    maxWait: 30000, // 30 seconds
    timeout: 30000, // 30 seconds
  });
}

// ✅ NEW: Get expiry urgency dashboard data for departure planning
async function getExpiryUrgencyDashboard(warehouseId = null) {
  try {
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
              },
            },
            entry_order: {
              select: {
                entry_order_no: true,
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
      },
      orderBy: [
        { entry_order_product: { expiration_date: "asc" } }, // ✅ PRIMARY: EXPIRY-BASED sorting
        { entry_order_product: { entry_order: { entry_date_time: "asc" } } },
      ],
    });

    // ✅ Filter allocations with available inventory
    const availableAllocations = allocations.filter(allocation => {
      const inventory = allocation.inventory[0];
      return inventory && 
             inventory.status === "AVAILABLE" && 
             inventory.current_quantity > 0;
    });

    const currentDate = new Date();
    
    // ✅ Categorize by expiry urgency
    const urgencyCategories = {
      EXPIRED: [],
      URGENT: [],     // ≤ 7 days
      WARNING: [],    // ≤ 30 days
      NORMAL: []      // > 30 days or no expiry
    };

    let totalQuantity = 0;
    let totalWeight = 0;
    let totalProducts = new Set();
    let totalSuppliers = new Set();
    let totalWarehouses = new Set();

    availableAllocations.forEach(allocation => {
      const inventory = allocation.inventory[0];
      const expiryDate = allocation.entry_order_product.expiration_date;
      
      let daysToExpiry = null;
      let urgencyLevel = 'NORMAL';
      
      if (expiryDate) {
        daysToExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry < 0) {
          urgencyLevel = 'EXPIRED';
        } else if (daysToExpiry <= 7) {
          urgencyLevel = 'URGENT';
        } else if (daysToExpiry <= 30) {
          urgencyLevel = 'WARNING';
        } else {
          urgencyLevel = 'NORMAL';
        }
      }

      const itemData = {
        allocation_id: allocation.allocation_id,
        inventory_id: inventory.inventory_id,
        product_id: allocation.entry_order_product.product.product_id,
        product_code: allocation.entry_order_product.product.product_code,
        product_name: allocation.entry_order_product.product.name,
        manufacturer: allocation.entry_order_product.product.manufacturer,
        supplier_name: allocation.entry_order_product.supplier?.name,
        entry_order_no: allocation.entry_order_product.entry_order.entry_order_no,
        entry_date_time: allocation.entry_order_product.entry_order.entry_date_time,
        manufacturing_date: allocation.entry_order_product.manufacturing_date,
        expiration_date: allocation.entry_order_product.expiration_date,
        lot_series: allocation.entry_order_product.lot_series,
        cell_reference: `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`,
        warehouse_name: allocation.cell.warehouse.name,
        warehouse_id: allocation.cell.warehouse.warehouse_id,
        available_quantity: inventory.current_quantity,
        available_packages: inventory.current_package_quantity,
        available_weight: parseFloat(inventory.current_weight),
        available_volume: inventory.current_volume ? parseFloat(inventory.current_volume) : null,
        presentation: allocation.presentation,
        product_status: allocation.product_status,
        status_code: allocation.status_code,
        days_to_expiry: daysToExpiry,
        urgency_level: urgencyLevel,
        is_expired: urgencyLevel === 'EXPIRED',
        is_urgent: urgencyLevel === 'URGENT',
        is_warning: urgencyLevel === 'WARNING',
        is_normal: urgencyLevel === 'NORMAL',
        dispatch_priority: urgencyLevel === 'EXPIRED' ? 1 : 
                          urgencyLevel === 'URGENT' ? 2 : 
                          urgencyLevel === 'WARNING' ? 3 : 4,
      };

      urgencyCategories[urgencyLevel].push(itemData);

      // Accumulate totals
      totalQuantity += inventory.current_quantity;
      totalWeight += parseFloat(inventory.current_weight);
      totalProducts.add(allocation.entry_order_product.product.product_id);
      totalSuppliers.add(allocation.entry_order_product.supplier?.supplier_id);
      totalWarehouses.add(allocation.cell.warehouse.warehouse_id);
    });

    // ✅ Calculate summary statistics
    const summary = {
      total_items: availableAllocations.length,
      total_products: totalProducts.size,
      total_suppliers: totalSuppliers.size,
      total_warehouses: totalWarehouses.size,
      total_quantity: totalQuantity,
      total_weight: totalWeight,
      
      // Urgency breakdown
      expired_items: urgencyCategories.EXPIRED.length,
      urgent_items: urgencyCategories.URGENT.length,
      warning_items: urgencyCategories.WARNING.length,
      normal_items: urgencyCategories.NORMAL.length,
      
      // Urgency percentages
      expired_percentage: availableAllocations.length > 0 ? 
        ((urgencyCategories.EXPIRED.length / availableAllocations.length) * 100).toFixed(1) : 0,
      urgent_percentage: availableAllocations.length > 0 ? 
        ((urgencyCategories.URGENT.length / availableAllocations.length) * 100).toFixed(1) : 0,
      warning_percentage: availableAllocations.length > 0 ? 
        ((urgencyCategories.WARNING.length / availableAllocations.length) * 100).toFixed(1) : 0,
      normal_percentage: availableAllocations.length > 0 ? 
        ((urgencyCategories.NORMAL.length / availableAllocations.length) * 100).toFixed(1) : 0,

      // Action recommendations
      requires_immediate_action: urgencyCategories.EXPIRED.length > 0,
      requires_urgent_planning: urgencyCategories.URGENT.length > 0,
      requires_attention: urgencyCategories.WARNING.length > 0,
      
      // Top priority items (expired + urgent)
      high_priority_count: urgencyCategories.EXPIRED.length + urgencyCategories.URGENT.length,
    };

    // ✅ Top products by urgency (most expired/urgent first)
    const topUrgentProducts = [...urgencyCategories.EXPIRED, ...urgencyCategories.URGENT]
      .slice(0, 10)
      .map(item => ({
        product_code: item.product_code,
        product_name: item.product_name,
        days_to_expiry: item.days_to_expiry,
        urgency_level: item.urgency_level,
        available_quantity: item.available_quantity,
        cell_reference: item.cell_reference,
        warehouse_name: item.warehouse_name,
      }));

    return {
      success: true,
      message: "Expiry urgency dashboard data retrieved successfully",
      summary,
      urgency_categories: {
        expired: urgencyCategories.EXPIRED,
        urgent: urgencyCategories.URGENT,
        warning: urgencyCategories.WARNING,
        normal: urgencyCategories.NORMAL.slice(0, 50), // Limit normal items for performance
      },
      top_urgent_products: topUrgentProducts,
      fifo_method: "EXPIRY_DATE_PRIORITY",
      dashboard_generated_at: new Date().toISOString(),
      warehouse_filter: warehouseId || "ALL_WAREHOUSES",
    };
  } catch (error) {
    console.error("Error in getExpiryUrgencyDashboard:", error);
    throw new Error(`Failed to fetch expiry urgency dashboard: ${error.message}`);
  }
}

// ✅ NEW: Create comprehensive departure order (enhanced version with all fields)
async function createComprehensiveDepartureOrder(comprehensiveData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create base order
    const newOrder = await tx.order.create({
      data: {
        order_type: "DEPARTURE",
        status: comprehensiveData.status || "PENDING",
        organisation_id: comprehensiveData.organisation_id,
        created_by: comprehensiveData.created_by,
        priority: comprehensiveData.priority_level || "NORMAL",
      },
    });

    // 2. Generate departure order number if not provided
    let departureOrderNo = comprehensiveData.departure_order_code;
    if (!departureOrderNo) {
      departureOrderNo = await getCurrentDepartureOrderNo();
    }

    // 3. Create comprehensive departure order
    const departureOrderData = {
      order_id: newOrder.order_id,
      departure_order_no: departureOrderNo,

      // Document info
      document_type_ids: comprehensiveData.document_type_id ? [comprehensiveData.document_type_id] : [],
      registration_date: new Date(),
      document_date: comprehensiveData.document_date ? new Date(comprehensiveData.document_date) : null,
      departure_date_time: comprehensiveData.departure_date ? new Date(comprehensiveData.departure_date) : null,
      created_by: comprehensiveData.created_by,

      // Order details
      order_status: comprehensiveData.status || "PENDING",
      destination_point: comprehensiveData.arrival_point || null,
      transport_type: comprehensiveData.transport_type || null,
      carrier_name: comprehensiveData.carrier_name || null,
      observation: comprehensiveData.observations || null,

      // Document fields
      dispatch_document_number: comprehensiveData.dispatch_document_number || null,
      uploaded_documents: comprehensiveData.uploaded_documents || null,

      // Review status
      review_status: "PENDING",

      // Warehouse assignment
      warehouse_id: comprehensiveData.warehouse_id || null,
    };

    // Add customer_id or client_id dynamically based on what's provided
    if (comprehensiveData.client_id) {
      departureOrderData.client_id = comprehensiveData.client_id;
    } else if (comprehensiveData.customer_id && comprehensiveData.customer_id !== "Monish Testing 1") {
      departureOrderData.customer_id = comprehensiveData.customer_id;
    }

    const newDepartureOrder = await tx.departureOrder.create({
      data: departureOrderData,
      include: {
        customer: {
          select: {
            customer_id: true,
            name: true,
          }
        },
        client: {
          select: {
            client_id: true,
            company_name: true,
            first_names: true,
            last_name: true,
            client_type: true,
          }
        },
        warehouse: {
          select: {
            warehouse_id: true,
            name: true,
            location: true,
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
          }
        },
        order: {
          select: {
            order_id: true,
            order_type: true,
            status: true,
            created_at: true,
            organisation: {
              select: {
                organisation_id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    // 4. Create comprehensive departure products
    const departureProducts = [];
    if (comprehensiveData.products && comprehensiveData.products.length > 0) {
      for (const productData of comprehensiveData.products) {
        // Validate product exists
        const product = await tx.product.findUnique({
          where: { product_id: String(productData.product_id) }
        });
        if (!product) {
          throw new Error(`Product with ID ${productData.product_id} not found`);
        }

        const departureProduct = await tx.departureOrderProduct.create({
          data: {
            departure_order_id: newDepartureOrder.departure_order_id,
            product_code: productData.product_code,
            product_id: String(productData.product_id),
            lot_series: productData.lot_number || null,
            requested_quantity: parseInt(productData.requested_quantity),
            requested_packages: parseInt(productData.packaging_quantity || productData.requested_quantity),
            requested_pallets: parseInt(productData.pallet_quantity) || Math.ceil(productData.requested_quantity / 200),
            presentation: productData.presentation || "CAJA",
            requested_weight: parseFloat(productData.requested_weight),
            requested_volume: productData.requested_volume ? parseFloat(productData.requested_volume) : null,
            unit_price: productData.unit_price ? parseFloat(productData.unit_price) : null,
            total_value: productData.unit_price ? parseFloat(productData.unit_price) * parseInt(productData.requested_quantity) : null,
            temperature_requirement: productData.temperature_requirement || "AMBIENTE",
            special_handling: comprehensiveData.special_instructions || null,
            delivery_instructions: productData.delivery_instructions || null,
          },
          include: {
            product: {
              select: {
                product_code: true,
                name: true,
                manufacturer: true,
              }
            }
          }
        });

        departureProducts.push({
          ...departureProduct,
          product_name: departureProduct.product.name,
          entry_order_no: productData.entry_order_no,
          guide_number: productData.guide_number,
        });
      }
    }

    return {
      success: true,
      message: "Comprehensive departure order created successfully",
      departure_order: {
        ...newDepartureOrder,
        // Workflow status
        workflow_status: "PENDING_APPROVAL",
        can_be_edited: newDepartureOrder.order_status === 'REVISION',
        can_be_approved: newDepartureOrder.order_status === 'PENDING',
        can_be_dispatched: newDepartureOrder.order_status === 'APPROVED',
        
        // Comprehensive fields summary
        comprehensive_fields_captured: {
          departure_order_number: newDepartureOrder.departure_order_no,
          customer_or_client: comprehensiveData.customer_id || comprehensiveData.client_id,
          warehouse_assigned: !!comprehensiveData.warehouse_id,
          document_type_provided: !!comprehensiveData.document_type_id,
          dispatch_document_number: !!comprehensiveData.dispatch_document_number,
          departure_date: !!comprehensiveData.departure_date,
          transport_details: !!comprehensiveData.transport_type,
          destination_provided: !!comprehensiveData.arrival_point,
          has_products: departureProducts.length > 0,
          special_instructions: !!comprehensiveData.special_instructions,
        }
      },
      departure_products: departureProducts,
      comprehensive_data: {
        total_products: departureProducts.length,
        total_requested_quantity: departureProducts.reduce((sum, p) => sum + p.requested_quantity, 0),
        total_requested_weight: departureProducts.reduce((sum, p) => sum + parseFloat(p.requested_weight || 0), 0),
        priority_level: comprehensiveData.priority_level || "NORMAL",
        creation_source: "COMPREHENSIVE_API",
      },
      next_steps: [
        "Comprehensive departure order created and pending approval",
        "Warehouse incharge or admin can approve, reject, or request revision",
        "Once approved, inventory can be allocated and dispatched"
      ],
      approval_workflow: {
        current_status: "PENDING",
        required_approvers: ["WAREHOUSE_INCHARGE", "ADMIN"],
        possible_actions: ["APPROVE", "REJECT", "REQUEST_REVISION"]
      }
    };
  }, {
    maxWait: 30000,
    timeout: 30000,
  });
}

// ✅ NEW: Get comprehensive departure orders with enhanced data
async function getComprehensiveDepartureOrders(organisationId = null, userRole = null, userId = null, filters = {}) {
  try {
    const whereClause = {};

    // Organisation filter
    if (organisationId) {
      whereClause.order = {
        organisation_id: organisationId
      };
    }

    // Role-based filtering
    if (userRole === 'CLIENT') {
      // CLIENT users can only see their own orders
      whereClause.created_by = userId;
    }

    // Status filtering
    if (filters.status) {
      whereClause.order_status = filters.status;
    }

    // Date range filtering
    if (filters.startDate || filters.endDate) {
      whereClause.registration_date = {};
      if (filters.startDate) {
        whereClause.registration_date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.registration_date.lte = new Date(filters.endDate);
      }
    }

    const departureOrders = await prisma.departureOrder.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            customer_id: true,
            name: true,
          }
        },
        client: {
          select: {
            client_id: true,
            company_name: true,
            first_names: true,
            last_name: true,
            client_type: true,
          }
        },
        warehouse: {
          select: {
            warehouse_id: true,
            name: true,
            location: true,
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: {
              select: {
                role_id: true,
                name: true,
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: {
              select: {
                role_id: true,
                name: true,
              }
            }
          }
        },
        dispatcher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: {
              select: {
                role_id: true,
                name: true,
              }
            }
          }
        },
        order: {
          select: {
            order_id: true,
            order_type: true,
            status: true,
            created_at: true,
            organisation: {
              select: {
                organisation_id: true,
                name: true,
              }
            }
          }
        },
        products: {
          include: {
            product: {
              select: {
                product_id: true,
                product_code: true,
                name: true,
                manufacturer: true,
              }
            }
          }
        },
        departureAllocations: {
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
                  }
                }
              }
            },
            source_allocation: {
              select: {
                allocation_id: true,
                entry_order_product: {
                  select: {
                    entry_order: {
                      select: {
                        entry_order_no: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { registration_date: 'desc' },
        { departure_order_no: 'desc' }
      ]
    });

    // Transform data to comprehensive format
    const comprehensiveOrders = departureOrders.map(order => {
      // Calculate totals
      const totalQuantity = order.products.reduce((sum, p) => sum + p.requested_quantity, 0);
      const totalWeight = order.products.reduce((sum, p) => sum + parseFloat(p.requested_weight || 0), 0);
      const totalValue = order.products.reduce((sum, p) => sum + parseFloat(p.total_value || 0), 0);
      const totalProducts = order.products.length;

      // Calculate allocation status
      const totalAllocated = order.departureAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
      const allocationPercentage = totalQuantity > 0 ? ((totalAllocated / totalQuantity) * 100).toFixed(1) : 0;

      // Workflow status
      const workflowStatus = getWorkflowStatus(order.order_status, order.review_status, order.dispatch_status);

      return {
        ...order,
        // Comprehensive summary
        comprehensive_summary: {
          total_products: totalProducts,
          total_quantity: totalQuantity,
          total_weight: totalWeight,
          total_value: totalValue,
          total_allocated: totalAllocated,
          allocation_percentage: parseFloat(allocationPercentage),
          is_fully_allocated: allocationPercentage >= 100,
          days_since_creation: Math.ceil((new Date() - new Date(order.registration_date)) / (1000 * 60 * 60 * 24)),
        },

        // Workflow information
        workflow_info: {
          current_status: workflowStatus.status,
          can_be_edited: workflowStatus.canEdit,
          can_be_approved: workflowStatus.canApprove,
          can_be_rejected: workflowStatus.canReject,
          can_be_dispatched: workflowStatus.canDispatch,
          next_possible_actions: workflowStatus.nextActions,
          required_approvers: workflowStatus.requiredApprovers,
        },

        // Enhanced product information
        products_summary: order.products.map(product => ({
          ...product,
          allocation_status: {
            allocated_quantity: order.departureAllocations
              .filter(a => a.departure_order_product_id === product.departure_order_product_id)
              .reduce((sum, a) => sum + a.allocated_quantity, 0),
            allocation_percentage: product.requested_quantity > 0 ? 
              ((order.departureAllocations
                .filter(a => a.departure_order_product_id === product.departure_order_product_id)
                .reduce((sum, a) => sum + a.allocated_quantity, 0) / product.requested_quantity) * 100).toFixed(1) : 0,
          }
        })),

        // Cell allocation summary
        cell_allocations_summary: order.departureAllocations.map(allocation => ({
          allocation_id: allocation.allocation_id,
          cell_reference: `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`,
          warehouse_name: allocation.cell.warehouse.name,
          allocated_quantity: allocation.allocated_quantity,
          allocated_weight: parseFloat(allocation.allocated_weight),
          source_entry_order: allocation.source_allocation?.entry_order_product?.entry_order?.entry_order_no,
          product_status: allocation.product_status,
          status_code: allocation.status_code,
        })),

        // Time tracking
        time_tracking: {
          created_at: order.registration_date,
          reviewed_at: order.reviewed_at,
          dispatched_at: order.dispatched_at,
          days_in_current_status: calculateDaysInStatus(order),
          estimated_dispatch_date: estimateDispatchDate(order),
        }
      };
    });

    return {
      success: true,
      message: "Comprehensive departure orders retrieved successfully",
      data: comprehensiveOrders,
      summary: {
        total_orders: comprehensiveOrders.length,
        status_breakdown: getStatusBreakdown(comprehensiveOrders),
        total_value: comprehensiveOrders.reduce((sum, o) => sum + o.comprehensive_summary.total_value, 0),
        total_products: comprehensiveOrders.reduce((sum, o) => sum + o.comprehensive_summary.total_products, 0),
        average_allocation_percentage: comprehensiveOrders.length > 0 ? 
          (comprehensiveOrders.reduce((sum, o) => sum + o.comprehensive_summary.allocation_percentage, 0) / comprehensiveOrders.length).toFixed(1) : 0,
      },
      filters_applied: {
        organisation_id: organisationId,
        user_role: userRole,
        user_id: userRole === 'CLIENT' ? userId : null,
        additional_filters: filters,
      }
    };

  } catch (error) {
    console.error("Error in getComprehensiveDepartureOrders:", error);
    throw new Error(`Failed to fetch comprehensive departure orders: ${error.message}`);
  }
}

// Helper function to determine workflow status
function getWorkflowStatus(orderStatus, reviewStatus, dispatchStatus) {
  const status = {
    status: orderStatus,
    canEdit: orderStatus === 'REVISION',
    canApprove: orderStatus === 'PENDING' && reviewStatus === 'PENDING',
    canReject: orderStatus === 'PENDING' && reviewStatus === 'PENDING',
    canDispatch: orderStatus === 'APPROVED' && dispatchStatus === 'NOT_DISPATCHED',
    nextActions: [],
    requiredApprovers: [],
  };

  switch (orderStatus) {
    case 'PENDING':
      status.nextActions = ['APPROVE', 'REJECT', 'REQUEST_REVISION'];
      status.requiredApprovers = ['WAREHOUSE_INCHARGE', 'ADMIN'];
      break;
    case 'APPROVED':
      status.nextActions = ['DISPATCH'];
      status.requiredApprovers = ['WAREHOUSE_INCHARGE', 'ADMIN'];
      break;
    case 'REVISION':
      status.nextActions = ['EDIT', 'RESUBMIT'];
      break;
    case 'DISPATCHED':
      status.nextActions = ['VIEW_DISPATCH_DETAILS'];
      break;
    case 'REJECTED':
      status.nextActions = ['VIEW_REJECTION_REASON'];
      break;
  }

  return status;
}

// Helper function to get status breakdown
function getStatusBreakdown(orders) {
  const breakdown = {};
  orders.forEach(order => {
    const status = order.order_status;
    breakdown[status] = (breakdown[status] || 0) + 1;
  });
  return breakdown;
}

// Helper function to calculate days in current status
function calculateDaysInStatus(order) {
  let statusDate = order.registration_date;
  
  if (order.reviewed_at) {
    statusDate = order.reviewed_at;
  }
  if (order.dispatched_at) {
    statusDate = order.dispatched_at;
  }
  
  return Math.ceil((new Date() - new Date(statusDate)) / (1000 * 60 * 60 * 24));
}

// Helper function to estimate dispatch date
function estimateDispatchDate(order) {
  if (order.order_status === 'DISPATCHED') {
    return order.dispatched_at;
  }
  
  if (order.departure_date_time) {
    return order.departure_date_time;
  }
  
  // Estimate based on current status
  const daysToAdd = order.order_status === 'PENDING' ? 3 : 
                   order.order_status === 'APPROVED' ? 1 : 7;
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
  return estimatedDate;
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
  getFifoLocationsForProduct,
  getSuggestedFifoAllocation,
  approveDepartureOrder,
  rejectDepartureOrder,
  requestRevisionDepartureOrder,
  dispatchDepartureOrder,
  batchDispatchDepartureOrders,
  processInventoryDispatch,
  getExpiryUrgencyDashboard,
  createComprehensiveDepartureOrder,
  getComprehensiveDepartureOrders, // ✅ NEW: Get comprehensive orders
};
