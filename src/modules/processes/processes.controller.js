const processesService = require("./processes.service");

/**
 * Handles the creation of an order and entry order.
 */
async function createEntryOrder(req, res) {
  const entryData = req.body;

  console.log("entryData", entryData);

  // Validate the incoming data (make sure essential fields are present)
  if (
    !entryData.order_type ||
    !entryData.entry_order_no ||
    !entryData.organisation_id ||
    !entryData.created_by
  ) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  try {
    // Call the service to create the EntryOrder and Order
    const newEntryOrder = await processesService.createEntryOrder(entryData);

    // Send the newly created EntryOrder as the response
    return res.status(201).json({
      message: "Entry order created successfully",
      entryOrder: newEntryOrder,
    });
  } catch (error) {
    // Handle any errors
    return res.status(500).json({
      message: "Error creating entry order",
      error: error.message,
    });
  }
}

/**
 * Handle request to fetch all EntryOrders
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
async function getAllEntryOrders(req, res) {
  try {
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role;
    console.log("req.user", req.user);

    if (!organisationId) {
      return res.status(403).json({
        success: false,
        message: "Authorization required to view entry orders",
      });
    }

    // Apply organization filtering based on user role:
    // - For ADMIN users: Pass null to see all orders across all organizations
    // - For regular users: Pass their organization ID to see only their org's orders
    const filterOrganisationId = userRole === "ADMIN" ? null : organisationId;

    const entryOrders = await processesService.getAllEntryOrders(
      filterOrganisationId
    );

    return res.status(200).json({
      success: true,
      message: "Entry orders fetched successfully",
      data: entryOrders,
      count: entryOrders.length,
    });
  } catch (error) {
    console.error("Error fetching entry orders:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching entry orders",
      error: error.message,
    });
  }
}

/**
 * Handle request to fetch all entry form dropdown fields
 */
async function getEntryFormFields(req, res) {
  try {
    const entryFormDropdownData = await processesService.getEntryFormFields();
    return res.status(200).json(entryFormDropdownData);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Handle request to fetch all entry form dropdown fields
 */
async function getDepartureFormFields(req, res) {
  try {
    const data = await processesService.getDepartureFormFields();
    return res.status(200).json({
      message: "Data fetched successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
}

// get departure exit options
async function getDepartureExitOptions(req, res) {
  try {
    const data = await processesService.getDepartureExitOptions();
    return res.status(200).json({
      message: "Data fetched successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
}

// get all departure order
async function getAllDepartureOrders(req, res) {
  try {
    const data = await processesService.getAllDepartureOrders();
    return res.status(200).json({
      message: "Data fetched successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
}

// function to create new departure order
async function createDepartureOrder(req, res) {
  try {
    const newRecord = await processesService.createDepartureOrder(req.body);
    return res.status(201).json({
      message: "Departure Order created successfully",
      data: newRecord,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create departure order" });
  }
}

module.exports = {
  // entry orders
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,

  // departure
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
};
