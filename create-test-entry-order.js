const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createEntryOrder() {
  try {
    const client1User = await prisma.user.findFirst({ 
      where: { email: 'client1@company.com' } 
    });
    
    const supplier = await prisma.supplier.findFirst();
    const product = await prisma.product.findFirst();
    const warehouse = await prisma.warehouse.findFirst({ 
      where: { name: 'Cold Storage' } 
    });

    const entryOrder = await prisma.entryOrder.create({
      data: {
        entry_order_no: 'CLIENT1-TEST-001',
        created_by: client1User.user_id,
        supplier_id: supplier.supplier_id,
        warehouse_id: warehouse.warehouse_id,
        status: 'APPROVED',
        entry_date: new Date(),
        expected_arrival_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        products: {
          create: [{
            product_id: product.product_id,
            quantity: 100,
            unit_price: 25.50,
            total_price: 2550.00,
            supplier_id: supplier.supplier_id
          }]
        }
      }
    });

    console.log('✅ Created entry order for client1:');
    console.log('Entry Order ID:', entryOrder.entry_order_id);
    console.log('Entry Order No:', entryOrder.entry_order_no);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

createEntryOrder(); 