const { PrismaClient } = require("@prisma/client");
const { toUTC } = require("../../utils/index");
const prisma = new PrismaClient();

// Dropdown data for Departure form
async function getDepartureFormFields() {
  const [customers, documentTypes, users, packagingTypes, labels] =
    await Promise.all([
      prisma.customer.findMany({ select: { customer_id: true, name: true } }),
      prisma.documentType.findMany({
        select: { document_type_id: true, name: true },
      }),
      prisma.user.findMany({
        select: { id: true, first_name: true, last_name: true },
      }),
      prisma.packagingType.findMany(),
      prisma.label.findMany(),
    ]);
  return { customers, documentTypes, users, packagingTypes, labels };
}

// Exit options
async function getDepartureExitOptions() {
  return await prisma.exitOption.findMany();
}

// Fetch departure orders
async function getAllDepartureOrders(searchQuery = "") {
  const whereClause = searchQuery
    ? { departure_order_no: { contains: searchQuery, mode: "insensitive" } }
    : {};
  return await prisma.departureOrder.findMany({
    where: whereClause,
    orderBy: { departure_date: "desc" },
    select: {
      departure_order_id: true,
      departure_order_no: true,
      documentType: { select: { name: true } },
      customer: { select: { name: true } },
      order: { select: { created_at: true } },
      palettes: true,
      total_qty: true,
      total_volume: true,
      total_weight: true,
      departure_date: true,
      departure_status: { select: { name: true } },
      arrival_point: true,
      type: true,
      insured_value: true,
      departure_transfer_note: true,
      product_description: true,
    },
  });
}

// Create Departure order and update inventory + logs
async function createDepartureOrder(departureData) {
  const newOrder = await prisma.order.create({
    data: {
      order_type: departureData.order_type || "DEPARTURE",
      status: departureData.status || "PENDING",
      organisation_id: departureData.organisation_id,
      created_by: departureData.created_by,
    },
  });

  const newDepartureOrder = await prisma.departureOrder.create({
    data: {
      order_id: newOrder.order_id,
      departure_order_no: departureData.departure_order_no,
      registration_date: toUTC(departureData.registration_date),
      document_no: departureData.document_no,
      document_date: toUTC(departureData.document_date),
      date_and_time_of_transfer: toUTC(departureData.date_and_time_of_transfer),
      arrival_point: departureData.arrival_point,
      id_responsible: departureData.id_responsible,
      responsible_for_collection: departureData.responsible_for_collection,
      order_progress: departureData.order_progress,
      observation: departureData.observation,
      total_qty: departureData.total_qty,
      total_volume: departureData.total_volume,
      palettes: departureData.palettes,
      total_weight: departureData.total_weight,
      insured_value: departureData.insured_value,
      product_description: departureData.product_description,
      departure_date: toUTC(departureData.departure_date),
      type: departureData.type,
      status: departureData.status,
      departure_transfer_note: departureData.departure_transfer_note,
      product_id: departureData.product_id,
      customer_id: departureData.customer_id,
      document_type_id: departureData.document_type_id,
      personnel_in_charge_id: departureData.personnel_in_charge_id,
      packaging_id: departureData.packaging_id,
      label_id: departureData.label_id,
      document_status: departureData.document_status,
    },
  });

  return { departureOrder: newDepartureOrder };
}

module.exports = {
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
};
