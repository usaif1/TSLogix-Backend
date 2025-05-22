const { PrismaClient, AuditResult } = require("@prisma/client");
const { toUTC } = require("../../utils/index");
const prisma = new PrismaClient();

// Creates Order and EntryOrder with proper handling of quantity fields
async function createEntryOrder(entryData) {
  const newOrder = await prisma.order.create({
    data: {
      order_type: entryData.order_type || "ENTRY",
      status: entryData.status || "PENDING",
      organisation_id: entryData.organisation_id,
      created_by: entryData.created_by,
    },
  });

  // Parse numeric fields properly
  const totalQty = parseInt(entryData.total_qty) || 0;
  const totalWeight = parseFloat(entryData.total_weight) || 0;
  const totalVolume = parseFloat(entryData.total_volume) || 0;
  const palettes = parseInt(entryData.palettes) || 0;
  const quantityPackaging = parseInt(entryData.quantity_packaging) || 0;

  const newEntryOrder = await prisma.entryOrder.create({
    data: {
      entry_order_no: entryData.entry_order_no,
      registration_date: toUTC(entryData.registration_date),
      document_date: toUTC(entryData.document_date),
      admission_date_time: toUTC(entryData.admission_date_time),
      document_status: entryData.document_status,
      documentType: entryData.document_type,
      observation: entryData.observation,
      total_volume: totalVolume,
      total_weight: totalWeight,
      cif_value: entryData.cif_value,
      product_id: entryData.product,
      certificate_protocol_analysis: entryData.certificate_protocol_analysis,
      mfd_date_time: toUTC(entryData.mfd_date_time),
      expiration_date: toUTC(entryData.expiration_date),
      lot_series: entryData.lot_series,
      quantity_packaging: quantityPackaging,
      presentation: entryData.presentation,
      total_qty: totalQty,
      technical_specification: entryData.technical_specification,
      max_temperature: entryData.max_temperature,
      min_temperature: entryData.min_temperature,
      humidity: entryData.humidity,
      palettes: palettes,
      product_description: entryData.product_description,
      insured_value: entryData.insured_value
        ? parseFloat(entryData.insured_value)
        : null,
      entry_date: toUTC(entryData.entry_date) || new Date(),
      entry_transfer_note: entryData.entry_transfer_note,
      type: entryData.type,
      status_id: entryData.status, // Changed from status to status_id
      comments: entryData.comments,
      order_id: newOrder.order_id,
      origin_id: entryData.origin,
      supplier_id: entryData.supplier,
      // Set initial remaining quantities equal to total
      remaining_packaging_qty: totalQty,
      remaining_weight: totalWeight,
    },
  });

  return { entryOrder: newEntryOrder };
}

// Fetches and transforms EntryOrders
async function getAllEntryOrders(
  organisationId = null,
  sortOptions = null,
  entryOrderNo = null
) {
  const query = {
    select: {
      entry_order_id: true,
      entry_order_no: true,
      total_qty: true,
      remaining_packaging_qty: true, // Add remaining quantities
      remaining_weight: true,
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
      product: { select: { name: true, product_id: true } },
      documentType: { select: { name: true } },
      supplier: { select: { name: true } },
      origin: { select: { name: true } },
      audit_status: true, // Changed to direct enum value
      warehouse: { select: { name: true, warehouse_id: true } }, // Added warehouse
      order: {
        select: { created_at: true, organisation: { select: { name: true } } },
      },
      // Get related cell assignments
      cellAssignments: {
        select: {
          cell: {
            select: {
              row: true,
              bay: true,
              position: true,
              status: true,
              current_packaging_qty: true,
              current_weight: true,
            },
          },
          packaging_quantity: true,
          weight: true,
          assigned_at: true,
        },
      },
    },
    orderBy: {
      [sortOptions?.orderBy || "entry_date"]: sortOptions?.direction || "desc",
    },
    where: {},
  };

  const whereConds = {};
  if (organisationId) whereConds.order = { organisation_id: organisationId };
  if (entryOrderNo)
    whereConds.entry_order_no = { contains: entryOrderNo, mode: "insensitive" };
  if (Object.keys(whereConds).length) query.where = whereConds;

  const orders = await prisma.entryOrder.findMany(query);

  return orders.map((o) => {
    // Transform cell data for easier consumption
    const cellAssignments = o.cellAssignments?.map((ca) => ({
      cellReference: `${ca.cell.row}.${String(ca.cell.bay).padStart(
        2,
        "0"
      )}.${String(ca.cell.position).padStart(2, "0")}`,
      packaging_quantity: ca.packaging_quantity,
      weight: ca.weight,
      assigned_at: ca.assigned_at,
      cell_status: ca.cell.status,
    }));

    return {
      ...o,
      status: o.entry_status?.name || null,
      cellAssignments,
    };
  });
}

// Dropdown data for Entry form with warehouses
async function getEntryFormFields() {
  const [
    origins,
    documentTypes,
    users,
    suppliers,
    customers,
    products,
    orderStatus,
    warehouses,
  ] = await Promise.all([
    prisma.origin.findMany(),
    prisma.documentType.findMany({
      select: { document_type_id: true, name: true },
    }),
    prisma.user.findMany({
      select: { user_id: true, first_name: true, last_name: true },
    }),
    prisma.supplier.findMany(),
    prisma.customer.findMany({ select: { customer_id: true, name: true } }),
    prisma.product.findMany(),
    prisma.status.findMany(),
    prisma.warehouse.findMany({
      select: { warehouse_id: true, name: true },
    }),
  ]);
  return {
    origins,
    documentTypes,
    users,
    suppliers,
    customers,
    products,
    orderStatus,
    warehouses,
  };
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
    if (parts.length === 2 && !isNaN(parts[1]))
      nextCount = parseInt(parts[1]) + 1;
  }
  return `${currentYear}/${nextCount}`;
}

async function getEntryOrderByNo(orderNo, organisationId = null) {
  const where = { entry_order_no: orderNo };
  if (organisationId) {
    where.order = { organisation_id: organisationId };
  }

  const order = await prisma.entryOrder.findFirst({
    where,
    select: {
      entry_order_id: true,
      entry_order_no: true,
      total_qty: true,
      remaining_packaging_qty: true, // Add remaining values
      remaining_weight: true,
      palettes: true,
      total_weight: true,
      total_volume: true,
      entry_transfer_note: true,
      presentation: true,
      comments: true,
      type: true,
      insured_value: true,
      entry_date: true,
      document_date: true,
      admission_date_time: true,
      registration_date: true,
      document_status: true,
      order_progress: true,
      product: { select: { name: true, product_id: true } },
      documentType: { select: { name: true, document_type_id: true } },
      supplier: { select: { name: true, supplier_id: true } },
      origin: { select: { name: true, origin_id: true } },
      entry_status: { select: { name: true, status_id: true } },
      warehouse: { select: { name: true, warehouse_id: true } }, // Add warehouse
      order: { select: { organisation: { select: { name: true } } } },
      audit_status: true,
      // Get related cell assignments
      cellAssignments: {
        select: {
          assignment_id: true,
          cell: {
            select: {
              id: true,
              row: true,
              bay: true,
              position: true,
              status: true,
              current_packaging_qty: true,
              current_weight: true,
            },
          },
          packaging_quantity: true,
          weight: true,
          volume: true,
          assigned_at: true,
          assigned_by: true,
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
      // Include audit records
      audits: {
        select: {
          audit_id: true,
          audit_date: true,
          audit_result: true,
          comments: true,
          discrepancy_notes: true,
          auditor: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { audit_date: "desc" },
      },
    },
  });

  if (!order) return null;

  // Transform cell references for easier consumption
  const cellAssignments = order.cellAssignments?.map((ca) => ({
    assignment_id: ca.assignment_id,
    cellReference: `${ca.cell.row}.${String(ca.cell.bay).padStart(
      2,
      "0"
    )}.${String(ca.cell.position).padStart(2, "0")}`,
    cell_id: ca.cell.id,
    packaging_quantity: ca.packaging_quantity,
    weight: ca.weight,
    volume: ca.volume,
    assigned_at: ca.assigned_at,
    assigned_by: ca.assigned_by,
    assigned_by_name: `${ca.user.first_name || ""} ${
      ca.user.last_name || ""
    }`.trim(),
    cell_status: ca.cell.status,
  }));

  return {
    ...order,
    status: order.entry_status?.name || null,
    cellAssignments,
  };
}

/**
 * Fetch entry orders where audit_status = 'PASSED' and that have remaining inventory to assign
 */
async function getPassedEntryOrders(
  organisationId = null,
  sortOptions = null,
  searchNo = null
) {
  const where = {
    audit_status: AuditResult.PASSED,
    // Only include entry orders with remaining inventory to assign
    remaining_packaging_qty: { gt: 0 },
    remaining_weight: { gt: 0 },
  };

  if (organisationId) {
    where.order = { organisation_id: organisationId };
  }
  if (searchNo) {
    where.entry_order_no = { contains: searchNo, mode: "insensitive" };
  }

  const query = {
    select: {
      entry_order_id: true,
      entry_order_no: true,
      total_qty: true,
      remaining_packaging_qty: true,
      remaining_weight: true,
      palettes: true,
      total_volume: true,
      total_weight: true,
      presentation: true,
      status_id: true,
      entry_status: { select: { name: true } },
      comments: true,
      type: true,
      insured_value: true,
      entry_date: true,
      warehouse_id: true,
      warehouse: { select: { name: true } },
      product: {
        select: {
          name: true,
          product_id: true,
        },
      },
      documentType: { select: { name: true } },
      supplier: { select: { name: true } },
      origin: { select: { name: true } },
      audit_status: true,
      order: {
        select: { created_at: true, organisation: { select: { name: true } } },
      },
      // Include already assigned cells
      cellAssignments: {
        select: {
          cell: {
            select: {
              row: true,
              bay: true,
              position: true,
            },
          },
          packaging_quantity: true,
          weight: true,
        },
      },
    },
    where,
    orderBy: {
      [sortOptions?.orderBy || "entry_date"]: sortOptions?.direction || "desc",
    },
  };

  const orders = await prisma.entryOrder.findMany(query);

  return orders.map((o) => {
    // Transform cell references for easier consumption
    const cellAssignments = o.cellAssignments?.map((ca) => ({
      cellReference: `${ca.cell.row}.${String(ca.cell.bay).padStart(
        2,
        "0"
      )}.${String(ca.cell.position).padStart(2, "0")}`,
      packaging_quantity: ca.packaging_quantity,
      weight: ca.weight,
    }));

    return {
      ...o,
      status: o.entry_status?.name || null,
      cellAssignments,
    };
  });
}

module.exports = {
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,
  getCurrentEntryOrderNo,
  getEntryOrderByNo,
  getPassedEntryOrders,
};
