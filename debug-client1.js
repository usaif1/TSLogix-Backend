const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function debugClient1() {
  try {
    console.log("🔍 Debugging client1 user and supplier assignments...\n");
    
    // 1. Check if client1 user exists
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
    
    console.log("👤 Client1 User Found:");
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
          console.log(`   ${index + 1}. ${assignment.supplier.company_name || assignment.supplier.name}`);
        });
      }
    } else {
      console.log("⚠️ No client account found for client1 user");
    }
    
    // 2. Check total suppliers and assignments
    const totalSuppliers = await prisma.supplier.count();
    const totalAssignments = await prisma.clientSupplierAssignment.count({
      where: { is_active: true }
    });
    
    console.log(`\n📊 Database Stats:`);
    console.log(`   • Total suppliers: ${totalSuppliers}`);
    console.log(`   • Total active assignments: ${totalAssignments}`);
    
    // 3. Test the filtering logic
    if (client1User.clientUserAccount?.supplierAssignments?.length > 0) {
      const whereClause = {
        clientAssignments: {
          some: {
            client_id: client1User.clientUserAccount.client_id,
            is_active: true
          }
        }
      };
      
      const filteredSuppliers = await prisma.supplier.findMany({
        where: whereClause,
        select: {
          supplier_id: true,
          company_name: true,
          name: true
        }
      });
      
      console.log(`\n🔍 Filtering Test:`);
      console.log(`   • Filtered suppliers: ${filteredSuppliers.length}`);
      console.log(`   • Should match assignments: ${client1User.clientUserAccount.supplierAssignments.length}`);
      console.log(`   • Filtering working: ${filteredSuppliers.length === client1User.clientUserAccount.supplierAssignments.length ? '✅ YES' : '❌ NO'}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClient1(); 