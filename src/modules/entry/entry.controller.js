const entryService = require("./entry.service");

// Create a new Entry Order
async function createEntryOrder(req, res) {
  const entryData = req.body;
  if (
    !entryData.order_type ||
    !entryData.entry_order_no ||
    !entryData.organisation_id ||
    !entryData.created_by
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const result = await entryService.createEntryOrder(entryData);
    return res.status(201).json({
      message: "Entry order created successfully",
      entryOrder: result.entryOrder,
      inventory: result.inventory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating entry order",
      error: error.message,
    });
  }
}

// Fetch all Entry Orders
async function getAllEntryOrders(req, res) {
  try {
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role;
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
    return res.status(200).json({ success: true, data: entryOrders, count: entryOrders.length });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching entry orders", error: error.message });
  }
}

// Fetch dropdown fields for Entry form
async function getEntryFormFields(req, res) {
  try {
    const data = await entryService.getEntryFormFields();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Get next Entry Order number
async function getCurrentEntryOrderNo(req, res) {
  try {
    const currentOrderNo = await entryService.getCurrentEntryOrderNo();
    return res.status(200).json({ currentOrderNo });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,
  getCurrentEntryOrderNo,
};