const {
  PrismaClient,
  RoleName,
  CellStatus,
  MovementType,
  InventoryStatus,
  AuditResult,
  CellRole,
  CellKind
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

// Helper functions
const createBaseLookupTables = async () => {
  console.log("Creating base lookup tables...");
  
  // Creating statuses
  const statuses = [
    { name: "order in process" },
    { name: "send order" },
    { name: "approved" },
    { name: "internal damage" },
    { name: "external damage" },
  ];
  await prisma.status.createMany({ data: statuses, skipDuplicates: true });
  
  // Creating origins
  const origins = [
    "Buy Local",
    "Import",
    "Return",
    "Reconditioned",
    "Warehouse Transfer",
    "Transfer between establishments of the same company",
    "Fractional",
  ].map(name => ({ name }));
  await prisma.origin.createMany({ data: origins, skipDuplicates: true });
  
  // Creating document types
  const documentTypes = [{ name: "Referral Guide" }, { name: "Bill" }];
  await prisma.documentType.createMany({ data: documentTypes, skipDuplicates: true });
  
  // Creating exit options
  const exitOptions = [
    { name: "Road Transport" },
    { name: "Air Freight" },
    { name: "Sea Freight" },
    { name: "Rail Transport" },
    { name: "Express Delivery" },
  ];
  await prisma.exitOption.createMany({ data: exitOptions, skipDuplicates: true });
  
  // Creating customer types
  const customerTypes = [
    { name: "Wholesale", discount_rate: 15.5 },
    { name: "Retail", discount_rate: 5.0 },
    { name: "Distributor", discount_rate: 20.0 },
    { name: "Government", discount_rate: 10.0 },
  ];
  await prisma.customerType.createMany({ data: customerTypes, skipDuplicates: true });
  
  // Creating labels
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
  await prisma.label.createMany({ data: labels, skipDuplicates: true });
  
  // Creating packaging types
  const packagingTypes = [
    { name: "Cardboard Box" },
    { name: "Wooden Crate" },
    { name: "Pallet" },
    { name: "Container" },
    { name: "Barrel" },
    { name: "Plastic Wrap" },
  ];
  await prisma.packagingType.createMany({ data: packagingTypes, skipDuplicates: true });
  
  // Creating product lines
  const productLines = [
    { name: "Electronics" },
    { name: "Automotive Parts" },
    { name: "Pharmaceuticals" },
    { name: "Food & Beverages" },
    { name: "Industrial Equipment" },
  ];
  await prisma.productLine.createMany({ data: productLines, skipDuplicates: true });
  
  // Creating group names
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
  await prisma.groupName.createMany({ data: groupNames, skipDuplicates: true });
  
  // Creating countries
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
  await prisma.country.createMany({ data: countries, skipDuplicates: true });
  
  // Creating temperature ranges
  const temperatureRanges = [
    { range: "Frozen", min_celsius: -30, max_celsius: -18 },
    { range: "Refrigerated", min_celsius: 2, max_celsius: 8 },
    { range: "Cool", min_celsius: 8, max_celsius: 15 },
    { range: "Room Temperature", min_celsius: 15, max_celsius: 25 },
    { range: "Warm", min_celsius: 25, max_celsius: 40 },
  ];
  await prisma.temperatureRange.createMany({ data: temperatureRanges, skipDuplicates: true });
  
  // Creating active states
  const activeStates = [
    { name: "Active" },
    { name: "Inactive" },
    { name: "Suspended" },
  ];
  await prisma.activeState.createMany({ data: activeStates, skipDuplicates: true });
  
  console.log("✅ Base lookup tables created");
};

async function createOrganisationsAndUsers() {
  console.log("Creating organisations...");
  // Create organisations
  const organisations = [
    {
      name: "TSLogix Corporation",
      address: { street: "123 Main St", city: "New York", zip: "10001" },
      tax_id: "TAX12345678",
    },
    ...Array(COUNT.ORGANISATIONS - 1).fill(null).map(() => ({
      name: faker.company.name(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        zip: faker.location.zipCode(),
      },
      tax_id: `TAX${faker.string.numeric(8)}`,
    }))
  ];
  
  await prisma.organisation.createMany({ data: organisations, skipDuplicates: true });
  const createdOrgs = await prisma.organisation.findMany();
  
  console.log("✅ Organisations created");
  
  console.log("Creating roles...");
  // Create roles according to new structure
  const roles = [
    { name: RoleName.CUSTOMER },
    { name: RoleName.WAREHOUSE },
    { name: RoleName.ADMIN }
  ];
  
  await prisma.role.createMany({ data: roles, skipDuplicates: true });
  const createdRoles = await prisma.role.findMany();
  
  console.log("✅ Roles created");
  
  console.log("Creating users...");
  const activeStates = await prisma.activeState.findMany();
  
  const customerRole = createdRoles.find((r) => r.name === "CUSTOMER").role_id;
  const warehouseRole = createdRoles.find((r) => r.name === "WAREHOUSE").role_id;
  const adminRole = createdRoles.find((r) => r.name === "ADMIN").role_id;
  const activeState = activeStates.find((s) => s.name === "Active").state_id;
  const mainOrg = createdOrgs[0].organisation_id;
  
  // Create seed users with visible passwords
  const seedUsers = [
    // Admin users
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
    // Customer users
    {
      user_id: "customer1",
      email: "customer1@company.com",
      password_hash: await bcrypt.hash("Customer123!", 10),
      first_name: "Customer",
      last_name: "One",
      organisation_id: createdOrgs[1].organisation_id,
      role_id: customerRole,
      active_state_id: activeState,
    },
    {
      user_id: "customer2",
      email: "customer2@company.com",
      password_hash: await bcrypt.hash("Customer456!", 10),
      first_name: "Customer",
      last_name: "Two",
      organisation_id: createdOrgs[1].organisation_id,
      role_id: customerRole,
      active_state_id: activeState,
    },
    // Warehouse users
    {
      user_id: "warehouse1",
      email: "warehouse1@tslogix.com",
      password_hash: await bcrypt.hash("Warehouse123!", 10),
      first_name: "Warehouse",
      last_name: "One",
      organisation_id: mainOrg,
      role_id: warehouseRole,
      active_state_id: activeState,
    },
    {
      user_id: "warehouse2",
      email: "warehouse2@tslogix.com",
      password_hash: await bcrypt.hash("Warehouse456!", 10),
      first_name: "Warehouse",
      last_name: "Two",
      organisation_id: mainOrg,
      role_id: warehouseRole,
      active_state_id: activeState,
    },
  ];
  
  // Create seed users
  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { user_id: user.user_id },
      update: {},
      create: user,
    });
  }
  
  console.log("✅ Seed users created with visible passwords:");
  seedUsers.forEach(u => console.log(`- ${u.user_id}: ${u.email} / Password: ${u.password_hash.slice(0, 10)}...`));
  
  // Create additional regular users
  const regularUsers = [];
  for (let i = 0; i < COUNT.USERS - seedUsers.length; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const passwordHash = await bcrypt.hash(faker.internet.password(), 10);
    
    regularUsers.push({
      user_id: faker.internet.userName({ firstName, lastName }).toLowerCase(),
      email: faker.internet.email({ firstName, lastName }),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      middle_name: faker.helpers.maybe(() => faker.person.middleName(), { probability: 0.3 }),
      organisation_id: faker.helpers.arrayElement(createdOrgs).organisation_id,
      role_id: faker.helpers.arrayElement([customerRole, warehouseRole]),
      active_state_id: faker.helpers.arrayElement(activeStates).state_id,
    });
  }
  
  // Create regular users in batches
  for (const user of regularUsers) {
    await prisma.user.upsert({
      where: { user_id: user.user_id },
      update: {},
      create: user,
    });
  }
  
  console.log(`✅ ${regularUsers.length} additional users created`);
  return { seedUsers, regularUsers };
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
  return suppliers;
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
  return customers;
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
        () => faker.helpers.arrayElement(temperatureRanges).temperature_range_id,
        { probability: 0.7 }
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
  return products;
}

async function createWarehouses() {
  console.log("Creating warehouses...");
  
  const warehouseNames = [
    "Central Warehouse",
    "North Distribution Center",
    "South Logistics Hub",
  ];
  
  const warehouses = [];
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
      status: faker.helpers.arrayElement(["Active", "Maintenance", "Expanding"]),
    });
  }
  
  await prisma.warehouse.createMany({
    data: warehouses,
    skipDuplicates: true,
  });
  
  console.log("✅ Warehouses created");
  return warehouses;
}

async function createWarehouseCells() {
  console.log("Creating warehouse cells...");
  const warehouses = await prisma.warehouse.findMany();
  const cells = [];
  
  // Configuration for cell creation
  const standardRows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
  const specialRow = "Q";
  const maxBays = 28;
  const maxPositions = 10;
  const kinds = [CellKind.NORMAL, CellKind.TRANSFER, CellKind.RESERVED];
  
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
            cell_role: CellRole.STANDARD,
            capacity: 1,
            currentUsage: 0,
            current_packaging_qty: 0,
            current_weight: 0,
            status: CellStatus.AVAILABLE,
          });
        }
      }
    }
    
    // Create special purpose cells in row Q
    
    // Standard cells in Q (bays 1-20)
    for (let bay = 1; bay <= 20; bay++) {
      for (let pos = 1; pos <= maxPositions; pos++) {
        cells.push({
          warehouse_id: wh.warehouse_id,
          row: specialRow,
          bay: bay,
          position: pos,
          kind: CellKind.NORMAL,
          cell_role: CellRole.STANDARD,
          capacity: 1,
          currentUsage: 0,
          current_packaging_qty: 0,
          current_weight: 0,
          status: CellStatus.AVAILABLE,
        });
      }
    }
    
    // Damaged cells in Q (bays 21-24)
    for (let bay = 21; bay <= 24; bay++) {
      for (let pos = 1; pos <= maxPositions; pos++) {
        cells.push({
          warehouse_id: wh.warehouse_id,
          row: specialRow,
          bay: bay,
          position: pos,
          kind: CellKind.NORMAL,
          cell_role: CellRole.DAMAGED,
          capacity: 1,
          currentUsage: 0,
          current_packaging_qty: 0,
          current_weight: 0,
          status: CellStatus.AVAILABLE,
        });
      }
    }
    
    // Expired cells in Q (bays 25-28)
    for (let bay = 25; bay <= 28; bay++) {
      for (let pos = 1; pos <= maxPositions; pos++) {
        cells.push({
          warehouse_id: wh.warehouse_id,
          row: specialRow,
          bay: bay,
          position: pos,
          kind: CellKind.NORMAL,
          cell_role: CellRole.EXPIRED,
          capacity: 1,
          currentUsage: 0,
          current_packaging_qty: 0,
          current_weight: 0,
          status: CellStatus.AVAILABLE,
        });
      }
    }
  }
  
  await prisma.warehouseCell.createMany({
    data: cells,
    skipDuplicates: true,
  });
  
  console.log(`✅ Warehouse Cells created: ${cells.length} cells across ${warehouses.length} warehouses`);
  return cells;
}

async function createEntryOrders() {
  console.log("🌱 Creating entry orders with cell assignments...");
  
  // Get data needed for entry orders
  const organisations = await prisma.organisation.findMany();
  const customerUsers = await prisma.user.findMany({
    where: { role: { name: "CUSTOMER" } },
  });
  const warehouseUsers = await prisma.user.findMany({
    where: { role: { name: "WAREHOUSE" } },
  });
  const suppliers = await prisma.supplier.findMany();
  const origins = await prisma.origin.findMany();
  const documentTypes = await prisma.documentType.findMany();
  const statuses = await prisma.status.findMany();
  const products = await prisma.product.findMany();
  const warehouses = await prisma.warehouse.findMany();
  
  const entryOrders = [];
  
  for (let i = 0; i < COUNT.ENTRY_ORDERS; i++) {
    // Create entry order by a customer
    const customerUser = faker.helpers.arrayElement(customerUsers);
    const product = faker.helpers.arrayElement(products);
    const warehouse = faker.helpers.arrayElement(warehouses);
    
    // Calculate order quantities
    const packagingQty = faker.number.int({ min: 10, max: 100 });
    const unitWeight = product.unit_weight || 1;
    const totalWeight = unitWeight * packagingQty;
    const unitVolume = product.unit_volume || 0.2;
    const totalVolume = unitVolume * packagingQty;
    
    // Create base order
    const order = await prisma.order.create({
      data: {
        order_type: "ENTRY",
        status: "PENDING",
        organisation_id: customerUser.organisation_id,
        created_by: customerUser.id,
        created_at: faker.date.recent({ days: 60 }),
      },
    });
    
    // Create entry order
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
        document_type_id: faker.helpers.arrayElement(documentTypes).document_type_id,
        personnel_incharge_id: customerUser.id,
        
        // Set quantities
        total_qty: packagingQty,
        total_weight: totalWeight,
        total_volume: totalVolume,
        remaining_packaging_qty: packagingQty,
        remaining_weight: totalWeight,
        
        // Additional details
        presentation: faker.helpers.arrayElement(["Boxed", "Palletized", "Loose"]),
        palettes: packagingQty, // One palette per package
        lot_series: `LOT-${faker.string.alphanumeric(8)}`,
        mfd_date_time: faker.date.past({ years: 1 }),
        expiration_date: faker.date.future({ years: 2 }),
        humidity: `${faker.number.int({ min: 20, max: 80 })}%`,
        insured_value: faker.number.float({ min: 1000, max: 100000 }),
        comments: faker.lorem.paragraph(),
      },
    });
    
    entryOrders.push(entryOrder);
    
    // Create audit by warehouse user
    const warehouseUser = faker.helpers.arrayElement(warehouseUsers);
    const auditResult = faker.helpers.arrayElement([
      AuditResult.PASSED,
      AuditResult.FAILED,
      AuditResult.PENDING,
    ]);
    
    // For demonstration, sometimes have a discrepancy in verified quantities
    const hasDiscrepancy = faker.helpers.maybe(() => true, { probability: 0.2 });
    const verifiedPackagingQty = hasDiscrepancy 
      ? faker.number.int({ min: Math.floor(packagingQty * 0.8), max: packagingQty })
      : packagingQty;
    const verifiedWeight = hasDiscrepancy
      ? verifiedPackagingQty * unitWeight
      : totalWeight;
      
    const audit = await prisma.entryOrderAudit.create({
      data: {
        entry_order_id: entryOrder.entry_order_id,
        audited_by: warehouseUser.id,
        audit_result: auditResult,
        verified_packaging_qty: verifiedPackagingQty,
        verified_weight: verifiedWeight,
        discrepancy_notes: hasDiscrepancy 
          ? `Found ${verifiedPackagingQty} packages instead of declared ${packagingQty}`
          : null,
        comments: faker.lorem.sentence(),
      },
    });
    
    // Update the entry order with audit status
    await prisma.entryOrder.update({
      where: { entry_order_id: entryOrder.entry_order_id },
      data: { 
        audit_status: audit.audit_result,
        // If there was a discrepancy, update the remaining values
        remaining_packaging_qty: auditResult === AuditResult.PASSED ? verifiedPackagingQty : packagingQty,
        remaining_weight: auditResult === AuditResult.PASSED ? verifiedWeight : totalWeight,
      },
    });
    
    // For PASSED audits, assign to cells
    if (audit.audit_result === AuditResult.PASSED) {
      await assignEntryOrderToCells(entryOrder, warehouseUser, verifiedPackagingQty, verifiedWeight, product, warehouse);
    }
  }
  
  console.log("✅ Entry orders created with audits and cell assignments");
  return entryOrders;
}

async function assignEntryOrderToCells(entryOrder, warehouseUser, totalPackagingQty, totalWeight, product, warehouse) {
  // Get available cells in this warehouse
  let availableCells = await prisma.warehouseCell.findMany({
    where: {
      warehouse_id: warehouse.warehouse_id,
      status: CellStatus.AVAILABLE,
      // Use standard cells only for normal items
      cell_role: CellRole.STANDARD,
    },
    orderBy: [
      { row: 'asc' },
      { bay: 'asc' },
      { position: 'asc' }
    ],
  });
  
  if (availableCells.length === 0) {
    console.log(`⚠️ No available cells for entry order ${entryOrder.entry_order_id}`);
    return;
  }
  
  // Determine how many cells needed and how to distribute
  const cellCount = Math.min(
    Math.ceil(totalPackagingQty / 20), // Max 20 packages per cell
    availableCells.length, // Limited by available cells
    3 // For demonstration, limit to max 3 cells per order
  );
  
  let remainingPackaging = totalPackagingQty;
  let remainingWeight = totalWeight;
  
  for (let i = 0; i < cellCount && remainingPackaging > 0; i++) {
    const cell = availableCells[i];
    
    // For last cell, assign all remaining; otherwise distribute evenly
    const isLastCell = i === cellCount - 1;
    const packagingForThisCell = isLastCell 
      ? remainingPackaging 
      : Math.ceil(totalPackagingQty / cellCount);
    
    const weightForThisCell = isLastCell
      ? remainingWeight
      : (packagingForThisCell / totalPackagingQty) * totalWeight;
    
    // Format the cell reference
    const cellRef = `${cell.row}.${String(cell.bay).padStart(2, '0')}.${String(cell.position).padStart(2, '0')}`;
    
    // Create cell assignment
    const cellAssignment = await prisma.cellAssignment.create({
      data: {
        entry_order_id: entryOrder.entry_order_id,
        cell_id: cell.id,
        assigned_by: warehouseUser.id,
        packaging_quantity: packagingForThisCell,
        weight: weightForThisCell,
        volume: (packagingForThisCell / totalPackagingQty) * entryOrder.total_volume,
        status: "ACTIVE",
      },
    });
    
    // Create inventory record for this cell
    await prisma.inventory.create({
      data: {
        product_id: product.product_id,
        entry_order_id: entryOrder.entry_order_id,
        warehouse_id: warehouse.warehouse_id,
        cell_id: cell.id,
        quantity: packagingForThisCell,
        packaging_quantity: packagingForThisCell,
        weight: weightForThisCell,
        status: InventoryStatus.AVAILABLE,
        expiration_date: entryOrder.expiration_date,
      },
    });
    
    // Create inventory log entry
    await prisma.inventoryLog.create({
      data: {
        user_id: warehouseUser.id,
        product_id: product.product_id,
        movement_type: MovementType.ENTRY,
        quantity_change: packagingForThisCell,
        packaging_change: packagingForThisCell,
        weight_change: weightForThisCell,
        entry_order_id: entryOrder.entry_order_id,
        warehouse_id: warehouse.warehouse_id,
        cell_id: cell.id,
        notes: `Assigned ${packagingForThisCell} packages (${weightForThisCell.toFixed(2)} kg) to cell ${cellRef}`,
      },
    });
    
    // Update cell status
    await prisma.warehouseCell.update({
      where: { id: cell.id },
      data: {
        status: CellStatus.OCCUPIED,
        currentUsage: 1,
        current_packaging_qty: packagingForThisCell,
        current_weight: weightForThisCell,
      },
    });
    
    // Update tracking variables
    remainingPackaging -= packagingForThisCell;
    remainingWeight -= weightForThisCell;
  }
  
  // Update entry order with remaining quantities
  await prisma.entryOrder.update({
    where: { entry_order_id: entryOrder.entry_order_id },
    data: {
      remaining_packaging_qty: remainingPackaging,
      remaining_weight: remainingWeight,
    },
  });
}

async function createDepartureOrders() {
  console.log("🌱 Creating departure orders...");
  
  // Get data needed for departure orders
  const customerUsers = await prisma.user.findMany({
    where: { role: { name: "CUSTOMER" } },
  });
  const warehouseUsers = await prisma.user.findMany({
    where: { role: { name: "WAREHOUSE" } },
  });
  const customers = await prisma.customer.findMany();
  const packagingTypes = await prisma.packagingType.findMany();
  const labels = await prisma.label.findMany();
  const exitOptions = await prisma.exitOption.findMany();
  const statuses = await prisma.status.findMany();
  
  // Get all inventory that can be shipped
  const availableInventory = await prisma.inventory.findMany({
    where: {
      status: InventoryStatus.AVAILABLE,
      quantity: { gt: 0 },
      entry_order: { audit_status: AuditResult.PASSED },
    },
    include: {
      product: true,
      entry_order: {
        include: { order: true }
      },
      warehouse: true,
      cell: true,
    },
  });
  
  if (availableInventory.length === 0) {
    console.log("⚠️ No available inventory for departure orders");
    return [];
  }
  
  // Group inventory by entry order
  const inventoryByEntryOrder = {};
  availableInventory.forEach(inv => {
    if (!inventoryByEntryOrder[inv.entry_order_id]) {
      inventoryByEntryOrder[inv.entry_order_id] = [];
    }
    inventoryByEntryOrder[inv.entry_order_id].push(inv);
  });
  
  const departureOrders = [];
  const entryOrderIds = Object.keys(inventoryByEntryOrder);
  
  for (let i = 0; i < Math.min(COUNT.DEPARTURE_ORDERS, entryOrderIds.length); i++) {
    const entryOrderId = entryOrderIds[i];
    const inventoryItems = inventoryByEntryOrder[entryOrderId];
    const sampleInventory = inventoryItems[0];
    
    // Determine how much to ship (sometimes partial, sometimes full)
    const isPartialShipment = faker.helpers.maybe(() => true, { probability: 0.3 });
    
    // Calculate total available
    const totalAvailablePackaging = inventoryItems.reduce((sum, item) => sum + item.packaging_quantity, 0);
    const totalAvailableWeight = inventoryItems.reduce((sum, item) => parseFloat(sum) + parseFloat(item.weight), 0);
    
    // For partial shipments, take a portion
    const packagingToShip = isPartialShipment
      ? faker.number.int({ min: 1, max: Math.floor(totalAvailablePackaging * 0.7) })
      : totalAvailablePackaging;
      
    const weightToShip = isPartialShipment
      ? (packagingToShip / totalAvailablePackaging) * totalAvailableWeight
      : totalAvailableWeight;
    
    // Create by a customer
    const customerUser = faker.helpers.arrayElement(customerUsers);
    
    // Base Order
    const order = await prisma.order.create({
      data: {
        order_type: "DEPARTURE",
        status: "PROCESSING",
        priority: faker.helpers.arrayElement(["HIGH", "NORMAL", "LOW"]),
        created_at: faker.date.recent({ days: 30 }),
        organisation_id: customerUser.organisation_id,
        created_by: customerUser.id,
      },
    });
    
    // Create departure order
    const departureOrder = await prisma.departureOrder.create({
      data: {
        order_id: order.order_id,
        entry_order_id: entryOrderId,
        product_id: sampleInventory.product_id,
        customer_id: faker.helpers.arrayElement(customers).customer_id,
        packaging_id: faker.helpers.arrayElement(packagingTypes).packaging_type_id,
        exit_option_id: faker.helpers.arrayElement(exitOptions).exit_option_id,
        label_id: faker.helpers.maybe(() => faker.helpers.arrayElement(labels).label_id),
        status_id: faker.helpers.arrayElement(statuses).status_id,
        
        // Set quantities
        total_qty: packagingToShip,
        total_weight: weightToShip,
        total_volume: (packagingToShip / totalAvailablePackaging) * sampleInventory.entry_order.total_volume,
        
        // Additional details
        palettes: `${Math.ceil(packagingToShip / 20)} pallets`,
        insured_value: weightToShip * faker.number.float({ min: 5, max: 20 }),
        arrival_point: `${faker.location.city()}, ${faker.location.country()}`,
        responsible_for_collection: faker.person.fullName(),
        departure_transfer_note: `TN-${faker.string.alphanumeric(10)}`,
        document_no: `DOC-${faker.string.numeric(8)}`,
        document_date: faker.date.recent({ days: 7 }),
        personnel_in_charge_id: faker.helpers.arrayElement(warehouseUsers).id,
        date_and_time_of_transfer: faker.date.soon({ days: 3 }),
        warehouse_id: sampleInventory.warehouse_id,
      },
    });
    
    departureOrders.push(departureOrder);
    
    // Process inventory for this departure
    await processDepartureOrderInventory(
      departureOrder, 
      inventoryItems, 
      packagingToShip, 
      weightToShip, 
      customerUser
    );
  }
  
  console.log("✅ Departure orders created");
  return departureOrders;
}

async function processDepartureOrderInventory(departureOrder, inventoryItems, packagingToShip, weightToShip, user) {
  let remainingPackagingToShip = packagingToShip;
  let remainingWeightToShip = weightToShip;
  
  // Process inventory items until we've shipped the requested amount
  for (const inventoryItem of inventoryItems) {
    if (remainingPackagingToShip <= 0) break;
    
    const cell = inventoryItem.cell;
    if (!cell) continue;
    
    const cellRef = `${cell.row}.${String(cell.bay).padStart(2, '0')}.${String(cell.position).padStart(2, '0')}`;
    
    // Determine how much to take from this inventory item
    const packagingFromThisItem = Math.min(remainingPackagingToShip, inventoryItem.packaging_quantity);
    const weightRatio = packagingFromThisItem / inventoryItem.packaging_quantity;
    const weightFromThisItem = weightRatio * parseFloat(inventoryItem.weight);
    
    // Create cell assignment for this departure
    await prisma.cellAssignment.create({
      data: {
        departure_order_id: departureOrder.departure_order_id,
        cell_id: cell.id,
        assigned_by: user.id,
        packaging_quantity: packagingFromThisItem,
        weight: weightFromThisItem,
        status: "ACTIVE",
      },
    });
    
    // Create inventory log for this movement
    await prisma.inventoryLog.create({
      data: {
        user_id: user.id,
        product_id: inventoryItem.product_id,
        movement_type: MovementType.DEPARTURE,
        quantity_change: -packagingFromThisItem,
        packaging_change: -packagingFromThisItem,
        weight_change: -weightFromThisItem,
        departure_order_id: departureOrder.departure_order_id,
        entry_order_id: inventoryItem.entry_order_id,
        warehouse_id: inventoryItem.warehouse_id,
        cell_id: cell.id,
        notes: `Removed ${packagingFromThisItem} packages (${weightFromThisItem.toFixed(2)} kg) from cell ${cellRef}`,
      },
    });
    
    // Calculate remaining inventory
    const remainingPackaging = inventoryItem.packaging_quantity - packagingFromThisItem;
    const remainingWeight = parseFloat(inventoryItem.weight) - weightFromThisItem;
    
    // Update inventory record
    await prisma.inventory.update({
      where: { inventory_id: inventoryItem.inventory_id },
      data: {
        quantity: remainingPackaging,
        packaging_quantity: remainingPackaging,
        weight: remainingWeight,
        status: remainingPackaging > 0 ? InventoryStatus.AVAILABLE : InventoryStatus.DEPLETED,
      },
    });
    
    // Update cell if fully depleted
    if (remainingPackaging <= 0) {
      await prisma.warehouseCell.update({
        where: { id: cell.id },
        data: {
          status: CellStatus.AVAILABLE,
          currentUsage: 0,
          current_packaging_qty: 0,
          current_weight: 0,
        },
      });
    } else {
      // Otherwise update cell with remaining quantities
      await prisma.warehouseCell.update({
        where: { id: cell.id },
        data: {
          current_packaging_qty: remainingPackaging,
          current_weight: remainingWeight,
        },
      });
    }
    
    // Update tracking variables
    remainingPackagingToShip -= packagingFromThisItem;
    remainingWeightToShip -= weightFromThisItem;
  }
}

async function main() {
  try {
    console.log("Starting database seed...");
    
    // Create all lookup tables first
    await createBaseLookupTables();
    
    // Create organizational structure
    await createOrganisationsAndUsers();
    await createSuppliers();
    await createCustomers();
    await createProducts();
    
    // Create warehouse infrastructure
    const warehouses = await createWarehouses();
    await createWarehouseCells();
    
    // Create orders and assignments
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
