const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a new client (Commercial or Individual) with REQUIRED cell assignment
 */
async function createClient(clientData, cellAssignmentData = {}) {
  try {
    // Validate cell assignment data is provided (now required)
    if (!cellAssignmentData.cell_ids || !Array.isArray(cellAssignmentData.cell_ids) || cellAssignmentData.cell_ids.length === 0) {
      throw new Error("Cell assignment is required when creating a client. Please provide at least one cell_id.");
    }
    if (!cellAssignmentData.warehouse_id) {
      throw new Error("Warehouse ID is required for cell assignment when creating a client.");
    }
    if (!cellAssignmentData.assigned_by) {
      throw new Error("Assigned by user ID is required for cell assignment when creating a client.");
    }

    // Validate ALL required fields based on client type
    if (!clientData.client_type) {
      throw new Error("Client type is required");
    }

    // Common required fields for all clients
    if (!clientData.email) {
      throw new Error("Email is required for all clients");
    }
    if (!clientData.address) {
      throw new Error("Address is required for all clients");
    }
    if (!clientData.phone) {
      throw new Error("Phone number is required for all clients");
    }
    if (!clientData.cell_phone) {
      throw new Error("Cell phone number is required for all clients");
    }

    // Client type specific required fields
    if (clientData.client_type === "COMMERCIAL") {
      if (!clientData.company_name) {
        throw new Error("Company name is required for commercial clients");
      }
      if (!clientData.ruc) {
        throw new Error("RUC is required for commercial clients");
      }
      if (!clientData.company_type) {
        throw new Error("Company type is required for commercial clients");
      }
      if (!clientData.establishment_type) {
        throw new Error("Establishment type is required for commercial clients");
      }
    } else if (clientData.client_type === "INDIVIDUAL") {
      if (!clientData.first_names) {
        throw new Error("First names are required for individual clients");
      }
      if (!clientData.last_name) {
        throw new Error("Last name is required for individual clients");
      }
      if (!clientData.mothers_last_name) {
        throw new Error("Mother's last name is required for individual clients");
      }
      if (!clientData.individual_id) {
        throw new Error("Individual ID is required for individual clients");
      }
      if (!clientData.date_of_birth) {
        throw new Error("Date of birth is required for individual clients");
      }
    } else {
      throw new Error("Invalid client type. Must be COMMERCIAL or INDIVIDUAL");
    }

    // Check for duplicate RUC for commercial clients
    if (clientData.client_type === "COMMERCIAL" && clientData.ruc) {
      const existingClient = await prisma.client.findFirst({
        where: { 
          ruc: clientData.ruc,
          client_type: "COMMERCIAL"
        }
      });
      if (existingClient) {
        throw new Error("A commercial client with this RUC already exists");
      }
    }

    // Check for duplicate individual_id for individual clients
    if (clientData.client_type === "INDIVIDUAL" && clientData.individual_id) {
      const existingClient = await prisma.client.findFirst({
        where: { 
          individual_id: clientData.individual_id,
          client_type: "INDIVIDUAL"
        }
      });
      if (existingClient) {
        throw new Error("An individual client with this ID already exists");
      }
    }

    // Check for duplicate email
    if (clientData.email) {
      const existingClient = await prisma.client.findFirst({
        where: { email: clientData.email }
      });
      if (existingClient) {
        throw new Error("A client with this email already exists");
      }
    }

    // Validate warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { warehouse_id: cellAssignmentData.warehouse_id }
    });
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }

    // Validate cells exist and are available
    const cells = await prisma.warehouseCell.findMany({
      where: {
        id: { in: cellAssignmentData.cell_ids },
        warehouse_id: cellAssignmentData.warehouse_id,
        status: "AVAILABLE",
        cell_role: "STANDARD" // Only standard cells for client assignment
      }
    });

    if (cells.length !== cellAssignmentData.cell_ids.length) {
      const foundCellIds = cells.map(c => c.id);
      const missingCells = cellAssignmentData.cell_ids.filter(id => !foundCellIds.includes(id));
      throw new Error(`Some cells are not available or don't exist in the specified warehouse: ${missingCells.join(', ')}`);
    }

    // Check for existing assignments for these cells
    const existingAssignments = await prisma.clientCellAssignment.findMany({
      where: {
        cell_id: { in: cellAssignmentData.cell_ids },
        is_active: true
      }
    });

    if (existingAssignments.length > 0) {
      const assignedCellIds = existingAssignments.map(a => a.cell_id);
      throw new Error(`Some cells are already assigned to other clients: ${assignedCellIds.join(', ')}`);
    }

    // Define valid fields for Client model
    const validClientFields = [
      'client_type',
      'email',
      'address', 
      'phone',
      'cell_phone',
      'active_state_id',
      // Commercial fields
      'company_name',
      'company_type',
      'establishment_type',
      'ruc',
      // Individual fields
      'first_names',
      'last_name',
      'mothers_last_name',
      'individual_id',
      'date_of_birth'
    ];

    // Clean data based on client type and filter valid fields only
    const cleanedData = {};
    
    // Only include valid fields
    validClientFields.forEach(field => {
      if (clientData.hasOwnProperty(field)) {
        cleanedData[field] = clientData[field];
      }
    });
    
    if (clientData.client_type === "COMMERCIAL") {
      // Clear individual fields for commercial clients
      cleanedData.first_names = null;
      cleanedData.last_name = null;
      cleanedData.mothers_last_name = null;
      cleanedData.individual_id = null;
      cleanedData.date_of_birth = null;
    } else if (clientData.client_type === "INDIVIDUAL") {
      // Clear commercial fields for individual clients
      cleanedData.company_name = null;
      cleanedData.company_type = null;
      cleanedData.establishment_type = null;
      cleanedData.ruc = null;
    }

    // Parse date_of_birth if provided
    if (cleanedData.date_of_birth) {
      cleanedData.date_of_birth = new Date(cleanedData.date_of_birth);
    }

    // Use transaction to ensure both client creation and cell assignment succeed together
    const result = await prisma.$transaction(async (tx) => {
      // Create the client
      const newClient = await tx.client.create({
        data: cleanedData
      });

      // Prepare bulk cell assignment data
      const finalNotes = cellAssignmentData.notes || `Cell assigned during client creation for ${newClient.client_type === "COMMERCIAL" ? newClient.company_name : `${newClient.first_names} ${newClient.last_name}`}`;
      
      const assignmentData = cellAssignmentData.cell_ids.map((cellId, index) => ({
        client_id: newClient.client_id,
        cell_id: cellId,
        warehouse_id: cellAssignmentData.warehouse_id,
        assigned_by: cellAssignmentData.assigned_by,
        priority: index + 1, // Priority based on order
        notes: finalNotes,
        max_capacity: cellAssignmentData.max_capacity || 100.0
      }));

      // Bulk create all cell assignments at once
      await tx.clientCellAssignment.createMany({
        data: assignmentData,
        skipDuplicates: false
      });

      // Return client with assignments (fetch after creation)
      return await tx.client.findUnique({
        where: { client_id: newClient.client_id },
        include: {
          active_state: true,
          cellAssignments: {
            include: {
              cell: true,
              warehouse: true,
              assignedBy: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });
    }, {
      timeout: 15000 // Increase timeout to 15 seconds for client creation
    });

    return result;
  } catch (error) {
    console.error("Error in createClient service:", error);
    throw error;
  }
}

/**
 * Get all clients with filtering (no pagination - handled by frontend)
 */
async function getAllClients(filters) {
  try {
    const {
      client_type,
      company_type,
      establishment_type,
      active_state_id,
      search
    } = filters;

    // Build where conditions
    const whereConditions = {};

    if (client_type) {
      whereConditions.client_type = client_type;
    }

    if (company_type) {
      whereConditions.company_type = company_type;
    }

    if (establishment_type) {
      whereConditions.establishment_type = establishment_type;
    }

    if (active_state_id) {
      whereConditions.active_state_id = active_state_id;
    }

    // Search functionality
    if (search) {
      whereConditions.OR = [
        { company_name: { contains: search, mode: 'insensitive' } },
        { first_names: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { ruc: { contains: search, mode: 'insensitive' } },
        { individual_id: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { cell_phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get all clients (no pagination)
    const clients = await prisma.client.findMany({
      where: whereConditions,
      include: {
        active_state: true,
        cellAssignments: {
          where: { is_active: true },
          include: {
            cell: true,
            warehouse: true
          }
        },
        _count: {
          select: {
            cellAssignments: {
              where: { is_active: true }
            },
            departureOrders: true
          }
        }
      },
      orderBy: [
        { created_at: 'desc' }
      ]
    });

    return clients;
  } catch (error) {
    console.error("Error in getAllClients service:", error);
    throw error;
  }
}

/**
 * Get client by ID
 */
async function getClientById(clientId) {
  try {
    const client = await prisma.client.findUnique({
      where: { client_id: clientId },
      include: {
        active_state: true,
        cellAssignments: {
          include: {
            cell: true,
            warehouse: true,
            assignedBy: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        departureOrders: {
          include: {
            order: true
          },
          orderBy: { created_at: 'desc' },
          take: 10 // Latest 10 departure orders
        },
        _count: {
          select: {
            cellAssignments: {
              where: { is_active: true }
            },
            departureOrders: true
          }
        }
      }
    });

    if (!client) {
      throw new Error("Client not found");
    }

    return client;
  } catch (error) {
    console.error("Error in getClientById service:", error);
    throw error;
  }
}

/**
 * Update client
 */
async function updateClient(clientId, updateData) {
  try {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { client_id: clientId }
    });

    if (!existingClient) {
      throw new Error("Client not found");
    }

    // Validate client type specific fields
    if (updateData.client_type && updateData.client_type !== existingClient.client_type) {
      throw new Error("Cannot change client type after creation");
    }

    // Check for duplicate constraints
    if (updateData.ruc && updateData.ruc !== existingClient.ruc) {
      const duplicateRuc = await prisma.client.findFirst({
        where: { 
          ruc: updateData.ruc,
          client_type: "COMMERCIAL",
          client_id: { not: clientId }
        }
      });
      if (duplicateRuc) {
        throw new Error("A commercial client with this RUC already exists");
      }
    }

    if (updateData.individual_id && updateData.individual_id !== existingClient.individual_id) {
      const duplicateId = await prisma.client.findFirst({
        where: { 
          individual_id: updateData.individual_id,
          client_type: "INDIVIDUAL",
          client_id: { not: clientId }
        }
      });
      if (duplicateId) {
        throw new Error("An individual client with this ID already exists");
      }
    }

    if (updateData.email && updateData.email !== existingClient.email) {
      const duplicateEmail = await prisma.client.findFirst({
        where: { 
          email: updateData.email,
          client_id: { not: clientId }
        }
      });
      if (duplicateEmail) {
        throw new Error("A client with this email already exists");
      }
    }

    // Define valid fields for Client model updates
    const validUpdateFields = [
      'client_type',
      'email',
      'address', 
      'phone',
      'cell_phone',
      'active_state_id',
      // Commercial fields
      'company_name',
      'company_type',
      'establishment_type',
      'ruc',
      // Individual fields
      'first_names',
      'last_name',
      'mothers_last_name',
      'individual_id',
      'date_of_birth'
    ];

    // Filter update data to only include valid fields
    const filteredUpdateData = {};
    validUpdateFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    // Parse date_of_birth if provided
    if (filteredUpdateData.date_of_birth) {
      filteredUpdateData.date_of_birth = new Date(filteredUpdateData.date_of_birth);
    }

    const updatedClient = await prisma.client.update({
      where: { client_id: clientId },
      data: filteredUpdateData,
      include: {
        active_state: true,
        cellAssignments: {
          where: { is_active: true },
          include: {
            cell: true,
            warehouse: true
          }
        }
      }
    });

    return updatedClient;
  } catch (error) {
    console.error("Error in updateClient service:", error);
    throw error;
  }
}

/**
 * Assign cells to client (OPTIMIZED for bulk operations)
 */
async function assignCellsToClient(assignmentData) {
  try {
    const { client_id, cell_ids, cell_id, warehouse_id, assigned_by, notes, observations, max_capacity } = assignmentData;

    // Handle both single cell_id and multiple cell_ids
    let cellIdsArray = [];
    if (cell_ids && Array.isArray(cell_ids)) {
      cellIdsArray = cell_ids;
    } else if (cell_id) {
      cellIdsArray = [cell_id]; // Convert single cell_id to array
    } else {
      throw new Error("Either cell_ids (array) or cell_id (string) is required");
    }

    // Validate required fields
    if (!client_id) {
      throw new Error("Client ID is required");
    }
    if (!assigned_by) {
      throw new Error("Assigned by user ID is required");
    }

    // Use transaction for atomicity and better performance
    const result = await prisma.$transaction(async (tx) => {
      // OPTIMIZATION 1: Combine all validations in parallel
      const [client, assignedByUser, cells, existingAssignments] = await Promise.all([
        // Validate client exists
        tx.client.findUnique({
          where: { client_id },
          select: { client_id: true, client_type: true, company_name: true, first_names: true, last_name: true }
        }),
        
        // Validate assigned_by user exists
        tx.user.findUnique({
          where: { id: assigned_by },
          select: { id: true, first_name: true, last_name: true, email: true }
        }),
        
        // Validate cells exist, are available, and get warehouse info in one query
        tx.warehouseCell.findMany({
          where: {
            id: { in: cellIdsArray },
            status: "AVAILABLE",
            cell_role: "STANDARD"
          },
          include: {
            warehouse: {
              select: { warehouse_id: true, name: true, location: true }
            }
          }
        }),
        
        // Check for existing assignments
        tx.clientCellAssignment.findMany({
          where: {
            cell_id: { in: cellIdsArray },
            is_active: true
          },
          select: { cell_id: true }
        })
      ]);

      // Validate results
      if (!client) {
        throw new Error("Client not found");
      }
      
      if (!assignedByUser) {
        throw new Error(`User with ID ${assigned_by} not found. Please provide a valid user ID for assigned_by field.`);
      }

      if (cells.length !== cellIdsArray.length) {
        const foundCellIds = cells.map(c => c.id);
        const missingCells = cellIdsArray.filter(id => !foundCellIds.includes(id));
        throw new Error(`Some cells are not available or don't exist: ${missingCells.join(', ')}`);
      }

      if (existingAssignments.length > 0) {
        const assignedCellIds = existingAssignments.map(a => a.cell_id);
        throw new Error(`Some cells are already assigned to other clients: ${assignedCellIds.join(', ')}`);
      }

      // Get warehouse_id from cells (all cells should be in same warehouse)
      const finalWarehouseId = warehouse_id || cells[0].warehouse_id;
      
      // Ensure all cells are in the same warehouse
      const differentWarehouse = cells.find(cell => cell.warehouse_id !== finalWarehouseId);
      if (differentWarehouse) {
        throw new Error("All cells must be in the same warehouse");
      }

      // OPTIMIZATION 2: Bulk create assignments using createMany
      const finalNotes = notes || observations || `Cell assigned to ${client.client_type === "COMMERCIAL" ? client.company_name : `${client.first_names} ${client.last_name}`}`;
      
      const assignmentData = cellIdsArray.map((cellId, index) => ({
        client_id,
        cell_id: cellId,
        warehouse_id: finalWarehouseId,
        assigned_by,
        priority: index + 1,
        notes: finalNotes,
        max_capacity: max_capacity || 100.0
      }));

      // Bulk create all assignments at once
      await tx.clientCellAssignment.createMany({
        data: assignmentData,
        skipDuplicates: false // We already checked for duplicates
      });

      // OPTIMIZATION 3: Fetch created assignments with all relations in one query
      const createdAssignments = await tx.clientCellAssignment.findMany({
        where: {
          client_id,
          cell_id: { in: cellIdsArray },
          is_active: true
        },
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
          cell: {
            select: {
              id: true,
              row: true,
              bay: true,
              position: true,
              capacity: true,
              status: true,
              cell_role: true
            }
          },
          warehouse: {
            select: {
              warehouse_id: true,
              name: true,
              location: true
            }
          },
          assignedBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { priority: 'asc' }
      });

      return createdAssignments;
    }, {
      timeout: 15000 // Increase timeout to 15 seconds for cell assignment
    });

    return result;
  } catch (error) {
    console.error("Error in assignCellsToClient service:", error);
    throw error;
  }
}

/**
 * Get client cell assignments
 */
async function getClientCellAssignments(clientId) {
  try {
    const assignments = await prisma.clientCellAssignment.findMany({
      where: { 
        client_id: clientId,
        is_active: true
      },
      include: {
        cell: true,
        warehouse: true,
        assignedBy: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { assigned_at: 'desc' }
      ]
    });

    return assignments;
  } catch (error) {
    console.error("Error in getClientCellAssignments service:", error);
    throw error;
  }
}

/**
 * Get available cells for client assignment (excludes cells already assigned to clients)
 */
async function getAvailableCellsForClient(warehouseId) {
  try {
    const whereCondition = {
      status: "AVAILABLE",
      cell_role: "STANDARD" // Only standard cells for client assignment
    };

    if (warehouseId) {
      whereCondition.warehouse_id = warehouseId;
    }

    // Get cells that are NOT assigned to any client
    const availableCells = await prisma.warehouseCell.findMany({
      where: {
        ...whereCondition,
        // Exclude cells that have active client assignments
        clientCellAssignments: {
          none: {
            is_active: true
          }
        }
      },
      include: {
        warehouse: true,
        clientCellAssignments: {
          where: { is_active: true },
          include: {
            client: {
              select: {
                client_id: true,
                client_type: true,
                company_name: true,
                first_names: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy: [
        { warehouse_id: 'asc' },
        { row: 'asc' },
        { bay: 'asc' },
        { position: 'asc' }
      ]
    });

    // Group by warehouse for better organization
    const cellsByWarehouse = {};
    availableCells.forEach(cell => {
      if (!cellsByWarehouse[cell.warehouse_id]) {
        cellsByWarehouse[cell.warehouse_id] = {
          warehouse: cell.warehouse,
          cells: []
        };
      }
      cellsByWarehouse[cell.warehouse_id].cells.push({
        ...cell,
        is_assigned_to_client: false, // These are unassigned cells
        client_assignment: null
      });
    });

    return {
      total_available: availableCells.length,
      cells_by_warehouse: cellsByWarehouse,
      all_cells: availableCells.map(cell => ({
        ...cell,
        is_assigned_to_client: false,
        client_assignment: null
      }))
    };
  } catch (error) {
    console.error("Error in getAvailableCellsForClient service:", error);
    throw error;
  }
}

/**
 * Deactivate client cell assignment
 */
async function deactivateClientCellAssignment(assignmentId, deactivatedBy) {
  try {
    // Check if assignment exists and is active
    const assignment = await prisma.clientCellAssignment.findUnique({
      where: { assignment_id: assignmentId },
      include: {
        client: true,
        cell: true
      }
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (!assignment.is_active) {
      throw new Error("Assignment is already deactivated");
    }

    // Check if cell has any active inventory
    const cellInventory = await prisma.inventory.count({
      where: {
        cell_id: assignment.cell_id,
        status: { in: ["AVAILABLE", "QUARANTINED", "RESERVED"] }
      }
    });

    if (cellInventory > 0) {
      throw new Error("Cannot deactivate assignment - cell contains active inventory");
    }

    // Deactivate the assignment
    const updatedAssignment = await prisma.clientCellAssignment.update({
      where: { assignment_id: assignmentId },
      data: {
        is_active: false,
        notes: `${assignment.notes}\nDeactivated on ${new Date().toISOString()}`
      },
      include: {
        client: true,
        cell: true,
        warehouse: true,
        assignedBy: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    return updatedAssignment;
  } catch (error) {
    console.error("Error in deactivateClientCellAssignment service:", error);
    throw error;
  }
}

/**
 * Get form fields for client creation
 */
async function getClientFormFields() {
  try {
    const [activeStates, clientTypes, companyTypes, establishmentTypes] = await Promise.all([
      prisma.activeState.findMany({
        orderBy: { name: 'asc' }
      }),
      // Get enum values for client types
      Promise.resolve([
        { value: "COMMERCIAL", label: "Commercial" },
        { value: "INDIVIDUAL", label: "Individual" }
      ]),
      // Get enum values for company types
      Promise.resolve([
        { value: "PRIVATE", label: "Private" },
        { value: "PUBLIC", label: "Public" }
      ]),
      // Get enum values for establishment types
      Promise.resolve([
        { value: "ALMACEN_ESPECIALIZADO", label: "Almacén Especializado" },
        { value: "BOTICA", label: "Botica" },
        { value: "BOTIQUIN", label: "Botiquín" },
        { value: "DROGUERIA", label: "Droguería" },
        { value: "FARMACIA", label: "Farmacia" },
        { value: "OTROS", label: "Otros" }
      ])
    ]);

    return {
      active_states: activeStates,
      client_types: clientTypes,
      company_types: companyTypes,
      establishment_types: establishmentTypes,
      required_fields: {
        common: ["client_type", "email", "address", "phone", "cell_phone", "cell_ids", "warehouse_id"],
        commercial: ["company_name", "ruc", "company_type", "establishment_type"],
        individual: ["first_names", "last_name", "mothers_last_name", "individual_id", "date_of_birth"]
      },
      field_descriptions: {
        client_type: "Type of client: COMMERCIAL or INDIVIDUAL (REQUIRED)",
        email: "Email address for the client (REQUIRED)",
        address: "Physical address of the client (REQUIRED)",
        phone: "Primary phone number (REQUIRED)",
        cell_phone: "Mobile/cell phone number (REQUIRED)",
        company_name: "Company name (REQUIRED for commercial clients)",
        ruc: "RUC (Registro Único de Contribuyente) - 11 digits (REQUIRED for commercial clients)",
        company_type: "PRIVATE or PUBLIC company (REQUIRED for commercial clients)",
        establishment_type: "Type of commercial establishment (REQUIRED for commercial clients)",
        first_names: "First and middle names (REQUIRED for individual clients)",
        last_name: "Last name/surname (REQUIRED for individual clients)",
        mothers_last_name: "Mother's last name (REQUIRED for individual clients)",
        individual_id: "DNI or similar identification document (REQUIRED for individual clients)",
        date_of_birth: "Date of birth in YYYY-MM-DD format (REQUIRED for individual clients)",
        cell_ids: "Array of cell IDs to assign to the client (REQUIRED - at least 1 cell)",
        warehouse_id: "Warehouse ID where the cells are located (REQUIRED)"
      }
    };
  } catch (error) {
    console.error("Error in getClientFormFields service:", error);
    throw error;
  }
}

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  assignCellsToClient,
  getClientCellAssignments,
  getAvailableCellsForClient,
  deactivateClientCellAssignment,
  getClientFormFields
}; 