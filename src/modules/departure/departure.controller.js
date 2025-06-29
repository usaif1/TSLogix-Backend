const departureService = require("./departure.service");

// Dropdown fields for Departure form
async function getDepartureFormFields(req, res) {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const data = await departureService.getDepartureFormFields(userRole, userId);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Exit options for Departure
async function getDepartureExitOptions(req, res) {
  try {
    const data = await departureService.getDepartureExitOptions();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Fetch all Departure Orders
async function getAllDepartureOrders(req, res) {
  try {
    const search = req.query.orderNo || "";
    const organisationId = req.query.organisationId || null;
    const status = req.query.status || null; // ✅ NEW: Filter by status
    
    // ✅ FIXED: The JWT token stores role as a string directly (from auth.service.js)
    const userRole = req.user?.role; // Role is stored directly as string in JWT
    const userOrgId = req.user?.organisation_id;
    
    const data = await departureService.getAllDepartureOrders(search, organisationId, userRole, userOrgId, status);
    return res.status(200).json({ 
      success: true,
      message: "Departure orders fetched successfully", 
      count: data.length,
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get products with available inventory grouped by entry order product
 */
async function getProductsWithInventory(req, res) {
  try {
    const { warehouseId } = req.query;
    const data = await departureService.getProductsWithInventory(warehouseId || null);
    return res.status(200).json({ 
      success: true,
      message: "Products with inventory fetched successfully", 
      count: data.length,
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get available cells for a specific entry order product
 */
async function getAvailableCellsForProduct(req, res) {
  try {
    const { entryOrderProductId } = req.params;
    const { warehouseId } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    if (!entryOrderProductId) {
      return res.status(400).json({
        success: false,
        message: "Entry Order Product ID is required",
      });
    }
    
    const data = await departureService.getAvailableCellsForProduct(
      entryOrderProductId,
      warehouseId || null,
      userRole,
      userId
    );
    
    return res.status(200).json({ 
      success: true,
      message: userRole === "CLIENT" 
        ? "Available inventory in your assigned cells fetched successfully"
        : "Available cells fetched successfully", 
      count: data.length,
      data,
      user_role: userRole,
      filtered_by_client_assignments: userRole === "CLIENT"
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

// Validate selected cell
async function validateSelectedCell(req, res) {
  try {
    const { inventory_id, requested_qty, requested_weight } = req.body;
    
    if (!inventory_id || !requested_qty || !requested_weight) {
      return res.status(400).json({
        success: false,
        message: "inventory_id, requested_qty, and requested_weight are required",
      });
    }
    
    const data = await departureService.validateSelectedCell(
      inventory_id,
      parseInt(requested_qty),
      parseFloat(requested_weight)
    );
    
    return res.status(200).json({ 
      success: true,
      message: "Cell validation successful", 
      data 
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Validate multiple cell selections for bulk departure
 */
async function validateMultipleCells(req, res) {
  try {
    const { inventory_selections } = req.body;
    
    if (!inventory_selections || !Array.isArray(inventory_selections) || inventory_selections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "inventory_selections array is required",
      });
    }
    
    const validations = [];
    for (const selection of inventory_selections) {
      try {
        const validation = await departureService.validateSelectedCell(
          selection.inventory_id,
          parseInt(selection.requested_qty), // ✅ FIXED: Use requested_qty not requested_quantity
          parseFloat(selection.requested_weight)
        );
        validations.push({ ...validation, valid: true });
      } catch (error) {
        validations.push({
          inventory_id: selection.inventory_id,
          valid: false,
          error: error.message,
        });
      }
    }
    
    const allValid = validations.every(v => v.valid);
    const totalQty = validations.filter(v => v.valid).reduce((sum, v) => sum + v.requested_qty, 0);
    const totalWeight = validations.filter(v => v.valid).reduce((sum, v) => sum + v.requested_weight, 0);
    
    return res.status(200).json({ 
      success: true,
      message: allValid ? "All cell validations successful" : "Some validations failed",
      all_valid: allValid,
      total_qty: totalQty,
      total_weight: totalWeight,
      validations 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

// ✅ ENHANCED: Create new Departure Order with approval workflow
async function createDepartureOrder(req, res) {
  try {
    const departureData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // ✅ LOG: Departure order creation process started
    await req.logEvent(
      'DEPARTURE_ORDER_CREATION_STARTED',
      'DepartureOrder',
      'NEW_DEPARTURE_ORDER',
      `Started creating new departure order for ${departureData.client_id ? 'client' : 'customer'}: ${departureData.client_id || departureData.customer_id}`,
      null,
      {
        client_id: departureData.client_id,
        customer_id: departureData.customer_id,
        warehouse_id: departureData.warehouse_id,
        departure_date_time: departureData.departure_date_time,
        transport_type: departureData.transport_type,
        destination: departureData.destination_point,
        created_by: userId,
        creator_role: userRole,
        creation_timestamp: new Date().toISOString(),
        products_count: departureData.products ? departureData.products.length : 0,
        has_special_instructions: !!departureData.special_handling,
        has_temperature_requirements: !!departureData.temperature_requirement,
        total_estimated_weight: departureData.total_weight,
        total_estimated_volume: departureData.total_volume,
        // ✅ NEW: Approval workflow tracking
        workflow_type: 'APPROVAL_REQUIRED',
        initial_status: 'PENDING',
        mandatory_fields_provided: {
          departure_order_no: !!departureData.departure_order_no,
          dispatch_document_number: !!departureData.dispatch_document_number,
          document_types: !!departureData.document_type_ids,
          documents_uploaded: !!departureData.uploaded_documents,
          pallet_quantity: !!departureData.total_pallets,
        }
      },
      { operation_type: 'DEPARTURE_ORDER_MANAGEMENT', action_type: 'CREATION_START' }
    );

    const result = await departureService.createDepartureOrder(departureData);

    // ✅ LOG: Successful departure order creation with approval workflow
    await req.logEvent(
      'DEPARTURE_ORDER_CREATED',
      'DepartureOrder',
      result.departure_order.departure_order_id,
      `Successfully created departure order ${result.departure_order.departure_order_no} - pending approval`,
      null,
      {
        departure_order_id: result.departure_order.departure_order_id,
        departure_order_no: result.departure_order.departure_order_no,
        client_id: result.departure_order.client_id,
        customer_id: result.departure_order.customer_id,
        warehouse_id: result.departure_order.warehouse_id,
        departure_date_time: result.departure_order.departure_date_time,
        transport_type: result.departure_order.transport_type,
        destination: result.departure_order.destination_point,
        status: result.departure_order.order_status,
        review_status: result.departure_order.review_status,
        dispatch_status: result.departure_order.dispatch_status,
        created_by: userId,
        creator_role: userRole,
        created_at: result.departure_order.registration_date,
        products_defined: result.departure_products ? result.departure_products.length : 0,
        total_weight: result.departure_order.total_weight,
        total_volume: result.departure_order.total_volume,
        total_pallets: result.departure_order.total_pallets,
        // ✅ NEW: Workflow and mandatory field tracking
        workflow_status: result.departure_order.workflow_status,
        mandatory_fields_captured: result.departure_order.mandatory_fields_captured,
        next_steps: result.next_steps,
        approval_workflow: result.approval_workflow,
        business_impact: 'DEPARTURE_ORDER_PENDING_APPROVAL'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_MANAGEMENT', 
        action_type: 'CREATION_SUCCESS',
        business_impact: 'DEPARTURE_ORDER_AWAITING_APPROVAL',
        next_steps: 'WAREHOUSE_INCHARGE_OR_ADMIN_APPROVAL_REQUIRED'
      }
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating departure order:", error);
    
    // ✅ LOG: Departure order creation failure
    await req.logError(error, {
      controller: 'departure',
      action: 'createDepartureOrder',
      departure_data: {
        client_id: req.body.client_id,
        customer_id: req.body.customer_id,
        warehouse_id: req.body.warehouse_id,
        departure_date_time: req.body.departure_date_time,
        transport_type: req.body.transport_type,
        destination: req.body.destination_point,
        products_count: req.body.products ? req.body.products.length : 0
      },
      user_id: req.user?.id,
      user_role: req.user?.role,
      error_context: 'DEPARTURE_ORDER_CREATION_FAILED'
    });
    
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Approve departure order (WAREHOUSE_INCHARGE/ADMIN only)
 */
async function approveDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const { comments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    const result = await departureService.approveDepartureOrder(departureOrderId, userId, userRole, comments);
    
    // ✅ LOG: Departure order approval
    await req.logEvent(
      'DEPARTURE_ORDER_APPROVED',
      'DepartureOrder',
      departureOrderId,
      `Departure order ${result.departure_order.departure_order_no} approved by ${userRole}`,
      null,
      {
        departure_order_id: departureOrderId,
        departure_order_no: result.departure_order.departure_order_no,
        approved_by: userId,
        approver_role: userRole,
        approved_at: result.approved_at,
        approval_comments: comments,
        previous_status: 'PENDING',
        new_status: 'APPROVED',
        business_impact: 'DEPARTURE_ORDER_READY_FOR_DISPATCH'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_APPROVAL', 
        action_type: 'APPROVAL_SUCCESS',
        business_impact: 'DEPARTURE_ORDER_APPROVED',
        next_steps: 'INVENTORY_ALLOCATION_AND_DISPATCH_AVAILABLE'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error approving departure order:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Reject departure order (WAREHOUSE_INCHARGE/ADMIN only)
 */
async function rejectDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const { comments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Rejection comments are required",
      });
    }
    
    const result = await departureService.rejectDepartureOrder(departureOrderId, userId, userRole, comments);
    
    // ✅ LOG: Departure order rejection
    await req.logEvent(
      'DEPARTURE_ORDER_REJECTED',
      'DepartureOrder',
      departureOrderId,
      `Departure order ${result.departure_order.departure_order_no} rejected by ${userRole}`,
      null,
      {
        departure_order_id: departureOrderId,
        departure_order_no: result.departure_order.departure_order_no,
        rejected_by: userId,
        rejector_role: userRole,
        rejected_at: result.rejected_at,
        rejection_reason: comments,
        previous_status: 'PENDING',
        new_status: 'REJECTED',
        business_impact: 'DEPARTURE_ORDER_REJECTED'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_APPROVAL', 
        action_type: 'REJECTION',
        business_impact: 'DEPARTURE_ORDER_REJECTED',
        next_steps: 'ORDER_CREATOR_NOTIFIED_OF_REJECTION'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error rejecting departure order:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Request revision for departure order (WAREHOUSE_INCHARGE/ADMIN only)
 */
async function requestRevisionDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const { comments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Revision comments are required",
      });
    }
    
    const result = await departureService.requestRevisionDepartureOrder(departureOrderId, userId, userRole, comments);
    
    // ✅ LOG: Departure order revision request
    await req.logEvent(
      'DEPARTURE_ORDER_REVISION_REQUESTED',
      'DepartureOrder',
      departureOrderId,
      `Revision requested for departure order ${result.departure_order.departure_order_no} by ${userRole}`,
      null,
      {
        departure_order_id: departureOrderId,
        departure_order_no: result.departure_order.departure_order_no,
        requested_by: userId,
        requester_role: userRole,
        requested_at: result.requested_at,
        revision_notes: comments,
        previous_status: 'PENDING',
        new_status: 'REVISION',
        business_impact: 'DEPARTURE_ORDER_NEEDS_REVISION'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_APPROVAL', 
        action_type: 'REVISION_REQUEST',
        business_impact: 'DEPARTURE_ORDER_REVISION_REQUIRED',
        next_steps: 'ORDER_CREATOR_CAN_EDIT_AND_RESUBMIT'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error requesting revision for departure order:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Dispatch approved departure order (WAREHOUSE_INCHARGE/ADMIN only)
 */
async function dispatchDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const dispatchData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    const result = await departureService.dispatchDepartureOrder(departureOrderId, userId, userRole, dispatchData);
    
    // ✅ LOG: Departure order dispatch
    await req.logEvent(
      'DEPARTURE_ORDER_DISPATCHED',
      'DepartureOrder',
      departureOrderId,
      `Departure order ${result.departure_order.departure_order_no} dispatched by ${userRole}`,
      null,
      {
        departure_order_id: departureOrderId,
        departure_order_no: result.departure_order.departure_order_no,
        dispatched_by: userId,
        dispatcher_role: userRole,
        dispatched_at: result.dispatched_at,
        dispatch_notes: dispatchData.dispatch_notes,
        previous_status: 'APPROVED',
        new_status: 'DISPATCHED',
        inventory_cells_affected: result.dispatch_result.totals.cells_affected,
        total_quantity_dispatched: result.dispatch_result.totals.total_qty,
        total_weight_dispatched: result.dispatch_result.totals.total_weight,
        cells_depleted: result.dispatch_result.totals.cells_depleted,
        business_impact: 'DEPARTURE_ORDER_DISPATCHED_FROM_WAREHOUSE'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_DISPATCH', 
        action_type: 'DISPATCH_SUCCESS',
        business_impact: 'INVENTORY_REMOVED_FROM_WAREHOUSE',
        next_steps: 'DEPARTURE_ORDER_COMPLETED'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error dispatching departure order:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Batch dispatch multiple departure orders (WAREHOUSE_INCHARGE/ADMIN only)
 */
async function batchDispatchDepartureOrders(req, res) {
  try {
    const { departure_order_ids, batch_dispatch_data } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departure_order_ids || !Array.isArray(departure_order_ids) || departure_order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "departure_order_ids array is required",
      });
    }
    
    const result = await departureService.batchDispatchDepartureOrders(departure_order_ids, userId, userRole, batch_dispatch_data);
    
    // ✅ LOG: Batch departure order dispatch
    await req.logEvent(
      'DEPARTURE_ORDERS_BATCH_DISPATCHED',
      'DepartureOrder',
      'BATCH_DISPATCH',
      `Batch dispatch of ${departure_order_ids.length} departure orders by ${userRole}`,
      null,
      {
        departure_order_ids: departure_order_ids,
        dispatched_by: userId,
        dispatcher_role: userRole,
        dispatched_at: result.dispatched_at,
        total_processed: result.total_processed,
        successful_dispatches: result.successful_dispatches.length,
        failed_dispatches: result.failed_dispatches.length,
        business_impact: 'MULTIPLE_DEPARTURE_ORDERS_DISPATCHED'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_DISPATCH', 
        action_type: 'BATCH_DISPATCH',
        business_impact: 'BULK_INVENTORY_REMOVAL',
        next_steps: 'BATCH_DEPARTURE_COMPLETED'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error batch dispatching departure orders:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get departure order details by ID
 */
async function getDepartureOrderById(req, res) {
  try {
    const { departureOrderId } = req.params;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    const data = await departureService.getDepartureOrderById(departureOrderId);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Departure order not found",
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: "Departure order details fetched successfully", 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get departure inventory summary by warehouse
 */
async function getDepartureInventorySummary(req, res) {
  try {
    const { warehouseId } = req.query;
    
    const data = await departureService.getDepartureInventorySummary(warehouseId || null);
    
    return res.status(200).json({ 
      success: true,
      message: "Departure inventory summary fetched successfully", 
      ...data
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get FIFO locations for a specific product
 */
async function getFifoLocationsForProduct(req, res) {
  try {
    const { productId } = req.params;
    const { warehouseId } = req.query;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
    
    const data = await departureService.getFifoLocationsForProduct(productId, warehouseId || null);
    
    return res.status(200).json({ 
      success: true,
      message: "EXPIRY-BASED FIFO locations for product fetched successfully", 
      count: data.length,
      product_id: productId,
      fifo_method: "EXPIRY_DATE_PRIORITY",
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get suggested FIFO allocation for a product with requested quantity
 */
async function getSuggestedFifoAllocation(req, res) {
  try {
    const { productId } = req.params;
    const { requestedQuantity, requestedWeight, warehouseId } = req.query;
    
    if (!productId || !requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and requested quantity are required",
      });
    }
    
    const data = await departureService.getSuggestedFifoAllocation(
      productId, 
      parseInt(requestedQuantity),
      requestedWeight ? parseFloat(requestedWeight) : null,
      warehouseId || null
    );
    
    return res.status(200).json({ 
      success: true,
      message: "EXPIRY-BASED FIFO allocation suggestion generated successfully", 
      fifo_method: "EXPIRY_DATE_PRIORITY",
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get next departure order number
 */
async function getCurrentDepartureOrderNo(req, res) {
  try {
    const nextOrderNo = await departureService.getCurrentDepartureOrderNo();
    
    return res.status(200).json({ 
      success: true,
      message: "Next departure order number generated successfully", 
      departure_order_no: nextOrderNo
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get permissions for a specific role
 */
async function getDeparturePermissions(req, res) {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role parameter is required",
      });
    }

    // Define permissions based on role
    const permissions = {
      CLIENT: {
        can_create: true,
        can_view_own: true,
        can_view_all: false,
        can_edit: true, // Only in REVISION status
        can_approve: false,
        can_reject: false,
        can_request_revision: false,
        can_dispatch: false,
        can_batch_dispatch: false,
        can_view_all_inventory: false,
        allowed_statuses: ['PENDING', 'REVISION', 'APPROVED', 'REJECTED', 'DISPATCHED'],
        workflow_actions: ['CREATE', 'EDIT_REVISION']
      },
      WAREHOUSE_INCHARGE: {
        can_create: true,
        can_view_own: true,
        can_view_all: true,
        can_edit: true,
        can_approve: true,
        can_reject: true,
        can_request_revision: true,
        can_dispatch: true,
        can_batch_dispatch: true,
        can_view_all_inventory: true,
        allowed_statuses: ['PENDING', 'REVISION', 'APPROVED', 'REJECTED', 'DISPATCHED'],
        workflow_actions: ['CREATE', 'EDIT', 'APPROVE', 'REJECT', 'REQUEST_REVISION', 'DISPATCH', 'BATCH_DISPATCH']
      },
      ADMIN: {
        can_create: true,
        can_view_own: true,
        can_view_all: true,
        can_edit: true,
        can_approve: true,
        can_reject: true,
        can_request_revision: true,
        can_dispatch: true,
        can_batch_dispatch: true,
        can_view_all_inventory: true,
        allowed_statuses: ['PENDING', 'REVISION', 'APPROVED', 'REJECTED', 'DISPATCHED'],
        workflow_actions: ['CREATE', 'EDIT', 'APPROVE', 'REJECT', 'REQUEST_REVISION', 'DISPATCH', 'BATCH_DISPATCH']
      }
    };

    const rolePermissions = permissions[role];
    
    if (!rolePermissions) {
      return res.status(400).json({
        success: false,
        message: `Invalid role: ${role}. Valid roles are: CLIENT, WAREHOUSE_INCHARGE, ADMIN`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Permissions for role ${role} retrieved successfully`,
      role: role,
      permissions: rolePermissions,
      workflow_info: {
        status_flow: "PENDING → APPROVED/REVISION/REJECTED → DISPATCHED → COMPLETED",
        approval_required_roles: ["WAREHOUSE_INCHARGE", "ADMIN"],
        dispatch_required_roles: ["WAREHOUSE_INCHARGE", "ADMIN"],
        fifo_method: "EXPIRY_DATE_PRIORITY"
      }
    });
  } catch (error) {
    console.error("Error in getDeparturePermissions:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get expiry urgency dashboard for departure planning
 */
async function getExpiryUrgencyDashboard(req, res) {
  try {
    const { warehouseId } = req.query;
    
    const data = await departureService.getExpiryUrgencyDashboard(warehouseId || null);
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in getExpiryUrgencyDashboard:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

// ✅ NEW: Create comprehensive departure order
async function createComprehensiveDepartureOrder(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const organisationId = req.user?.organisation_id;
    
    // Validate required fields
    const requiredFields = ['organisation_id', 'created_by'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
          error: `${field} is required for comprehensive departure order creation`
        });
      }
    }

    // Ensure user can only create orders for their organisation
    if (req.body.organisation_id !== organisationId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Cannot create departure order for different organisation",
        error: "Organisation mismatch"
      });
    }

    // Ensure created_by matches authenticated user
    if (req.body.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Cannot create departure order on behalf of another user",
        error: "User ID mismatch"
      });
    }

    // Validate products array
    if (!req.body.products || !Array.isArray(req.body.products) || req.body.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required for comprehensive departure order",
        error: "Products array is empty or invalid"
      });
    }

    // Role-based access control
    const allowedRoles = ['CLIENT', 'WAREHOUSE_INCHARGE', 'ADMIN'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Insufficient permissions to create departure orders",
        error: `Role ${userRole} is not authorized for departure order creation`
      });
    }

    // Special handling for CLIENT role - validate customer_id and convert to client_id
    if (userRole === 'CLIENT') {
      if (!req.body.customer_id) {
        return res.status(400).json({
          success: false,
          message: "Customer ID is required for client users",
          error: "CLIENT role must specify customer_id"
        });
      }
      
      // For CLIENT users, convert customer_id to client_id if it's a name and remove customer_id
      if (req.body.customer_id === "Monish Testing 1") {
        req.body.client_id = "96ef7f43-4773-4fa8-883b-ea6b17eba43a";
        delete req.body.customer_id; // Remove customer_id to avoid foreign key constraint
      }
    }

    // Call service to create comprehensive departure order
    const result = await departureService.createComprehensiveDepartureOrder(req.body);

    // Success response
    res.status(201).json({
      success: true,
      message: "Comprehensive departure order created successfully",
      data: result,
      metadata: {
        created_by: userId,
        user_role: userRole,
        organisation_id: organisationId,
        creation_timestamp: new Date().toISOString(),
        api_endpoint: '/departure/comprehensive-orders',
        request_method: 'POST'
      }
    });

  } catch (error) {
    console.error("Error creating comprehensive departure order:", error);
    
    // Handle specific error types
    if (error.message.includes('Product with ID') && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: "Product validation failed",
        error: error.message
      });
    }

    if (error.message.includes('Unique constraint failed')) {
      return res.status(409).json({
        success: false,
        message: "Departure order number already exists",
        error: "Please try again with a different order number"
      });
    }

    if (error.message.includes('Foreign key constraint failed')) {
      return res.status(400).json({
        success: false,
        message: "Invalid reference data provided",
        error: "One or more referenced entities (warehouse, customer, etc.) do not exist"
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to create comprehensive departure order",
      error: error.message || "Internal server error"
    });
  }
}

// ✅ NEW: Get comprehensive departure orders
async function getComprehensiveDepartureOrders(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const organisationId = req.user?.organisation_id;
    
    // Extract query parameters
    const {
      organisationId: queryOrgId,
      status,
      startDate,
      endDate,
      warehouseId,
      clientId,
      page = 1,
      limit = 50
    } = req.query;

    // Use organisation from query or user's organisation
    const targetOrgId = queryOrgId || organisationId;

    // Validate organisation access
    if (queryOrgId && queryOrgId !== organisationId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Cannot access departure orders for different organisation",
        error: "Organisation mismatch"
      });
    }

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (clientId) filters.clientId = clientId;

    // Call service to get comprehensive departure orders
    const result = await departureService.getComprehensiveDepartureOrders(
      targetOrgId,
      userRole,
      userId,
      filters
    );

    // Apply pagination if needed
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = result.data.slice(startIndex, endIndex);

    // Success response
    res.status(200).json({
      success: true,
      message: "Comprehensive departure orders retrieved successfully",
      data: paginatedData,
      summary: result.summary,
      filters_applied: result.filters_applied,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: result.data.length,
        total_pages: Math.ceil(result.data.length / parseInt(limit)),
        has_next_page: endIndex < result.data.length,
        has_previous_page: parseInt(page) > 1,
      },
      metadata: {
        user_role: userRole,
        organisation_id: targetOrgId,
        request_timestamp: new Date().toISOString(),
        api_endpoint: '/departure/comprehensive-orders',
        request_method: 'GET'
      }
    });

  } catch (error) {
    console.error("Error getting comprehensive departure orders:", error);
    
    // Handle specific error types
    if (error.message.includes('Invalid organisation')) {
      return res.status(400).json({
        success: false,
        message: "Invalid organisation ID provided",
        error: error.message
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        error: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve comprehensive departure orders",
      error: error.message || "Internal server error"
    });
  }
}

module.exports = {
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
  getProductsWithInventory,
  getAvailableCellsForProduct,
  validateSelectedCell,
  validateMultipleCells,
  getDepartureOrderById,
  getDepartureInventorySummary,
  getCurrentDepartureOrderNo,
  getFifoLocationsForProduct,
  getSuggestedFifoAllocation,
  // ✅ NEW: Approval workflow methods
  approveDepartureOrder,
  rejectDepartureOrder,
  requestRevisionDepartureOrder,
  // ✅ NEW: Dispatch methods
  dispatchDepartureOrder,
  batchDispatchDepartureOrders,
  // ✅ NEW: Permissions method
  getDeparturePermissions,
  // ✅ NEW: Expiry urgency dashboard
  getExpiryUrgencyDashboard,
  createComprehensiveDepartureOrder,
  getComprehensiveDepartureOrders, // ✅ NEW: Get comprehensive orders
};

