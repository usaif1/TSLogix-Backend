const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

/**
 * Creates an Order and its associated Entry Order with separate IDs.
 */
async function createEntryOrder(orderData, entryData) {
  try {
    // ✅ Step 1: Create the Order (Auto-generates `order_id`)
    const newOrder = await prisma.order.create({
      data: {
        order_type: "ENTRY",
        status: "PENDING",
        organisation_id: orderData.organisation_id,
        created_by: orderData.created_by,
      },
    });

    console.log("✅ Order Created:", newOrder.order_id);

    // ✅ Step 2: Create an Entry Order & link it to the Order
    const newEntryOrder = await prisma.entryOrder.create({
      data: {
        entry_order_id: crypto.randomUUID(), // Generate unique entry order ID
        order_id: newOrder.order_id, // Foreign key linking to Order

        origin_id: entryData.origin_id,
        supplier_id: entryData.supplier_id,
        document_type_id: entryData.document_type_id,
        product_line_id: entryData.product_line_id,
        temperature_id: entryData.temperature_id,
        active_state_id: entryData.active_state_id,
        batch_number: entryData.batch_number,
        received_quantity: entryData.received_quantity,
        unit: entryData.unit,
        expiry_date: entryData.expiry_date,
        storage_location: entryData.storage_location,
        quality_check: entryData.quality_check,
      },
    });

    console.log("✅ Entry Order Created:", newEntryOrder.entry_order_id);

    return {
      order_id: newOrder.order_id,
      entry_order_id: newEntryOrder.entry_order_id,
    };
  } catch (error) {
    console.error("❌ Error creating entry order:", error.message);
    throw new Error("Entry order creation failed.");
  }
}

/**
 * Fetches all entry orders with related order details.
 */
async function getAllEntryOrders() {
  try {
    const entryOrders = await prisma.entryOrder.findMany({
      include: {
        order: true, // Include related Order details
        origin: true,
        supplier: true,
        documentType: true,
        productLine: true,
        temperature: true,
        active_state: true,
      },
    });

    return entryOrders;
  } catch (error) {
    console.error("❌ Error fetching entry orders:", error.message);
    throw new Error("Failed to retrieve entry orders.");
  }
}

async function getEntryFormFields() {
  try {
    // Fetching all data from the Origin table
    const origins = await prisma.origin.findMany();

    // Fetching all data from the User table
    const users = await prisma.user.findMany();

    // Fetching all data from the Supplier table
    const suppliers = await prisma.supplier.findMany();

    return {
      origins,
      users,
      suppliers,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Error fetching data from the database");
  }
}

module.exports = { createEntryOrder, getAllEntryOrders, getEntryFormFields };
