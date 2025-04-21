const { PrismaClient } = require("@prisma/client");
const { toUTC } = require("../../utils/index");
const prisma = new PrismaClient();

// Creates Order, EntryOrder, and upserts Inventory
async function createEntryOrder(entryData) {
  const newOrder = await prisma.order.create({
    data: {
      order_type: entryData.order_type || "ENTRY",
      status: entryData.status || "PENDING",
      organisation_id: entryData.organisation_id,
      created_by: entryData.created_by,
    },
  });

  const newEntryOrder = await prisma.entryOrder.create({
    data: {
      entry_order_no: entryData.entry_order_no,
      registration_date: toUTC(entryData.registration_date),
      document_date: toUTC(entryData.document_date),
      admission_date_time: toUTC(entryData.admission_date_time),
      document_status: entryData.document_status,
      order_progress: entryData.order_progress,
      observation: entryData.observation,
      total_volume: entryData.total_volume,
      total_weight: entryData.total_weight,
      cif_value: entryData.cif_value,
      product_id: entryData.product,
      certificate_protocol_analysis: entryData.certificate_protocol_analysis,
      mfd_date_time: toUTC(entryData.mfd_date_time),
      expiration_date: toUTC(entryData.expiration_date),
      lot_series: entryData.lot_series,
      quantity_packaging: entryData.quantity_packaging,
      presentation: entryData.presentation,
      total_qty: entryData.total_qty,
      technical_specification: entryData.technical_specification,
      max_temperature: entryData.max_temperature,
      min_temperature: entryData.min_temperature,
      humidity: entryData.humidity,
      palettes: entryData.palettes,
      product_description: entryData.product_description,
      insured_value: entryData.insured_value ? parseFloat(entryData.insured_value) : null,
      entry_date: toUTC(entryData.entry_date) || new Date(),
      entry_transfer_note: entryData.entry_transfer_note,
      type: entryData.type,
      status: entryData.status,
      comments: entryData.comments,
      order_id: newOrder.order_id,
      origin_id: entryData.origin,
      supplier_id: entryData.supplier,
    },
  });

  const expiry = entryData.expiration_date ? toUTC(entryData.expiration_date) : null;
  const inventoryRecord = await prisma.inventory.upsert({
    where: {
      product_location_expiry: {
        product_id: newEntryOrder.product_id,
        expiration_date: expiry,
      },
    },
    update: { quantity: { increment: Number(newEntryOrder.total_qty) } },
    create: {
      product_id: newEntryOrder.product_id,
      entry_order_id: newEntryOrder.entry_order_id,
      quantity: Number(newEntryOrder.total_qty),
      expiration_date: expiry,
      status: "AVAILABLE",
    },
  });

  return { entryOrder: newEntryOrder, inventory: inventoryRecord };
}

// Fetches and transforms EntryOrders
async function getAllEntryOrders(organisationId = null, sortOptions = null, entryOrderNo = null) {
  const query = {
    select: {
      entry_order_id: true,
      entry_order_no: true,
      total_qty: true,
      palettes: true,
      total_volume: true,
      total_weight: true,
      entry_transfer_note: true,
      presentation: true,
      status_id: true,
      entry_status: { select: { name: true } },
      comments: true,
      type: true,
      insured_value: true,
      entry_date: true,
      documentType: { select: { name: true } },
      supplier: { select: { name: true } },
      origin: { select: { name: true } },
      order: { select: { created_at: true, organisation: { select: { name: true } } } },
    },
    orderBy: { [sortOptions?.orderBy || "entry_date"]: sortOptions?.direction || "desc" },
    where: {},
  };

  const whereConds = {};
  if (organisationId) whereConds.order = { organisation_id: organisationId };
  if (entryOrderNo) whereConds.entry_order_no = { contains: entryOrderNo, mode: "insensitive" };
  if (Object.keys(whereConds).length) query.where = whereConds;

  const orders = await prisma.entryOrder.findMany(query);
  return orders.map(o => ({ ...o, status: o.entry_status?.name || null }));
}

// Dropdown data for Entry form
async function getEntryFormFields() {
  const [origins, documentTypes, users, suppliers, customers, products, orderStatus] =
    await Promise.all([
      prisma.origin.findMany(),
      prisma.documentType.findMany({ select: { document_type_id: true, name: true } }),
      prisma.user.findMany({ select: { user_id: true, first_name: true, last_name: true } }),
      prisma.supplier.findMany(),
      prisma.customer.findMany({ select: { customer_id: true, name: true } }),
      prisma.product.findMany(),
      prisma.status.findMany(),
    ]);
  return { origins, documentTypes, users, suppliers, customers, products, orderStatus };
}

// Generates next EntryOrder number
async function getCurrentEntryOrderNo() {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const last = await prisma.entryOrder.findFirst({
    where: { entry_order_no: { startsWith: `${currentYear}/` } },
    orderBy: { entry_date: "desc" },
  });
  let nextCount = 1;
  if (last?.entry_order_no) {
    const parts = last.entry_order_no.split("/");
    if (parts.length === 2 && !isNaN(parts[1])) nextCount = parseInt(parts[1]) + 1;
  }
  return `${currentYear}/${nextCount}`;
}

module.exports = {
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,
  getCurrentEntryOrderNo,
};