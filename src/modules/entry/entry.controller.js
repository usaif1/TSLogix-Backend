const entryService = require("./entry.service");

// Create a new Entry Order with multiple products
async function createEntryOrder(req, res) {
  const entryData = req.body;

  // Validate required fields
  if (
    !entryData.entry_order_no ||
    !entryData.organisation_id ||
    !entryData.created_by ||
    !entryData.products ||
    !Array.isArray(entryData.products) ||
    entryData.products.length === 0
  ) {
    return res.status(400).json({
      message:
        "Missing required fields. Entry order must include at least one product.",
    });
  }

  // Validate each product
  for (let i = 0; i < entryData.products.length; i++) {
    const product = entryData.products[i];
    if (
      !product.product_id ||
      !product.quantity_packaging ||
      !product.total_weight
    ) {
      return res.status(400).json({
        message: `Product ${
          i + 1
        }: Missing required fields (product_id, quantity_packaging, total_weight)`,
      });
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

// Fetch all Entry Orders (unchanged logic, updated data structure)
async function getAllEntryOrders(req, res) {
  try {
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role?.name;
    const searchOrderNo = req.query.orderNo || null;

    if (!organisationId) {
      return res.status(403).json({ message: "Authorization required" });
    }

    const filterOrg = userRole === "ADMIN" ? null : organisationId;
    const sortOptions = { orderBy: "entry_date", direction: "desc" };

    const entryOrders = await entryService.getAllEntryOrders(
      filterOrg,
      sortOptions,
      searchOrderNo
    );

    return res.status(200).json({
      success: true,
      data: entryOrders,
      count: entryOrders.length,
    });
  } catch (error) {
    console.error("Error fetching entry orders:", error);
    return res.status(500).json({
      message: "Error fetching entry orders",
      error: error.message,
    });
  }
}

// Fetch dropdown fields for Entry form (now includes packaging options)
async function getEntryFormFields(req, res) {
  try {
    const data = await entryService.getEntryFormFields();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching form fields:", error);
    return res.status(500).json({ message: error.message });
  }
}

// Get next Entry Order number (unchanged)
async function getCurrentEntryOrderNo(req, res) {
  try {
    const currentOrderNo = await entryService.getCurrentEntryOrderNo();
    return res.status(200).json({ currentOrderNo });
  } catch (error) {
    console.error("Error getting current order number:", error);
    return res.status(500).json({ message: error.message });
  }
}

// Fetch single Entry Order by order number (now includes full product details)
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
      return res.status(404).json({ message: "Entry order not found" });
    }

    return res.status(200).json({ success: true, data: entryOrder });
  } catch (error) {
    console.error("Error fetching entry order:", error);
    return res.status(500).json({
      message: "Error fetching entry order",
      error: error.message,
    });
  }
}

// Fetch entry orders that passed audit and have remaining inventory (updated for multi-product)
async function fetchPassedOrders(req, res) {
  try {
    const organisationId = req.user.organisation_id;
    const searchNo = req.query.orderNo || null;
    const data = await entryService.getPassedEntryOrders(
      organisationId,
      null,
      searchNo
    );
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching passed orders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,
  getCurrentEntryOrderNo,
  getEntryOrderByNo,
  fetchPassedOrders,
};
