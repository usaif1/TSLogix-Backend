const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestCuarentenaInventory() {
  console.log('📦 Creating test CUARENTENA inventory...\n');

  try {
    const targetWarehouseId = '3601d881-687a-4bee-9ffb-06b3814683f9';
    
    // Get warehouse user
    const warehouseUser = await prisma.user.findFirst({
      where: { role: { name: "WAREHOUSE" } }
    });

    // Get available cells in the target warehouse
    const availableCells = await prisma.warehouseCell.findMany({
      where: { 
        warehouse_id: targetWarehouseId,
        status: 'AVAILABLE'
      },
      take: 3
    });

    if (availableCells.length === 0) {
      console.log('❌ No available cells found in warehouse');
      return;
    }

    // Get some products and entry orders
    const entryOrders = await prisma.entryOrder.findMany({
      include: { products: true },
      take: 3
    });

    if (entryOrders.length === 0) {
      console.log('❌ No entry orders found');
      return;
    }

    // Create 3 test allocations in CUARENTENA status
    for (let i = 0; i < 3; i++) {
      const entryOrder = entryOrders[i];
      const entryProduct = entryOrder.products[0];
      const cell = availableCells[i];

      const testQuantity = 50 + (i * 25); // 50, 75, 100 units
      const testPackages = 25 + (i * 15); // 25, 40, 55 packages
      const testWeight = 100 + (i * 50);  // 100, 150, 200 kg

      // Create allocation
      const allocation = await prisma.inventoryAllocation.create({
        data: {
          entry_order_id: entryOrder.entry_order_id,
          entry_order_product_id: entryProduct.entry_order_product_id,
          inventory_quantity: testQuantity,
          package_quantity: testPackages,
          quantity_pallets: Math.ceil(testPackages / 20),
          presentation: 'CAJA',
          weight_kg: testWeight,
          volume_m3: testWeight * 0.05, // 5% of weight as volume
          cell_id: cell.id,
          product_status: 'CAJ_NORMAL',
          status_code: 31,
          quality_status: 'CUARENTENA',
          guide_number: `TEST-CUA-${Date.now()}-${i + 1}`,
          observations: `Test allocation ${i + 1} for API testing - CUARENTENA status`,
          allocated_by: warehouseUser.id,
          status: 'ACTIVE'
        }
      });

      // Create inventory record
      await prisma.inventory.create({
        data: {
          allocation_id: allocation.allocation_id,
          product_id: entryProduct.product_id,
          cell_id: cell.id,
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
        where: { id: cell.id },
        data: {
          status: 'OCCUPIED',
          current_packaging_qty: testPackages,
          current_weight: testWeight,
          currentUsage: testWeight * 0.05
        }
      });

      console.log(`✅ Created test allocation ${i + 1}:`);
      console.log(`   Product: ${entryProduct.product_code}`);
      console.log(`   Quantities: ${testQuantity} units, ${testPackages} packages, ${testWeight} kg`);
      console.log(`   Cell: ${cell.row}.${cell.bay}.${cell.position}`);
      console.log(`   Status: CUARENTENA\n`);
    }

    console.log('🎉 Test inventory created successfully!');
    console.log(`\n🔗 You can now test the API endpoint:`);
    console.log(`GET http://localhost:3000/inventory/by-quality-status?quality_status=CUARENTENA&warehouse_id=${targetWarehouseId}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCuarentenaInventory(); 