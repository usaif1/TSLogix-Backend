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

        palettes: entryData.palettes,
        product_description: entryData.product_description,
        insured_value: entryData.insured_value
          ? parseFloat(entryData.insured_value)
          : null,
        entry_date: entryData.entry_date || new Date(),
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
 * Fetch EntryOrders filtered by organization
 * @param {string} organisationId - ID of the organization to filter by
 * @returns {Promise<Array>} - List of EntryOrders for the specified organization
 */
async function getAllEntryOrders(organisationId = null) {
  try {
    // Build the query based on whether an organization ID is provided
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
        status: true,
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
    };

    // Add organization filter if provided
    if (organisationId) {
      query.where = {
        order: {
          organisation_id: organisationId,
        },
      };
    }

    const entryOrders = await prisma.entryOrder.findMany(query);
    return entryOrders;
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

    return {
      origins,
      users,
      suppliers,
      documentTypes,
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
          name: true, // Only select the 'name' of the documentType
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
          created_at: true, // Select 'created_at' from the related Order model
        },
      },
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
        registration_date: departureData.registration_date,
        document_no: departureData.document_no,
        document_date: departureData.document_date,
        date_and_time_of_transfer: departureData.date_and_time_of_transfer,
        arrival_point: departureData.arrival_point,
        id_responsible: departureData.id_responsible,
        responsible_for_collection: departureData.responsible_for_collection,
        order_progress: departureData.order_progress,
        observation: departureData.observation,

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

module.exports = {
  createEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,

  // departure
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
};
