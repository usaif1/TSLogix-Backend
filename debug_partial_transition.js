const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPartialTransition() {
  console.log('🔍 Debugging partial transition for OI202503...\n');

  try {
    // Find the allocation that was partially transitioned
    const allocationId = '5a9f7bb6-a0c4-4e80-a339-8f058fd4e36e';
    
    console.log('1. Checking original allocation status...');
    const originalAllocation = await prisma.inventoryAllocation.findUnique({
      where: { allocation_id: allocationId },
      include: {
        entry_order_product: {
          include: {
            product: true,
            entry_order: true
          }
        },
        inventory: true,
        cell: true
      }
    });

    if (originalAllocation) {
      console.log('✅ Original allocation found:');
      console.log('   Entry Order:', originalAllocation.entry_order_product.entry_order.entry_order_no);
      console.log('   Quality Status:', originalAllocation.quality_status);
      console.log('   Inventory Quantity:', originalAllocation.inventory_quantity);
      console.log('   Package Quantity:', originalAllocation.package_quantity);
      console.log('   Weight:', originalAllocation.weight_kg);
      console.log('   Status:', originalAllocation.status);
      console.log('   Last Modified:', originalAllocation.last_modified_at);
      console.log('   Observations:', originalAllocation.observations);
      
      if (originalAllocation.inventory.length > 0) {
        console.log('   Inventory Record:');
        console.log('     Current Quantity:', originalAllocation.inventory[0].current_quantity);
        console.log('     Current Packages:', originalAllocation.inventory[0].current_package_quantity);
        console.log('     Current Weight:', originalAllocation.inventory[0].current_weight);
        console.log('     Quality Status:', originalAllocation.inventory[0].quality_status);
        console.log('     Status:', originalAllocation.inventory[0].status);
      }
    } else {
      console.log('❌ Original allocation not found!');
    }

    console.log('\n2. Looking for any related allocations (splits)...');
    const relatedAllocations = await prisma.inventoryAllocation.findMany({
      where: {
        entry_order_product_id: originalAllocation?.entry_order_product_id
      },
      include: {
        entry_order_product: {
          include: {
            entry_order: true,
            product: true
          }
        },
        inventory: true,
        cell: true
      }
    });

    console.log(`Found ${relatedAllocations.length} allocations for this entry order product:`);
    relatedAllocations.forEach((alloc, index) => {
      console.log(`\nAllocation ${index + 1}:`);
      console.log('   ID:', alloc.allocation_id);
      console.log('   Quality Status:', alloc.quality_status);
      console.log('   Inventory Quantity:', alloc.inventory_quantity);
      console.log('   Package Quantity:', alloc.package_quantity);
      console.log('   Weight:', alloc.weight_kg);
      console.log('   Status:', alloc.status);
      console.log('   Cell:', `${alloc.cell.row}.${alloc.cell.bay}.${alloc.cell.position}`);
      console.log('   Created:', alloc.allocated_at);
      console.log('   Last Modified:', alloc.last_modified_at);
      console.log('   Observations:', alloc.observations);
      
      if (alloc.inventory.length > 0) {
        alloc.inventory.forEach((inv, invIndex) => {
          console.log(`   Inventory ${invIndex + 1}:`);
          console.log('     Current Quantity:', inv.current_quantity);
          console.log('     Current Packages:', inv.current_package_quantity);
          console.log('     Current Weight:', inv.current_weight);
          console.log('     Quality Status:', inv.quality_status);
          console.log('     Status:', inv.status);
        });
      }
    });

    console.log('\n3. Checking quality control transitions...');
    const transitions = await prisma.qualityControlTransition.findMany({
      where: {
        allocation_id: allocationId
      },
      include: {
        performer: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        performed_at: 'desc'
      }
    });

    console.log(`Found ${transitions.length} transitions for this allocation:`);
    transitions.forEach((transition, index) => {
      console.log(`\nTransition ${index + 1}:`);
      console.log('   From Status:', transition.from_status);
      console.log('   To Status:', transition.to_status);
      console.log('   Quantity Moved:', transition.quantity_moved);
      console.log('   Package Quantity Moved:', transition.package_quantity_moved);
      console.log('   Weight Moved:', transition.weight_moved);
      console.log('   Performed At:', transition.performed_at);
      console.log('   Performed By:', `${transition.performer.first_name} ${transition.performer.last_name}`);
      console.log('   Reason:', transition.reason);
      console.log('   Notes:', transition.notes);
    });

    console.log('\n4. Testing the API query logic...');
    // Simulate the exact query from getInventoryByQualityStatus
    const apiResult = await prisma.inventoryAllocation.findMany({
      where: {
        quality_status: 'CUARENTENA',
        status: 'ACTIVE',
        inventory_quantity: { gt: 0 },
        cell: {
          warehouse_id: '3601d881-687a-4bee-9ffb-06b3814683f9'
        }
      },
      include: {
        entry_order_product: {
          include: {
            entry_order: true,
            product: true
          }
        }
      }
    });

    console.log(`API query found ${apiResult.length} CUARENTENA allocations`);
    const matchingAllocation = apiResult.find(alloc => 
      alloc.entry_order_product.entry_order.entry_order_no === 'OI202503'
    );

    if (matchingAllocation) {
      console.log('✅ Found OI202503 in API results:');
      console.log('   Allocation ID:', matchingAllocation.allocation_id);
      console.log('   Quality Status:', matchingAllocation.quality_status);
      console.log('   Inventory Quantity:', matchingAllocation.inventory_quantity);
    } else {
      console.log('❌ OI202503 NOT found in API results');
    }

    console.log('\n5. Checking all allocations for entry order OI202503...');
    const allOI202503Allocations = await prisma.inventoryAllocation.findMany({
      where: {
        entry_order_product: {
          entry_order: {
            entry_order_no: 'OI202503'
          }
        }
      },
      include: {
        entry_order_product: {
          include: {
            entry_order: true,
            product: true
          }
        },
        inventory: true,
        cell: true
      }
    });

    console.log(`Found ${allOI202503Allocations.length} total allocations for OI202503:`);
    allOI202503Allocations.forEach((alloc, index) => {
      console.log(`\nOI202503 Allocation ${index + 1}:`);
      console.log('   ID:', alloc.allocation_id);
      console.log('   Quality Status:', alloc.quality_status);
      console.log('   Inventory Quantity:', alloc.inventory_quantity);
      console.log('   Status:', alloc.status);
      console.log('   Cell:', `${alloc.cell.row}.${alloc.cell.bay}.${alloc.cell.position}`);
      console.log('   Last Modified:', alloc.last_modified_at);
      console.log('   Observations:', alloc.observations?.substring(0, 100) + '...');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPartialTransition(); 