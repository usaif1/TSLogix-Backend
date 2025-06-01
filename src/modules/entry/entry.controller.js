const entryService = require("./entry.service");

// Create a new Entry Order with multiple products (updated for new schema)
async function createEntryOrder(req, res) {
  const entryData = req.body;

  // ✅ UPDATED: Validate new required fields
  if (
    !entryData.entry_order_no ||
    !entryData.organisation_id ||
    !entryData.created_by ||
    !entryData.products ||
    !Array.isArray(entryData.products) ||
    entryData.products.length === 0
  ) {
    return res.status(400).json({
      message: "Missing required fields. Entry order must include at least one product.",
    });
  }

  // ✅ UPDATED: Validate each product with new schema fields
  for (let i = 0; i < entryData.products.length; i++) {
    const product = entryData.products[i];
    if (
      !product.product_id ||
      !product.product_code ||
      !product.inventory_quantity ||
      !product.package_quantity ||
      !product.weight_kg
    ) {
      return res.status(400).json({
        message: `Product ${i + 1}: Missing required fields (product_id, product_code, inventory_quantity, package_quantity, weight_kg)`,
      });
    }

    // Validate quantities are positive numbers
    if (
      product.inventory_quantity <= 0 ||
      product.package_quantity <= 0 ||
      product.weight_kg <= 0
    ) {
      return res.status(400).json({
        message: `Product ${i + 1}: Quantities and weight must be positive numbers`,
      });
    }

    // Validate dates if provided
    if (product.manufacturing_date && product.expiration_date) {
      const mfgDate = new Date(product.manufacturing_date);
      const expDate = new Date(product.expiration_date);
      if (expDate <= mfgDate) {
        return res.status(400).json({
          message: `Product ${i + 1}: Expiration date must be after manufacturing date`,
        });
      }
    }
  }

  try {
    const result = await entryService.createEntryOrder(entryData);
    return res.status(201).json({
      message: "Entry order created successfully",
      entryOrder: result.entryOrder,
      products: result.products,
    });
  } catch (error) {
    console.error("Error creating entry order:", error);
    return res.status(500).json({
      message: "Error creating entry order",
      error: error.message,
    });
  }
}

// Fetch all Entry Orders (updated for new schema)
async function getAllEntryOrders(req, res) {
  try {
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role?.name;
    const searchOrderNo = req.query.orderNo || null;

    if (!organisationId) {
      return res.status(403).json({ message: "Authorization required" });
    }

    // ✅ UPDATED: Admin can see all orders, others see only their organization's orders
    const filterOrg = userRole === "ADMIN" ? null : organisationId;
    
    // ✅ UPDATED: Changed sort field to match new schema
    const sortOptions = { 
      orderBy: "registration_date", 
      direction: req.query.sortDirection || "desc" 
    };

    const entryOrders = await entryService.getAllEntryOrders(
      filterOrg,
      sortOptions,
      searchOrderNo
    );

    return res.status(200).json({
      success: true,
      data: entryOrders,
      count: entryOrders.length,
      user_role: userRole,
    });
  } catch (error) {
    console.error("Error fetching entry orders:", error);
    return res.status(500).json({
      message: "Error fetching entry orders",
      error: error.message,
    });
  }
}

// Fetch dropdown fields for Entry form (updated with new enums)
async function getEntryFormFields(req, res) {
  try {
    const data = await entryService.getEntryFormFields();
    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching form fields:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to fetch form fields",
      error: error.message 
    });
  }
}

// Get next Entry Order number
async function getCurrentEntryOrderNo(req, res) {
  try {
    const currentOrderNo = await entryService.getCurrentEntryOrderNo();
    return res.status(200).json({ 
      success: true,
      currentOrderNo 
    });
  } catch (error) {
    console.error("Error getting current order number:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to generate order number",
      error: error.message 
    });
  }
}

// Fetch single Entry Order by order number (updated with full product details)
async function getEntryOrderByNo(req, res) {
  try {
    const { orderNo } = req.params;
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role?.name;

    if (!organisationId) {
      return res.status(403).json({ message: "Authorization required" });
    }

    const filterOrg = userRole === "ADMIN" ? null : organisationId;
    const entryOrder = await entryService.getEntryOrderByNo(orderNo, filterOrg);

    if (!entryOrder) {
      return res.status(404).json({ 
        success: false,
        message: "Entry order not found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: entryOrder 
    });
  } catch (error) {
    console.error("Error fetching entry order:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching entry order",
      error: error.message,
    });
  }
}

// ✅ UPDATED: Fetch approved entry orders ready for inventory allocation
async function getApprovedEntryOrders(req, res) {
  try {
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role?.name;
    const searchNo = req.query.orderNo || null;

    if (!organisationId) {
      return res.status(403).json({ message: "Authorization required" });
    }

    // Only warehouse and admin can access approved orders for allocation
    if (userRole !== "WAREHOUSE" && userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only warehouse staff can view approved orders." 
      });
    }

    const filterOrg = userRole === "ADMIN" ? null : organisationId;
    const approvedOrders = await entryService.getApprovedEntryOrders(filterOrg, searchNo);

    return res.status(200).json({
      success: true,
      data: approvedOrders,
      count: approvedOrders.length,
    });
  } catch (error) {
    console.error("Error fetching approved orders:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching approved orders",
      error: error.message 
    });
  }
}

// ✅ NEW: Review entry order (Admin only)
async function reviewEntryOrder(req, res) {
  try {
    const { orderNo } = req.params;
    const { review_status, review_comments } = req.body;
    const reviewerId = req.user?.id;
    const userRole = req.user?.role?.name;

    // Only admin can review orders
    if (userRole !== "ADMIN") {
      return res.status(403).json({ 
        message: "Access denied. Only administrators can review orders." 
      });
    }

    if (!review_status || !["APPROVED", "REJECTED", "NEEDS_REVISION"].includes(review_status)) {
      return res.status(400).json({
        message: "Invalid review status. Must be APPROVED, REJECTED, or NEEDS_REVISION",
      });
    }

    const result = await entryService.reviewEntryOrder(orderNo, {
      review_status,
      review_comments,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
    });

    if (!result) {
      return res.status(404).json({ 
        message: "Entry order not found" 
      });
    }

    return res.status(200).json({
      success: true,
      message: `Entry order ${review_status.toLowerCase()} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error reviewing entry order:", error);
    return res.status(500).json({
      success: false,
      message: "Error reviewing entry order",
      error: error.message,
    });
  }
}

// ✅ NEW: Get entry orders by status
async function getEntryOrdersByStatus(req, res) {
  try {
    const { status } = req.params;
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role?.name;

    if (!organisationId) {
      return res.status(403).json({ message: "Authorization required" });
    }

    // Validate status
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "NEEDS_REVISION"];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const filterOrg = userRole === "ADMIN" ? null : organisationId;
    const orders = await entryService.getEntryOrdersByStatus(status.toUpperCase(), filterOrg);

    return res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
      status: status.toUpperCase(),
    });
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching orders by status",
      error: error.message,
    });
  }
}

module.exports = {
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,
  getCurrentEntryOrderNo,
  getEntryOrderByNo,
  getApprovedEntryOrders, // ✅ Updated from fetchPassedOrders
  reviewEntryOrder, // ✅ New
  getEntryOrdersByStatus, // ✅ New
};