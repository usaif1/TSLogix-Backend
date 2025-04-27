const {
  PrismaClient,
  RoleName,
  CellStatus,
  MovementType,
  InventoryStatus,
  AuditResult,
} = require("@prisma/client");
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
  WAREHOUSES: 3,
  WAREHOUSE_CELLS: 100,
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

  const adminRole = roles.find((r) => r.name === "ADMIN").role_id;
  const clientRole = roles.find((r) => r.name === "CLIENT").role_id;
  const staffRole = roles.find((r) => r.name === "STAFF").role_id;
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
      role_id: staffRole,
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

async function createWarehouses() {
  console.log("Creating warehouses...");
  const warehouses = [];

  const warehouseNames = [
    "Central Warehouse",
    "North Distribution Center",
    "South Logistics Hub",
  ];

  for (let i = 0; i < COUNT.WAREHOUSES; i++) {
    warehouses.push({
      name: warehouseNames[i] || `Warehouse-${i + 1}`,
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zip: faker.location.zipCode(),
        country: faker.location.country(),
      },
      location: faker.location.city(),
      capacity: faker.number.int({ min: 5000, max: 20000 }),
      max_occupancy: faker.number.int({ min: 4000, max: 5000 }),
      status: faker.helpers.arrayElement([
        "Active",
        "Maintenance",
        "Expanding",
      ]),
    });
  }

  await prisma.warehouse.createMany({
    data: warehouses,
    skipDuplicates: true,
  });

  console.log("✅ Warehouses created");
}

async function createWarehouseCells() {
  console.log("Creating warehouse cells...");

  const warehouses = await prisma.warehouse.findMany();
  const cells = [];

  // Distribute cells among warehouses
  const cellsPerWarehouse = Math.ceil(
    COUNT.WAREHOUSE_CELLS / warehouses.length
  );

  warehouses.forEach((warehouse) => {
    const zones = ["A", "B", "C", "D"];

    for (let i = 0; i < cellsPerWarehouse; i++) {
      const row = String.fromCharCode(65 + (Math.floor(i / 25) % 6)); // A-F
      const column = String(Math.floor(i % 25) + 1).padStart(2, "0"); // 01-25
      const level = String(Math.floor(i / 150) + 1);
      const zone = faker.helpers.arrayElement(zones);

      cells.push({
        warehouse_id: warehouse.warehouse_id,
        cell_number: `${zone}${row}${column}${level}`,
        zone: zone,
        row: row,
        column: column,
        level: level,
        capacity: faker.number.float({ min: 10, max: 50, precision: 0.01 }),
        current_usage: faker.number.float({ min: 0, max: 5, precision: 0.01 }),
        temperature: faker.helpers.maybe(() =>
          faker.number.float({ min: -5, max: 30, precision: 0.1 })
        ),
        humidity: faker.helpers.maybe(() =>
          faker.number.float({ min: 35, max: 70, precision: 0.1 })
        ),
        status: faker.helpers.weightedArrayElement([
          { weight: 5, value: CellStatus.AVAILABLE },
          { weight: 3, value: CellStatus.PARTIALLY_OCCUPIED },
          { weight: 1, value: CellStatus.OCCUPIED },
          { weight: 0.5, value: CellStatus.MAINTENANCE },
          { weight: 0.3, value: CellStatus.RESERVED },
          { weight: 0.2, value: CellStatus.BLOCKED },
        ]),
      });
    }
  });

  await prisma.warehouseCell.createMany({
    data: cells,
    skipDuplicates: true,
  });

  console.log("✅ Warehouse Cells created");
}

async function createEntryOrders() {
  console.log("🌱 Creating detailed entry orders...");
  const organisations = await prisma.organisation.findMany();
  const users = await prisma.user.findMany();
  const suppliers = await prisma.supplier.findMany();
  const origins = await prisma.origin.findMany();
  const documentTypes = await prisma.documentType.findMany();
  const statuses = await prisma.status.findMany();
  const products = await prisma.product.findMany();
  const warehouses = await prisma.warehouse.findMany();
  const cells = await prisma.warehouseCell.findMany();

  for (let i = 0; i < COUNT.ENTRY_ORDERS; i++) {
    // 1. Select product and calculate metrics
    const product = faker.helpers.arrayElement(products);
    const quantity = faker.number.int({ min: 100, max: 1000 });
    const unitWeight =
      product.unit_weight ?? faker.number.float({ min: 0.5, max: 10 });
    const unitVolume =
      product.unit_volume ?? faker.number.float({ min: 0.1, max: 2 });

    // 2. Calculate derived fields
    const totalQty = `${quantity} ${faker.helpers.arrayElement([
      "units",
      "boxes",
      "crates",
    ])}`;
    const totalWeight = `${(unitWeight * quantity).toFixed(2)} kg`;
    const totalVolume = `${(unitVolume * quantity).toFixed(2)} m³`;
    const palettes = `${Math.ceil(
      quantity / faker.number.int({ min: 20, max: 50 })
    )} pallets`;
    const technicalSpec = `Specifications:\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}`;

    // 3. Create base order
    const order = await prisma.order.create({
      data: {
        order_type: "ENTRY",
        status: "PENDING",
        organisation_id:
          faker.helpers.arrayElement(organisations).organisation_id,
        created_by: faker.helpers.arrayElement(users).id,
        created_at: faker.date.recent({ days: 60 }),
      },
    });

    // 4. Create entry order with all fields
    const warehouse = faker.helpers.arrayElement(warehouses);
    const entryOrder = await prisma.entryOrder.create({
      data: {
        order_id: order.order_id,
        product_id: product.product_id,
        entry_order_no: `ENTRY-${faker.string.numeric(5)}`,
        registration_date: new Date(),
        document_date: faker.date.past({ years: 1 }),
        document_status: "ACTIVE",
        status_id: faker.helpers.arrayElement(statuses).status_id,
        warehouse_id: warehouse.warehouse_id,
        supplier_id: faker.helpers.arrayElement(suppliers).supplier_id,
        origin_id: faker.helpers.arrayElement(origins).origin_id,
        document_type_id:
          faker.helpers.arrayElement(documentTypes).document_type_id,
        personnel_incharge_id: faker.helpers.arrayElement(users).id,

        // Detailed fields
        total_qty: totalQty,
        total_weight: totalWeight,
        total_volume: totalVolume,
        technical_specification: technicalSpec,
        palettes: palettes,
        presentation: faker.helpers.arrayElement([
          "Boxed",
          "Palletized",
          "Loose",
        ]),
        lot_series: `LOT-${faker.string.alphanumeric(8)}`,
        mfd_date_time: faker.date.past({ years: 1 }),
        expiration_date: faker.date.future({ years: 2 }),
        humidity: `${faker.number.int({ min: 20, max: 80 })}%`,
        insured_value: faker.number.float({ min: 1000, max: 100000 }),
        observation: faker.lorem.sentence(),
        comments: faker.lorem.paragraph(),
      },
    });

    // 5. Audit and inventory flow (same as before)
    const audit = await prisma.entryOrderAudit.create({
      data: {
        entry_order_id: entryOrder.entry_order_id,
        audited_by: faker.helpers.arrayElement(users).id,
        audit_result: faker.helpers.arrayElement([
          AuditResult.PASSED,
          AuditResult.FAILED,
          AuditResult.PENDING,
        ]),
        comments: faker.lorem.sentence(),
      },
    });

    await prisma.entryOrder.update({
      where: { entry_order_id: entryOrder.entry_order_id },
      data: { audit_status: audit.audit_result },
    });

    if (audit.audit_result === AuditResult.PASSED) {
      const cell = faker.helpers.arrayElement(
        cells.filter((c) => c.warehouse_id === warehouse.warehouse_id)
      );

      // Create inventory with precise quantity
      await prisma.inventory.create({
        data: {
          product_id: product.product_id,
          entry_order_id: entryOrder.entry_order_id,
          warehouse_id: warehouse.warehouse_id,
          cell_id: cell.cell_id,
          quantity: quantity, // Numeric value from total_qty calculation
          status: InventoryStatus.AVAILABLE,
          expiration_date: entryOrder.expiration_date,
        },
      });

      // Inventory log with audit reference
      await prisma.inventoryLog.create({
        data: {
          audit_id: audit.audit_id,
          user_id: order.created_by,
          product_id: product.product_id,
          quantity_change: quantity,
          movement_type: MovementType.ENTRY,
          entry_order_id: entryOrder.entry_order_id,
          warehouse_id: warehouse.warehouse_id,
          cell_id: cell.cell_id,
          notes: `Initial entry: ${totalQty} (${totalWeight}, ${totalVolume})`,
        },
      });

      // Update warehouse cell capacity
      await prisma.warehouseCell.update({
        where: { cell_id: cell.cell_id },
        data: {
          current_usage: {
            increment: unitVolume * quantity,
          },
          status: CellStatus.PARTIALLY_OCCUPIED,
        },
      });
    }
  }
  console.log("✅ Detailed entry orders created with all fields");
}

async function createDepartureOrders() {
  console.log("🌱 Creating detailed departure orders...");
  const users = await prisma.user.findMany();
  const customers = await prisma.customer.findMany();
  const packagingTypes = await prisma.packagingType.findMany();
  const labels = await prisma.label.findMany();
  const exitOptions = await prisma.exitOption.findMany();
  const statuses = await prisma.status.findMany();
  const organisations = await prisma.organisation.findMany();

  // Get valid inventory with proper relations
  const validInventory = await prisma.inventory.findMany({
    where: {
      status: InventoryStatus.AVAILABLE,
      quantity: { gt: 0 },
      entry_order: { audit_status: AuditResult.PASSED },
    },
    include: {
      product: true,
      entry_order: {
        include: {
          audits: true,
          order: {
            include: {
              organisation: true
            }
          },
          product: true,
        },
      },
      warehouse: true,
      cell: true,
    },
  });

  if (validInventory.length === 0) {
    console.log("⏹️ No available inventory for departure orders");
    return;  // Exit the function if no valid inventory
  }

  for (let i = 0; i < COUNT.DEPARTURE_ORDERS; i++) {
    if (validInventory.length === 0) {
      console.log("⏹️ No more available inventory for departure orders");
      break;
    }

    // 1. Select inventory and calculate shipment details
    const inventoryIndex = faker.number.int({
      min: 0,
      max: validInventory.length - 1,
    });
    const inventory = validInventory[inventoryIndex];
    const quantity = faker.number.int({
      min: 1,
      max: inventory.quantity,
    });

    // 2. Calculate derived values
    const product = inventory.product;
    const unitWeight =
      product.unit_weight || faker.number.float({ min: 0.5, max: 10 });
    const unitVolume =
      product.unit_volume || faker.number.float({ min: 0.1, max: 2 });
    const totalWeight = unitWeight * quantity;
    const totalVolume = unitVolume * quantity;

    // Get the organization ID safely
    const organisationId = inventory.entry_order.order?.organisation?.organisation_id;
    // If we don't have an organization ID, use a default
    const finalOrgId = organisationId || organisations[0].organisation_id;

    // 3. Create base order with proper relations
    const order = await prisma.order.create({
      data: {
        order_type: "DEPARTURE",
        status: "PROCESSING",
        priority: faker.helpers.arrayElement(["HIGH", "NORMAL", "LOW"]),
        created_at: faker.date.recent({ days: 30 }),
        organisation: {
          connect: {
            organisation_id: finalOrgId,
          },
        },
        createdBy: {
          connect: { id: faker.helpers.arrayElement(users).id },
        },
      },
    });

    // 4. Create departure order with all fields
    const departureOrder = await prisma.departureOrder.create({
      data: {
        order_id: order.order_id,
        entry_order_id: inventory.entry_order_id,
        product_id: product.product_id,
        customer_id: faker.helpers.arrayElement(customers).customer_id,
        packaging_id:
          faker.helpers.arrayElement(packagingTypes).packaging_type_id,
        exit_option_id: faker.helpers.arrayElement(exitOptions).exit_option_id,
        label_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(labels).label_id
        ),
        status_id: faker.helpers.arrayElement(statuses).status_id,
        total_qty: `${quantity} units`,
        total_weight: `${totalWeight.toFixed(2)} kg`,
        total_volume: `${totalVolume.toFixed(2)} m³`,
        palettes: `${Math.ceil(quantity / 50)} pallets`,
        insured_value: totalWeight * faker.number.float({ min: 5, max: 20 }),
        arrival_point: `${faker.location.city()}, ${faker.location.country()}`,
        responsible_for_collection: faker.person.fullName(),
        departure_transfer_note: `TN-${faker.string.alphanumeric(10)}`,
        document_no: `DOC-${faker.string.numeric(8)}`,
        document_date: faker.date.recent({ days: 7 }),
        personnel_in_charge_id: faker.helpers.arrayElement(users).id,
        date_and_time_of_transfer: faker.date.soon({ days: 3 }),
        warehouse_id: inventory.warehouse_id,  // Connect to the same warehouse
      },
    });

    // 5. Get associated audit from entry order if it exists
    const entryOrderAudit = inventory.entry_order.audits[0] || null;
    const auditId = entryOrderAudit ? entryOrderAudit.audit_id : null;

    // 6. Create inventory log with audit reference
    await prisma.inventoryLog.create({
      data: {
        audit_id: auditId,
        user_id: order.created_by,
        product_id: inventory.product_id,
        quantity_change: -quantity,
        movement_type: MovementType.DEPARTURE,
        departure_order_id: departureOrder.departure_order_id,
        warehouse_id: inventory.warehouse_id,
        cell_id: inventory.cell_id,
        notes: `Shipped ${quantity} units to ${departureOrder.arrival_point}`,
      },
    });

    // 7. Update inventory
    const updatedInventory = await prisma.inventory.update({
      where: { inventory_id: inventory.inventory_id },
      data: {
        quantity: { decrement: quantity },
        status:
          inventory.quantity - quantity <= 0
            ? InventoryStatus.DEPLETED
            : InventoryStatus.AVAILABLE,
      },
    });

    // 8. Update warehouse cell capacity if cell exists
    if (inventory.cell_id) {
      await prisma.warehouseCell.update({
        where: { cell_id: inventory.cell_id },
        data: {
          current_usage: { decrement: totalVolume },
          status:
            updatedInventory.quantity > 0
              ? CellStatus.PARTIALLY_OCCUPIED
              : CellStatus.AVAILABLE,
        },
      });
    }

    // 9. Remove depleted inventory from available stock
    if (updatedInventory.quantity <= 0) {
      validInventory.splice(inventoryIndex, 1);
    } else {
      // Update the quantity in our local array to reflect the database
      validInventory[inventoryIndex].quantity = updatedInventory.quantity;
    }
  }
  console.log("✅ Departure orders created with inventory tracking");
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
    await createWarehouses();
    await createWarehouseCells();
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
