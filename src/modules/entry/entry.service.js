const { PrismaClient, AuditResult } = require("@prisma/client");
const { toUTC } = require("../../utils/index");
const { getPackagingCode } = require("../../utils/packagingCodes");
const prisma = new PrismaClient();

// Creates Order and EntryOrder with multiple products
async function createEntryOrder(entryData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create base order
    const newOrder = await tx.order.create({
      data: {
        order_type: entryData.order_type || "ENTRY",
        status: entryData.status || "PENDING",
        organisation_id: entryData.organisation_id,
        created_by: entryData.created_by,
      },
    });

    // 2. Create entry order (without product-specific fields)
    const newEntryOrder = await tx.entryOrder.create({
      data: {
        order_id: newOrder.order_id,
        entry_order_no: entryData.entry_order_no,
        registration_date: toUTC(entryData.registration_date),
        document_date: toUTC(entryData.document_date),
        admission_date_time: toUTC(entryData.admission_date_time),
        document_status: entryData.document_status,
        document_type_id: entryData.document_type_id,
        observation: entryData.observation,
        cif_value: entryData.cif_value,
        certificate_protocol_analysis: entryData.certificate_protocol_analysis,
        lot_series: entryData.lot_series,
        entry_date: toUTC(entryData.entry_date) || new Date(),
        entry_transfer_note: entryData.entry_transfer_note,
        type: entryData.type,
        status_id: entryData.status_id,
        comments: entryData.comments,
        origin_id: entryData.origin_id,
        supplier_id: entryData.supplier_id,
        warehouse_id: entryData.warehouse_id,
        personnel_incharge_id: entryData.personnel_incharge_id,
        audit_status: AuditResult.PENDING,
      },
    });

    // 3. Create products for this entry order
    const entryOrderProducts = [];
    if (entryData.products && Array.isArray(entryData.products)) {
      for (const productData of entryData.products) {
        const packagingCode = getPackagingCode(
          productData.packaging_type || "BOX",
          productData.packaging_status || "NORMAL"
        );

        const entryOrderProduct = await tx.entryOrderProduct.create({
          data: {
            entry_order_id: newEntryOrder.entry_order_id,
            product_id: productData.product_id,
            quantity_packaging: parseInt(productData.quantity_packaging) || 0,
            total_qty: parseInt(productData.total_qty) || 0,
            total_weight: parseFloat(productData.total_weight) || 0,
            total_volume: parseFloat(productData.total_volume) || 0,
            palettes: parseInt(productData.palettes) || 0,
            presentation: productData.presentation,
            product_description: productData.product_description,
            insured_value: parseFloat(productData.insured_value) || 0,
            technical_specification: productData.technical_specification,
            expiration_date: toUTC(productData.expiration_date),
            mfd_date_time: toUTC(productData.mfd_date_time),
            packaging_type: productData.packaging_type || "BOX",
            packaging_status: productData.packaging_status || "NORMAL",
            packaging_code: packagingCode,
            remaining_packaging_qty:
              parseInt(productData.quantity_packaging) || 0,
            remaining_weight: parseFloat(productData.total_weight) || 0,
            audit_status: AuditResult.PENDING,
          },
        });
        entryOrderProducts.push(entryOrderProduct);
      }
    }

    return { entryOrder: newEntryOrder, products: entryOrderProducts };
  });
}

// Fetches and transforms EntryOrders with multi-product support
async function getAllEntryOrders(
  organisationId = null,
  sortOptions = null,
  entryOrderNo = null
) {
  const query = {
    select: {
      entry_order_id: true,
      entry_order_no: true,
      entry_date: true,
      document_date: true,
      admission_date_time: true,
      document_status: true,
      lot_series: true,
      entry_transfer_note: true,
      status_id: true,
      entry_status: { select: { name: true } },
      comments: true,
      type: true,
      audit_status: true,
      warehouse: { select: { name: true, warehouse_id: true } },
      documentType: { select: { name: true } },
      supplier: { select: { name: true } },
      origin: { select: { name: true } },
      order: {
        select: {
          created_at: true,
          organisation: { select: { name: true } },
        },
      },
      // NEW: Include products in entry order
      products: {
        select: {
          entry_order_product_id: true,
          quantity_packaging: true,
          total_qty: true,
          total_weight: true,
          total_volume: true,
          palettes: true,
          presentation: true,
          product_description: true,
          insured_value: true,
          expiration_date: true,
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
          remaining_packaging_qty: true,
          remaining_weight: true,
          audit_status: true,
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
            },
          },
        },
      },
      // Cell assignments now link to specific products
      cellAssignments: {
        select: {
          assignment_id: true,
          entry_order_product_id: true,
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
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
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
    // Calculate totals from products
    const totalQuantityPackaging = o.products.reduce(
      (sum, p) => sum + p.quantity_packaging,
      0
    );
    const totalWeight = o.products.reduce(
      (sum, p) => parseFloat(sum) + parseFloat(p.total_weight),
      0
    );
    const totalVolume = o.products.reduce(
      (sum, p) => parseFloat(sum) + parseFloat(p.total_volume || 0),
      0
    );
    const totalPalettes = o.products.reduce(
      (sum, p) => sum + (p.palettes || 0),
      0
    );
    const totalInsuredValue = o.products.reduce(
      (sum, p) => parseFloat(sum) + parseFloat(p.insured_value || 0),
      0
    );

    // Calculate remaining totals
    const remainingPackaging = o.products.reduce(
      (sum, p) => sum + p.remaining_packaging_qty,
      0
    );
    const remainingWeight = o.products.reduce(
      (sum, p) => parseFloat(sum) + parseFloat(p.remaining_weight),
      0
    );

    // Transform cell data with product linking
    const cellAssignments = o.cellAssignments?.map((ca) => ({
      assignment_id: ca.assignment_id,
      entry_order_product_id: ca.entry_order_product_id,
      cellReference: `${ca.cell.row}.${String(ca.cell.bay).padStart(
        2,
        "0"
      )}.${String(ca.cell.position).padStart(2, "0")}`,
      packaging_quantity: ca.packaging_quantity,
      weight: ca.weight,
      assigned_at: ca.assigned_at,
      cell_status: ca.cell.status,
      packaging_type: ca.packaging_type,
      packaging_status: ca.packaging_status,
      packaging_code: ca.packaging_code,
    }));

    return {
      ...o,
      status: o.entry_status?.name || null,
      // Calculated totals
      total_quantity_packaging: totalQuantityPackaging,
      total_weight: totalWeight,
      total_volume: totalVolume,
      total_palettes: totalPalettes,
      total_insured_value: totalInsuredValue,
      remaining_packaging_qty: remainingPackaging,
      remaining_weight: remainingWeight,
      cellAssignments,
    };
  });
}

// Updated dropdown data for Entry form
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
    temperatureRanges,
  ] = await Promise.all([
    prisma.origin.findMany(),
    prisma.documentType.findMany({
      select: { document_type_id: true, name: true },
    }),
    prisma.user.findMany({
      select: { user_id: true, id: true, first_name: true, last_name: true },
    }),
    prisma.supplier.findMany(),
    prisma.customer.findMany({ select: { customer_id: true, name: true } }),
    prisma.product.findMany({
      select: {
        product_id: true,
        product_code: true,
        name: true,
        unit_weight: true,
        unit_volume: true,
        temperature_range: {
          select: {
            range: true,
            min_celsius: true,
            max_celsius: true,
          },
        },
      },
    }),
    prisma.status.findMany(),
    prisma.warehouse.findMany({
      select: { warehouse_id: true, name: true },
    }),
    prisma.temperatureRange.findMany(),
  ]);

  // Add packaging options
  const packagingTypes = [
    { value: "PALET", label: "Palet" },
    { value: "BOX", label: "Box" },
    { value: "SACK", label: "Sack" },
    { value: "UNIT", label: "Unit" },
    { value: "PACK", label: "Pack" },
    { value: "BARRELS", label: "Barrels" },
    { value: "BUNDLE", label: "Bundle" },
    { value: "OTHER", label: "Other" },
  ];

  const packagingStatuses = [
    { value: "NORMAL", label: "Normal" },
    { value: "PARTIALLY_DAMAGED", label: "Partially Damaged" },
    { value: "DAMAGED", label: "Damaged" },
  ];

  return {
    origins,
    documentTypes,
    users,
    suppliers,
    customers,
    products,
    orderStatus,
    warehouses,
    temperatureRanges,
    packagingTypes,
    packagingStatuses,
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

// Get single entry order with full product details
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
      entry_date: true,
      document_date: true,
      admission_date_time: true,
      registration_date: true,
      document_status: true,
      order_progress: true,
      lot_series: true,
      entry_transfer_note: true,
      comments: true,
      type: true,
      cif_value: true,
      certificate_protocol_analysis: true,
      audit_status: true,
      warehouse: { select: { name: true, warehouse_id: true } },
      documentType: { select: { name: true, document_type_id: true } },
      supplier: { select: { name: true, supplier_id: true } },
      origin: { select: { name: true, origin_id: true } },
      entry_status: { select: { name: true, status_id: true } },
      order: { select: { organisation: { select: { name: true } } } },

      // NEW: Include all products with full details
      products: {
        select: {
          entry_order_product_id: true,
          product_id: true,
          quantity_packaging: true,
          total_qty: true,
          total_weight: true,
          total_volume: true,
          palettes: true,
          presentation: true,
          product_description: true,
          insured_value: true,
          technical_specification: true,
          expiration_date: true,
          mfd_date_time: true,
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
          remaining_packaging_qty: true,
          remaining_weight: true,
          audit_status: true,
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
              temperature_range: {
                select: {
                  range: true,
                  min_celsius: true,
                  max_celsius: true,
                },
              },
            },
          },
          // Product-specific audits
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
          // Product-specific cell assignments
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
              packaging_type: true,
              packaging_status: true,
              packaging_code: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      },

      // Overall entry order audits (if any)
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

  // Transform products with their cell assignments
  const transformedProducts = order.products.map((product) => {
    const cellAssignments = product.cellAssignments?.map((ca) => ({
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
      packaging_type: ca.packaging_type,
      packaging_status: ca.packaging_status,
      packaging_code: ca.packaging_code,
    }));

    return {
      ...product,
      cellAssignments,
    };
  });

  // Calculate totals
  const totalQuantityPackaging = order.products.reduce(
    (sum, p) => sum + p.quantity_packaging,
    0
  );
  const totalWeight = order.products.reduce(
    (sum, p) => parseFloat(sum) + parseFloat(p.total_weight),
    0
  );
  const totalVolume = order.products.reduce(
    (sum, p) => parseFloat(sum) + parseFloat(p.total_volume || 0),
    0
  );
  const remainingPackaging = order.products.reduce(
    (sum, p) => sum + p.remaining_packaging_qty,
    0
  );
  const remainingWeight = order.products.reduce(
    (sum, p) => parseFloat(sum) + parseFloat(p.remaining_weight),
    0
  );

  return {
    ...order,
    status: order.entry_status?.name || null,
    products: transformedProducts,
    // Calculated totals
    total_quantity_packaging: totalQuantityPackaging,
    total_weight: totalWeight,
    total_volume: totalVolume,
    remaining_packaging_qty: remainingPackaging,
    remaining_weight: remainingWeight,
  };
}

/**
 * Fetch entry orders where overall audit_status = 'PASSED' and that have remaining inventory to assign
 */
async function getPassedEntryOrders(
  organisationId = null,
  sortOptions = null,
  searchNo = null
) {
  const where = {
    audit_status: AuditResult.PASSED,
    // Include entry orders that have products with remaining inventory
    products: {
      some: {
        AND: [
          { remaining_packaging_qty: { gt: 0 } },
          { remaining_weight: { gt: 0 } },
          { audit_status: AuditResult.PASSED },
        ],
      },
    },
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
      entry_date: true,
      status_id: true,
      entry_status: { select: { name: true } },
      comments: true,
      type: true,
      audit_status: true,
      warehouse_id: true,
      warehouse: { select: { name: true } },
      documentType: { select: { name: true } },
      supplier: { select: { name: true } },
      origin: { select: { name: true } },
      order: {
        select: { created_at: true, organisation: { select: { name: true } } },
      },
      // Only include products that have remaining inventory
      products: {
        where: {
          AND: [
            { remaining_packaging_qty: { gt: 0 } },
            { remaining_weight: { gt: 0 } },
            { audit_status: AuditResult.PASSED },
          ],
        },
        select: {
          entry_order_product_id: true,
          quantity_packaging: true,
          total_qty: true,
          total_weight: true,
          total_volume: true,
          remaining_packaging_qty: true,
          remaining_weight: true,
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
          audit_status: true,
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
            },
          },
          // Include already assigned cells for this product
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
      },
    },
    where,
    orderBy: {
      [sortOptions?.orderBy || "entry_date"]: sortOptions?.direction || "desc",
    },
  };

  const orders = await prisma.entryOrder.findMany(query);

  return orders.map((o) => {
    // Transform products with cell assignments
    const transformedProducts = o.products.map((product) => {
      const cellAssignments = product.cellAssignments?.map((ca) => ({
        cellReference: `${ca.cell.row}.${String(ca.cell.bay).padStart(
          2,
          "0"
        )}.${String(ca.cell.position).padStart(2, "0")}`,
        packaging_quantity: ca.packaging_quantity,
        weight: ca.weight,
      }));

      return {
        ...product,
        cellAssignments,
      };
    });

    // Calculate totals from available products
    const totalRemainingPackaging = o.products.reduce(
      (sum, p) => sum + p.remaining_packaging_qty,
      0
    );
    const totalRemainingWeight = o.products.reduce(
      (sum, p) => parseFloat(sum) + parseFloat(p.remaining_weight),
      0
    );

    return {
      ...o,
      status: o.entry_status?.name || null,
      products: transformedProducts,
      total_remaining_packaging: totalRemainingPackaging,
      total_remaining_weight: totalRemainingWeight,
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
