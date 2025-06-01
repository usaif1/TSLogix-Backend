const {
  PrismaClient,
  RoleName,
  CellStatus,
  MovementType,
  InventoryStatus,
  ReviewStatus,
  CellRole,
  CellKind,
  OriginType,
  DocumentTypeEntry,
  DocumentTypeDeparture,
  OrderStatusEntry,
  OrderStatusDeparture,
  PresentationType,
  TemperatureRangeType,
  ProductStatus,
} = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

// Helper function to calculate status code from ProductStatus enum
function getStatusCodeFromEnum(productStatus) {
  const statusMapping = {
    'PAL_NORMAL': 30, 'CAJ_NORMAL': 31, 'SAC_NORMAL': 32, 'UNI_NORMAL': 33,
    'PAQ_NORMAL': 34, 'TAM_NORMAL': 35, 'BUL_NORMAL': 36, 'OTR_NORMAL': 37,
    'PAL_DANADA': 40, 'CAJ_DANADA': 41, 'SAC_DANADO': 42, 'UNI_DANADA': 43,
    'PAQ_DANADO': 44, 'TAM_DANADO': 45, 'BUL_DANADO': 46, 'OTR_DANADO': 47,
  };
  return statusMapping[productStatus] || 30;
}

// Number of records to create
const COUNT = {
  ORGANISATIONS: 4,
  USERS: 20,
  SUPPLIERS: 15,
  CUSTOMERS: 20,
  PRODUCTS: 30,
  WAREHOUSES: 3,
  ENTRY_ORDERS: 25,
  DEPARTURE_ORDERS: 15,
};

async function createBaseLookupTables() {
  try {
    console.log("Creating base lookup tables...");

    // Countries
    console.log("Creating countries...");
    await prisma.country.createMany({
      data: [
        { name: "Peru" },
        { name: "Ecuador" },
        { name: "Colombia" },
        { name: "Brazil" },
        { name: "Chile" },
        { name: "United States" },
        { name: "Mexico" },
        { name: "Argentina" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Countries created");

    // Product Lines
    console.log("Creating product lines...");
    await prisma.productLine.createMany({
      data: [
        { name: "Electronics" },
        { name: "Food & Beverages" },
        { name: "Textiles" },
        { name: "Automotive" },
        { name: "Chemicals" },
        { name: "Pharmaceuticals" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Product lines created");

    // Group Names
    console.log("Creating group names...");
    await prisma.groupName.createMany({
      data: [
        { name: "Frozen Foods", product_category: "Food" },
        { name: "Fresh Produce", product_category: "Food" },
        { name: "Consumer Electronics", product_category: "Electronics" },
        { name: "Industrial Equipment", product_category: "Equipment" },
        { name: "Raw Materials", product_category: "Materials" },
        { name: "Medical Supplies", product_category: "Healthcare" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Group names created");

    // Temperature Ranges
    console.log("Creating temperature ranges...");
    await prisma.temperatureRange.createMany({
      data: [
        { range: "15°C - 30°C", min_celsius: 15, max_celsius: 30 },
        { range: "15°C - 25°C", min_celsius: 15, max_celsius: 25 },
        { range: "2°C - 8°C", min_celsius: 2, max_celsius: 8 },
        { range: "Ambiente", min_celsius: null, max_celsius: null },
        { range: "-18°C - -15°C", min_celsius: -18, max_celsius: -15 },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Temperature ranges created");

    // Active States
    console.log("Creating active states...");
    await prisma.activeState.createMany({
      data: [
        { name: "Active" },
        { name: "Inactive" },
        { name: "Pending" },
        { name: "Suspended" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Active states created");

    // Customer Types
    console.log("Creating customer types...");
    await prisma.customerType.createMany({
      data: [
        { name: "Regular", discount_rate: 0.00 },
        { name: "Premium", discount_rate: 5.00 },
        { name: "VIP", discount_rate: 10.00 },
        { name: "Wholesale", discount_rate: 15.00 },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Customer types created");

    // Origins for Entry Orders
    console.log("Creating origins...");
    await prisma.origin.createMany({
      data: [
        { name: "Compra Local", type: "COMPRA_LOCAL" },
        { name: "Importación", type: "IMPORTACION" },
        { name: "Devolución", type: "DEVOLUCION" },
        { name: "Acondicionado", type: "ACONDICIONADO" },
        { name: "Transferencia Interna", type: "TRANSFERENCIA_INTERNA" },
        { name: "Fraccionado", type: "FRACCIONADO" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Origins created");

    // Document Types for Entry
    console.log("Creating document types for entry...");
    await prisma.documentType.createMany({
      data: [
        { name: "Packing List", type: "PACKING_LIST" },
        { name: "Factura", type: "FACTURA" },
        { name: "Certificado de Análisis", type: "CERTIFICADO_ANALISIS" },
        { name: "RRSS", type: "RRSS" },
        { name: "Permiso Especial", type: "PERMISO_ESPECIAL" },
        { name: "Otro", type: "OTRO" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Entry document types created");

    // Document Types for Departure
    console.log("Creating document types for departure...");
    await prisma.departureDocumentType.createMany({
      data: [
        { name: "Invoice", type: "INVOICE" },
        { name: "Delivery Note", type: "DELIVERY_NOTE" },
        { name: "Transfer Receipt", type: "TRANSFER_RECEIPT" },
        { name: "Shipping Manifest", type: "SHIPPING_MANIFEST" },
        { name: "Customs Declaration", type: "CUSTOMS_DECLARATION" },
        { name: "Other", type: "OTRO" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Departure document types created");

    // Exit Options
    console.log("Creating exit options...");
    await prisma.exitOption.createMany({
      data: [
        { name: "Local Delivery" },
        { name: "Export" },
        { name: "Transfer" },
        { name: "Return" },
        { name: "Express Delivery" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Exit options created");

    // Labels
    console.log("Creating labels...");
    await prisma.label.createMany({
      data: [
        { name: "Urgent" },
        { name: "Fragile" },
        { name: "Cold Chain" },
        { name: "Hazardous" },
        { name: "Standard" },
        { name: "Heavy" },
        { name: "Priority" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Labels created");

    // Roles
    console.log("Creating roles...");
    await prisma.role.createMany({
      data: [
        { name: "ADMIN" },
        { name: "WAREHOUSE" },
        { name: "CUSTOMER" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Roles created");

  } catch (error) {
    console.error("❌ Error in createBaseLookupTables:", error);
    throw error;
  }
}

async function createUsersAndOrganization() {
  try {
    console.log("Creating organisations...");
    
    // Create organisations
    const organisations = [
      {
        name: "TSLogix Corporation",
        address: { street: "123 Main St", city: "Lima", zip: "15001" },
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
    
    console.log("Creating users...");
    const activeStates = await prisma.activeState.findMany();
    const roles = await prisma.role.findMany();
    
    const customerRole = roles.find(r => r.name === "CUSTOMER").role_id;
    const warehouseRole = roles.find(r => r.name === "WAREHOUSE").role_id;
    const adminRole = roles.find(r => r.name === "ADMIN").role_id;
    const activeState = activeStates.find(s => s.name === "Active").state_id;
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
    console.log("✅ Seed users created");
    
    return { seedUsers, createdOrgs, roles };
  } catch (error) {
    console.error("❌ Error creating users and organizations:", error);
    throw error;
  }
}

async function createSuppliersAndCustomers() {
  try {
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
    
    await prisma.supplier.createMany({ data: suppliers, skipDuplicates: true });
    console.log("✅ Suppliers created");
    
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
    
    await prisma.customer.createMany({ data: customers, skipDuplicates: true });
    console.log("✅ Customers created");
  } catch (error) {
    console.error("❌ Error creating suppliers and customers:", error);
    throw error;
  }
}

async function createProducts() {
  try {
    console.log("Creating products...");
    
    const productLines = await prisma.productLine.findMany();
    const groupNames = await prisma.groupName.findMany();
    const temperatureRanges = await prisma.temperatureRange.findMany();
    const activeStates = await prisma.activeState.findMany();
    
    const products = [];
    for (let i = 0; i < COUNT.PRODUCTS; i++) {
      products.push({
        product_code: `PRD-${faker.string.alphanumeric(8).toUpperCase()}`,
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
    
    await prisma.product.createMany({ data: products, skipDuplicates: true });
    console.log("✅ Products created");
  } catch (error) {
    console.error("❌ Error creating products:", error);
    throw error;
  }
}

async function createWarehousesAndCells() {
  try {
    console.log("Creating warehouses and cells...");

    // Create warehouses
    const warehouses = await prisma.warehouse.createMany({
      data: [
        {
          name: "Main Warehouse",
          location: "Lima, Peru",
          capacity: 10000,
          max_occupancy: 8000,
          status: "ACTIVE",
        },
        {
          name: "Cold Storage",
          location: "Callao, Peru", 
          capacity: 5000,
          max_occupancy: 4000,
          status: "ACTIVE",
        },
        {
          name: "Distribution Center",
          location: "Arequipa, Peru",
          capacity: 7500,
          max_occupancy: 6000,
          status: "ACTIVE",
        },
      ],
      skipDuplicates: true,
    });

    // Get warehouse IDs for cell creation
    const warehouseList = await prisma.warehouse.findMany();
    
    // Create cells for each warehouse
    const allCells = [];
    
    for (const warehouse of warehouseList) {
      // Create standard cells
      for (let row of ['A', 'B', 'C', 'D', 'E']) {
        for (let bay = 1; bay <= 20; bay++) {
          for (let position = 1; position <= 5; position++) {
            allCells.push({
              warehouse_id: warehouse.warehouse_id,
              row: row,
              bay: bay,
              position: position,
              kind: "NORMAL",
              status: "AVAILABLE",
              cell_role: "STANDARD",
              capacity: 100.00,
              currentUsage: 0.00,
              current_packaging_qty: 0,
              current_weight: 0.00,
            });
          }
        }
      }
      
      // Create damaged goods cells
      for (let bay = 1; bay <= 5; bay++) {
        for (let position = 1; position <= 3; position++) {
          allCells.push({
            warehouse_id: warehouse.warehouse_id,
            row: 'D',
            bay: bay,
            position: position,
            kind: "DAMAGED",
            status: "AVAILABLE",
            cell_role: "DAMAGED",
            capacity: 50.00,
            currentUsage: 0.00,
            current_packaging_qty: 0,
            current_weight: 0.00,
          });
        }
      }
    }

    await prisma.warehouseCell.createMany({
      data: allCells,
      skipDuplicates: true,
    });

    console.log("✅ Warehouses and cells created");
  } catch (error) {
    console.error("❌ Error creating warehouses and cells:", error);
    throw error;
  }
}

async function createEntryOrdersWithProducts() {
  try {
    console.log("🌱 Creating entry orders with products...");
    
    // Get required data
    const customerUsers = await prisma.user.findMany({
      where: { role: { name: "CUSTOMER" } },
    });
    const adminUsers = await prisma.user.findMany({
      where: { role: { name: "ADMIN" } },
    });
    const suppliers = await prisma.supplier.findMany();
    const origins = await prisma.origin.findMany();
    const documentTypes = await prisma.documentType.findMany();
    const products = await prisma.product.findMany();
    const warehouses = await prisma.warehouse.findMany();
    
    const entryOrders = [];
    
    for (let i = 0; i < COUNT.ENTRY_ORDERS; i++) {
      const customerUser = faker.helpers.arrayElement(customerUsers);
      const warehouse = faker.helpers.arrayElement(warehouses);
      
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
          entry_order_no: `ENTRY-${faker.string.numeric(5)}`,
          origin_id: faker.helpers.arrayElement(origins).origin_id,
          document_type_id: faker.helpers.arrayElement(documentTypes).document_type_id,
          registration_date: new Date(),
          document_date: faker.date.past({ years: 1 }),
          entry_date_time: faker.date.future({ days: 7 }),
          created_by: customerUser.id,
          order_status: faker.helpers.arrayElement(Object.values(OrderStatusEntry)),
          total_volume: parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
          total_weight: parseFloat(faker.commerce.price({ min: 500, max: 5000 })),
          cif_value: parseFloat(faker.commerce.price({ min: 10000, max: 100000 })),
          total_pallets: faker.number.int({ min: 5, max: 20 }),
          observation: faker.lorem.paragraph(),
          uploaded_documents: {
            documents: [
              { name: "invoice.pdf", url: "/documents/invoice.pdf" },
              { name: "packing_list.pdf", url: "/documents/packing_list.pdf" }
            ]
          },
          warehouse_id: warehouse.warehouse_id,
          review_status: faker.helpers.arrayElement([ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED]),
          review_comments: faker.lorem.sentence(),
          reviewed_by: faker.helpers.maybe(() => faker.helpers.arrayElement(adminUsers).id),
          reviewed_at: faker.helpers.maybe(() => faker.date.recent({ days: 30 })),
        },
      });
      
      entryOrders.push(entryOrder);
      
      // Create multiple products for this entry order (2-5 products per order)
      const numberOfProducts = faker.number.int({ min: 2, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(products, numberOfProducts);
      
      for (const product of selectedProducts) {
        const inventoryQuantity = faker.number.int({ min: 50, max: 500 });
        const packageQuantity = faker.number.int({ min: 10, max: 100 });
        const weightKg = parseFloat(faker.commerce.price({ min: 10, max: 500 }));
        const volumeM3 = parseFloat(faker.commerce.price({ min: 1, max: 50 }));
        
        // Create EntryOrderProduct with new schema fields
        await prisma.entryOrderProduct.create({
          data: {
            entry_order_id: entryOrder.entry_order_id,
            serial_number: `SN-${faker.string.alphanumeric(10)}`,
            supplier_id: faker.helpers.arrayElement(suppliers).supplier_id,
            product_code: product.product_code,
            product_id: product.product_id,
            lot_series: `LOT-${faker.string.alphanumeric(8)}`,
            manufacturing_date: faker.date.past({ years: 1 }),
            expiration_date: faker.date.future({ years: 2 }),
            inventory_quantity: inventoryQuantity,
            package_quantity: packageQuantity,
            quantity_pallets: Math.ceil(packageQuantity / 20),
            presentation: faker.helpers.arrayElement(Object.values(PresentationType)),
            guide_number: `GN-${faker.string.numeric(8)}`,
            weight_kg: weightKg,
            volume_m3: volumeM3,
            insured_value: parseFloat(faker.commerce.price({ min: 1000, max: 50000 })),
            temperature_range: faker.helpers.arrayElement(Object.values(TemperatureRangeType)),
            humidity: `${faker.number.int({ min: 30, max: 80 })}%`,
            health_registration: `HR-${faker.string.alphanumeric(10)}`,
          },
        });
      }
    }
    
    console.log("✅ Entry orders with products created");
    return entryOrders;
  } catch (error) {
    console.error("❌ Error creating entry orders:", error);
    throw error;
  }
}

async function createInventoryAllocations() {
  try {
    console.log("🌱 Creating inventory allocations...");
    
    // Get approved entry orders
    const approvedEntryOrders = await prisma.entryOrder.findMany({
      where: { review_status: ReviewStatus.APPROVED },
      include: { products: { include: { product: true } } },
    });
    
    if (approvedEntryOrders.length === 0) {
      console.log("⚠️ No approved entry orders to create allocations");
      return;
    }
    
    const warehouseUsers = await prisma.user.findMany({
      where: { role: { name: "WAREHOUSE" } },
    });
    
    const availableCells = await prisma.warehouseCell.findMany({
      where: { status: CellStatus.AVAILABLE },
      orderBy: [{ row: 'asc' }, { bay: 'asc' }, { position: 'asc' }],
    });
    
    for (const entryOrder of approvedEntryOrders.slice(0, 15)) { // Limit to avoid too many allocations
      const warehouseUser = faker.helpers.arrayElement(warehouseUsers);
      
      for (const entryProduct of entryOrder.products) {
        if (availableCells.length === 0) break;
        
        const cell = availableCells.shift(); // Take next available cell
        const product = entryProduct.product;
        
        // Create allocation with partial quantities (warehouse decides how much to allocate)
        const allocatedQuantity = Math.floor(entryProduct.inventory_quantity * faker.number.float({ min: 0.7, max: 1.0 }));
        const allocatedPackages = Math.floor(entryProduct.package_quantity * faker.number.float({ min: 0.7, max: 1.0 }));
        const allocatedWeight = entryProduct.weight_kg * (allocatedQuantity / entryProduct.inventory_quantity);
        const allocatedVolume = entryProduct.volume_m3 ? entryProduct.volume_m3 * (allocatedQuantity / entryProduct.inventory_quantity) : null;
        
        const productStatus = faker.helpers.arrayElement(Object.values(ProductStatus));
        const statusCode = getStatusCodeFromEnum(productStatus);
        
        // Create inventory allocation
        const allocation = await prisma.inventoryAllocation.create({
          data: {
            entry_order_id: entryOrder.entry_order_id,
            entry_order_product_id: entryProduct.entry_order_product_id,
            inventory_quantity: allocatedQuantity,
            package_quantity: allocatedPackages,
            quantity_pallets: Math.ceil(allocatedPackages / 20),
            presentation: faker.helpers.arrayElement(Object.values(PresentationType)),
            weight_kg: allocatedWeight,
            volume_m3: allocatedVolume,
            cell_id: cell.id,
            product_status: productStatus,
            status_code: statusCode,
            guide_number: `AG-${faker.string.numeric(8)}`,
            uploaded_documents: {
              documents: [
                { name: "allocation_doc.pdf", url: "/documents/allocation_doc.pdf" }
              ]
            },
            observations: faker.lorem.sentence(),
            allocated_by: warehouseUser.id,
          },
        });
        
        // Create inventory record
        await prisma.inventory.create({
          data: {
            allocation_id: allocation.allocation_id,
            product_id: product.product_id,
            cell_id: cell.id,
            warehouse_id: entryOrder.warehouse_id,
            current_quantity: allocatedQuantity,
            current_package_quantity: allocatedPackages,
            current_weight: allocatedWeight,
            current_volume: allocatedVolume,
            status: InventoryStatus.AVAILABLE,
            product_status: productStatus,
            status_code: statusCode,
          },
        });
        
        // Update cell status
        await prisma.warehouseCell.update({
          where: { id: cell.id },
          data: {
            status: CellStatus.OCCUPIED,
            currentUsage: 1,
            current_packaging_qty: allocatedPackages,
            current_weight: allocatedWeight,
          },
        });
        
        // Create inventory log
        await prisma.inventoryLog.create({
          data: {
            user_id: warehouseUser.id,
            product_id: product.product_id,
            movement_type: MovementType.ENTRY,
            quantity_change: allocatedQuantity,
            package_change: allocatedPackages,
            weight_change: allocatedWeight,
            volume_change: allocatedVolume,
            entry_order_id: entryOrder.entry_order_id,
            entry_order_product_id: entryProduct.entry_order_product_id,
            allocation_id: allocation.allocation_id,
            warehouse_id: entryOrder.warehouse_id,
            cell_id: cell.id,
            product_status: productStatus,
            status_code: statusCode,
            notes: `Entry allocation: ${allocatedQuantity} units allocated to cell ${cell.row}.${cell.bay}.${cell.position}`,
          },
        });
      }
    }
    
    console.log("✅ Inventory allocations created");
  } catch (error) {
    console.error("❌ Error creating inventory allocations:", error);
    throw error;
  }
}

async function createDepartureOrdersWithProducts() {
  try {
    console.log("🌱 Creating departure orders with products...");
    
    const customerUsers = await prisma.user.findMany({
      where: { role: { name: "CUSTOMER" } },
    });
    const warehouseUsers = await prisma.user.findMany({
      where: { role: { name: "WAREHOUSE" } },
    });
    const customers = await prisma.customer.findMany();
    const labels = await prisma.label.findMany();
    const exitOptions = await prisma.exitOption.findMany();
    const departureDocTypes = await prisma.departureDocumentType.findMany();
    
    // Get available inventory
    const availableInventory = await prisma.inventory.findMany({
      where: {
        status: InventoryStatus.AVAILABLE,
        current_quantity: { gt: 0 },
      },
      include: {
        product: true,
        allocation: {
          include: {
            entry_order_product: {
              include: { product: true }
            }
          }
        },
        warehouse: true,
        cell: true,
      },
    });
    
    if (availableInventory.length === 0) {
      console.log("⚠️ No available inventory for departure orders");
      return [];
    }
    
    // Group inventory by product
    const inventoryByProduct = {};
    availableInventory.forEach(inv => {
      if (!inventoryByProduct[inv.product_id]) {
        inventoryByProduct[inv.product_id] = [];
      }
      inventoryByProduct[inv.product_id].push(inv);
    });
    
    const productIds = Object.keys(inventoryByProduct);
    
    for (let i = 0; i < Math.min(COUNT.DEPARTURE_ORDERS, productIds.length); i++) {
      const customerUser = faker.helpers.arrayElement(customerUsers);
      const customer = faker.helpers.arrayElement(customers);
      
      // Create base order
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
          departure_order_no: `DEP-${faker.string.numeric(5)}`,
          customer_id: customer.customer_id,
          document_type_id: faker.helpers.maybe(() => faker.helpers.arrayElement(departureDocTypes).document_type_id),
          registration_date: new Date(),
          document_date: faker.date.recent({ days: 7 }),
          departure_date_time: faker.date.future({ days: 5 }),
          created_by: customerUser.id,
          order_status: faker.helpers.arrayElement(Object.values(OrderStatusDeparture)),
          destination_point: `${faker.location.city()}, ${faker.location.country()}`,
          transport_type: faker.helpers.arrayElement(["Truck", "Ship", "Air", "Rail"]),
          carrier_name: faker.company.name(),
          total_volume: parseFloat(faker.commerce.price({ min: 50, max: 500 })),
          total_weight: parseFloat(faker.commerce.price({ min: 200, max: 2000 })),
          total_value: parseFloat(faker.commerce.price({ min: 5000, max: 50000 })),
          total_pallets: faker.number.int({ min: 2, max: 10 }),
          observation: faker.lorem.paragraph(),
          uploaded_documents: {
            documents: [
              { name: "departure_invoice.pdf", url: "/documents/departure_invoice.pdf" }
            ]
          },
          warehouse_id: availableInventory[0].warehouse_id,
          label_id: faker.helpers.maybe(() => faker.helpers.arrayElement(labels).label_id),
          exit_option_id: faker.helpers.maybe(() => faker.helpers.arrayElement(exitOptions).exit_option_id),
          review_status: faker.helpers.arrayElement([ReviewStatus.PENDING, ReviewStatus.APPROVED]),
        },
      });
      
      // Create departure products (2-4 products per departure)
      const numberOfProducts = faker.number.int({ min: 2, max: 4 });
      const selectedProductIds = faker.helpers.arrayElements(productIds, numberOfProducts);
      
      for (const productId of selectedProductIds) {
        const productInventory = inventoryByProduct[productId];
        const firstInventory = productInventory[0];
        const product = firstInventory.product;
        
        // Calculate totals available for this product
        const totalAvailable = productInventory.reduce((sum, inv) => sum + inv.current_quantity, 0);
        const totalWeight = productInventory.reduce((sum, inv) => sum + parseFloat(inv.current_weight), 0);
        const totalVolume = productInventory.reduce((sum, inv) => sum + parseFloat(inv.current_volume || 0), 0);
        
        // Request partial quantity
        const requestedQuantity = faker.number.int({ min: 1, max: Math.floor(totalAvailable * 0.8) });
        const requestedWeight = (requestedQuantity / totalAvailable) * totalWeight;
        const requestedVolume = (requestedQuantity / totalAvailable) * totalVolume;
        
        // Create departure order product
        await prisma.departureOrderProduct.create({
          data: {
            departure_order_id: departureOrder.departure_order_id,
            product_code: product.product_code,
            product_id: productId,
            lot_series: firstInventory.allocation?.entry_order_product?.lot_series,
            requested_quantity: requestedQuantity,
            requested_packages: Math.ceil(requestedQuantity / 10),
            requested_pallets: Math.ceil(requestedQuantity / 200),
            presentation: faker.helpers.arrayElement(Object.values(PresentationType)),
            requested_weight: requestedWeight,
            requested_volume: requestedVolume,
            unit_price: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
            total_value: parseFloat(faker.commerce.price({ min: 500, max: 5000 })),
            temperature_requirement: faker.helpers.arrayElement(Object.values(TemperatureRangeType)),
            special_handling: faker.helpers.maybe(() => faker.lorem.sentence()),
            delivery_instructions: faker.lorem.sentence(),
          },
        });
      }
    }
    
    console.log("✅ Departure orders with products created");
  } catch (error) {
    console.error("❌ Error creating departure orders:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Starting database seed for new entry/departure flow...");
    
    await createBaseLookupTables();
    await createUsersAndOrganization();
    await createSuppliersAndCustomers(); 
    await createProducts();
    await createWarehousesAndCells();
    await createEntryOrdersWithProducts();
    await createInventoryAllocations();
    await createDepartureOrdersWithProducts();
    
    console.log("🎉 Database seeded successfully with new flow!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();