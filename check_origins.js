const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrigins() {
  try {
    const origins = await prisma.origin.findMany();
    console.log('Available origins:');
    origins.forEach(origin => {
      console.log(`- ${origin.origin_id}: ${origin.name} (${origin.type})`);
    });
    
    console.log('\nAvailable document types:');
    const documentTypes = await prisma.documentType.findMany();
    documentTypes.forEach(docType => {
      console.log(`- ${docType.document_type_id}: ${docType.name} (${docType.type})`);
    });
  } catch (error) {
    console.error('Error checking origins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrigins(); 