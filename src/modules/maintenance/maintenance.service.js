const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createSupplier = async (supplierData) => {
  return prisma.supplier.create({
    data: {
      // ✅ NEW: Support new supplier fields
      company_name: supplierData.company_name,
      category: supplierData.category || null,
      tax_id: supplierData.tax_id || null,
      registered_address: supplierData.registered_address || null,
      city: supplierData.city || null,
      contact_no: supplierData.contact_no || null,
      contact_person: supplierData.contact_person || null,
      notes: supplierData.notes || null,
      
      // ✅ DEPRECATED: Keep old fields for backward compatibility
      name: supplierData.name || supplierData.company_name,
      address: supplierData.address || supplierData.registered_address,
      city: supplierData.city,
      phone: supplierData.phone || supplierData.contact_no,
      email: supplierData.email || null,
      ruc: supplierData.ruc || supplierData.tax_id,
      
      ...(supplierData.country_id && {
        country: {
          connect: { country_id: supplierData.country_id }
        }
      })
    },
  });
};

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
