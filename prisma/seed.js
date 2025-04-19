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
  LOCATIONS: 10,
};

const LocationType = {
  STORAGE: "STORAGE",
  LOADING: "LOADING",
  UNLOADING: "UNLOADING",
  TRANSIT: "TRANSIT",
  REPACKAGING: "REPACKAGING",
  INSPECTION: "INSPECTION",
  RETURN: "RETURN",
  REPAIR: "REPAIR",
  WAREHOUSE: "WAREHOUSE",
  DISTRIBUTION: "DISTRIBUTION",
};

// Define these enums as well since they're used in createEntryOrders and createDepartureOrders
const MovementType = {
  ENTRY: "ENTRY",
  DEPARTURE: "DEPARTURE",
  TRANSFER: "TRANSFER",
  ADJUSTMENT: "ADJUSTMENT"
};

const InventoryStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  DAMAGED: "DAMAGED",
  EXPIRED: "EXPIRED"
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
  const documentTypes = [{ name: "Referral Guide" }, { name: "Bill" }];

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

  const adminRole = roles.find((r) => r.name === RoleName.ADMIN).role_id;
  const clientRole = roles.find((r) => r.name === RoleName.CLIENT).role_id;
  const activeState = activeStates.find((s) => s.name === "Active").state_id;
  const mainOrg = organisations[0].organisation_id;

  // Create admin users with visible passwords
  const adminUsers = [
    {
      user_id: "admin1",
      email: "admin1@tslogix.com",
      password_hash: await bcrypt.hash("Admin123!", 10),
      first_name: "Admin",
      last_name: "One",
      organisation_id: mainOrg,
      role_id: adminRole,
      active_state_id: activeState,
    },
    {
      user_id: "admin2",
      email: "admin2@tslogix.com",
      password_hash: await bcrypt.hash("Admin456!", 10),
      first_name: "Admin",
      last_name: "Two",
      organisation_id: mainOrg,
      role_id: adminRole,
      active_state_id: activeState,
    },
    {
      user_id: "admin3",
      email: "admin3@tslogix.com",
      password_hash: await bcrypt.hash("Admin789!", 10),
      first_name: "Admin",
      last_name: "Three",
      organisation_id: mainOrg,
      role_id: adminRole,
      active_state_id: activeState,
    },
  ];

  // Create client users with visible passwords
  const clientUsers = [
    {
      user_id: "client1",
      email: "client1@company.com",
      password_hash: await bcrypt.hash("Client123!", 10),
      first_name: "Client",
      last_name: "One",
      organisation_id: organisations[1].organisation_id,
      role_id: clientRole,
      active_state_id: activeState,
    },
    {
      user_id: "client2",
      email: "client2@company.com",
      password_hash: await bcrypt.hash("Client456!", 10),
      first_name: "Client",
      last_name: "Two",
      organisation_id: organisations[1].organisation_id,
      role_id: clientRole,
      active_state_id: activeState,
    },
    {
      user_id: "client3",
      email: "client3@company.com",
      password_hash: await bcrypt.hash("Client789!", 10),
      first_name: "Client",
      last_name: "Three",
      organisation_id: organisations[2].organisation_id,
      role_id: clientRole,
      active_state_id: activeState,
    },
  ];

  // Create all admin and client users first
  for (const user of [...adminUsers, ...clientUsers]) {
    await prisma.user.upsert({
      where: { user_id: user.user_id },
      update: {},
      create: user,
    });
  }

  console.log("✅ Admin and Client users created with visible passwords:");
  console.log("Admin Users:");
  adminUsers.forEach((u) =>
    console.log(
      `- ${u.user_id}: ${u.email} / Password: Admin123!|Admin456!|Admin789!`
    )
  );
  console.log("Client Users:");
  clientUsers.forEach((u) =>
    console.log(
      `- ${u.user_id}: ${u.email} / Password: Client123!|Client456!|Client789!`
    )
  );

  // Create regular staff users
  const regularUsers = [];
  for (
    let i = 0;
    i < COUNT.USERS - (adminUsers.length + clientUsers.length);
    i++
  ) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const passwordHash = await bcrypt.hash(faker.internet.password(), 10);

    regularUsers.push({
      user_id: faker.internet.userName({ firstName, lastName }).toLowerCase(),
      email: faker.internet.email({ firstName, lastName }),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      middle_name: faker.helpers.maybe(() => faker.person.middleName(), {
        probability: 0.3,
      }),
      organisation_id:
        faker.helpers.arrayElement(organisations).organisation_id,
      role_id: roles.find((r) => r.name === RoleName.STAFF).role_id,
      active_state_id: faker.helpers.arrayElement(activeStates).state_id,
    });
  }

  // Create the regular users
  for (const user of regularUsers) {
    await prisma.user.upsert({
      where: { user_id: user.user_id },
      update: {},
      create: user,
    });
  }

  console.log(`✅ ${regularUsers.length} regular users created`);
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
      temperature_range_id: faker.helpers.maybe(
        () => faker.helpers.arrayElement(temperatureRanges).temperature_range_id
      ),
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
      unit_weight: parseFloat(faker.commerce.price({ min: 0.1, max: 50 })),
      unit_volume: parseFloat(faker.commerce.price({ min: 0.1, max: 10 })),
    });
  }

  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  console.log("✅ Products created");
}

async function createLocations() {
  console.log("Creating locations...");

  const locationTypes = Object.values(LocationType);
  const locations = [];

  for (let i = 0; i < COUNT.LOCATIONS; i++) {
    const locationType = faker.helpers.arrayElement(locationTypes);
    const name = `${locationType}-${String(i).padStart(3, "0")}`;

    locations.push({
      name,
      type: locationType,
      capacity: faker.number.int({ min: 100, max: 10000 }),
    });
  }

  await prisma.location.createMany({
    data: locations,
    skipDuplicates: true,
  });

  console.log("✅ Locations created");
}

async function createEntryOrders() {
  console.log("Creating entry orders...");

  const organisations = await prisma.organisation.findMany();
  const users = await prisma.user.findMany();
  const suppliers = await prisma.supplier.findMany();
  const origins = await prisma.origin.findMany();
  const documentTypes = await prisma.documentType.findMany();
  const statuses = await prisma.status.findMany();
  const products = await prisma.product.findMany();
  const locations = await prisma.location.findMany({
    where: { type: LocationType.STORAGE },
  });

  for (let i = 0; i < COUNT.ENTRY_ORDERS; i++) {
    const orderDate = faker.date.recent({ days: 60 });
    const expirationDate = faker.date.future({ years: 2, refDate: orderDate });

    const order = await prisma.order.create({
      data: {
        order_type: "ENTRY",
        status: "PENDING",
        organisation_id:
          faker.helpers.arrayElement(organisations).organisation_id,
        created_by: faker.helpers.arrayElement(users).id,
        created_at: orderDate,
      },
    });

    const maxTemp = faker.number.int({ min: 15, max: 30 });
    const minTemp = faker.number.int({ min: 0, max: maxTemp - 1 });

    const entryOrder = await prisma.entryOrder.create({
      data: {
        order_id: order.order_id,
        entry_order_no: `ENTRY-${faker.string.numeric(5)}`,
        registration_date: orderDate,
        document_date: orderDate,
        document_status: faker.helpers.arrayElement([
          "Active",
          "Draft",
          "Archived",
        ]),
        supplier_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(suppliers).supplier_id
        ),
        origin_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(origins).origin_id
        ),
        document_type_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(documentTypes).document_type_id
        ),
        personnel_incharge_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(users).id
        ),
        admission_date_time: faker.helpers.maybe(() =>
          faker.date.recent({ days: 30 })
        ),
        cif_value: faker.helpers.maybe(() => faker.string.numeric(6)),
        max_temperature: `${maxTemp}°C`,
        min_temperature: `${minTemp}°C`,
        product: faker.commerce.productName(),
        product_description: faker.commerce.productDescription(),
        quantity_packaging: `${faker.number.int({
          min: 1,
          max: 100,
        })} ${faker.helpers.arrayElement([
          "boxes",
          "crates",
          "pallets",
          "containers",
        ])}`,
        total_qty: faker.number.int({ min: 10, max: 10000 }).toString(),
        presentation: faker.helpers.arrayElement([
          "Boxed",
          "Loose",
          "Wrapped",
          "Vacuum Sealed",
        ]),
        insured_value: parseFloat(
          faker.commerce.price({ min: 1000, max: 100000 })
        ),
        palettes: faker.number.int({ min: 1, max: 50 }).toString(),
        lot_series: `LOT-${faker.string.alphanumeric(8)}`,
        technical_specification: faker.lorem.paragraph(1),
        humidity: `${faker.number.int({ min: 20, max: 80 })}%`,
        total_volume: `${faker.number.int({ min: 1, max: 1000 })} m³`,
        total_weight: `${faker.number.int({ min: 10, max: 50000 })} kg`,
        mfd_date_time: faker.date.past({ years: 1, refDate: orderDate }),
        expiration_date: expirationDate,
        certificate_protocol_analysis: faker.helpers.maybe(
          () => `CERT-${faker.string.alphanumeric(10)}`
        ),
        entry_transfer_note: faker.lorem.sentence(),
        type: faker.helpers.arrayElement([
          "Regular",
          "Urgent",
          "Special",
          "Return",
        ]),
        status_id: faker.helpers.arrayElement(statuses).status_id,
        comments: faker.lorem.paragraph(),
        observation: faker.lorem.sentence(),
        order_progress: faker.helpers.arrayElement([
          "0%",
          "25%",
          "50%",
          "75%",
          "100%",
        ]),
      },
    });

    // Create inventory and inventory logs for this entry
    if (i % 2 === 0) {
      // Only create inventory for half the entries
      const productToUse = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 10, max: 1000 });
      const location = faker.helpers.arrayElement(locations);
      const user = faker.helpers.arrayElement(users);

      // Create inventory record
      const inventory = await prisma.inventory.create({
        data: {
          product_id: productToUse.product_id,
          entry_order_id: entryOrder.entry_order_id,
          location_id: location.location_id,
          quantity,
          expiration_date: expirationDate,
          status: InventoryStatus.AVAILABLE,
        },
      });

      // Create inventory log
      await prisma.inventoryLog.create({
        data: {
          user_id: user.id,
          product_id: productToUse.product_id,
          quantity_change: quantity,
          movement_type: MovementType.ENTRY,
          entry_order_id: entryOrder.entry_order_id,
          location_id: location.location_id,
        },
      });
    }
  }

  console.log("✅ Entry Orders and related Inventory records created");
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
  const products = await prisma.product.findMany();

  // Get entry orders to link some departure orders to them
  const entryOrders = await prisma.entryOrder.findMany({
    take: Math.floor(COUNT.ENTRY_ORDERS / 2), // Link about half of departure orders to entry orders
  });

  // Get inventory with products that have stock
  const inventoryItems = await prisma.inventory.findMany({
    where: {
      quantity: {
        gt: 0,
      },
    },
    include: {
      location: true,
    },
  });

  for (let i = 0; i < COUNT.DEPARTURE_ORDERS; i++) {
    const orderDate = faker.date.recent({ days: 30 });
    const transferDate = faker.date.soon({ days: 14, refDate: orderDate });

    const order = await prisma.order.create({
      data: {
        order_type: "DEPARTURE",
        status: "PENDING",
        organisation_id:
          faker.helpers.arrayElement(organisations).organisation_id,
        created_by: faker.helpers.arrayElement(users).id,
        created_at: orderDate,
        priority: faker.helpers.arrayElement(["HIGH", "NORMAL"]),
      },
    });

    // Link to an entry order for some departure orders
    // Only link if we're in the first half of departure orders and have entry orders
    const linkedEntryOrder = i < entryOrders.length ? entryOrders[i] : null;

    const departureOrder = await prisma.departureOrder.create({
      data: {
        order_id: order.order_id,
        departure_order_no: `DEP-${faker.string.numeric(5)}`,
        registration_date: orderDate,
        document_no: `DOC-${faker.string.alphanumeric(8)}`,
        document_date: orderDate,
        document_status: faker.helpers.arrayElement([
          "Active",
          "Draft",
          "Processed",
        ]),
        customer_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(customers).customer_id
        ),
        document_type_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(documentTypes).document_type_id
        ),
        packaging_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(packagingTypes).packaging_type_id
        ),
        label_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(labels).label_id
        ),
        exit_option_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(exitOptions).exit_option_id
        ),
        personnel_in_charge_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(users).id
        ),
        date_and_time_of_transfer: transferDate,
        arrival_point: faker.location.streetAddress(),
        id_responsible: `ID-${faker.string.numeric(6)}`,
        responsible_for_collection: faker.person.fullName(),
        order_progress: faker.helpers.arrayElement([
          "0%",
          "25%",
          "50%",
          "75%",
          "100%",
        ]),
        observation: faker.lorem.sentence(),
        palettes: faker.number.int({ min: 1, max: 50 }).toString(),
        product_description: faker.commerce.productDescription(),
        status_id: faker.helpers.arrayElement(statuses).status_id,
        type: faker.helpers.arrayElement([
          "Regular",
          "Urgent",
          "Special",
          "Return",
        ]),
        total_qty: faker.number.int({ min: 10, max: 10000 }).toString(),
        total_volume: `${faker.number.int({ min: 1, max: 1000 })} m³`,
        total_weight: `${faker.number.int({ min: 10, max: 50000 })} kg`,
        // Add entry_order_id if we have a linked entry order
        entry_order_id: linkedEntryOrder
          ? linkedEntryOrder.entry_order_id
          : null,
      },
    });

    // Create inventory logs for this departure if we have inventory items
    if (inventoryItems.length > 0 && i % 3 === 0) {
      const inventoryItem = faker.helpers.arrayElement(inventoryItems);
      const quantityToRemove = faker.number.int({
        min: 1,
        max: Math.min(inventoryItem.quantity, 100),
      });
      const user = faker.helpers.arrayElement(users);

      // Create inventory log for departure
      await prisma.inventoryLog.create({
        data: {
          user_id: user.id,
          product_id: inventoryItem.product_id,
          quantity_change: -quantityToRemove, // Negative for departures
          movement_type: MovementType.DEPARTURE,
          departure_order_id: departureOrder.departure_order_id,
          location_id: inventoryItem.location_id,
        },
      });

      // Update inventory quantity
      await prisma.inventory.update({
        where: {
          inventory_id: inventoryItem.inventory_id,
        },
        data: {
          quantity: {
            decrement: quantityToRemove,
          },
        },
      });
    }
  }

  console.log("✅ Departure Orders and related inventory logs created");
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
    await createLocations();
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
