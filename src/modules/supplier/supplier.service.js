const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a new supplier
 * @param {Object} supplierData - The supplier data
 * @returns {Promise<Object>} - The created supplier
 */
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
        ...(supplierData.country_id && {
          country: {
            connect: { country_id: supplierData.country_id }
          }
        })
      },
      include: {
        country: true
      }
    });
    return newSupplier;
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw new Error(`Error creating supplier: ${error.message}`);
  }
}

/**
 * Get all suppliers
 * @returns {Promise<Array>} - List of suppliers
 */
async function getAllSuppliers(search) {
  try {
    // Build filter condition if search term is provided
    const filter = search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const suppliers = await prisma.supplier.findMany({
      where: filter,
      include: {
        country: {
          select: {
            country_id: true,
            name: true,
          },
        },
        EntryOrder: {
          select: {
            entry_order_id: true,
            entry_order_no: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    return suppliers;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw new Error(`Error fetching suppliers: ${error.message}`);
  }
}

/**
 * Get supplier by ID
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} - Supplier data
 */
async function getSupplierById(supplierId) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { supplier_id: supplierId },
      include: {
        country: true,
        EntryOrder: {
          select: {
            entry_order_id: true,
            entry_order_no: true,
            registration_date: true,
            order: {
              select: {
                created_at: true,
                organisation: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    
    return supplier;
  } catch (error) {
    console.error(`Error fetching supplier with ID ${supplierId}:`, error);
    throw new Error(`Error fetching supplier: ${error.message}`);
  }
}

/**
 * Update supplier
 * @param {string} supplierId - Supplier ID
 * @param {Object} supplierData - Updated supplier data
 * @returns {Promise<Object>} - Updated supplier
 */
async function updateSupplier(supplierId, supplierData) {
  try {
    const updatedSupplier = await prisma.supplier.update({
      where: { supplier_id: supplierId },
      data: {
        name: supplierData.name,
        address: supplierData.address,
        city: supplierData.city,
        phone: supplierData.phone,
        email: supplierData.email,
        ruc: supplierData.ruc,
        // Connect to country if provided
        ...(supplierData.country_id && {
          country: {
            connect: { country_id: supplierData.country_id }
          }
        })
      },
      include: {
        country: true
      }
    });
    return updatedSupplier;
  } catch (error) {
    console.error(`Error updating supplier with ID ${supplierId}:`, error);
    throw new Error(`Error updating supplier: ${error.message}`);
  }
}

/**
 * Delete supplier
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} - Deleted supplier
 */
async function deleteSupplier(supplierId) {
  try {
    // Check if supplier has related entry orders
    const supplierWithEntryOrders = await prisma.supplier.findUnique({
      where: { supplier_id: supplierId },
      include: {
        EntryOrder: {
          select: { entry_order_id: true }
        }
      }
    });
    
    if (supplierWithEntryOrders?.EntryOrder?.length > 0) {
      throw new Error("Cannot delete supplier with related entry orders");
    }
    
    const deletedSupplier = await prisma.supplier.delete({
      where: { supplier_id: supplierId }
    });
    
    return deletedSupplier;
  } catch (error) {
    console.error(`Error deleting supplier with ID ${supplierId}:`, error);
    throw new Error(`Error deleting supplier: ${error.message}`);
  }
}

const getCountry = async () => {
  return prisma.country.findMany();
};


const getFormFields = async () => {
  try {
    const [country] = await Promise.all([
      getCountry(),
    ]);

    return {
      country,
    };
  } catch (error) {
    throw new Error("Failed to fetch form fields");
  }
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getFormFields,
};