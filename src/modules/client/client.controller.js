const clientService = require("./client.service");

// Create a new client with REQUIRED cell assignment
async function createClient(req, res) {
  try {
    const clientData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Validate ALL required fields
    const validationErrors = [];

    // Client type validation
    if (!clientData.client_type) {
      validationErrors.push("Client type is required");
    } else if (!["COMMERCIAL", "INDIVIDUAL"].includes(clientData.client_type)) {
      validationErrors.push("Client type must be COMMERCIAL or INDIVIDUAL");
    }

    // Common required fields
    if (!clientData.email) validationErrors.push("Email is required");
    if (!clientData.address) validationErrors.push("Address is required");
    if (!clientData.phone) validationErrors.push("Phone number is required");
    if (!clientData.cell_phone) validationErrors.push("Cell phone number is required");

    // Client type specific validation
    if (clientData.client_type === "COMMERCIAL") {
      if (!clientData.company_name) validationErrors.push("Company name is required for commercial clients");
      if (!clientData.ruc) validationErrors.push("RUC is required for commercial clients");
      if (!clientData.company_type) validationErrors.push("Company type is required for commercial clients");
      if (!clientData.establishment_type) validationErrors.push("Establishment type is required for commercial clients");
    } else if (clientData.client_type === "INDIVIDUAL") {
      if (!clientData.first_names) validationErrors.push("First names are required for individual clients");
      if (!clientData.last_name) validationErrors.push("Last name is required for individual clients");
      if (!clientData.mothers_last_name) validationErrors.push("Mother's last name is required for individual clients");
      if (!clientData.individual_id) validationErrors.push("Individual ID is required for individual clients");
      if (!clientData.date_of_birth) validationErrors.push("Date of birth is required for individual clients");
    }

    // Cell assignment validation (mandatory)
    if (!clientData.cell_ids || !Array.isArray(clientData.cell_ids) || clientData.cell_ids.length === 0) {
      validationErrors.push("Cell assignment is required. Please provide at least one cell_id in the cell_ids array");
    }
    if (!clientData.warehouse_id) {
      validationErrors.push("Warehouse ID is required for cell assignment");
    }

    // Return all validation errors at once
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }
    
    // Extract cell assignment data (now required)
    const cellAssignmentData = {
      cell_ids: clientData.cell_ids,
      warehouse_id: clientData.warehouse_id,
      assigned_by: req.user?.id || clientData.assigned_by,
      notes: clientData.assignment_notes,
      max_capacity: clientData.max_capacity
    };
    
    // Validate assigned_by user
    if (!cellAssignmentData.assigned_by) {
      return res.status(400).json({
        success: false,
        message: "Assigned by user ID is required for cell assignment.",
      });
    }
    
    // Remove cell assignment fields from client data
    const {
      cell_ids,
      warehouse_id,
      assigned_by,
      assignment_notes,
      max_capacity,
      ...pureClientData
    } = clientData;
    
    // ✅ LOG: Client creation process started
    await req.logEvent(
      'CLIENT_CREATION_STARTED',
      'Client',
      'NEW_CLIENT',
      `Started creating new client: ${clientData.name}`,
      null,
      {
        client_name: clientData.name,
        client_email: clientData.email,
        client_phone: clientData.phone,
        client_address: clientData.address,
        client_city: clientData.city,
        client_country: clientData.country,
        contact_person: clientData.contact_person,
        created_by: userId,
        creator_role: userRole,
        creation_timestamp: new Date().toISOString(),
        has_tax_id: !!clientData.tax_id,
        has_registration_number: !!clientData.registration_number
      },
      { operation_type: 'CLIENT_MANAGEMENT', action_type: 'CREATION_START' }
    );
    
    const newClient = await clientService.createClient(pureClientData, cellAssignmentData);
    
    // ✅ LOG: Successful client creation
    await req.logEvent(
      'CLIENT_CREATED',
      'Client',
      newClient.client_id,
      `Successfully created new client: ${newClient.name}`,
      null,
      {
        client_id: newClient.client_id,
        client_name: newClient.name,
        client_email: newClient.email,
        client_phone: newClient.phone,
        client_address: newClient.address,
        client_city: newClient.city,
        client_country: newClient.country,
        contact_person: newClient.contact_person,
        tax_id: newClient.tax_id,
        registration_number: newClient.registration_number,
        status: newClient.status,
        created_by: userId,
        creator_role: userRole,
        created_at: newClient.created_at,
        business_impact: 'NEW_CLIENT_AVAILABLE_FOR_ORDERS'
      },
      { 
        operation_type: 'CLIENT_MANAGEMENT', 
        action_type: 'CREATION_SUCCESS',
        business_impact: 'CLIENT_ONBOARDED',
        next_steps: 'CLIENT_CAN_CREATE_DEPARTURE_ORDERS'
      }
    );
    
    res.status(201).json({
      success: true,
      message: "Client created and cells assigned successfully",
      data: newClient,
    });
  } catch (error) {
    console.error("Error in createClient controller:", error);
    
    // ✅ LOG: Client creation failure
    await req.logError(error, {
      controller: 'client',
      action: 'createClient',
      client_data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        city: req.body.city,
        country: req.body.country
      },
      user_id: req.user?.id,
      user_role: req.user?.role,
      error_context: 'CLIENT_CREATION_FAILED'
    });
    
    res.status(500).json({
      success: false,
      message: "Error creating client",
      error: error.message,
    });
  }
}

// Get all clients with filtering (no pagination - handled by frontend)
async function getAllClients(req, res) {
  try {
    const filters = {
      client_type: req.query.client_type,
      company_type: req.query.company_type,
      establishment_type: req.query.establishment_type,
      active_state_id: req.query.active_state_id,
      search: req.query.search
    };

    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // ✅ LOG: Client list access
    await req.logEvent(
      'CLIENT_LIST_ACCESSED',
      'Client',
      'CLIENT_LIST',
      `User accessed client list`,
      null,
      {
        accessed_by: userId,
        accessor_role: userRole,
        access_timestamp: new Date().toISOString(),
        query_params: req.query
      },
      { operation_type: 'CLIENT_MANAGEMENT', action_type: 'LIST_ACCESS' }
    );

    const clients = await clientService.getAllClients(filters);
    
    res.status(200).json({
      success: true,
      message: "Clients fetched successfully",
      data: clients,
      total_count: clients.length
    });
  } catch (error) {
    console.error("Error in getAllClients controller:", error);
    
    // ✅ LOG: Client list access failure
    await req.logError(error, {
      controller: 'client',
      action: 'getAllClients',
      user_id: req.user?.id,
      user_role: req.user?.role,
      error_context: 'CLIENT_LIST_ACCESS_FAILED'
    });
    
    res.status(500).json({
      success: false,
      message: "Error fetching clients",
      error: error.message,
    });
  }
}

// Get client by ID
async function getClientById(req, res) {
  try {
    const { client_id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // ✅ LOG: Client details access
    await req.logEvent(
      'CLIENT_DETAILS_ACCESSED',
      'Client',
      client_id,
      `User accessed client details for client ${client_id}`,
      null,
      {
        client_id: client_id,
        accessed_by: userId,
        accessor_role: userRole,
        access_timestamp: new Date().toISOString()
      },
      { operation_type: 'CLIENT_MANAGEMENT', action_type: 'DETAILS_ACCESS' }
    );

    const client = await clientService.getClientById(client_id);
    
    if (!client) {
      // ✅ LOG: Client not found
      await req.logEvent(
        'CLIENT_NOT_FOUND',
        'Client',
        client_id,
        `Client ${client_id} not found during details access`,
        null,
        {
          client_id: client_id,
          accessed_by: userId,
          accessor_role: userRole
        },
        { operation_type: 'CLIENT_MANAGEMENT', action_type: 'NOT_FOUND' }
      );
      
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Client fetched successfully",
      data: client,
    });
  } catch (error) {
    console.error("Error in getClientById controller:", error);
    
    // ✅ LOG: Client details access failure
    await req.logError(error, {
      controller: 'client',
      action: 'getClientById',
      client_id: req.params.client_id,
      user_id: req.user?.id,
      user_role: req.user?.role,
      error_context: 'CLIENT_DETAILS_ACCESS_FAILED'
    });
    
    const statusCode = error.message === "Client not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: "Error fetching client",
      error: error.message,
    });
  }
}

// Update client
async function updateClient(req, res) {
  try {
    const { client_id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // ✅ LOG: Client update process started
    await req.logEvent(
      'CLIENT_UPDATE_STARTED',
      'Client',
      client_id,
      `Started updating client ${client_id}`,
      null,
      {
        client_id: client_id,
        update_fields: Object.keys(updateData),
        updated_by: userId,
        updater_role: userRole,
        update_timestamp: new Date().toISOString(),
        has_name_change: !!updateData.name,
        has_contact_change: !!(updateData.email || updateData.phone),
        has_address_change: !!(updateData.address || updateData.city || updateData.country),
        has_status_change: !!updateData.status
      },
      { operation_type: 'CLIENT_MANAGEMENT', action_type: 'UPDATE_START' }
    );
    
    const updatedClient = await clientService.updateClient(client_id, updateData);
    
    if (!updatedClient.success) {
      // ✅ LOG: Client update failure (not found)
      await req.logEvent(
        'CLIENT_UPDATE_FAILED',
        'Client',
        client_id,
        `Client ${client_id} not found during update attempt`,
        null,
        {
          client_id: client_id,
          update_fields: Object.keys(updateData),
          updated_by: userId,
          updater_role: userRole,
          failure_reason: 'CLIENT_NOT_FOUND'
        },
        { operation_type: 'CLIENT_MANAGEMENT', action_type: 'UPDATE_NOT_FOUND' }
      );
      
      return res.status(404).json(updatedClient);
    }

    // ✅ LOG: Successful client update
    await req.logEvent(
      'CLIENT_UPDATED',
      'Client',
      client_id,
      `Successfully updated client ${client_id}`,
      updatedClient.oldValues,
      updatedClient.newValues,
      { 
        operation_type: 'CLIENT_MANAGEMENT', 
        action_type: 'UPDATE_SUCCESS',
        business_impact: updateData.status ? 'CLIENT_STATUS_CHANGED' : 'CLIENT_INFORMATION_UPDATED',
        changes_summary: {
          fields_updated: Object.keys(updateData),
          status_changed: !!updateData.status,
          contact_info_changed: !!(updateData.email || updateData.phone),
          address_changed: !!(updateData.address || updateData.city || updateData.country)
        }
      }
    );
    
    res.status(200).json(updatedClient);
  } catch (error) {
    console.error("Error in updateClient controller:", error);
    
    // ✅ LOG: Client update failure
    await req.logError(error, {
      controller: 'client',
      action: 'updateClient',
      client_id: req.params.client_id,
      update_data_keys: Object.keys(req.body || {}),
      user_id: req.user?.id,
      user_role: req.user?.role,
      error_context: 'CLIENT_UPDATE_FAILED'
    });
    
    const statusCode = error.message === "Client not found" ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: "Error updating client",
      error: error.message,
    });
  }
}

// Assign cells to client
async function assignCellsToClient(req, res) {
  try {
    const assignmentData = {
      ...req.body,
      assigned_by: req.user?.id || req.body.assigned_by, // Get from auth middleware or request body
    };

    const assignments = await clientService.assignCellsToClient(assignmentData);
    
    res.status(201).json({
      success: true,
      message: "Cells assigned to client successfully",
      data: assignments,
    });
  } catch (error) {
    console.error("Error in assignCellsToClient controller:", error);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// Get client cell assignments
async function getClientCellAssignments(req, res) {
  try {
    const { client_id } = req.params;
    const assignments = await clientService.getClientCellAssignments(client_id);
    
    res.status(200).json({
      success: true,
      message: "Client cell assignments fetched successfully",
      data: assignments,
    });
  } catch (error) {
    console.error("Error in getClientCellAssignments controller:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// Get available cells for client assignment
async function getAvailableCellsForClient(req, res) {
  try {
    const { warehouse_id } = req.query;
    const cells = await clientService.getAvailableCellsForClient(warehouse_id);
    
    res.status(200).json({
      success: true,
      message: "Available cells fetched successfully",
      data: cells,
    });
  } catch (error) {
    console.error("Error in getAvailableCellsForClient controller:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// Deactivate client cell assignment
async function deactivateClientCellAssignment(req, res) {
  try {
    const { assignment_id } = req.params;
    const deactivated_by = req.user?.id || req.body.deactivated_by;
    
    const assignment = await clientService.deactivateClientCellAssignment(assignment_id, deactivated_by);
    
    res.status(200).json({
      success: true,
      message: "Client cell assignment deactivated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Error in deactivateClientCellAssignment controller:", error);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// Get form fields for client creation
async function getClientFormFields(req, res) {
  try {
    const formFields = await clientService.getClientFormFields();
    
    res.status(200).json({
      success: true,
      message: "Client form fields fetched successfully",
      data: formFields,
    });
  } catch (error) {
    console.error("Error in getClientFormFields controller:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// Get client statistics
async function getClientStatistics(req, res) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const [
      totalClients,
      commercialClients,
      individualClients,
      activeClients,
      clientsWithCells,
      recentClients
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { client_type: "COMMERCIAL" } }),
      prisma.client.count({ where: { client_type: "INDIVIDUAL" } }),
      prisma.client.count({ 
        where: { 
          active_state: { name: "Active" }
        }
      }),
      prisma.client.count({
        where: {
          cellAssignments: {
            some: {
              is_active: true
            }
          }
        }
      }),
      prisma.client.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    const statistics = {
      totalClients,
      commercialClients,
      individualClients,
      activeClients,
      clientsWithCells,
      recentClients,
      percentages: {
        commercial: totalClients > 0 ? ((commercialClients / totalClients) * 100).toFixed(1) : 0,
        individual: totalClients > 0 ? ((individualClients / totalClients) * 100).toFixed(1) : 0,
        active: totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : 0,
        withCells: totalClients > 0 ? ((clientsWithCells / totalClients) * 100).toFixed(1) : 0
      }
    };

    res.status(200).json({
      success: true,
      message: "Client statistics fetched successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Error in getClientStatistics controller:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * ✅ DEBUG: Get client credentials (for testing purposes only)
 */
async function getClientCredentials(req, res) {
  try {
    // Only allow warehouse incharge and admin to access this
    if (!["WAREHOUSE_INCHARGE", "ADMIN"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only warehouse incharge and admin can access client credentials.",
      });
    }

    const clients = await clientService.getClientCredentials();
    
    return res.status(200).json({
      success: true,
      message: "Client credentials retrieved successfully",
      count: clients.length,
      data: clients,
      warning: "⚠️ This endpoint is for testing purposes only. Do not expose credentials in production.",
    });
  } catch (error) {
    console.error("Error getting client credentials:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving client credentials",
      error: error.message,
    });
  }
}

/**
 * ✅ TEST: Create a simple test client with minimal requirements
 */
async function createTestClient(req, res) {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    // Only allow warehouse incharge and admin to create test clients
    if (!["WAREHOUSE_INCHARGE", "ADMIN"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only warehouse incharge and admin can create test clients.",
      });
    }

    // Get available warehouses and cells for assignment
    const warehouses = await clientService.getAvailableWarehousesForAssignment();
    if (warehouses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No warehouses available for client assignment.",
      });
    }

    // Get available cells from the first warehouse
    const firstWarehouse = warehouses[0];
    const availableCells = await clientService.getAvailableCellsForClient(firstWarehouse.warehouse_id);
    
    if (!availableCells.all_cells || availableCells.all_cells.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No available cells for client assignment.",
      });
    }

    // Create a simple test client
    const testClientData = {
      client_type: "COMMERCIAL",
      company_name: `Test Client ${Date.now()}`,
      company_type: "PRIVATE",
      establishment_type: "FARMACIA",
      email: `testclient${Date.now()}@test.com`,
      address: "123 Test Street, Test City",
      phone: "123-456-7890",
      cell_phone: "098-765-4321",
      ruc: `20${Math.random().toString().slice(2, 11)}`,
    };

    // Use first 2 available cells for assignment
    const cellAssignmentData = {
      cell_ids: availableCells.all_cells.slice(0, 2).map(cell => cell.id),
      warehouse_id: firstWarehouse.warehouse_id,
      assigned_by: userId,
      notes: "Test client created by system",
      max_capacity: 100.00
    };

    const newClient = await clientService.createClient(testClientData, cellAssignmentData);
    
    return res.status(201).json({
      success: true,
      message: "Test client created successfully",
      data: newClient,
      warehouse_assigned: firstWarehouse.name,
      cells_assigned: cellAssignmentData.cell_ids.length,
    });
  } catch (error) {
    console.error("Error creating test client:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating test client",
      error: error.message,
    });
  }
}

/**
 * ✅ NEW: Get pending credentials for handover to clients
 */
async function getPendingCredentials(req, res) {
  try {
    // Only allow warehouse incharge and admin to access credentials
    if (!["WAREHOUSE_INCHARGE", "ADMIN"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only warehouse incharge and admin can access client credentials.",
      });
    }

    const pendingCredentials = await clientService.getPendingCredentialsForHandover();
    
    return res.status(200).json({
      success: true,
      message: "Pending credentials retrieved successfully",
      count: pendingCredentials.length,
      data: pendingCredentials,
      note: "⚠️ These credentials should be securely handed over to clients. They will auto-expire after 24 hours.",
    });
  } catch (error) {
    console.error("Error getting pending credentials:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving pending credentials",
      error: error.message,
    });
  }
}

/**
 * ✅ NEW: Get specific client credentials for handover
 */
async function getClientCredentialsById(req, res) {
  try {
    const { client_id } = req.params;
    
    // Only allow warehouse incharge and admin to access credentials
    if (!["WAREHOUSE_INCHARGE", "ADMIN"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only warehouse incharge and admin can access client credentials.",
      });
    }

    const credentials = await clientService.getClientCredentialsForHandover(client_id);
    
    return res.status(200).json({
      success: true,
      message: "Client credentials retrieved successfully",
      data: credentials,
      note: "⚠️ Please hand over these credentials securely to the client and mark as completed.",
    });
  } catch (error) {
    console.error("Error getting client credentials:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving client credentials",
      error: error.message,
    });
  }
}

/**
 * ✅ NEW: Mark credentials as handed over to client
 */
async function markCredentialsHandedOver(req, res) {
  try {
    const { client_id } = req.params;
    
    // Only allow warehouse incharge and admin to mark credentials as handed over
    if (!["WAREHOUSE_INCHARGE", "ADMIN"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only warehouse incharge and admin can mark credentials as handed over.",
      });
    }

    const result = await clientService.markCredentialsHandedOver(client_id);
    
    return res.status(200).json({
      success: true,
      message: "Credentials marked as handed over successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error marking credentials as handed over:", error);
    return res.status(500).json({
      success: false,
      message: "Error marking credentials as handed over",
      error: error.message,
    });
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
  getClientStatistics,
  getClientCredentials,
  createTestClient,
  getPendingCredentials,
  getClientCredentialsById,
  markCredentialsHandedOver,
}; 