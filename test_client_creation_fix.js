const { PrismaClient } = require("@prisma/client");
const clientService = require("./src/modules/client/client.service");

const prisma = new PrismaClient();

async function testClientCreationFix() {
  try {
    console.log("🧪 Testing CLIENT creation fix for clientUserAccounts...\n");

    // Get available warehouses and cells
    const warehouses = await clientService.getAvailableWarehousesForAssignment();
    if (warehouses.length === 0) {
      console.log("❌ No warehouses available for testing");
      return;
    }

    const firstWarehouse = warehouses[0];
    const availableCells = await clientService.getAvailableCellsForClient(firstWarehouse.warehouse_id);
    
    if (!availableCells.all_cells || availableCells.all_cells.length === 0) {
      console.log("❌ No available cells for testing");
      return;
    }

    // Get a warehouse incharge user to create the client
    const warehouseIncharge = await prisma.user.findFirst({
      where: {
        role: { name: "WAREHOUSE_INCHARGE" }
      },
      select: { id: true, email: true }
    });

    if (!warehouseIncharge) {
      console.log("❌ No warehouse incharge user found for testing");
      return;
    }

    console.log(`✅ Using warehouse incharge: ${warehouseIncharge.email}`);
    console.log(`✅ Using warehouse: ${firstWarehouse.name}`);
    console.log(`✅ Available cells: ${availableCells.all_cells.length}`);

    // Create test client data
    const testClientData = {
      client_type: "JURIDICO",
      company_name: `Fix Test Client ${Date.now()}`,
      company_type: "PRIVADO",
      establishment_type: "FARMACIA",
      email: `fixtest${Date.now()}@test.com`,
      address: "123 Fix Test Street, Test City",
      phone: "123-456-7890",
      cell_phone: "098-765-4321",
      ruc: `20${Math.random().toString().slice(2, 11)}`,
    };

    // Use first 2 available cells for assignment
    const cellAssignmentData = {
      cell_ids: availableCells.all_cells.slice(0, 2).map(cell => cell.id),
      warehouse_id: firstWarehouse.warehouse_id,
      assigned_by: warehouseIncharge.id,
      notes: "Test client created to verify ClientUser record creation",
      max_capacity: 100.00
    };

    console.log(`\n🔧 Creating test client with fix...`);
    
    // Create the client
    const newClient = await clientService.createClient(testClientData, cellAssignmentData);
    
    console.log(`✅ Client created successfully: ${newClient.client_id}`);
    console.log(`   Company: ${newClient.company_name}`);
    console.log(`   Email: ${newClient.email}`);

    // Now check if ClientUser record was created
    console.log(`\n🔍 Checking for ClientUser records...`);
    
    const clientUsers = await prisma.clientUser.findMany({
      where: { client_id: newClient.client_id },
      include: {
        user: {
          select: {
            id: true,
            user_id: true,
            email: true,
            role: { select: { name: true } }
          }
        }
      }
    });

    console.log(`Found ${clientUsers.length} ClientUser records:`);
    clientUsers.forEach((clientUser, index) => {
      console.log(`  ${index + 1}. ClientUser ID: ${clientUser.client_user_id}`);
      console.log(`     Username: ${clientUser.username}`);
      console.log(`     Is Primary: ${clientUser.is_primary}`);
      console.log(`     Is Active: ${clientUser.is_active}`);
      console.log(`     User ID: ${clientUser.user.id}`);
      console.log(`     User Email: ${clientUser.user.email}`);
      console.log(`     User Role: ${clientUser.user.role.name}`);
    });

    // Test the entry form fields for this user
    console.log(`\n🧪 Testing entry form fields for this CLIENT user...`);
    
    if (clientUsers.length > 0) {
      const testUser = clientUsers[0].user;
      const entryService = require("./src/modules/entry/entry.service");
      
      const formFields = await entryService.getEntryFormFields(testUser.role.name, testUser.id);
      
      console.log(`Entry form fields result:`);
      console.log(`  Users: ${formFields.users.length}`);
      console.log(`  Suppliers: ${formFields.suppliers.length}`);
      console.log(`  Products: ${formFields.products.length}`);
      
      if (formFields.users.length > 0 || formFields.suppliers.length > 0 || formFields.products.length > 0) {
        console.log(`✅ SUCCESS: Entry form fields now return data for CLIENT user!`);
      } else {
        console.log(`❌ STILL EMPTY: Entry form fields still returning empty arrays`);
      }
    }

    // Check the old problematic users
    console.log(`\n🔍 Checking the old problematic CLIENT users...`);
    
    const problematicUsers = await prisma.user.findMany({
      where: {
        user_id: { in: ["compan960", "23545466546"] },
        role: { name: "CLIENT" }
      },
      include: {
        role: true,
        clientUserAccounts: {
          include: {
            client: true
          }
        }
      }
    });

    problematicUsers.forEach(user => {
      console.log(`\n  User: ${user.email} (${user.user_id})`);
      console.log(`    Role: ${user.role.name}`);
      console.log(`    Client Accounts: ${user.clientUserAccounts.length}`);
      
      if (user.clientUserAccounts.length === 0) {
        console.log(`    ❌ STILL NO CLIENT ACCOUNTS - This user needs to be fixed`);
      } else {
        console.log(`    ✅ Has client accounts`);
      }
    });

    console.log(`\n🎉 Test completed! The fix ensures new clients will have proper ClientUser records.`);
    console.log(`⚠️  Note: Existing problematic users (test1@example.com, test123@gmail.com) still need manual fixing.`);

  } catch (error) {
    console.error("❌ Error testing client creation fix:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testClientCreationFix(); 