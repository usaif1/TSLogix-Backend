const processesService = require("./processes.service");

/**
 * Handles the creation of an order and entry order.
 */
async function createEntryOrder(req, res) {
  const entryData = req.body;

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
    const entryOrders = await processesService.getAllEntryOrders();
    return res.status(200).json({
      message: "Entry orders fetched successfully",
      data: entryOrders,
    });
  } catch (error) {
    return res.status(500).json({
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

module.exports = {
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,
  getDepartureFormFields,
};
