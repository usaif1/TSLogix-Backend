const processService = require("./processes.service");

/**
 * Handles the creation of an order and entry order.
 */
async function createEntryOrder(req, res) {
  try {
    const { orderData, entryData } = req.body;

    if (!orderData || !entryData) {
      return res.status(400).json({ message: "Missing required data" });
    }

    const result = await processService.createEntryOrder(orderData, entryData);

    return res.status(201).json({
      message: "Order and Entry Order created successfully",
      order_id: result.order_id,
      entry_order_id: result.entry_order_id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Fetch all entry orders.
 */
async function getAllEntryOrders(req, res) {
  try {
    const entryOrders = await processService.getAllEntryOrders();
    return res.status(200).json(entryOrders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getEntryFormFields(req, res) {
  try {
    const entryFormDropdownData = await processService.getEntryFormFields();
    return res.status(200).json(entryFormDropdownData);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { createEntryOrder, getAllEntryOrders, getEntryFormFields };
