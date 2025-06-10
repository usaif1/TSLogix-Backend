const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeEntryOrderBreakdown() {
  console.log('🔍 Analyzing entry order product allocation breakdown...\n');

  try {
    // Look at the entry order product for OI202503
    const entryOrderProduct = await prisma.entryOrderProduct.findFirst({
      where: {
        entry_order: {
          entry_order_no: 'OI202503'
        }
      },
      include: {
        entry_order: true,
        product: true,
        supplier: true,
        inventoryAllocations: {
          include: {
            inventory: true,
            cell: true
          }
        }
      }
    });

    if (!entryOrderProduct) {
      console.log('❌ Entry order product not found for OI202503');
      return;
    }

    console.log('📦 Entry Order Product Details:');
    console.log('   Entry Order:', entryOrderProduct.entry_order.entry_order_no);
    console.log('   Product Code:', entryOrderProduct.product_code);
    console.log('   Product Name:', entryOrderProduct.product.name);
    console.log('   Total Inventory Quantity:', entryOrderProduct.inventory_quantity);
    console.log('   Total Package Quantity:', entryOrderProduct.package_quantity);
    console.log('   Total Weight:', entryOrderProduct.weight_kg, 'kg');
    console.log('   Manufacturing Date:', entryOrderProduct.manufacturing_date);
    console.log('   Expiration Date:', entryOrderProduct.expiration_date);
    console.log('   Guide Number:', entryOrderProduct.guide_number);

    console.log('\n📋 All Allocations for this Entry Order Product:');
    let totalAllocatedQty = 0;
    let totalAllocatedPkg = 0;
    let totalAllocatedWeight = 0;
    
    entryOrderProduct.inventoryAllocations.forEach((allocation, index) => {
      console.log(`\n   Allocation ${index + 1}:`);
      console.log('     ID:', allocation.allocation_id);
      console.log('     Quality Status:', allocation.quality_status);
      console.log('     Inventory Quantity:', allocation.inventory_quantity);
      console.log('     Package Quantity:', allocation.package_quantity);
      console.log('     Weight:', allocation.weight_kg, 'kg');
      console.log('     Cell:', `${allocation.cell.row}.${allocation.cell.bay}.${allocation.cell.position}`);
      console.log('     Status:', allocation.status);
      console.log('     Created:', allocation.allocated_at);
      console.log('     Last Modified:', allocation.last_modified_at);
      console.log('     Guide Number:', allocation.guide_number);

      totalAllocatedQty += allocation.inventory_quantity;
      totalAllocatedPkg += allocation.package_quantity;
      totalAllocatedWeight += parseFloat(allocation.weight_kg);

      if (allocation.inventory.length > 0) {
        allocation.inventory.forEach((inv, invIndex) => {
          console.log(`     Inventory ${invIndex + 1}:`);
          console.log('       Current Quantity:', inv.current_quantity);
          console.log('       Current Packages:', inv.current_package_quantity);
          console.log('       Current Weight:', inv.current_weight);
          console.log('       Quality Status:', inv.quality_status);
          console.log('       Status:', inv.status);
        });
      }
    });

    console.log('\n📊 Summary:');
    console.log('   Entry Order Product Total:', entryOrderProduct.inventory_quantity, 'units');
    console.log('   Total Allocated Across All Allocations:', totalAllocatedQty, 'units');
    console.log('   Remaining Unallocated:', entryOrderProduct.inventory_quantity - totalAllocatedQty, 'units');
    
    if (totalAllocatedQty > entryOrderProduct.inventory_quantity) {
      console.log('   ⚠️  WARNING: Over-allocated!');
    } else if (totalAllocatedQty < entryOrderProduct.inventory_quantity) {
      console.log('   ℹ️  Note: Some quantities remain unallocated');
    } else {
      console.log('   ✅ Fully allocated');
    }

    console.log('\n🔍 Quality Status Breakdown:');
    const statusBreakdown = {};
    entryOrderProduct.inventoryAllocations.forEach(allocation => {
      if (!statusBreakdown[allocation.quality_status]) {
        statusBreakdown[allocation.quality_status] = { qty: 0, pkg: 0, weight: 0, count: 0 };
      }
      statusBreakdown[allocation.quality_status].qty += allocation.inventory_quantity;
      statusBreakdown[allocation.quality_status].pkg += allocation.package_quantity;
      statusBreakdown[allocation.quality_status].weight += parseFloat(allocation.weight_kg);
      statusBreakdown[allocation.quality_status].count += 1;
    });

    Object.entries(statusBreakdown).forEach(([status, data]) => {
      console.log(`   ${status}: ${data.qty} units (${data.pkg} packages, ${data.weight} kg) across ${data.count} allocation(s)`);
    });

    // Check for specific allocation in question
    console.log('\n🎯 Focusing on allocation 5a9f7bb6-a0c4-4e80-a339-8f058fd4e36e:');
    const targetAllocation = entryOrderProduct.inventoryAllocations.find(
      alloc => alloc.allocation_id === '5a9f7bb6-a0c4-4e80-a339-8f058fd4e36e'
    );

    if (targetAllocation) {
      console.log('   This allocation was created with:', targetAllocation.inventory_quantity, 'units initially');
      console.log('   Current quantity:', targetAllocation.inventory_quantity, 'units');
      console.log('   Current status:', targetAllocation.quality_status);
      console.log('   Guide number:', targetAllocation.guide_number);
      console.log('   Observations:', targetAllocation.observations);
      
      // Check quality control transitions for this allocation
      const transitions = await prisma.qualityControlTransition.findMany({
        where: { allocation_id: targetAllocation.allocation_id },
        orderBy: { performed_at: 'asc' }
      });

      console.log(`\n   Quality transitions for this allocation (${transitions.length}):`);
      transitions.forEach((transition, index) => {
        console.log(`     Transition ${index + 1}:`);
        console.log('       From:', transition.from_status, 'To:', transition.to_status);
        console.log('       Quantity moved:', transition.quantity_moved);
        console.log('       When:', transition.performed_at);
        console.log('       Reason:', transition.reason);
      });
    } else {
      console.log('   ❌ Target allocation not found in this entry order product');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeEntryOrderBreakdown(); 