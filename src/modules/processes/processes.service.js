const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const { toUTC } = require("../../utils/index");

const prisma = new PrismaClient();

/**
 * Creates an Order and its associated Entry Order with separate IDs.
 */
async function createEntryOrder(entryData) {
  try {
    // Create the Order first
    const newOrder = await prisma.order.create({
      data: {
        order_type: entryData.order_type || "ENTRY",
        status: entryData.status || "PENDING",
        organisation_id: entryData.organisation_id,
        created_by: entryData.created_by, // Assuming it's the user creating the order
      },
    });

    // Create the EntryOrder associated with the created Order
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
        product: entryData.product,
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
        insured_value: entryData.insured_value
          ? parseFloat(entryData.insured_value)
          : null,
        entry_date: toUTC(entryData.entry_date) || new Date(),
        entry_transfer_note: entryData.entry_transfer_note,
        type: entryData.type,
        status: entryData.status,
        comments: entryData.comments,
        // Link EntryOrder to the created Order
        order_id: newOrder.order_id,

        // Additional relations
        origin_id: entryData.origin_id,
        // document_type_id: entryData.document_type_id,
        // personnel_incharge_id: entryData.personnel_incharge_id,
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
 * Fetch EntryOrders filtered by organization and search criteria
 * @param {string} organisationId - ID of the organization to filter by
 * @param {Object} sortOptions - Sorting options (orderBy field and direction)
 * @param {string} entryOrderNo - Optional order number to search by
 * @returns {Promise<Array>} - List of EntryOrders matching criteria
 */
async function getAllEntryOrders(organisationId = null, sortOptions = null, entryOrderNo = null) {
  try {
    // Build the query based on filters
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
        entry_status: {
          select: {
            name: true,
            status_id: true,
          },
        },
        comments: true,
        type: true,
        insured_value: true,
        entry_date: true,
        documentType: {
          select: {
            name: true,
            document_type_id: true,
          },
        },
        supplier: {
          select: {
            name: true,
            supplier_id: true,
          },
        },
        origin: {
          select: {
            name: true,
            origin_id: true,
          },
        },
        order: {
          select: {
            created_at: true,
            order_id: true,
            organisation_id: true,
            organisation: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        entry_date: "desc", // Default sort
      },
      where: {},
    };

    // Apply custom sorting if provided
    if (sortOptions && sortOptions.orderBy) {
      query.orderBy = {
        [sortOptions.orderBy]: sortOptions.direction || "desc"
      };
    }

    // Initialize where conditions
    const whereConditions = {};

    // Add organization filter if provided
    if (organisationId) {
      whereConditions.order = {
        organisation_id: organisationId,
      };
    }

    // Add entry order number search if provided
    if (entryOrderNo) {
      whereConditions.entry_order_no = {
        contains: entryOrderNo,
        mode: 'insensitive' // Case insensitive search
      };
    }

    // Apply conditions to query if any exist
    if (Object.keys(whereConditions).length > 0) {
      query.where = whereConditions;
    }

    // Execute the query
    const entryOrders = await prisma.entryOrder.findMany(query);
    
    // Add a derived status field for compatibility with frontend
    const transformedOrders = entryOrders.map(order => ({
      ...order,
      status: order.entry_status?.name || null,
    }));
    
    return transformedOrders;
  } catch (error) {
    console.error("Error fetching entry orders:", error);
    throw new Error(`Error fetching entry orders: ${error.message}`);
  }
}

/**
 * get all the dropdown fields required for entry form
 *  */

async function getEntryFormFields() {
  try {
    // Fetching all data from the Origin table
    const origins = await prisma.origin.findMany();

    // Fetching all data from the DocumentType table
    const documentTypes = await prisma.documentType.findMany({
      select: {
        document_type_id: true,
        name: true,
      },
    });

    // Fetching all data from the User table
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
      },
    });

    // Fetching all data from the Supplier table
    const suppliers = await prisma.supplier.findMany();

    const customers = await prisma.customer.findMany({
      select: {
        customer_id: true,
        name: true,
      },
    });

    const products = await prisma.product.findMany();

    const orderStatus = await prisma.status.findMany();

    return {
      origins,
      users,
      suppliers,
      documentTypes,
      customers,
      products,
      orderStatus,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Error fetching data from the database");
  }
}

/**
 * fetch departure exit options
 */
async function getDepartureExitOptions() {
  try {
    const exitOptions = await prisma.exitOption.findMany();
    return exitOptions;
  } catch (error) {
    console.error("Error fetching departure options", error);
    throw new Error("Error fetching departure options");
  }
}

/**
 * Fetch all required data (ExitOptions, Customers, DocumentTypes, Users, PackagingTypes, Labels)
 */
async function getDepartureFormFields() {
  try {
    const [customers, documentTypes, users, packagingTypes, labels] =
      await Promise.all([
        prisma.customer.findMany({
          select: {
            customer_id: true,
            name: true,
          },
        }),
        prisma.documentType.findMany({
          select: {
            document_type_id: true,
            name: true,
          },
        }),
        prisma.user.findMany({
          select: {
            user_id: true,
            id: true,
            first_name: true,
            middle_name: true,
            last_name: true,
          },
        }),
        prisma.packagingType.findMany(),
        prisma.label.findMany(),
      ]);

    return {
      customers,
      documentTypes,
      users,
      packagingTypes,
      labels,
    };
  } catch (error) {
    console.error("Error fetching all data:", error);
    throw new Error("Error fetching all data");
  }
}

async function getAllDepartureOrders() {
  const departureOrders = await prisma.departureOrder.findMany({
    select: {
      departure_order_id: true,
      departure_order_no: true,
      documentType: {
        select: {
          name: true,
          document_type_id: true,
        },
      },
      customer: {
        select: {
          name: true,
          customer_id: true,
        },
      },
      order: {
        select: {
          created_at: true,
        },
      },
      palettes: true,
      total_qty: true,
      total_volume: true,
      total_weight: true,
      departure_date: true,
      // Replace 'status' with status_id and the relation
      status_id: true,
      departure_status: {
        select: {
          name: true,
          status_id: true,
        },
      },
      arrival_point: true,
      type: true,
      insured_value: true,
      departure_transfer_note: true,
      product_description: true,
    },
  });
  console.log("departureOrders", departureOrders);
  return departureOrders;
}

/**
 * Creates a new Departure Order
 * 1) Creates an Order record
 * 2) Creates a DepartureOrder linked to the Order
 */
async function createDepartureOrder(departureData) {
  try {
    // 1) Create the Order first
    const newOrder = await prisma.order.create({
      data: {
        order_type: departureData.order_type || "DEPARTURE", // or "DEPARTURE" explicitly
        status: departureData.status || "PENDING",
        organisation_id: departureData.organisation_id,
        created_by: departureData.created_by, // user creating the order
      },
    });

    // 2) Create the DepartureOrder associated with the newly created Order
    const newDepartureOrder = await prisma.departureOrder.create({
      data: {
        // Linking to the newly created Order
        order_id: newOrder.order_id,

        // Fields from your UI:
        departure_order_no: departureData.departure_order_no,
        registration_date: toUTC(departureData.registration_date),
        document_no: departureData.document_no,
        document_date: toUTC(departureData.document_date),
        date_and_time_of_transfer: toUTC(
          departureData.date_and_time_of_transfer
        ),
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

        // Relations
        customer_id: departureData.customer_id,
        document_type_id: departureData.document_type_id,
        personnel_in_charge_id: departureData.personnel_in_charge_id,
        packaging_id: departureData.packaging_id,
        label_id: departureData.label_id,
        document_status: departureData.document_status,
      },
    });

    // Return the newly-created departure order
    return newDepartureOrder;
  } catch (error) {
    console.error("Error creating departure order:", error);
    throw new Error("Error creating departure order");
  }
}

/**
 * Returns the next entry order number in the format "YY/increment"
 */
async function getCurrentEntryOrderNo() {
  try {
    // Get current year in two-digit format (e.g., "25")
    const currentYear = new Date().getFullYear().toString().slice(-2);

    // Find the last created EntryOrder for the current year
    const lastEntryOrder = await prisma.entryOrder.findFirst({
      where: {
        entry_order_no: {
          startsWith: `${currentYear}/`,
        },
      },
      orderBy: {
        entry_date: "desc",
      },
    });

    // Determine the next count; if none exists, start at 1.
    let nextCount = 1;
    // Check if we have a previous entry order and it has an order number
    if (lastEntryOrder && lastEntryOrder.entry_order_no) {
      // Split the entry order number by the "/" character
      // Example: If entry_order_no is "25/42", parts will be ["25", "42"]
      const parts = lastEntryOrder.entry_order_no.split("/");
      // Verify that the split resulted in exactly 2 parts AND the second part is a valid number
      // This ensures we're working with a properly formatted entry_order_no (YY/123)
      if (parts.length === 2 && !isNaN(parts[1])) {
        // Extract the numeric part after the slash, convert to integer, and increment by 1
        // Example: If parts[1] is "42", nextCount will be 43
        nextCount = parseInt(parts[1], 10) + 1;
      }
    }

    return `${currentYear}/${nextCount}`;
  } catch (error) {
    console.error("Error generating next entry order number:", error);
    throw new Error("Error generating next entry order number");
  }
}

module.exports = {
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,

  // departure
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
  getCurrentEntryOrderNo,
};
