const { PrismaClient, RoleName } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

// Number of records to create for each model
const COUNT = {
  ORIGINS: 10,
  DOCUMENT_TYPES: 8,
  EXIT_OPTIONS: 5,
  CUSTOMER_TYPES: 4,
  LABELS: 10,
  PACKAGING_TYPES: 6,
  PRODUCT_LINES: 5,
  GROUP_NAMES: 8,
  COUNTRIES: 15,
  TEMPERATURE_RANGES: 5,
  ACTIVE_STATES: 3,
  ORGANISATIONS: 4,
  USERS: 20,
  SUPPLIERS: 15,
  CUSTOMERS: 20,
  PRODUCTS: 30,
  ENTRY_ORDERS: 25,
  DEPARTURE_ORDERS: 25,
};

async function createStatuses() {
  console.log("Creating statuses...");
  const statuses = [
    { name: "order in process" },
    { name: "send order" },
    { name: "approved" },
    { name: "internal damage" },
    { name: "external damage" },
  ];

  await prisma.status.createMany({
    data: statuses,
    skipDuplicates: true,
  });

  console.log("✅ Statuses created");
}

async function createOrigins() {
  console.log("Creating origins...");
  const origins = [];

  const standardOrigins = [
    "Buy Local",
    "Import",
    "Return",
    "Reconditioned",
    "Warehouse Transfer",
    "Transfer between establishments of the same company",
    "Fractional",
  ];

  standardOrigins.forEach((name) => {
    origins.push({ name });
  });

  await prisma.origin.createMany({
    data: origins,
    skipDuplicates: true,
  });

  console.log("✅ Origins created");
}

async function createDocumentTypes() {
  console.log("Creating document types...");
  const documentTypes = [
    { name: "Referral Guide" },
    { name: "Bill" }
  ];

  await prisma.documentType.createMany({
    data: documentTypes,
    skipDuplicates: true,
  });

  console.log("✅ Document Types created");
}

async function createExitOptions() {
  console.log("Creating exit options...");
  const exitOptions = [
    { name: "Road Transport" },
    { name: "Air Freight" },
    { name: "Sea Freight" },
    { name: "Rail Transport" },
    { name: "Express Delivery" },
  ];

  await prisma.exitOption.createMany({
    data: exitOptions,
    skipDuplicates: true,
  });

  console.log("✅ Exit Options created");
}

async function createCustomerTypes() {
  console.log("Creating customer types...");
  const customerTypes = [
    { name: "Wholesale", discount_rate: 15.5 },
    { name: "Retail", discount_rate: 5.0 },
    { name: "Distributor", discount_rate: 20.0 },
    { name: "Government", discount_rate: 10.0 },
  ];

  await prisma.customerType.createMany({
    data: customerTypes,
    skipDuplicates: true,
  });

  console.log("✅ Customer Types created");
}

async function createLabels() {
  console.log("Creating labels...");
  const labels = [
    { name: "Fragile" },
    { name: "Handle With Care" },
    { name: "Keep Dry" },
    { name: "This Side Up" },
    { name: "Hazardous Material" },
    { name: "Perishable" },
    { name: "Temperature Sensitive" },
    { name: "Urgent" },
    { name: "Heavy" },
    { name: "Priority" },
  ];

  await prisma.label.createMany({
    data: labels,
    skipDuplicates: true,
  });

  console.log("✅ Labels created");
}

async function createPackagingTypes() {
  console.log("Creating packaging types...");
  const packagingTypes = [
    { name: "Cardboard Box" },
    { name: "Wooden Crate" },
    { name: "Pallet" },
    { name: "Container" },
    { name: "Barrel" },
    { name: "Plastic Wrap" },
  ];

  await prisma.packagingType.createMany({
    data: packagingTypes,
    skipDuplicates: true,
  });

  console.log("✅ Packaging Types created");
}

async function createProductLines() {
  console.log("Creating product lines...");
  const productLines = [
    { name: "Electronics" },
    { name: "Automotive Parts" },
    { name: "Pharmaceuticals" },
    { name: "Food & Beverages" },
    { name: "Industrial Equipment" },
  ];

  await prisma.productLine.createMany({
    data: productLines,
    skipDuplicates: true,
  });

  console.log("✅ Product Lines created");
}

async function createGroupNames() {
  console.log("Creating group names...");
  const groupNames = [
    { name: "Consumer Electronics", product_category: "Electronics" },
    { name: "Engine Components", product_category: "Automotive" },
    { name: "Generic Medications", product_category: "Pharmaceuticals" },
    { name: "Dairy Products", product_category: "Food" },
    { name: "Power Tools", product_category: "Industrial" },
    { name: "Mobile Devices", product_category: "Electronics" },
    { name: "Transmission Parts", product_category: "Automotive" },
    { name: "Specialized Medications", product_category: "Pharmaceuticals" },
  ];

  await prisma.groupName.createMany({
    data: groupNames,
    skipDuplicates: true,
  });

  console.log("✅ Group Names created");
}

async function createCountries() {
  console.log("Creating countries...");
  const countries = [
    { name: "United States" },
    { name: "China" },
    { name: "Mexico" },
    { name: "Canada" },
    { name: "Brazil" },
    { name: "Germany" },
    { name: "Japan" },
    { name: "United Kingdom" },
    { name: "France" },
    { name: "Italy" },
    { name: "South Korea" },
    { name: "India" },
    { name: "Spain" },
    { name: "Australia" },
    { name: "Peru" },
  ];

  await prisma.country.createMany({
    data: countries,
    skipDuplicates: true,
  });

  console.log("✅ Countries created");
}

async function createTemperatureRanges() {
  console.log("Creating temperature ranges...");
  const temperatureRanges = [
    { range: "Frozen", min_celsius: -30, max_celsius: -18 },
    { range: "Refrigerated", min_celsius: 2, max_celsius: 8 },
    { range: "Cool", min_celsius: 8, max_celsius: 15 },
    { range: "Room Temperature", min_celsius: 15, max_celsius: 25 },
    { range: "Warm", min_celsius: 25, max_celsius: 40 },
  ];

  await prisma.temperatureRange.createMany({
    data: temperatureRanges,
    skipDuplicates: true,
  });

  console.log("✅ Temperature Ranges created");
}

async function createActiveStates() {
  console.log("Creating active states...");
  const activeStates = [
    { name: "Active" },
    { name: "Inactive" },
    { name: "Suspended" },
  ];

  await prisma.activeState.createMany({
    data: activeStates,
    skipDuplicates: true,
  });

  console.log("✅ Active States created");
}

async function createOrganisations() {
  console.log("Creating organisations...");
  const organisations = [];

  organisations.push({
    name: "TSLogix Corporation",
    address: { street: "123 Main St", city: "New York", zip: "10001" },
    tax_id: "TAX12345678",
  });

  for (let i = 0; i < COUNT.ORGANISATIONS - 1; i++) {
    organisations.push({
      name: faker.company.name(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        zip: faker.location.zipCode(),
      },
      tax_id: `TAX${faker.string.numeric(8)}`,
    });
  }

  await prisma.organisation.createMany({
    data: organisations,
    skipDuplicates: true,
  });

  console.log("✅ Organisations created");
}

async function createRoles() {
  console.log("Creating roles...");
  const roles = [
    { name: RoleName.ADMIN },
    { name: RoleName.CLIENT },
    { name: RoleName.STAFF },
  ];

  await prisma.role.createMany({
    data: roles,
    skipDuplicates: true,
  });

  console.log("✅ Roles created");
}

async function createUsers() {
  console.log("Creating users...");

  const organisations = await prisma.organisation.findMany();
  const roles = await prisma.role.findMany();
  const activeStates = await prisma.activeState.findMany();

  const users = [];

  const hashedPassword = await bcrypt.hash("admin123", 10);
  users.push({
    user_id: "admin",
    email: "admin@tslogix.com",
    password_hash: hashedPassword,
    first_name: "Admin",
    last_name: "User",
    organisation_id: organisations[0].organisation_id,
    role_id: roles.find((r) => r.name === RoleName.ADMIN).role_id,
    active_state_id: activeStates.find((s) => s.name === "Active").state_id,
  });

  for (let i = 0; i < COUNT.USERS - 1; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const passwordHash = await bcrypt.hash(faker.internet.password(), 10);

    users.push({
      user_id: faker.internet.userName({ firstName, lastName }).toLowerCase(),
      email: faker.internet.email({ firstName, lastName }),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      middle_name: faker.helpers.maybe(() => faker.person.middleName(), {
        probability: 0.3,
      }),
      organisation_id: faker.helpers.arrayElement(organisations).organisation_id,
      role_id: faker.helpers.arrayElement(roles).role_id,
      active_state_id: faker.helpers.arrayElement(activeStates).state_id,
    });
  }

  for (const user of users) {
    await prisma.user.upsert({
      where: { user_id: user.user_id },
      update: {},
      create: user,
    });
  }

  console.log("✅ Users created");
}

async function createSuppliers() {
  console.log("Creating suppliers...");

  const countries = await prisma.country.findMany();
  const suppliers = [];

  for (let i = 0; i < COUNT.SUPPLIERS; i++) {
    suppliers.push({
      name: faker.company.name(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      phone: faker.phone.number(),
      email: faker.internet.email({ provider: "supplier.com" }),
      ruc: `RUC${faker.string.numeric(8)}`,
      country_id: faker.helpers.arrayElement(countries).country_id,
    });
  }

  await prisma.supplier.createMany({
    data: suppliers,
    skipDuplicates: true,
  });

  console.log("✅ Suppliers created");
}

async function createCustomers() {
  console.log("Creating customers...");

  const customerTypes = await prisma.customerType.findMany();
  const activeStates = await prisma.activeState.findMany();
  const customers = [];

  for (let i = 0; i < COUNT.CUSTOMERS; i++) {
    customers.push({
      name: faker.company.name(),
      type_id: faker.helpers.arrayElement(customerTypes).customer_type_id,
      billing_address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zip: faker.location.zipCode(),
      },
      active_state_id: faker.helpers.arrayElement(activeStates).state_id,
    });
  }

  await prisma.customer.createMany({
    data: customers,
    skipDuplicates: true,
  });

  console.log("✅ Customers created");
}

async function createProducts() {
  console.log("Creating products...");

  const productLines = await prisma.productLine.findMany();
  const groupNames = await prisma.groupName.findMany();
  const temperatureRanges = await prisma.temperatureRange.findMany();
  const activeStates = await prisma.activeState.findMany();
  const products = [];

  for (let i = 0; i < COUNT.PRODUCTS; i++) {
    products.push({
      name: faker.commerce.productName(),
      product_line_id: faker.helpers.arrayElement(productLines).product_line_id,
      group_id: faker.helpers.arrayElement(groupNames).group_id,
      temperature_range_id: faker.helpers.arrayElement(temperatureRanges).temperature_range_id,
      active_state_id: faker.helpers.arrayElement(activeStates).state_id,
      humidity: `${faker.number.int({ min: 20, max: 80 })}%`,
      manufacturer: faker.company.name(),
      storage_conditions: faker.helpers.arrayElement([
        "Store in a cool, dry place",
        "Refrigerate after opening",
        "Keep away from direct sunlight",
        "Store in original packaging",
        "Keep container tightly closed",
      ]),
    });
  }

  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  console.log("✅ Products created");
}

async function createEntryOrders() {
  console.log("Creating entry orders...");

  const organisations = await prisma.organisation.findMany();
  const users = await prisma.user.findMany();
  const suppliers = await prisma.supplier.findMany();
  const origins = await prisma.origin.findMany();
  const documentTypes = await prisma.documentType.findMany();
  const statuses = await prisma.status.findMany();

  for (let i = 0; i < COUNT.ENTRY_ORDERS; i++) {
    const orderDate = faker.date.recent({ days: 60 });
    const expirationDate = faker.date.future({ years: 2, refDate: orderDate });

    const order = await prisma.order.create({
      data: {
        order_type: "ENTRY",
        status: "PENDING",
        organisation_id: faker.helpers.arrayElement(organisations).organisation_id,
        created_by: faker.helpers.arrayElement(users).id,
        created_at: orderDate,
      },
    });

    const maxTemp = faker.number.int({ min: 15, max: 30 });
    const minTemp = faker.number.int({ min: 0, max: maxTemp - 1 });

    await prisma.entryOrder.create({
      data: {
        order_id: order.order_id,
        entry_order_no: `ENTRY-${faker.string.numeric(5)}`,
        registration_date: orderDate,
        document_date: orderDate,
        document_status: faker.helpers.arrayElement(["Active", "Draft", "Archived"]),
        supplier_id: faker.helpers.maybe(() => faker.helpers.arrayElement(suppliers).supplier_id),
        origin_id: faker.helpers.maybe(() => faker.helpers.arrayElement(origins).origin_id),
        document_type_id: faker.helpers.maybe(() => faker.helpers.arrayElement(documentTypes).document_type_id),
        personnel_incharge_id: faker.helpers.maybe(() => faker.helpers.arrayElement(users).id),
        admission_date_time: faker.helpers.maybe(() => faker.date.recent({ days: 30 })),
        cif_value: faker.helpers.maybe(() => faker.string.numeric(6)),
        max_temperature: `${maxTemp}°C`,
        min_temperature: `${minTemp}°C`,
        product: faker.commerce.productName(),
        product_description: faker.commerce.productDescription(),
        quantity_packaging: `${faker.number.int({ min: 1, max: 100 })} ${faker.helpers.arrayElement(["boxes", "crates", "pallets", "containers"])}`,
        total_qty: faker.number.int({ min: 10, max: 10000 }).toString(),
        presentation: faker.helpers.arrayElement(["Boxed", "Loose", "Wrapped", "Vacuum Sealed"]),
        insured_value: parseFloat(faker.commerce.price({ min: 1000, max: 100000 })),
        palettes: faker.number.int({ min: 1, max: 50 }).toString(),
        lot_series: `LOT-${faker.string.alphanumeric(8)}`,
        technical_specification: faker.lorem.paragraph(1),
        humidity: `${faker.number.int({ min: 20, max: 80 })}%`,
        total_volume: `${faker.number.int({ min: 1, max: 1000 })} m³`,
        total_weight: `${faker.number.int({ min: 10, max: 50000 })} kg`,
        mfd_date_time: faker.date.past({ years: 1, refDate: orderDate }),
        expiration_date: expirationDate,
        certificate_protocol_analysis: faker.helpers.maybe(() => `CERT-${faker.string.alphanumeric(10)}`),
        entry_transfer_note: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(["Regular", "Urgent", "Special", "Return"]),
        status_id: faker.helpers.arrayElement(statuses).status_id,
        comments: faker.lorem.paragraph(),
        observation: faker.lorem.sentence(),
        order_progress: faker.helpers.arrayElement(["0%", "25%", "50%", "75%", "100%"]),
      },
    });
  }

  console.log("✅ Entry Orders created");
}

async function createDepartureOrders() {
  console.log("Creating departure orders...");

  const organisations = await prisma.organisation.findMany();
  const users = await prisma.user.findMany();
  const customers = await prisma.customer.findMany();
  const documentTypes = await prisma.documentType.findMany();
  const packagingTypes = await prisma.packagingType.findMany();
  const labels = await prisma.label.findMany();
  const exitOptions = await prisma.exitOption.findMany();
  const statuses = await prisma.status.findMany();

  for (let i = 0; i < COUNT.DEPARTURE_ORDERS; i++) {
    const orderDate = faker.date.recent({ days: 30 });
    const transferDate = faker.date.soon({ days: 14, refDate: orderDate });

    const order = await prisma.order.create({
      data: {
        order_type: "DEPARTURE",
        status: "PENDING",
        organisation_id: faker.helpers.arrayElement(organisations).organisation_id,
        created_by: faker.helpers.arrayElement(users).id,
        created_at: orderDate,
      },
    });

    await prisma.departureOrder.create({
      data: {
        order_id: order.order_id,
        departure_order_no: `DEP-${faker.string.numeric(5)}`,
        registration_date: orderDate,
        document_no: `DOC-${faker.string.alphanumeric(8)}`,
        document_date: orderDate,
        document_status: faker.helpers.arrayElement(["Active", "Draft", "Processed"]),
        customer_id: faker.helpers.maybe(() => faker.helpers.arrayElement(customers).customer_id),
        document_type_id: faker.helpers.maybe(() => faker.helpers.arrayElement(documentTypes).document_type_id),
        packaging_id: faker.helpers.maybe(() => faker.helpers.arrayElement(packagingTypes).packaging_type_id),
        label_id: faker.helpers.maybe(() => faker.helpers.arrayElement(labels).label_id),
        exit_option_id: faker.helpers.maybe(() => faker.helpers.arrayElement(exitOptions).exit_option_id),
        personnel_in_charge_id: faker.helpers.maybe(() => faker.helpers.arrayElement(users).id),
        date_and_time_of_transfer: transferDate,
        arrival_point: faker.location.streetAddress(),
        id_responsible: `ID-${faker.string.numeric(6)}`,
        responsible_for_collection: faker.person.fullName(),
        order_progress: faker.helpers.arrayElement(["0%", "25%", "50%", "75%", "100%"]),
        observation: faker.lorem.sentence(),
        palettes: faker.number.int({ min: 1, max: 50 }).toString(),
        product_description: faker.commerce.productDescription(),
        status_id: faker.helpers.arrayElement(statuses).status_id,
        type: faker.helpers.arrayElement(["Regular", "Urgent", "Special", "Return"]),
        total_qty: faker.number.int({ min: 10, max: 10000 }).toString(),
        total_volume: `${faker.number.int({ min: 1, max: 1000 })} m³`,
        total_weight: `${faker.number.int({ min: 10, max: 50000 })} kg`,
      },
    });
  }

  console.log("✅ Departure Orders created");
}

async function main() {
  try {
    console.log("Starting database seed...");

    await createRoles();
    await createActiveStates();
    await createStatuses();
    await createOrigins();
    await createDocumentTypes();
    await createExitOptions();
    await createCustomerTypes();
    await createLabels();
    await createPackagingTypes();
    await createProductLines();
    await createGroupNames();
    await createCountries();
    await createTemperatureRanges();
    await createOrganisations();
    await createUsers();
    await createSuppliers();
    await createCustomers();
    await createProducts();
    await createEntryOrders();
    await createDepartureOrders();

    console.log("✅ Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();