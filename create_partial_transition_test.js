const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPartialTransitionTest() {
  console.log('🧪 Creating proper partial transition test...\n');

  try {
    const targetWarehouseId = '3601d881-687a-4bee-9ffb-06b3814683f9';
    
    // Get warehouse user
    const warehouseUser = await prisma.user.findFirst({
      where: { role: { name: "WAREHOUSE" } }
    });

    // Find the entry order product for OI202503 that has unallocated quantities
    const entryOrderProduct = await prisma.entryOrderProduct.findFirst({
      where: {
        entry_order: {
          entry_order_no: 'OI202503'
        }
      },
      include: {
        entry_order: true,
        product: true
      }
    });

    if (!entryOrderProduct) {
      console.log('❌ Entry order product OI202503 not found');
      return;
    }

    // Get available cell in the target warehouse
    const availableCell = await prisma.warehouseCell.findFirst({
      where: { 
        warehouse_id: targetWarehouseId,
        status: 'AVAILABLE'
      }
    });

    if (!availableCell) {
      console.log('❌ No available cells found in warehouse');
      return;
    }

    console.log('📦 Creating large allocation for partial transition testing...');
    
    // Create a larger allocation (15 units - the remaining unallocated amount)
    const testQuantity = 15; // Use the remaining unallocated units
    const testPackages = 15;
    const testWeight = 15; // 1 kg per unit for simplicity

    // Create allocation
    const allocation = await prisma.inventoryAllocation.create({
      data: {
        entry_order_id: entryOrderProduct.entry_order_id,
        entry_order_product_id: entryOrderProduct.entry_order_product_id,
        inventory_quantity: testQuantity,
        package_quantity: testPackages,
        quantity_pallets: Math.ceil(testPackages / 20),
        presentation: 'CAJA',
        weight_kg: testWeight,
        volume_m3: testWeight * 0.05, // 5% of weight as volume
        cell_id: availableCell.id,
        product_status: 'CAJ_NORMAL',
        status_code: 31,
        quality_status: 'CUARENTENA',
        guide_number: `PARTIAL-TEST-${Date.now()}`,
        observations: `Large allocation for partial transition testing. Total: ${testQuantity} units.`,
        allocated_by: warehouseUser.id,
        status: 'ACTIVE'
      }
    });

    // Create inventory record
    await prisma.inventory.create({
      data: {
        allocation_id: allocation.allocation_id,
        product_id: entryOrderProduct.product_id,
        cell_id: availableCell.id,
        warehouse_id: targetWarehouseId,
        current_quantity: testQuantity,
        current_package_quantity: testPackages,
        current_weight: testWeight,
        current_volume: testWeight * 0.05,
        status: 'QUARANTINED',
        product_status: 'CAJ_NORMAL',
        status_code: 31,
        quality_status: 'CUARENTENA',
        created_by: warehouseUser.id
      }
    });

    // Update cell status
    await prisma.warehouseCell.update({
      where: { id: availableCell.id },
      data: {
        status: 'OCCUPIED',
        current_packaging_qty: testPackages,
        current_weight: testWeight,
        currentUsage: testWeight * 0.05
      }
    });

    console.log('✅ Large test allocation created successfully!');
    console.log(`   Allocation ID: ${allocation.allocation_id}`);
    console.log(`   Entry Order: OI202503`);
    console.log(`   Product: ${entryOrderProduct.product_code}`);
    console.log(`   Total Quantities: ${testQuantity} units, ${testPackages} packages, ${testWeight} kg`);
    console.log(`   Cell: ${availableCell.row}.${availableCell.bay}.${availableCell.position}`);
    console.log(`   Status: CUARENTENA`);

    console.log('\n🎯 Now you can test partial transitions:');
    console.log(`   1. Check CUARENTENA inventory: GET /inventory/by-quality-status?quality_status=CUARENTENA&warehouse_id=${targetWarehouseId}`);
    console.log(`   2. You should see this new allocation with ${testQuantity} units`);
    console.log(`   3. Transition only PART of it (e.g., 6 units) to another status`);
    console.log(`   4. Check that ${testQuantity - 6} units remain in CUARENTENA`);
    console.log(`   5. Check that 6 units appear in the new status`);

    console.log('\n📋 Example partial transition request:');
    console.log(JSON.stringify({
      allocation_id: allocation.allocation_id,
      to_status: "CONTRAMUESTRAS",
      quantity_to_move: 6,
      package_quantity_to_move: 6,
      weight_to_move: 6,
      volume_to_move: 0.3,
      reason: "Testing partial transition",
      notes: "This should leave 9 units in CUARENTENA",
      new_cell_id: "get-from-samples-cells-endpoint", // You'll need to get a samples cell ID
      performed_by: warehouseUser.id
    }, null, 2));

    console.log('\n📊 Updated Entry Order Summary:');
    const updatedAllocations = await prisma.inventoryAllocation.findMany({
      where: {
        entry_order_product_id: entryOrderProduct.entry_order_product_id
      },
      include: {
        cell: true
      }
    });

    let totalAllocated = 0;
    let quarantineTotal = 0;
    let contramuestrasTotal = 0;

    updatedAllocations.forEach((alloc, index) => {
      console.log(`   Allocation ${index + 1}: ${alloc.inventory_quantity} units - ${alloc.quality_status} - Cell ${alloc.cell.row}.${alloc.cell.bay}.${alloc.cell.position}`);
      totalAllocated += alloc.inventory_quantity;
      if (alloc.quality_status === 'CUARENTENA') quarantineTotal += alloc.inventory_quantity;
      if (alloc.quality_status === 'CONTRAMUESTRAS') contramuestrasTotal += alloc.inventory_quantity;
    });

    console.log(`\n   Entry Order Product: ${entryOrderProduct.inventory_quantity} units total`);
    console.log(`   Currently Allocated: ${totalAllocated} units`);
    console.log(`   In CUARENTENA: ${quarantineTotal} units`);
    console.log(`   In CONTRAMUESTRAS: ${contramuestrasTotal} units`);
    console.log(`   Remaining Unallocated: ${entryOrderProduct.inventory_quantity - totalAllocated} units`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPartialTransitionTest(); 