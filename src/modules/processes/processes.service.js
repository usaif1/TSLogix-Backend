const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

/**
 * Creates an Order and its associated Entry Order with separate IDs.
 */
async function createEntryOrder(entryData) {
  try {
    // Create the Order first
    const newOrder = await prisma.order.create({
      data: {
        order_type: entryData.order_type, // 'ENTRY' or 'DEPARTURE'
        status: entryData.status || "PENDING",
        organisation_id: entryData.organisation_id,
        created_by: entryData.created_by, // Assuming it's the user creating the order
      },
    });

    // Create the EntryOrder associated with the created Order
    const newEntryOrder = await prisma.entryOrder.create({
      data: {
        entry_order_no: entryData.entry_order_no,
        registration_date: entryData.registration_date,
        document_date: entryData.document_date,
        admission_date_time: entryData.admission_date_time,
        document_status: entryData.document_status,
        order_progress: entryData.order_progress,
        observation: entryData.observation,
        total_volume: entryData.total_volume,
        total_weight: entryData.total_weight,
        cif_value: entryData.cif_value,
        product: entryData.product,
        certificate_protocol_analysis: entryData.certificate_protocol_analysis,
        mfd_date_time: entryData.mfd_date_time,
        expiration_date: entryData.expiration_date,
        lot_series: entryData.lot_series,
        quantity_packaging: entryData.quantity_packaging,
        presentation: entryData.presentation,
        total_qty: entryData.total_qty,
        technical_specification: entryData.technical_specification,
        temperature: entryData.temperature,
        humidity: entryData.humidity,

        // Link EntryOrder to the created Order
        order_id: newOrder.order_id,

        // Additional relations
        origin_id: entryData.origin_id,
        document_type_id: entryData.document_type_id,
        personnel_incharge_id: entryData.personnel_incharge_id,
        supplier_id: entryData.supplier_id,
      },
    });

    // Return the created EntryOrder
    return newEntryOrder;
  } catch (error) {
    console.error("Error creating entry order:", error);
    throw new Error("Error creating entry order");
  }
}

/**
 * Fetch all EntryOrders
 * @returns {Promise<Array>} - List of all EntryOrders
 */
async function getAllEntryOrders() {
  try {
    const entryOrders = await prisma.entryOrder.findMany({
      include: {
        order: true,
        origin: true,
        documentType: true,
        supplier: true,
        personnel_incharge: true,
      },
    });
    return entryOrders;
  } catch (error) {
    console.error("Error fetching entry orders:", error);
    throw new Error("Error fetching entry orders");
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
