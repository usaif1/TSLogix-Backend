const entryService = require("./entry.service");

// Create a new Entry Order
async function createEntryOrder(req, res) {
  const entryData = req.body;
  if (
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
    const userRole = req.user?.role?.name; // Access role.name
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
    return res
      .status(200)
      .json({ success: true, data: entryOrders, count: entryOrders.length });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching entry orders", error: error.message });
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

// Fetch single Entry Order by order number
async function getEntryOrderByNo(req, res) {
  try {
    const { orderNo } = req.params;
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role?.name; // Access role.name

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
    return res
      .status(500)
      .json({ message: "Error fetching entry order", error: error.message });
  }
}

// Fetch entry orders that passed audit and have remaining inventory
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
    console.error(error);
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
