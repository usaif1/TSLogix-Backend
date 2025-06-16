const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testSupplierFiltering() {
  try {
    console.log("🔍 Testing supplier filtering for client1 user...\n");
    
    // 1. Find client1 user
    const client1User = await prisma.user.findUnique({
      where: { user_id: "client1" },
      include: {
        role: true,
        clientUserAccount: {
          include: {
            supplierAssignments: {
              where: { is_active: true },
              include: {
                supplier: {
                  select: {
                    supplier_id: true,
                    company_name: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!client1User) {
      console.log("❌ client1 user not found");
      return;
    }
    
    console.log("👤 Client1 User Details:");
    console.log(`   • User ID: ${client1User.user_id}`);
    console.log(`   • Internal ID: ${client1User.id}`);
    console.log(`   • Role: ${client1User.role?.name}`);
    console.log(`   • Email: ${client1User.email}`);
    console.log(`   • Has Client Account: ${!!client1User.clientUserAccount}`);
    
    if (client1User.clientUserAccount) {
      console.log(`   • Client ID: ${client1User.clientUserAccount.client_id}`);
      console.log(`   • Supplier Assignments: ${client1User.clientUserAccount.supplierAssignments.length}`);
      
      if (client1User.clientUserAccount.supplierAssignments.length > 0) {
        console.log("\n📋 Assigned Suppliers:");
        client1User.clientUserAccount.supplierAssignments.forEach((assignment, index) => {
          console.log(`   ${index + 1}. ${assignment.supplier.company_name || assignment.supplier.name} (${assignment.supplier.supplier_id})`);
        });
      }
    }
    
    // 2. Test the filtering logic manually
    console.log("\n🧪 Testing filtering logic...");
    
    const userRole = client1User.role?.name;
    const userId = client1User.id;
    
    let whereClause = {};
    
    if (userRole === "CLIENT" && userId) {
      if (client1User?.clientUserAccount?.supplierAssignments?.length > 0) {
        whereClause.clientAssignments = {
          some: {
            client_id: client1User.clientUserAccount.client_id,
            is_active: true
          }
        };
        console.log("✅ Applied CLIENT filtering - should show assigned suppliers only");
      } else {
        console.log("⚠️ CLIENT has no supplier assignments - should return empty array");
        return [];
      }
    }
    
    console.log("🔍 Where clause:", JSON.stringify(whereClause, null, 2));
    
    // 3. Execute the query with filtering
    const filteredSuppliers = await prisma.supplier.findMany({
      where: whereClause,
      include: {
        country: {
          select: {
            country_id: true,
            name: true,
          },
        },
        clientAssignments: {
          where: { is_active: true },
          include: {
            client: {
              select: {
                client_id: true,
                company_name: true,
                first_names: true,
                last_name: true,
                client_type: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: "desc",
      },
    });
    
    console.log(`\n📊 Filtered Results: ${filteredSuppliers.length} suppliers`);
    
    if (filteredSuppliers.length > 0) {
      console.log("\n📋 Filtered Suppliers:");
      filteredSuppliers.forEach((supplier, index) => {
        console.log(`   ${index + 1}. ${supplier.company_name || supplier.name} (${supplier.supplier_id})`);
        console.log(`      • Client Assignments: ${supplier.clientAssignments.length}`);
      });
    }
    
    // 4. Compare with unfiltered results
    const allSuppliers = await prisma.supplier.findMany({
      select: { supplier_id: true, company_name: true, name: true }
    });
    
    console.log(`\n📈 Comparison:`);
    console.log(`   • Total suppliers in database: ${allSuppliers.length}`);
    console.log(`   • Suppliers visible to client1: ${filteredSuppliers.length}`);
    console.log(`   • Filtering working: ${filteredSuppliers.length < allSuppliers.length ? '✅ YES' : '❌ NO'}`);
    
    // 5. Check if there are any supplier assignments at all
    const totalAssignments = await prisma.clientSupplierAssignment.count({
      where: { is_active: true }
    });
    
    console.log(`\n🔗 Assignment Statistics:`);
    console.log(`   • Total active supplier assignments: ${totalAssignments}`);
    
    const client1Assignments = await prisma.clientSupplierAssignment.count({
      where: { 
        client_id: client1User.clientUserAccount?.client_id,
        is_active: true 
      }
    });
    
    console.log(`   • Client1 supplier assignments: ${client1Assignments}`);
    
  } catch (error) {
    console.error("❌ Error testing supplier filtering:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupplierFiltering(); 