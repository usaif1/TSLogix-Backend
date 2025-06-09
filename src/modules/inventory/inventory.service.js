const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get approved entry orders ready for inventory assignment
 */
async function getApprovedEntryOrdersForInventory(organisationId = null) {
  const where = {
    review_status: "APPROVED",
  };

  // Filter by organisation if provided (for non-admin users)
  if (organisationId) {
    where.order = { organisation_id: organisationId };
  }

  const orders = await prisma.entryOrder.findMany({
    where,
    select: {
      entry_order_id: true,
      entry_order_no: true,
      registration_date: true,
      document_date: true,
      entry_date_time: true,
      review_status: true,
      total_volume: true,
      total_weight: true,
      total_pallets: true,
      observation: true,
      
      // Relations
      origin: { 
        select: { 
          name: true, 
          type: true 
        } 
      },
      documentType: { 
        select: { 
          name: true, 
          type: true 
        } 
      },
      warehouse: { 
        select: { 
          warehouse_id: true,
          name: true 
        } 
      },
      creator: { 
        select: { 
          first_name: true, 
          last_name: true,
          organisation: { select: { name: true } }
        } 
      },
      
      // Products in this entry order
      products: {
        select: {
          entry_order_product_id: true,
          serial_number: true,
          product_code: true,
          lot_series: true,
          inventory_quantity: true,
          package_quantity: true,
          quantity_pallets: true,
          presentation: true,
          weight_kg: true,
          volume_m3: true,
          insured_value: true,
          temperature_range: true,
          guide_number: true,
          
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
            },
          },
          
          supplier: {
            select: {
              supplier_id: true,
              name: true,
            },
          },
          
          // Check existing allocations
          inventoryAllocations: {
            select: {
              allocation_id: true,
              inventory_quantity: true,
              package_quantity: true,
              weight_kg: true,
            },
          },
        },
      },
    },
    orderBy: { registration_date: "desc" },
  });

  return orders.map((order) => {
    // Calculate total quantities and allocation status
    const totalInventoryQuantity = order.products.reduce((sum, p) => sum + p.inventory_quantity, 0);
    const totalPackageQuantity = order.products.reduce((sum, p) => sum + p.package_quantity, 0);
    const totalWeight = order.products.reduce((sum, p) => sum + parseFloat(p.weight_kg), 0);
    
    // Calculate allocated quantities
    const totalAllocatedQuantity = order.products.reduce((sum, p) => 
      sum + p.inventoryAllocations.reduce((allocSum, alloc) => allocSum + alloc.inventory_quantity, 0), 0
    );
    
    const allocationPercentage = totalInventoryQuantity > 0 ? (totalAllocatedQuantity / totalInventoryQuantity) * 100 : 0;
    const isFullyAllocated = totalAllocatedQuantity >= totalInventoryQuantity;
    
    // Filter products that still need allocation
    const productsNeedingAllocation = order.products.filter(product => {
      const allocatedQuantity = product.inventoryAllocations.reduce((sum, alloc) => sum + alloc.inventory_quantity, 0);
      return allocatedQuantity < product.inventory_quantity;
    });

    return {
      ...order,
      creator_name: `${order.creator.first_name || ""} ${order.creator.last_name || ""}`.trim(),
      organisation_name: order.creator.organisation.name,
      
      // Totals
      total_inventory_quantity: totalInventoryQuantity,
      total_package_quantity: totalPackageQuantity,
      calculated_total_weight: totalWeight,
      
      // Allocation status
      total_allocated_quantity: totalAllocatedQuantity,
      allocation_percentage: allocationPercentage,
      is_fully_allocated: isFullyAllocated,
      products_needing_allocation: productsNeedingAllocation.length,
      
      // Only include products that need allocation in the main products array
      products: productsNeedingAllocation.map(product => {
        const allocatedQuantity = product.inventoryAllocations.reduce((sum, alloc) => sum + alloc.inventory_quantity, 0);
        
        return {
          ...product,
          supplier_name: product.supplier?.name,
          allocated_quantity: allocatedQuantity,
          remaining_quantity: product.inventory_quantity - allocatedQuantity,
        };
      }),
    };
  }).filter(order => order.products_needing_allocation > 0); // Only return orders that still need allocation
}

/**
 * Get specific entry order products for inventory assignment
 */
async function getEntryOrderProductsForInventory(entryOrderId) {
  const entryOrder = await prisma.entryOrder.findUnique({
    where: { 
      entry_order_id: entryOrderId,
      review_status: "APPROVED" 
    },
    select: {
      entry_order_id: true,
      entry_order_no: true,
      warehouse_id: true,
      warehouse: { select: { name: true } },
      
      products: {
        select: {
          entry_order_product_id: true,
          serial_number: true,
          product_code: true,
          lot_series: true,
          inventory_quantity: true,
          package_quantity: true,
          quantity_pallets: true,
          presentation: true,
          weight_kg: true,
          volume_m3: true,
          insured_value: true,
          temperature_range: true,
          guide_number: true,
          manufacturing_date: true,
          expiration_date: true,
          health_registration: true,
          
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
            },
          },
          
          supplier: {
            select: {
              supplier_id: true,
              name: true,
            },
          },
          
          // Check existing allocations
          inventoryAllocations: {
            select: {
              allocation_id: true,
              inventory_quantity: true,
              package_quantity: true,
              quantity_pallets: true,
              weight_kg: true,
              volume_m3: true,
              presentation: true,
              product_status: true,
              guide_number: true,
              observations: true,
              allocated_at: true,
              
              cell: {
                select: {
                  id: true,
                  row: true,
                  bay: true,
                  position: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!entryOrder) {
    throw new Error("Entry order not found or not approved");
  }

  // Transform products with allocation information
  const transformedProducts = entryOrder.products.map(product => {
    const allocatedQuantity = product.inventoryAllocations.reduce((sum, alloc) => sum + alloc.inventory_quantity, 0);
    const allocatedWeight = product.inventoryAllocations.reduce((sum, alloc) => sum + parseFloat(alloc.weight_kg || 0), 0);
    
    // Transform allocations with cell references
    const allocations = product.inventoryAllocations.map(allocation => ({
      ...allocation,
      cellReference: `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`,
    }));

    return {
      ...product,
      supplier_name: product.supplier?.name,
      allocated_quantity: allocatedQuantity,
      remaining_quantity: product.inventory_quantity - allocatedQuantity,
      allocated_weight: allocatedWeight,
      remaining_weight: parseFloat(product.weight_kg) - allocatedWeight,
      can_allocate: allocatedQuantity < product.inventory_quantity,
      allocations: allocations,
    };
  });

  return {
    ...entryOrder,
    products: transformedProducts,
  };
}

/**
 * Assign a specific entry order product to a warehouse cell
 */
async function assignProductToCell(assignmentData) {
  const {
    entry_order_product_id,
    cell_id,
    assigned_by,
    inventory_quantity,
    package_quantity,
    quantity_pallets,
    presentation,
    weight_kg,
    volume_m3,
    guide_number,
    product_status,
    uploaded_documents,
    observations,
    warehouse_id,
  } = assignmentData;

  return await prisma.$transaction(async (tx) => {
    // 1. Validate entry order product exists and is approved
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
        entry_order: {
          select: {
            entry_order_id: true,
            entry_order_no: true,
            review_status: true,
          },
        },
      },
    });

    if (!entryOrderProduct) {
      throw new Error("Entry order product not found");
    }

    if (entryOrderProduct.entry_order.review_status !== "APPROVED") {
      throw new Error("Cannot assign inventory for products from non-approved entry orders");
    }

    // 2. Check available quantities
    const existingAllocations = await tx.inventoryAllocation.findMany({
      where: { entry_order_product_id },
    });
    
    const totalAllocatedQuantity = existingAllocations.reduce((sum, alloc) => sum + alloc.inventory_quantity, 0);
    const totalAllocatedWeight = existingAllocations.reduce((sum, alloc) => sum + parseFloat(alloc.weight_kg), 0);
    
    const availableQuantity = entryOrderProduct.inventory_quantity - totalAllocatedQuantity;
    const availableWeight = parseFloat(entryOrderProduct.weight_kg) - totalAllocatedWeight;

    if (inventory_quantity > availableQuantity) {
      throw new Error(`Not enough inventory quantity. Available: ${availableQuantity}, Requested: ${inventory_quantity}`);
    }
    
    if (parseFloat(weight_kg) > availableWeight) {
      throw new Error(`Not enough weight. Available: ${availableWeight.toFixed(2)} kg, Requested: ${weight_kg} kg`);
    }

    // 3. Verify cell availability
    const cell = await tx.warehouseCell.findUnique({
      where: { id: cell_id },
    });
    
    if (!cell) {
      throw new Error("Cell not found");
    }
    
    if (cell.status !== "AVAILABLE") {
      throw new Error("Cell is not available for assignment");
    }

    // 4. ✅ FIXED: Convert product status string to enum and get status code
    const convertProductStatusToEnum = (statusString, presentation) => {
      // If it's already an enum value, return it
      if (!statusString.includes('-')) {
        return statusString;
      }

      // Extract the condition from the status string (e.g., "30-PAL-NORMAL" -> "NORMAL")
      const parts = statusString.split('-');
      const condition = parts[parts.length - 1]; // NORMAL, DAÑADA, etc.
      const isDamaged = condition.includes('DAÑAD') || condition === 'DAÑADA';

      // Map presentation to enum
      const enumMap = {
        PALETA: isDamaged ? 'PAL_DANADA' : 'PAL_NORMAL',
        CAJA: isDamaged ? 'CAJ_DANADA' : 'CAJ_NORMAL',
        SACO: isDamaged ? 'SAC_DANADO' : 'SAC_NORMAL',
        UNIDAD: isDamaged ? 'UNI_DANADA' : 'UNI_NORMAL',
        PAQUETE: isDamaged ? 'PAQ_DANADO' : 'PAQ_NORMAL',
        TAMBOS: isDamaged ? 'TAM_DANADO' : 'TAM_NORMAL',
        BULTO: isDamaged ? 'BUL_DANADO' : 'BUL_NORMAL',
        OTRO: isDamaged ? 'OTR_DANADO' : 'OTR_NORMAL',
      };

      return enumMap[presentation] || 'OTR_NORMAL';
    };

    const getStatusCode = (presentation, isDamaged = false) => {
      const statusMap = {
        PALETA: isDamaged ? 40 : 30,
        CAJA: isDamaged ? 41 : 31,
        SACO: isDamaged ? 42 : 32,
        UNIDAD: isDamaged ? 43 : 33,
        PAQUETE: isDamaged ? 44 : 34,
        TAMBOS: isDamaged ? 45 : 35,
        BULTO: isDamaged ? 46 : 36,
        OTRO: isDamaged ? 47 : 37,
      };
      return statusMap[presentation] || 37;
    };

    // Convert the product status to the correct enum value
    const productStatusEnum = convertProductStatusToEnum(product_status, presentation);
    const isDamaged = product_status.includes("DAÑAD") || product_status.includes("DAÑADA");
    const statusCode = getStatusCode(presentation, isDamaged);

    // 5. ✅ NEW: Create inventory allocation with quarantine status
    const allocation = await tx.inventoryAllocation.create({
      data: {
        entry_order_id: entryOrderProduct.entry_order_id,
        entry_order_product_id,
        inventory_quantity: parseInt(inventory_quantity),
        package_quantity: parseInt(package_quantity),
        quantity_pallets: parseInt(quantity_pallets) || null,
        presentation,
        weight_kg: parseFloat(weight_kg),
        volume_m3: parseFloat(volume_m3) || null,
        cell_id,
        product_status: productStatusEnum,
        status_code: statusCode,
        quality_status: "CUARENTENA", // ✅ NEW: Start in quarantine
        guide_number,
        uploaded_documents,
        observations: `Initial allocation to quarantine. ${observations || ''}`,
        allocated_by: assigned_by,
      },
    });

    // 6. ✅ NEW: Create actual inventory record in quarantine status
    const inventory = await tx.inventory.create({
      data: {
        allocation_id: allocation.allocation_id,
        product_id: entryOrderProduct.product_id,
        cell_id,
        warehouse_id,
        current_quantity: parseInt(inventory_quantity),
        current_package_quantity: parseInt(package_quantity),
        current_weight: parseFloat(weight_kg),
        current_volume: parseFloat(volume_m3) || null,
        status: "QUARANTINED", // ✅ NEW: Start in quarantine status
        product_status: productStatusEnum,
        status_code: statusCode,
        quality_status: "CUARENTENA", // ✅ NEW: Quarantine quality status
        created_by: assigned_by, // ✅ NEW: Track who created this
      },
    });

    // 7. Update cell status
    await tx.warehouseCell.update({
      where: { id: cell_id },
      data: {
        status: "OCCUPIED",
        currentUsage: { increment: parseFloat(volume_m3) || 0 },
        current_packaging_qty: { increment: parseInt(package_quantity) },
        current_weight: { increment: parseFloat(weight_kg) },
      },
    });

    // 8. Log inventory movement
    const cellRef = `${cell.row}.${String(cell.bay).padStart(2, "0")}.${String(cell.position).padStart(2, "0")}`;
    
    await tx.inventoryLog.create({
      data: {
        user_id: assigned_by,
        product_id: entryOrderProduct.product_id,
        movement_type: "ENTRY",
        quantity_change: parseInt(inventory_quantity),
        package_change: parseInt(package_quantity),
        weight_change: parseFloat(weight_kg),
        volume_change: parseFloat(volume_m3) || null,
        entry_order_id: entryOrderProduct.entry_order_id,
        entry_order_product_id,
        allocation_id: allocation.allocation_id,
        warehouse_id,
        cell_id,
        product_status: productStatusEnum,
        status_code: statusCode,
        notes: `Assigned ${inventory_quantity} units (${package_quantity} packages, ${parseFloat(weight_kg).toFixed(2)} kg) of ${entryOrderProduct.product.product_code} to quarantine in cell ${cellRef}`,
      },
    });

    // 9. ✅ NEW: Create audit log for inventory allocation
    await createAuditLog(
      assigned_by,
      "INVENTORY_ALLOCATED",
      "InventoryAllocation",
      allocation.allocation_id,
      `Allocated ${inventory_quantity} units of ${entryOrderProduct.product.name} to quarantine in cell ${cellRef}`,
      null,
      {
        quantity: parseInt(inventory_quantity),
        cell: cellRef,
        quality_status: "CUARENTENA",
        weight: parseFloat(weight_kg)
      },
      {
        entry_order_no: entryOrderProduct.entry_order.entry_order_no,
        product_code: entryOrderProduct.product.product_code
      }
    );

    return {
      allocation,
      inventory,
      cellReference: cellRef,
      product: entryOrderProduct.product,
    };
  });
}

/**
 * Get available cells in a specific warehouse for assignment
 */
async function getAvailableCells(warehouseId) {
  return await prisma.warehouseCell.findMany({
    where: {
      warehouse_id: warehouseId,
      status: "AVAILABLE",
    },
    select: {
      id: true,
      row: true,
      bay: true,
      position: true,
      capacity: true,
      currentUsage: true,
      current_packaging_qty: true,
      current_weight: true,
      status: true,
      kind: true,           // ✅ FIXED: Use 'kind' instead of 'cellKind'
      cell_role: true,      // ✅ FIXED: Use 'cell_role' instead of 'cellRole'
    },
    orderBy: [{ row: "asc" }, { bay: "asc" }, { position: "asc" }],
  });
}

/**
 * Get inventory summary by product and location with movement logs including departures
 */
async function getInventorySummary(filters = {}) {
  const { warehouse_id, product_id, status, include_logs = true } = filters;

  const where = {};
  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (product_id) where.product_id = product_id;
  if (status) where.status = status;

  const inventory = await prisma.inventory.findMany({
    where,
    select: {
      inventory_id: true,
      current_quantity: true,
      current_package_quantity: true,
      current_weight: true,
      current_volume: true,
      status: true,
      product_status: true,
      status_code: true,
      created_at: true,
      last_updated: true,

      product: {
        select: {
          product_id: true,
          product_code: true,
          name: true,
          manufacturer: true,
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

      warehouse: {
        select: {
          warehouse_id: true,
          name: true,
        },
      },

      allocation: {
        select: {
          allocation_id: true,
          guide_number: true,
          observations: true,
          allocated_at: true,
          quality_status: true,

          entry_order: {
            select: {
              entry_order_no: true,
              registration_date: true,
            },
          },

          entry_order_product: {
            select: {
              lot_series: true,
              manufacturing_date: true,
              expiration_date: true,
            },
          },
        },
      },
    },
    orderBy: [
      { warehouse: { name: "asc" } },
      { product: { product_code: "asc" } },
      { cell: { row: "asc" } },
      { cell: { bay: "asc" } },
      { cell: { position: "asc" } },
    ],
  });

  // If logs requested, get inventory movement logs for each item
  if (include_logs === true || include_logs === 'true') {
    const enrichedInventory = await Promise.all(
      inventory.map(async (item) => {
        // Get movement logs for this inventory item
        const movementLogs = await prisma.inventoryLog.findMany({
          where: {
            OR: [
              { product_id: item.product.product_id, cell_id: item.cell.id },
              { allocation_id: item.allocation?.allocation_id },
            ],
          },
          select: {
            log_id: true,
            timestamp: true,
            movement_type: true,
            quantity_change: true,
            package_change: true,
            weight_change: true,
            volume_change: true,
            product_status: true,
            status_code: true,
            
            // Entry order information
            entry_order_id: true,
            entry_order_product_id: true,
            
            // Departure order information  
            departure_order_id: true,
            departure_order_product_id: true,
            
            // User information
            user_id: true,
            
            // Location information
            warehouse_id: true,
            cell_id: true,
          },
          orderBy: { timestamp: 'desc' },
          take: 20, // Limit to last 20 movements
        });

        // Calculate movement summary
        const movementSummary = {
          total_entries: movementLogs.filter(log => log.movement_type === 'ENTRY').length,
          total_departures: movementLogs.filter(log => log.movement_type === 'DEPARTURE').length,
          total_quantity_in: movementLogs.filter(log => log.movement_type === 'ENTRY').reduce((sum, log) => sum + (log.quantity_change || 0), 0),
          total_quantity_out: Math.abs(movementLogs.filter(log => log.movement_type === 'DEPARTURE').reduce((sum, log) => sum + (log.quantity_change || 0), 0)),
          last_entry: movementLogs.find(log => log.movement_type === 'ENTRY')?.timestamp,
          last_departure: movementLogs.find(log => log.movement_type === 'DEPARTURE')?.timestamp,
        };

        return {
          ...item,
          cell_reference: `${item.cell.row}.${String(item.cell.bay).padStart(2, '0')}.${String(item.cell.position).padStart(2, '0')}`,
          movement_logs: movementLogs,
          movement_summary: movementSummary,
        };
      })
    );

    return enrichedInventory;
  }

  // Return basic inventory without logs
  return inventory.map(item => ({
    ...item,
    cell_reference: `${item.cell.row}.${String(item.cell.bay).padStart(2, '0')}.${String(item.cell.position).padStart(2, '0')}`,
  }));
}

/** Fetch all warehouses */
async function getAllWarehouses() {
  return await prisma.warehouse.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      warehouse_id: true,
      name: true,
      location: true,
      capacity: true,
      max_occupancy: true,
    },
    orderBy: { name: "asc" },
  });
}

/** Fetch warehouse cells with optional status filter */
async function getWarehouseCells(warehouseId, statusFilter = null) {
  const where = { warehouse_id: warehouseId };
  if (statusFilter) where.status = statusFilter;

  return await prisma.warehouseCell.findMany({
    where,
    select: {
      id: true,
      row: true,
      bay: true,
      position: true,
      capacity: true,
      currentUsage: true,
      current_packaging_qty: true,
      current_weight: true,
      status: true,
      kind: true,           // ✅ FIXED: Use 'kind' instead of 'cellKind'
      cell_role: true,      // ✅ FIXED: Use 'cell_role' instead of 'cellRole'
    },
    orderBy: [{ row: "asc" }, { bay: "asc" }, { position: "asc" }],
  });
}

// ✅ NEW: Helper function to create audit log entries
async function createAuditLog(userId, action, entityType, entityId, description, oldValues, newValues, metadata) {
  await prisma.systemAuditLog.create({
    data: {
      user_id: userId,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      description: description,
      old_values: oldValues || null,
      new_values: newValues || null,
      metadata: metadata || null,
      ip_address: "127.0.0.1", // Should be extracted from request
      user_agent: "TSLogix API",
      session_id: `session-${Date.now()}`,
    },
  });
}

// ✅ NEW: Get inventory allocations in quarantine for quality control
async function getQuarantineInventory(warehouseId = null) {
  const where = {
    quality_status: "CUARENTENA",
    status: "ACTIVE"
  };

  if (warehouseId) {
    where.cell = {
      warehouse_id: warehouseId
    };
  }

  return await prisma.inventoryAllocation.findMany({
    where,
    include: {
      entry_order_product: {
        include: {
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
            }
          },
          entry_order: {
            select: {
              entry_order_no: true,
            }
          }
        }
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
              name: true
            }
          }
        }
      },
      inventory: {
        select: {
          inventory_id: true,
          status: true,
          current_quantity: true,
        }
      },
      allocator: {
        select: {
          first_name: true,
          last_name: true,
        }
      }
    },
    orderBy: {
      allocated_at: 'asc'
    }
  });
}

// ✅ NEW: Get inventory allocations by any quality status (dynamic)
async function getInventoryByQualityStatus(qualityStatus, warehouseId = null) {
  // Validate quality status
  const validStatuses = ["CUARENTENA", "APROBADO", "DEVOLUCIONES", "CONTRAMUESTRAS", "RECHAZADOS"];
  if (!validStatuses.includes(qualityStatus)) {
    throw new Error(`Invalid quality status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const where = {
    quality_status: qualityStatus,
    status: "ACTIVE"
  };

  if (warehouseId) {
    where.cell = {
      warehouse_id: warehouseId
    };
  }

  return await prisma.inventoryAllocation.findMany({
    where,
    include: {
      entry_order_product: {
        include: {
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
              manufacturer: true,
              unit_weight: true,
              unit_volume: true,
            }
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
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          supplier: {
            select: {
              supplier_id: true,
              name: true,
            }
          }
        }
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
            }
          }
        }
      },
      inventory: {
        select: {
          inventory_id: true,
          status: true,
          current_quantity: true,
          current_package_quantity: true,
          current_weight: true,
          current_volume: true,
          created_at: true,
          last_modified_at: true,
        }
      },
      allocator: {
        select: {
          first_name: true,
          last_name: true,
        }
      },
      lastModifier: {
        select: {
          first_name: true,
          last_name: true,
        }
      }
    },
    orderBy: [
      { allocated_at: 'asc' },
      { entry_order_product: { entry_order: { registration_date: 'desc' } } }
    ]
  });
}

// ✅ NEW: Transition inventory from quarantine to other quality states
async function transitionQualityStatus(transitionData) {
  const {
    allocation_id,
    to_status,
    quantity_to_move,
    package_quantity_to_move,
    weight_to_move,
    volume_to_move,
    reason,
    notes,
    new_cell_id,
    performed_by
  } = transitionData;

  // ✅ FIXED: Validate and clean up input data to avoid NaN values
  const cleanQuantityToMove = parseInt(quantity_to_move) || 0;
  const cleanPackageQuantityToMove = package_quantity_to_move ? parseInt(package_quantity_to_move) : null;
  const cleanWeightToMove = weight_to_move ? parseFloat(weight_to_move) : null;
  const cleanVolumeToMove = volume_to_move ? parseFloat(volume_to_move) : null;

  // Validate required fields
  if (!allocation_id || !to_status || cleanQuantityToMove <= 0 || !performed_by || !reason) {
    throw new Error("Missing or invalid required fields: allocation_id, to_status, quantity_to_move, performed_by, reason");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Get current allocation
    const allocation = await tx.inventoryAllocation.findUnique({
      where: { allocation_id },
      include: {
        inventory: true,
        entry_order_product: {
          include: { product: true }
        },
        cell: true
      }
    });

    if (!allocation) {
      throw new Error("Allocation not found");
    }

    if (allocation.quality_status !== "CUARENTENA") {
      throw new Error("Can only transition from quarantine status");
    }

    // 2. Validate quantities
    if (cleanQuantityToMove > allocation.inventory_quantity) {
      throw new Error(`Cannot move more than available quantity. Available: ${allocation.inventory_quantity}, Requested: ${cleanQuantityToMove}`);
    }

    // Calculate proportional quantities if not provided
    const proportionRatio = cleanQuantityToMove / allocation.inventory_quantity;
    const calculatedPackageQty = cleanPackageQuantityToMove || Math.ceil(allocation.package_quantity * proportionRatio);
    const calculatedWeight = cleanWeightToMove || (parseFloat(allocation.weight_kg) * proportionRatio);
    const calculatedVolume = cleanVolumeToMove || (allocation.volume_m3 ? parseFloat(allocation.volume_m3) * proportionRatio : null);

    // 3. ✅ FIXED: Create quality control transition record with clean data
    const transition = await tx.qualityControlTransition.create({
      data: {
        allocation_id,
        inventory_id: allocation.inventory[0]?.inventory_id,
        from_status: "CUARENTENA",
        to_status,
        quantity_moved: cleanQuantityToMove,
        package_quantity_moved: calculatedPackageQty,
        weight_moved: calculatedWeight,
        volume_moved: calculatedVolume,
        from_cell_id: allocation.cell_id,
        to_cell_id: new_cell_id || allocation.cell_id,
        performed_by,
        reason,
        notes: notes || `Quality transition from CUARENTENA to ${to_status}`
      }
    });

    // 4. Update allocation status
    await tx.inventoryAllocation.update({
      where: { allocation_id },
      data: {
        quality_status: to_status,
        last_modified_by: performed_by,
        last_modified_at: new Date(),
        observations: `${allocation.observations || ''}\nQuality transition: ${reason}`
      }
    });

    // 5. Update inventory status
    if (allocation.inventory.length > 0) {
      const newInventoryStatus = to_status === "APROBADO" ? "AVAILABLE" :
                                to_status === "RECHAZADOS" ? "DAMAGED" : "RETURNED";

      await tx.inventory.update({
        where: { inventory_id: allocation.inventory[0].inventory_id },
        data: {
          quality_status: to_status,
          status: newInventoryStatus,
          last_modified_by: performed_by,
          last_modified_at: new Date()
        }
      });
    }

    // 6. Create audit log
    await createAuditLog(
      performed_by,
      "QUALITY_STATUS_CHANGED",
      "QualityControlTransition",
      transition.transition_id,
      `Quality status changed: ${cleanQuantityToMove} units of ${allocation.entry_order_product.product.name} from CUARENTENA to ${to_status}`,
      { quality_status: "CUARENTENA" },
      { quality_status: to_status },
      {
        allocation_id,
        product_code: allocation.entry_order_product.product.product_code,
        cell: `${allocation.cell.row}.${allocation.cell.bay}.${allocation.cell.position}`,
        reason,
        quantity_moved: cleanQuantityToMove,
        weight_moved: calculatedWeight
      }
    );

    return {
      transition,
      allocation,
      cellReference: `${allocation.cell.row}.${allocation.cell.bay}.${allocation.cell.position}`
    };
  });
}

// ✅ NEW: Get available inventory for departure (only approved items)
async function getAvailableInventoryForDeparture(filters = {}) {
  const { warehouse_id, product_id } = filters;

  const where = {
    quality_status: "APROBADO", // Only approved inventory
    status: "AVAILABLE",
    current_quantity: { gt: 0 }
  };

  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (product_id) where.product_id = product_id;

  return await prisma.inventory.findMany({
    where,
    include: {
      product: {
        select: {
          product_id: true,
          product_code: true,
          name: true,
        }
      },
      cell: {
        select: {
          row: true,
          bay: true,
          position: true,
        }
      },
      warehouse: {
        select: {
          warehouse_id: true,
          name: true,
        }
      },
      allocation: {
        select: {
          allocation_id: true,
          guide_number: true,
          entry_order_product: {
            select: {
              lot_series: true,
              expiration_date: true,
              entry_order: {
                select: {
                  entry_order_no: true,
                }
              }
            }
          }
        }
      }
    },
    orderBy: [
      { warehouse: { name: "asc" } },
      { product: { product_code: "asc" } },
      { allocation: { entry_order_product: { expiration_date: "asc" } } } // FIFO
    ]
  });
}

// ✅ NEW: Get audit trail for inventory operations
async function getInventoryAuditTrail(filters = {}) {
  const { entity_id, user_id, action, limit = 50 } = filters;

  const where = {
    entity_type: {
      in: ["InventoryAllocation", "Inventory", "QualityControlTransition"]
    }
  };

  if (entity_id) where.entity_id = entity_id;
  if (user_id) where.user_id = user_id;
  if (action) where.action = action;

  return await prisma.systemAuditLog.findMany({
    where,
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
        }
      }
    },
    orderBy: {
      performed_at: 'desc'
    },
    take: limit
  });
}

module.exports = {
  getApprovedEntryOrdersForInventory,
  getEntryOrderProductsForInventory,
  assignProductToCell,
  getAvailableCells,
  getInventorySummary,
  getAllWarehouses,
  getWarehouseCells,
  createAuditLog,
  // ✅ NEW: Quality control functions
  getQuarantineInventory,
  getInventoryByQualityStatus, // ✅ NEW: Dynamic quality status API
  transitionQualityStatus,
  getAvailableInventoryForDeparture,
  getInventoryAuditTrail,
};