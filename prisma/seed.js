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

  // Configuration
  const standardRows = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
  ];
  const specialRow = "Q";
  const maxBays = 28;
  const maxPositions = 10;
  const kinds = ["NORMAL", "V", "T", "R"];

  for (const wh of warehouses) {
    // Create standard storage cells (rows A-P, all bays)
    for (const row of standardRows) {
      for (let bay = 1; bay <= maxBays; bay++) {
        for (let pos = 1; pos <= maxPositions; pos++) {
          cells.push({
            warehouse_id: wh.warehouse_id,
            row: row,
            bay: bay,
            position: pos,
            kind: faker.helpers.arrayElement(kinds),
            cell_role: "STANDARD",
            capacity: 1,
            currentUsage: 0,
            status: CellStatus.AVAILABLE, // All cells start available
          });
        }
      }
    }

    // Create special purpose cells in row Q
    // Q row has 20 bays for standard, 4 bays for damaged, 4 bays for expired

    // Standard cells in row Q (bays 1-20)
    for (let bay = 1; bay <= 20; bay++) {
      for (let pos = 1; pos <= maxPositions; pos++) {
        cells.push({
          warehouse_id: wh.warehouse_id,
          row: specialRow,
          bay: bay,
          position: pos,
          kind: "NORMAL",
          cell_role: "STANDARD",
          capacity: 1,
          currentUsage: 0,
          status: CellStatus.AVAILABLE,
        });
      }
    }

    // Damaged product cells (bays 21-24)
    for (let bay = 21; bay <= 24; bay++) {
      for (let pos = 1; pos <= maxPositions; pos++) {
        cells.push({
          warehouse_id: wh.warehouse_id,
          row: specialRow,
          bay: bay,
          position: pos,
          kind: "NORMAL",
          cell_role: "DAMAGED",
          capacity: 1,
          currentUsage: 0,
          status: CellStatus.AVAILABLE,
        });
      }
    }

    // Expired product cells (bays 25-28)
    for (let bay = 25; bay <= 28; bay++) {
      for (let pos = 1; pos <= maxPositions; pos++) {
        cells.push({
          warehouse_id: wh.warehouse_id,
          row: specialRow,
          bay: bay,
          position: pos,
          kind: "NORMAL",
          cell_role: "EXPIRED",
          capacity: 1,
          currentUsage: 0,
          status: CellStatus.AVAILABLE,
        });
      }
    }
  }

  await prisma.warehouseCell.createMany({
    data: cells,
    skipDuplicates: true,
  });

  console.log(
    `✅ Warehouse Cells created: ${cells.length} cells across ${warehouses.length} warehouses`
  );
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
      // pick any AVAILABLE slot in this warehouse
      const cell = await prisma.warehouseCell.findFirst({
        where: {
          warehouse_id: warehouse.warehouse_id,
          status: CellStatus.AVAILABLE,
        },
        orderBy: { row: "asc" }, // or bay/position if you want a specific traversal order
      });

      // create the inventory record pointing at that slot
      await prisma.inventory.create({
        data: {
          product_id: product.product_id,
          entry_order_id: entryOrder.entry_order_id,
          warehouse_id: warehouse.warehouse_id,
          cell_id: cell.id,
          quantity: quantity,
          status: InventoryStatus.AVAILABLE,
          expiration_date: entryOrder.expiration_date,
        },
      });

      // log it
      await prisma.inventoryLog.create({
        data: {
          audit_id: audit.audit_id,
          user_id: order.created_by,
          product_id: product.product_id,
          movement_type: MovementType.ENTRY,
          quantity_change: quantity,
          entry_order_id: entryOrder.entry_order_id,
          warehouse_id: warehouse.warehouse_id,
          cell_id: cell.id,
          notes: `Stored in ${cell.row}.${String(cell.bay).padStart(
            2,
            "0"
          )}.${String(cell.position).padStart(2, "0")}`,
        },
      });

      await prisma.warehouseCell.update({
        where: { id: cell.id },
        data: {
          currentUsage: 1, // Each cell either holds 1 pallet or nothing
          status: CellStatus.OCCUPIED, // No more PARTIALLY_OCCUPIED status
        },
      });
    }
  }
  console.log("✅ Detailed entry orders created with all fields");
}

async function createDepartureOrders() {
  console.log("🌱 Creating detailed departure orders...");

  // Fetch lookup data
  const users = await prisma.user.findMany();
  const customers = await prisma.customer.findMany();
  const packagingTypes = await prisma.packagingType.findMany();
  const labels = await prisma.label.findMany();
  const exitOptions = await prisma.exitOption.findMany();
  const statuses = await prisma.status.findMany();
  const organisations = await prisma.organisation.findMany();

  // Get all inventory items that are AVAILABLE and have passed audit
  let validInventory = await prisma.inventory.findMany({
    where: {
      status: InventoryStatus.AVAILABLE,
      quantity: { gt: 0 },
      entry_order: { audit_status: AuditResult.PASSED },
    },
    include: {
      entry_order: true,
      warehouse: true,
      cell: true,
      product: true,
    },
  });

  if (validInventory.length === 0) {
    console.log("⏹️ No available inventory for departure orders");
    return;
  }

  for (let i = 0; i < COUNT.DEPARTURE_ORDERS; i++) {
    if (validInventory.length === 0) {
      console.log("⏹️ All inventory exhausted before reaching target");
      break;
    }

    // Pick a random inventory slot
    const idx = faker.number.int({ min: 0, max: validInventory.length - 1 });
    const inv = validInventory[idx];
    const qtyToShip = faker.number.int({ min: 1, max: inv.quantity });

    // Calculate weight/volume
    const unitWgt =
      inv.product.unit_weight || faker.number.float({ min: 0.5, max: 10 });
    const unitVol =
      inv.product.unit_volume || faker.number.float({ min: 0.1, max: 2 });
    const totalWgt = (unitWgt * qtyToShip).toFixed(2);
    const totalVol = (unitVol * qtyToShip).toFixed(2);

    // Base Order
    const order = await prisma.order.create({
      data: {
        order_type: "DEPARTURE",
        status: "PROCESSING",
        priority: faker.helpers.arrayElement(["HIGH", "NORMAL", "LOW"]),
        created_at: faker.date.recent({ days: 30 }),
        organisation: {
          connect: {
            organisation_id:
              inv.entry_order.order?.organisation_id ||
              organisations[0].organisation_id,
          },
        },
        createdBy: {
          connect: { id: faker.helpers.arrayElement(users).id },
        },
      },
    });

    // DepartureOrder record
    const departureOrder = await prisma.departureOrder.create({
      data: {
        order_id: order.order_id,
        entry_order_id: inv.entry_order_id,
        product_id: inv.product_id,
        customer_id: faker.helpers.arrayElement(customers).customer_id,
        packaging_id:
          faker.helpers.arrayElement(packagingTypes).packaging_type_id,
        exit_option_id: faker.helpers.arrayElement(exitOptions).exit_option_id,
        label_id: faker.helpers.maybe(
          () => faker.helpers.arrayElement(labels).label_id
        ),
        status_id: faker.helpers.arrayElement(statuses).status_id,
        total_qty: `${qtyToShip} units`,
        total_weight: `${totalWgt} kg`,
        total_volume: `${totalVol} m³`,
        palettes: `${Math.ceil(qtyToShip / 50)} pallets`,
        insured_value:
          unitWgt * qtyToShip * faker.number.float({ min: 5, max: 20 }),
        arrival_point: `${faker.location.city()}, ${faker.location.country()}`,
        responsible_for_collection: faker.person.fullName(),
        departure_transfer_note: `TN-${faker.string.alphanumeric(10)}`,
        document_no: `DOC-${faker.string.numeric(8)}`,
        document_date: faker.date.recent({ days: 7 }),
        personnel_in_charge_id: faker.helpers.arrayElement(users).id,
        date_and_time_of_transfer: faker.date.soon({ days: 3 }),
        warehouse_id: inv.warehouse_id,
      },
    });

    // Log the movement
    await prisma.inventoryLog.create({
      data: {
        user_id: order.created_by,
        product_id: inv.product_id,
        movement_type: MovementType.DEPARTURE,
        quantity_change: -qtyToShip,
        departure_order_id: departureOrder.departure_order_id,
        warehouse_id: inv.warehouse_id,
        cell_id: inv.cell_id,
        notes: `Shipped ${qtyToShip} units (W:${totalWgt}kg, V:${totalVol}m³)`,
      },
    });

    // Update the inventory record
    const updatedInv = await prisma.inventory.update({
      where: { inventory_id: inv.inventory_id },
      data: {
        quantity: inv.quantity - qtyToShip,
        status:
          inv.quantity - qtyToShip > 0
            ? InventoryStatus.AVAILABLE
            : InventoryStatus.DEPLETED,
      },
    });

    // Free up or update the cell
    if (inv.cell_id) {
      await prisma.warehouseCell.update({
        where: { id: inv.cell_id },
        data: {
          currentUsage: 0,
          status: CellStatus.AVAILABLE,
        },
      });
    }

    // Remove fully depleted from our local list
    if (updatedInv.quantity <= 0) {
      validInventory.splice(idx, 1);
    } else {
      validInventory[idx].quantity = updatedInv.quantity;
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
