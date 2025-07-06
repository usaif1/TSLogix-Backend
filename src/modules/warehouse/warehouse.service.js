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
 * Fetch all cells with client assignment status, optionally filtering by warehouse and user role
 */
async function getAllWarehouseCells(filter = {}, userContext = {}) {
  const { userId, userRole } = userContext;
  
  // ✅ NEW: Determine if user should see only their assigned cells
  const isClientUser = userRole && !['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userRole);
  
  const where = {};
  if (filter.warehouse_id) where.warehouse_id = filter.warehouse_id;
  
  // ✅ NEW: If client user, find their client assignments first
  let userClientIds = [];
  if (isClientUser && userId) {
    try {
      // Check if user is a client user (has clientUserAccounts)
      const userWithClients = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          clientUserAccounts: {
            where: { is_active: true },
            select: { client_id: true }
          }
        }
      });
      
      if (userWithClients?.clientUserAccounts?.length > 0) {
        userClientIds = userWithClients.clientUserAccounts.map(acc => acc.client_id);
        
        // ✅ Filter to only show cells assigned to user's clients
        where.clientCellAssignments = {
          some: {
            is_active: true,
            client_id: { in: userClientIds }
          }
        };
      } else {
        // If no client assignments found, return empty array
        return [];
      }
    } catch (error) {
      console.error("Error fetching user client assignments:", error);
      return [];
    }
  }
  
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
      client_name: activeAssignment.client.client_type === "JURIDICO" 
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
      assignment_count: cell._count.clientCellAssignments,
      // ✅ NEW: Add quality control purpose for special cells
      quality_purpose: {
        STANDARD: "Regular storage",
        REJECTED: "RECHAZADOS - Rejected products",
        SAMPLES: "CONTRAMUESTRAS - Product samples",
        RETURNS: "DEVOLUCIONES - Product returns",
        DAMAGED: "Damaged products",
        EXPIRED: "Expired products"
      }[cell.cell_role] || "Regular storage"
    };
  });
}

/**
 * Fetch all warehouses for dropdown with detailed information, filtered by user role
 */
async function fetchWarehouses(userContext = {}) {
  const { userId, userRole } = userContext;
  
  // ✅ NEW: Determine if user should see only warehouses with their assigned cells
  const isClientUser = userRole && !['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userRole);
  
  if (isClientUser && userId) {
    try {
      // ✅ Get warehouses that contain cells assigned to user's clients
      const userWithClients = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          clientUserAccounts: {
            where: { is_active: true },
            select: { 
              client: {
                select: {
                  cellAssignments: {
                    where: { is_active: true },
                    select: {
                      warehouse_id: true,
                      warehouse: {
                        select: {
                          warehouse_id: true,
                          name: true,
                          location: true,
                          capacity: true,
                          max_occupancy: true,
                          status: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      if (!userWithClients?.clientUserAccounts?.length) {
        return []; // No client assignments found
      }
      
      // Extract unique warehouse IDs from client assignments
      const warehouseIds = new Set();
      const warehouseMap = new Map();
      
      userWithClients.clientUserAccounts.forEach(account => {
        account.client.cellAssignments.forEach(assignment => {
          warehouseIds.add(assignment.warehouse_id);
          warehouseMap.set(assignment.warehouse_id, assignment.warehouse);
        });
      });
      
      if (warehouseIds.size === 0) {
        return []; // No warehouses found
      }
      
      // Get detailed warehouse information with counts
      const warehouses = await prisma.warehouse.findMany({
        where: {
          warehouse_id: { in: Array.from(warehouseIds) }
        },
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
              inventory: true,
              // ✅ Count cells assigned to user's clients
              clientCellAssignments: {
                where: {
                  is_active: true,
                  client: {
                    clientUsers: {
                      some: {
                        user_id: userId,
                        is_active: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { name: "asc" }
      });
      
      return warehouses.map(warehouse => ({
        ...warehouse,
        user_assigned_cells: warehouse._count.clientCellAssignments,
        is_client_filtered: true
      }));
      
    } catch (error) {
      console.error("Error fetching client warehouses:", error);
      return [];
    }
  }
  
  // ✅ For ADMIN and WAREHOUSE_INCHARGE, return all warehouses
  const warehouses = await prisma.warehouse.findMany({
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
          inventory: true,
          clientCellAssignments: {
            where: { is_active: true }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });
  
  return warehouses.map(warehouse => ({
    ...warehouse,
    total_assigned_cells: warehouse._count.clientCellAssignments,
    is_client_filtered: false
  }));
}

/**
 * Generate comprehensive warehouse report with filtering capabilities
 * @param {Object} filters - Filter parameters
 * @param {string} filters.date_from - Start date (ISO string)
 * @param {string} filters.date_to - End date (ISO string)
 * @param {string} filters.customer_name - Customer name filter
 * @param {string} filters.customer_code - Customer code filter
 * @param {string} filters.product_name - Product name filter
 * @param {string} filters.product_code - Product code filter
 * @param {string} filters.warehouse_id - Warehouse ID filter
 * @param {string} filters.quality_status - Quality status filter
 * @param {Object} userContext - User context for role-based filtering
 * @returns {Object} Warehouse report data
 */
async function generateWarehouseReport(filters = {}, userContext = {}) {
  const startTime = Date.now();
  console.log(`📊 WAREHOUSE REPORT: Starting report generation at ${new Date().toISOString()}`);
  
  try {
    const { userId, userRole } = userContext;
    
    // ✅ Build where clause for inventory allocations
    const whereClause = {
      status: "ACTIVE",
      inventory: {
        some: {
          current_quantity: { gt: 0 }
        }
      }
    };

    // ✅ Date range filtering
    if (filters.date_from || filters.date_to) {
      whereClause.entry_order_product = {
        entry_order: {}
      };
      
      if (filters.date_from) {
        whereClause.entry_order_product.entry_order.entry_date_time = {
          gte: new Date(filters.date_from)
        };
      }
      
      if (filters.date_to) {
        whereClause.entry_order_product.entry_order.entry_date_time = {
          ...whereClause.entry_order_product.entry_order.entry_date_time,
          lte: new Date(filters.date_to)
        };
      }
    }



    // ✅ Product filtering
    if (filters.product_name || filters.product_code) {
      whereClause.entry_order_product = {
        ...whereClause.entry_order_product,
        product: {}
      };
      
      if (filters.product_name) {
        whereClause.entry_order_product.product.name = {
          contains: filters.product_name,
          mode: 'insensitive'
        };
      }
      
      if (filters.product_code) {
        whereClause.entry_order_product.product.product_code = {
          contains: filters.product_code,
          mode: 'insensitive'
        };
      }
    }

    // ✅ Warehouse filtering
    if (filters.warehouse_id) {
      whereClause.cell = {
        warehouse_id: filters.warehouse_id
      };
    }

    // ✅ Quality status filtering
    if (filters.quality_status) {
      whereClause.quality_status = filters.quality_status;
    }

    // ✅ Role-based access control
    const isClientUser = userRole && !['ADMIN', 'WAREHOUSE_INCHARGE'].includes(userRole);
    
    if (isClientUser && userId) {
      try {
        // Get user's client assignments
        const userWithClients = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            clientUserAccounts: {
              where: { is_active: true },
              select: { client_id: true }
            }
          }
        });
        
        if (userWithClients?.clientUserAccounts?.length > 0) {
          const userClientIds = userWithClients.clientUserAccounts.map(acc => acc.client_id);
          
          // Filter to only show inventory assigned to user's clients
          whereClause.cell = {
            ...whereClause.cell,
            clientCellAssignments: {
              some: {
                is_active: true,
                client_id: { in: userClientIds }
              }
            }
          };
        } else {
          return {
            success: true,
            message: "No client assignments found for user",
            data: [],
            summary: {
              total_records: 0,
              total_quantity: 0,
              total_weight: 0,
              warehouses_involved: 0,
              products_involved: 0,
              customers_involved: 0
            },
            filters_applied: filters,
            user_role: userRole,
            is_client_filtered: true
          };
        }
      } catch (error) {
        console.error("Error fetching user client assignments:", error);
        return {
          success: false,
          message: "Error fetching user client assignments",
          error: error.message
        };
      }
    }

    // ✅ Fetch inventory data with comprehensive includes
    const inventoryData = await prisma.inventoryAllocation.findMany({
      where: whereClause,
      include: {
        inventory: {
          where: {
            current_quantity: { gt: 0 }
          },
          select: {
            inventory_id: true,
            current_quantity: true,
            current_package_quantity: true,
            current_weight: true,
            current_volume: true,
            status: true,
            quality_status: true,
            created_at: true,
            last_updated: true
          }
        },
        entry_order_product: {
          select: {
            product_id: true,
            expiration_date: true,
            lot_series: true,
            manufacturing_date: true,
            presentation: true,
                            entry_order: {
                  select: {
                    entry_order_id: true,
                    entry_order_no: true,
                    entry_date_time: true
                  }
                },
            product: {
              select: {
                product_id: true,
                product_code: true,
                name: true,
                manufacturer: true
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
            cell_role: true,
            status: true,
            warehouse: {
              select: {
                warehouse_id: true,
                name: true,
                location: true,
                capacity: true,
                max_occupancy: true
              }
            }
          }
        }
      },
      orderBy: [
        { entry_order_product: { entry_order: { entry_date_time: "asc" } } },
        { entry_order_product: { product: { product_code: "asc" } } },
        { cell: { warehouse: { name: "asc" } } }
      ]
    });

    console.log(`📦 Retrieved ${inventoryData.length} inventory allocations for report`);

    // ✅ Transform data into report format
    const reportData = inventoryData.map(allocation => {
      const inventory = allocation.inventory[0];
      if (!inventory) return null;

             const product = allocation.entry_order_product.product;
       const warehouse = allocation.cell.warehouse;

      // Calculate expiry information
      const expiryDate = allocation.entry_order_product.expiration_date;
      const daysToExpiry = expiryDate ? 
        Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
      
      // Determine category based on quality status and cell role
      const category = allocation.quality_status || allocation.cell.cell_role || 'STANDARD';
      
      // Calculate position information
      const position = `${allocation.cell.row}.${String(allocation.cell.bay).padStart(2, '0')}.${String(allocation.cell.position).padStart(2, '0')}`;

      return {
        // ✅ Basic identification
        allocation_id: allocation.allocation_id,
        inventory_id: inventory.inventory_id,
        
        // ✅ Product information
        product_id: product.product_id,
                 product_code: product.product_code,
         product_name: product.name,
         manufacturer: product.manufacturer,
        
        
        
        // ✅ Warehouse information
        warehouse_id: warehouse.warehouse_id,
        warehouse_name: warehouse.name,
        warehouse_location: warehouse.location,
        warehouse_capacity: warehouse.capacity,
        warehouse_max_occupancy: warehouse.max_occupancy,
        
        // ✅ Storage location
        cell_id: allocation.cell.id,
        position: position,
        cell_role: allocation.cell.cell_role,
        cell_status: allocation.cell.status,
        
        // ✅ Quantity and units
        quantity_units: inventory.current_quantity,
        package_quantity: inventory.current_package_quantity,
        weight_kg: parseFloat(inventory.current_weight || 0),
        volume_m3: inventory.current_volume ? parseFloat(inventory.current_volume) : null,
        
        // ✅ Category and status
        category: category,
        quality_status: allocation.quality_status,
        inventory_status: inventory.status,
        
        // ✅ Entry order information
        entry_order_id: allocation.entry_order_product.entry_order.entry_order_id,
        entry_order_no: allocation.entry_order_product.entry_order.entry_order_no,
        entry_date: allocation.entry_order_product.entry_order.entry_date_time,
        
                 // ✅ Product details
         lot_series: allocation.entry_order_product.lot_series,
         manufacturing_date: allocation.entry_order_product.manufacturing_date,
         expiration_date: expiryDate,
         days_to_expiry: daysToExpiry,
         presentation: allocation.entry_order_product.presentation,
         product_status: allocation.product_status,
        
        // ✅ Urgency indicators
        is_near_expiry: daysToExpiry !== null && daysToExpiry <= 30,
        is_urgent: daysToExpiry !== null && daysToExpiry <= 7,
        is_expired: daysToExpiry !== null && daysToExpiry < 0,
        
                 // ✅ Timestamps
         created_at: inventory.created_at,
         last_updated: inventory.last_updated,
        
        
      };
    }).filter(Boolean); // Remove null entries

    // ✅ Calculate summary statistics
    const summary = {
      total_records: reportData.length,
      total_quantity: reportData.reduce((sum, item) => sum + item.quantity_units, 0),
      total_weight: reportData.reduce((sum, item) => sum + item.weight_kg, 0),
      total_volume: reportData.reduce((sum, item) => sum + (item.volume_m3 || 0), 0),
             warehouses_involved: new Set(reportData.map(item => item.warehouse_id)).size,
       products_involved: new Set(reportData.map(item => item.product_id)).size,
      // ✅ Category breakdown
      category_breakdown: reportData.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {}),
      
      // ✅ Quality status breakdown
      quality_status_breakdown: reportData.reduce((acc, item) => {
        acc[item.quality_status] = (acc[item.quality_status] || 0) + 1;
        return acc;
      }, {}),
      
      // ✅ Urgency breakdown
      urgency_breakdown: {
        expired: reportData.filter(item => item.is_expired).length,
        urgent: reportData.filter(item => item.is_urgent && !item.is_expired).length,
        near_expiry: reportData.filter(item => item.is_near_expiry && !item.is_urgent && !item.is_expired).length,
        normal: reportData.filter(item => !item.is_near_expiry && !item.is_urgent && !item.is_expired).length
      }
    };

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ WAREHOUSE REPORT COMPLETE: Generated report with ${reportData.length} records in ${duration}ms`);

    return {
      success: true,
      message: "Warehouse report generated successfully",
      data: reportData,
      summary,
      filters_applied: filters,
      user_role: userRole,
      is_client_filtered: isClientUser,
      report_generated_at: new Date().toISOString(),
      processing_time_ms: duration
    };

  } catch (error) {
    console.error("Error generating warehouse report:", error);
    return {
      success: false,
      message: "Error generating warehouse report",
      error: error.message
    };
  }
}

module.exports = { assignPallets, getAllWarehouseCells, fetchWarehouses, generateWarehouseReport };
