const { PrismaClient } = require("@prisma/client");
const eventLogger = require("../../utils/eventLogger");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

// ✅ NEW: Helper function to generate unique username
function generateUniqueUsername(clientType, companyName, firstName, lastName) {
  const prefix = "client_";
  let baseName = "";
  
  if (clientType === "JURIDICO" && companyName) {
    // Use first word of company name
    baseName = companyName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  } else if (clientType === "NATURAL" && firstName && lastName) {
    // Use first name + last name initial
    baseName = (firstName.toLowerCase() + lastName.charAt(0).toLowerCase()).replace(/[^a-z0-9]/g, "");
  } else {
    baseName = "user";
  }
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return prefix + baseName.substring(0, 8) + "_" + randomSuffix;
}

// ✅ NEW: Helper function to generate secure password
function generateSecurePassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26)); // Lowercase
  password += "0123456789".charAt(Math.floor(Math.random() * 10)); // Number
  password += "!@#$%^&*".charAt(Math.floor(Math.random() * 8)); // Special char
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// ✅ NEW: Helper function to generate simple, name-based username
function generateSimpleUsername(clientType, companyName, firstName, lastName, ruc = null, individualId = null) {
  if (clientType === "JURIDICO" && ruc) {
    // ✅ NEW: For juridical clients, username is the RUC number
    return ruc;
  } else if (clientType === "NATURAL" && individualId) {
    // ✅ NEW: For natural clients, username is the individual ID
    return individualId;
  } else {
    // Fallback to old logic if RUC/ID not provided
    let baseName = "";
    
    if (clientType === "JURIDICO" && companyName) {
      baseName = companyName.toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 6);
    } else if (clientType === "NATURAL" && firstName && lastName) {
      const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, "").substring(0, 4);
      const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, "").substring(0, 3);
      baseName = cleanFirstName + cleanLastName;
    } else {
      baseName = "client";
    }
    
    const simpleNumber = Math.floor(Math.random() * 900) + 100;
    return baseName + simpleNumber;
  }
}

// ✅ NEW: Helper function to generate simple, ID-based password
function generateSimplePassword(clientType, companyName, firstName, lastName, ruc = null, individualId = null) {
  if (clientType === "JURIDICO" && ruc) {
    // ✅ NEW: For juridical clients, initial password is the RUC number
    return ruc;
  } else if (clientType === "NATURAL" && individualId) {
    // ✅ NEW: For natural clients, initial password is the individual ID
    return individualId;
  } else {
    // Fallback to old logic if RUC/ID not provided
    let basePassword = "";
    
    if (clientType === "JURIDICO" && companyName) {
      const cleanName = companyName.replace(/[^a-zA-Z]/g, "");
      const firstPart = cleanName.substring(0, 3);
      const lastPart = cleanName.length > 3 ? cleanName.slice(-2) : "";
      basePassword = firstPart + "123" + lastPart;
    } else if (clientType === "NATURAL" && firstName && lastName) {
      const cleanFirstName = firstName.replace(/[^a-zA-Z]/g, "").substring(0, 3);
      const cleanLastName = lastName.replace(/[^a-zA-Z]/g, "").substring(0, 2);
      basePassword = cleanFirstName + "123" + cleanLastName;
    } else {
      basePassword = "client123";
    }
    
    const simpleNumber = Math.floor(Math.random() * 90) + 10;
    return basePassword + simpleNumber;
  }
}

// ✅ NEW: Store client credentials for handover (temporary storage)
const clientCredentialsForHandover = new Map();

function storeCredentialsForHandover(clientId, username, password, clientName) {
  clientCredentialsForHandover.set(clientId, {
    username,
    password,
    clientName,
    createdAt: new Date(),
    handedOver: false
  });
  
  // Auto-cleanup after 24 hours
  setTimeout(() => {
    clientCredentialsForHandover.delete(clientId);
  }, 24 * 60 * 60 * 1000);
}

// ✅ NEW: Get credentials for handover
function getCredentialsForHandover(clientId) {
  return clientCredentialsForHandover.get(clientId);
}

// ✅ NEW: Mark credentials as handed over
function markCredentialsAsHandedOver(clientId) {
  const creds = clientCredentialsForHandover.get(clientId);
  if (creds) {
    creds.handedOver = true;
    creds.handedOverAt = new Date();
  }
}

// ✅ NEW: Get all pending credentials for handover
function getAllPendingCredentials() {
  const pending = [];
  for (const [clientId, creds] of clientCredentialsForHandover.entries()) {
    if (!creds.handedOver) {
      pending.push({ clientId, ...creds });
    }
  }
  return pending;
}

/**
 * Create a new client (Juridical or Natural) with REQUIRED cell assignment - OPTIMIZED VERSION
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
    if (clientData.client_type === "JURIDICO") {
      if (!clientData.company_name) {
        throw new Error("Company name is required for juridical clients");
      }
      if (!clientData.ruc) {
        throw new Error("RUC is required for juridical clients");
      }
      if (!clientData.company_type) {
        throw new Error("Company type is required for juridical clients");
      }
      if (!clientData.establishment_type) {
        throw new Error("Establishment type is required for juridical clients");
      }
    } else if (clientData.client_type === "NATURAL") {
      if (!clientData.first_names) {
        throw new Error("First names are required for natural clients");
      }
      if (!clientData.last_name) {
        throw new Error("Last name is required for natural clients");
      }
      if (!clientData.mothers_last_name) {
        throw new Error("Mother's last name is required for natural clients");
      }
      if (!clientData.individual_id) {
        throw new Error("Individual ID is required for natural clients");
      }
      if (!clientData.date_of_birth) {
        throw new Error("Date of birth is required for natural clients");
      }
    } else {
      throw new Error("Invalid client type. Must be JURIDICO or NATURAL");
    }

    // ✅ OPTIMIZATION 1: Run all validations in parallel
    const [
      existingRucClient,
      existingIdClient,
      existingEmailClient,
      warehouse,
      cells,
      existingAssignments
    ] = await Promise.all([
      // Check for duplicate RUC for juridical clients
      clientData.client_type === "JURIDICO" && clientData.ruc
        ? prisma.client.findFirst({
            where: { 
              ruc: clientData.ruc,
              client_type: "JURIDICO"
            },
            select: { client_id: true }
          })
        : Promise.resolve(null),
      
      // Check for duplicate individual_id for natural clients
      clientData.client_type === "NATURAL" && clientData.individual_id
        ? prisma.client.findFirst({
            where: { 
              individual_id: clientData.individual_id,
              client_type: "NATURAL"
            },
            select: { client_id: true }
          })
        : Promise.resolve(null),
      
      // Check for duplicate email
      prisma.client.findFirst({
        where: { email: clientData.email },
        select: { client_id: true }
      }),
      
      // Validate warehouse exists
      prisma.warehouse.findUnique({
        where: { warehouse_id: cellAssignmentData.warehouse_id },
        select: { warehouse_id: true, name: true }
      }),
      
      // Validate cells exist and are available
      prisma.warehouseCell.findMany({
        where: {
          id: { in: cellAssignmentData.cell_ids },
          warehouse_id: cellAssignmentData.warehouse_id,
          status: "AVAILABLE",
          cell_role: "STANDARD"
        },
        select: { id: true, row: true, bay: true, position: true }
      }),
      
      // Check for existing assignments for these cells
      prisma.clientCellAssignment.findMany({
        where: {
          cell_id: { in: cellAssignmentData.cell_ids },
          is_active: true
        },
        select: { cell_id: true }
      })
    ]);

    // ✅ OPTIMIZATION 2: Quick validation checks
    if (existingRucClient) {
      throw new Error("A juridical client with this RUC already exists");
    }
    if (existingIdClient) {
      throw new Error("A natural client with this ID already exists");
    }
    if (existingEmailClient) {
      throw new Error("A client with this email already exists");
    }
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }
    if (cells.length !== cellAssignmentData.cell_ids.length) {
      const foundCellIds = cells.map(c => c.id);
      const missingCells = cellAssignmentData.cell_ids.filter(id => !foundCellIds.includes(id));
      throw new Error(`Some cells are not available or don't exist in the specified warehouse: ${missingCells.join(', ')}`);
    }
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
      // Juridical fields
      'company_name',
      'company_type',
      'establishment_type',
      'ruc',
      // Natural fields
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
    
    if (clientData.client_type === "JURIDICO") {
      // Clear natural fields for juridical clients
      cleanedData.first_names = null;
      cleanedData.last_name = null;
      cleanedData.mothers_last_name = null;
      cleanedData.individual_id = null;
      cleanedData.date_of_birth = null;
    } else if (clientData.client_type === "NATURAL") {
      // Clear juridical fields for natural clients
      cleanedData.company_name = null;
      cleanedData.company_type = null;
      cleanedData.establishment_type = null;
      cleanedData.ruc = null;
    }

    // Parse date_of_birth if provided
    if (cleanedData.date_of_birth) {
      cleanedData.date_of_birth = new Date(cleanedData.date_of_birth);
    }

    // ✅ NEW: Generate simple auto-credentials for the client (RUC-based for JURIDICO, ID-based for NATURAL)
    const autoUsername = generateSimpleUsername(
      cleanedData.client_type,
      cleanedData.company_name,
      cleanedData.first_names,
      cleanedData.last_name,
      cleanedData.ruc,
      cleanedData.individual_id
    );
    const autoPassword = generateSimplePassword(
      cleanedData.client_type,
      cleanedData.company_name,
      cleanedData.first_names,
      cleanedData.last_name,
      cleanedData.ruc,
      cleanedData.individual_id
    );
    const autoPasswordHash = await bcrypt.hash(autoPassword, 10);

    // ✅ OPTIMIZATION 3: Simplified transaction with bulk operations
    const result = await prisma.$transaction(async (tx) => {
      // Get creator and role info in parallel
      const [creator, clientRole] = await Promise.all([
        tx.user.findUnique({
          where: { id: cellAssignmentData.assigned_by },
          select: { 
            id: true, 
            organisation_id: true,
            first_name: true,
            last_name: true
          }
        }),
        tx.role.findUnique({
          where: { name: "CLIENT" },
          select: { role_id: true }
        })
      ]);

      if (!creator) {
        throw new Error("Creator user not found. Cannot create client without valid creator.");
      }
      if (!clientRole) {
        throw new Error("CLIENT role not found in database.");
      }

      // Create user and client in parallel
      const [clientUser, newClient] = await Promise.all([
        tx.user.create({
          data: {
            user_id: autoUsername,
            email: cleanedData.email,
            password_hash: autoPasswordHash,
            role: { connect: { role_id: clientRole.role_id } },
            organisation: { connect: { organisation_id: creator.organisation_id } },
            first_name: cleanedData.first_names || cleanedData.company_name?.split(" ")[0] || "Client",
            last_name: cleanedData.last_name || cleanedData.company_name?.split(" ").slice(1).join(" ") || "User"
          },
          select: { id: true }
        }),
        // Prepare client data with auto-credentials
        Promise.resolve({
          ...cleanedData,
          created_by: cellAssignmentData.assigned_by,
          auto_username: autoUsername,
          auto_password_hash: autoPasswordHash
        })
      ]);

      // Create client with user reference
      const client = await tx.client.create({
        data: {
          ...newClient,
          client_user_id: clientUser.id
        },
        select: {
          client_id: true,
          client_type: true,
          company_name: true,
          first_names: true,
          last_name: true,
          email: true
        }
      });

      // ✅ FIX: Create ClientUser record (clientUserAccounts) for proper user-client relationship
      await tx.clientUser.create({
        data: {
          client_id: client.client_id,
          user_id: clientUser.id,
          username: autoUsername,
          password_hash: autoPasswordHash,
          is_primary: true, // This is the primary user for the client
          is_active: true,
          created_by: cellAssignmentData.assigned_by,
          notes: `Primary user created during client creation for ${client.client_type === "JURIDICO" ? client.company_name : `${client.first_names} ${client.last_name}`}`
        }
      });

      // ✅ OPTIMIZATION 4: Bulk create cell assignments
      const finalNotes = cellAssignmentData.notes || `Cell assigned during client creation for ${client.client_type === "JURIDICO" ? client.company_name : `${client.first_names} ${client.last_name}`}`;
      
      const assignmentData = cellAssignmentData.cell_ids.map((cellId, index) => ({
        client_id: client.client_id,
        cell_id: cellId,
        warehouse_id: cellAssignmentData.warehouse_id,
        assigned_by: cellAssignmentData.assigned_by,
        priority: index + 1,
        notes: finalNotes,
        max_capacity: cellAssignmentData.max_capacity || 100.0
      }));

      // ✅ OPTIMIZATION 5: Single bulk insert for all cell assignments
      await tx.clientCellAssignment.createMany({
        data: assignmentData,
        skipDuplicates: false
      });

      // ✅ OPTIMIZATION 6: Single event log for client creation (instead of individual cell logs)
      await eventLogger.logEvent({
        userId: cellAssignmentData.assigned_by,
        action: 'CLIENT_CREATED',
        entityType: 'Client',
        entityId: client.client_id,
        description: `Created ${client.client_type.toLowerCase()} client: ${client.client_type === "JURIDICO" ? client.company_name : `${client.first_names} ${client.last_name}`} with ${cellAssignmentData.cell_ids.length} cell assignments`,
        newValues: {
          client_type: client.client_type,
          email: client.email,
          company_name: client.company_name,
          first_names: client.first_names,
          last_name: client.last_name,
          cells_assigned: cellAssignmentData.cell_ids.length,
          warehouse_id: cellAssignmentData.warehouse_id
        },
        metadata: {
          operation_type: 'CLIENT_CREATION',
          client_type: client.client_type,
          has_cell_assignment: true,
          cell_count: cellAssignmentData.cell_ids.length,
          warehouse_name: warehouse.name,
          bulk_operation: true
        }
      });

      // ✅ OPTIMIZATION 7: Fetch final result with minimal data
      const clientWithAssignments = await tx.client.findUnique({
        where: { client_id: client.client_id },
        include: {
          active_state: {
            select: { state_id: true, name: true }
          },
          cellAssignments: {
            where: { is_active: true },
            select: {
              assignment_id: true,
              priority: true,
              assigned_at: true,
              notes: true,
              max_capacity: true,
              cell: {
                select: {
                  id: true,
                  row: true,
                  bay: true,
                  position: true,
                  capacity: true
                }
              },
              warehouse: {
                select: {
                  warehouse_id: true,
                  name: true,
                  location: true
                }
              }
            },
            orderBy: { priority: 'asc' }
          }
        }
      });

      // ✅ NEW: Store credentials for handover to client
      const clientName = clientWithAssignments.client_type === "JURIDICO" 
        ? clientWithAssignments.company_name 
        : `${clientWithAssignments.first_names} ${clientWithAssignments.last_name}`;
      
      storeCredentialsForHandover(
        clientWithAssignments.client_id, 
        autoUsername, 
        autoPassword, 
        clientName
      );

      // ✅ NEW: Add auto-generated credentials to response (for backend logging only)
      return {
        ...clientWithAssignments,
        _autoCredentials: {
          username: autoUsername,
          password: autoPassword,
          note: "These credentials are auto-generated and should be securely communicated to the client"
        }
      };
    }, {
      timeout: 30000 // Increase timeout for large cell assignments
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
          client_type: "JURIDICO",
          client_id: { not: clientId }
        }
      });
      if (duplicateRuc) {
        throw new Error("A juridical client with this RUC already exists");
      }
    }

    if (updateData.individual_id && updateData.individual_id !== existingClient.individual_id) {
      const duplicateId = await prisma.client.findFirst({
        where: { 
          individual_id: updateData.individual_id,
          client_type: "NATURAL",
          client_id: { not: clientId }
        }
      });
      if (duplicateId) {
        throw new Error("A natural client with this ID already exists");
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
      // Juridical fields
      'company_name',
      'company_type',
      'establishment_type',
      'ruc',
      // Natural fields
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
      const finalNotes = notes || observations || `Cell assigned to ${client.client_type === "JURIDICO" ? client.company_name : `${client.first_names} ${client.last_name}`}`;
      
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
        { value: "JURIDICO", label: "Jurídico" },
        { value: "NATURAL", label: "Natural" }
      ]),
      // Get enum values for company types
      Promise.resolve([
        { value: "PRIVADO", label: "Privado" },
        { value: "PUBLICO", label: "Público" }
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
        juridical: ["company_name", "ruc", "company_type", "establishment_type"],
        natural: ["first_names", "last_name", "mothers_last_name", "individual_id", "date_of_birth"],
        // ✅ NEW: Support for multiple users
        users: ["users"] // Array of user objects with username and password
      },
      field_descriptions: {
        client_type: "Type of client: JURIDICO or NATURAL (REQUIRED)",
        email: "Email address for the client (REQUIRED)",
        address: "Physical address of the client (REQUIRED)",
        phone: "Primary phone number (REQUIRED)",
        cell_phone: "Mobile/cell phone number (REQUIRED)",
        company_name: "Company name (REQUIRED for juridical clients)",
        ruc: "RUC (Registro Único de Contribuyente) - 11 digits (REQUIRED for juridical clients)",
        company_type: "PRIVADO or PUBLICO company (REQUIRED for juridical clients)",
        establishment_type: "Type of juridical establishment (REQUIRED for juridical clients)",
        first_names: "First and middle names (REQUIRED for natural clients)",
        last_name: "Last name/surname (REQUIRED for natural clients)",
        mothers_last_name: "Mother's last name (REQUIRED for natural clients)",
        individual_id: "DNI or similar identification document (REQUIRED for natural clients)",
        date_of_birth: "Date of birth in YYYY-MM-DD format (REQUIRED for natural clients)",
        cell_ids: "Array of cell IDs to assign to the client (REQUIRED - at least 1 cell)",
        warehouse_id: "Warehouse ID where the cells are located (REQUIRED)",
        // ✅ NEW: Multiple users support
        users: "Array of user objects with username and password (OPTIONAL - if not provided, auto-generated credentials will be created)"
      }
    };
  } catch (error) {
    console.error("Error in getClientFormFields service:", error);
    throw error;
  }
}

/**
 * ✅ NEW: Get available warehouses for client assignment
 */
async function getAvailableWarehousesForAssignment() {
  try {
    return await prisma.warehouse.findMany({
      select: {
        warehouse_id: true,
        name: true,
        location: true,
        status: true,
        _count: {
          select: {
            cells: {
              where: {
                clientCellAssignments: {
                  none: {
                    is_active: true
                  }
                }
              }
            }
          }
        }
      },
      where: {
        status: "ACTIVE"
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error("Error in getAvailableWarehousesForAssignment service:", error);
    throw error;
  }
}

/**
 * ✅ NEW: Get client credentials (for debugging/testing only)
 */
async function getClientCredentials() {
  try {
    // Return all clients for now (since schema might not be fully updated)
    const clients = await prisma.client.findMany({
      select: {
        client_id: true,
        client_type: true,
        company_name: true,
        first_names: true,
        last_name: true,
        email: true,
        created_at: true,
        creator: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            role: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return clients.map(client => ({
      client_id: client.client_id,
      client_name: client.client_type === "JURIDICO" 
        ? client.company_name 
        : `${client.first_names} ${client.last_name}`,
      client_type: client.client_type,
      email: client.email,
      created_by: `${client.creator.first_name} ${client.creator.last_name} (${client.creator.role.name})`,
      created_at: client.created_at,
      note: "Client created successfully. Auto-generated credentials are managed by the system."
    }));
  } catch (error) {
    console.error("Error in getClientCredentials service:", error);
    throw error;
  }
}

/**
 * ✅ NEW: Get pending credentials for handover
 */
async function getPendingCredentialsForHandover() {
  try {
    return getAllPendingCredentials();
  } catch (error) {
    console.error("Error in getPendingCredentialsForHandover service:", error);
    throw error;
  }
}

/**
 * ✅ NEW: Get specific client credentials for handover
 */
async function getClientCredentialsForHandover(clientId) {
  try {
    const credentials = getCredentialsForHandover(clientId);
    if (!credentials) {
      throw new Error("Credentials not found or already handed over");
    }
    return credentials;
  } catch (error) {
    console.error("Error in getClientCredentialsForHandover service:", error);
    throw error;
  }
}

/**
 * ✅ NEW: Mark credentials as handed over to client
 */
async function markCredentialsHandedOver(clientId) {
  try {
    markCredentialsAsHandedOver(clientId);
    return { success: true, message: "Credentials marked as handed over" };
  } catch (error) {
    console.error("Error in markCredentialsHandedOver service:", error);
    throw error;
  }
}

// ✅ NEW: Get client by user ID (for authentication purposes)
async function getClientByUserId(userId) {
  try {
    // First try the old single user field (for backward compatibility)
    let client = await prisma.client.findFirst({
      where: { client_user_id: userId },
      select: {
        client_id: true,
        client_type: true,
        company_name: true,
        first_names: true,
        last_name: true,
        email: true,
        active_state: {
          select: { name: true }
        }
      }
    });
    
    // If not found, try the new multiple users table
    if (!client) {
      const clientUser = await prisma.clientUser.findFirst({
        where: { 
          user_id: userId,
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
              email: true,
              active_state: {
                select: { name: true }
              }
            }
          }
        }
      });
      
      if (clientUser) {
        client = clientUser.client;
      }
    }
    
    return client;
  } catch (error) {
    console.error("Error finding client by user ID:", error);
    throw error;
  }
}

// ✅ NEW: Add multiple users to a client
async function addClientUsers(clientId, usersData, createdBy) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate client exists
      const client = await tx.client.findUnique({
        where: { client_id: clientId },
        select: {
          client_id: true,
          client_type: true,
          company_name: true,
          first_names: true,
          last_name: true
        }
      });

      if (!client) {
        throw new Error("Client not found");
      }

      // Validate users data
      if (!Array.isArray(usersData) || usersData.length === 0) {
        throw new Error("Users data must be a non-empty array");
      }

      // Validate each user has required fields
      for (let i = 0; i < usersData.length; i++) {
        const userData = usersData[i];
        if (!userData.username || !userData.password) {
          throw new Error(`User ${i + 1}: username and password are required`);
        }
      }

      // Check for username conflicts
      const usernames = usersData.map(u => u.username);
      const duplicateUsernames = usernames.filter((username, index) => usernames.indexOf(username) !== index);
      if (duplicateUsernames.length > 0) {
        throw new Error(`Duplicate usernames found: ${[...new Set(duplicateUsernames)].join(', ')}`);
      }

      // Check for existing usernames in database
      const existingUsernames = await tx.user.findMany({
        where: { user_id: { in: usernames } },
        select: { user_id: true }
      });
      if (existingUsernames.length > 0) {
        throw new Error(`Usernames already exist: ${existingUsernames.map(u => u.user_id).join(', ')}`);
      }

      // Get creator's organization
      const creator = await tx.user.findUnique({
        where: { id: createdBy },
        include: { organisation: true, role: true }
      });

      if (!creator) {
        throw new Error("Creator user not found");
      }

      // Get CLIENT role
      const clientRole = await tx.role.findUnique({
        where: { name: "CLIENT" }
      });

      if (!clientRole) {
        throw new Error("CLIENT role not found in database");
      }

      // Create users and client users
      const createdUsers = [];
      for (let i = 0; i < usersData.length; i++) {
        const userData = usersData[i];
        const passwordHash = await bcrypt.hash(userData.password, 10);

        // Create user account
        const newUser = await tx.user.create({
          data: {
            user_id: userData.username,
            email: userData.email || `${userData.username}@client.local`,
            password_hash: passwordHash,
            role: { connect: { role_id: clientRole.role_id } },
            organisation: { connect: { organisation_id: creator.organisation_id } },
            first_name: userData.first_name || client.first_names?.split(" ")[0] || client.company_name?.split(" ")[0] || "Client",
            last_name: userData.last_name || client.last_name || client.company_name?.split(" ").slice(1).join(" ") || "User"
          }
        });

        // Create client user link
        const clientUser = await tx.clientUser.create({
          data: {
            client_id: clientId,
            user_id: newUser.id,
            username: userData.username,
            password_hash: passwordHash,
            is_primary: i === 0, // First user is primary
            is_active: true,
            created_by: createdBy,
            notes: userData.notes || `User ${i + 1} for client`
          }
        });

        createdUsers.push({
          clientUser,
          user: newUser
        });
      }

      return createdUsers;
    });

    return result;
  } catch (error) {
    console.error("Error in addClientUsers service:", error);
    throw error;
  }
}

// ✅ NEW: Get all users for a client
async function getClientUsers(clientId) {
  try {
    const clientUsers = await prisma.clientUser.findMany({
      where: { 
        client_id: clientId,
        is_active: true
      },
      include: {
        user: {
          select: {
            id: true,
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
            created_at: true
          }
        },
        creator: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: [
        { is_primary: 'desc' },
        { created_at: 'asc' }
      ]
    });

    return clientUsers;
  } catch (error) {
    console.error("Error in getClientUsers service:", error);
    throw error;
  }
}

// ✅ NEW: Deactivate a client user
async function deactivateClientUser(clientUserId, deactivatedBy) {
  try {
    const clientUser = await prisma.clientUser.findUnique({
      where: { client_user_id: clientUserId },
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
    });

    if (!clientUser) {
      throw new Error("Client user not found");
    }

    if (!clientUser.is_active) {
      throw new Error("Client user is already deactivated");
    }

    // Prevent deactivating the only active user
    const activeUsersCount = await prisma.clientUser.count({
      where: {
        client_id: clientUser.client_id,
        is_active: true
      }
    });

    if (activeUsersCount === 1) {
      throw new Error("Cannot deactivate the only active user for this client");
    }

    const updatedClientUser = await prisma.clientUser.update({
      where: { client_user_id: clientUserId },
      data: {
        is_active: false,
        notes: `${clientUser.notes || ''}\nDeactivated on ${new Date().toISOString()} by ${deactivatedBy}`
      }
    });

    return updatedClientUser;
  } catch (error) {
    console.error("Error in deactivateClientUser service:", error);
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
  getClientFormFields,
  getAvailableWarehousesForAssignment,
  getClientCredentials,
  getPendingCredentialsForHandover,
  getClientCredentialsForHandover,
  markCredentialsHandedOver,
  getClientByUserId
}; 