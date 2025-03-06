const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createSupplier(supplierData) {
  try {
    const newSupplier = await prisma.supplier.create({
      data: {
        name: supplierData.name,
        address: supplierData.address,
        city: supplierData.city,
        phone: supplierData.phone,
        email: supplierData.email,
        ruc: supplierData.ruc,
        country: {
          connect: { country_id: supplierData.country_id }, // Link to the Country by ID
        },
      },
    });
    return newSupplier;
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw new Error("Error creating supplier: " + error.message);
  }
}

/**
 * Fetch all suppliers along with related country details.
 */
async function getAllSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        country: true,
      },
    });
    return suppliers;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw new Error("Error fetching suppliers: " + error.message);
  }
}

module.exports = { createSupplier, getAllSuppliers };
