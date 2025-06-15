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
        company_name: supplierData.company_name,
        category: supplierData.category || null,
        tax_id: supplierData.tax_id || null,
        registered_address: supplierData.registered_address || null,
        city: supplierData.city || null,
        contact_no: supplierData.contact_no || null,
        contact_person: supplierData.contact_person || null,
        notes: supplierData.notes || null,
        name: supplierData.name || supplierData.company_name,
        address: supplierData.address || supplierData.registered_address,
        phone: supplierData.phone || supplierData.contact_no,
        email: supplierData.email || null,
        ruc: supplierData.ruc || supplierData.tax_id,
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
    const filter = search
      ? {
          OR: [
            {
              company_name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              contact_person: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              tax_id: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              ruc: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
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
        entryOrderProducts: {
          select: {
            entry_order_product_id: true,
            entry_order: {
              select: {
                entry_order_id: true,
                entry_order_no: true,
                registration_date: true,
              }
            }
          },
          take: 5,
          orderBy: {
            entry_order: {
              registration_date: 'desc'
            }
          }
        },
      },
      orderBy: {
        created_at: "desc",
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
        entryOrderProducts: {
          select: {
            entry_order_product_id: true,
            product_code: true,
            serial_number: true,
            lot_series: true,
            entry_order: {
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
          },
          orderBy: {
            entry_order: {
              registration_date: 'desc'
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
        ...(supplierData.company_name !== undefined && { company_name: supplierData.company_name }),
        ...(supplierData.category !== undefined && { category: supplierData.category }),
        ...(supplierData.tax_id !== undefined && { tax_id: supplierData.tax_id }),
        ...(supplierData.registered_address !== undefined && { registered_address: supplierData.registered_address }),
        ...(supplierData.city !== undefined && { city: supplierData.city }),
        ...(supplierData.contact_no !== undefined && { contact_no: supplierData.contact_no }),
        ...(supplierData.contact_person !== undefined && { contact_person: supplierData.contact_person }),
        ...(supplierData.notes !== undefined && { notes: supplierData.notes }),
        ...(supplierData.name !== undefined && { name: supplierData.name }),
        ...(supplierData.address !== undefined && { address: supplierData.address }),
        ...(supplierData.phone !== undefined && { phone: supplierData.phone }),
        ...(supplierData.email !== undefined && { email: supplierData.email }),
        ...(supplierData.ruc !== undefined && { ruc: supplierData.ruc }),
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
    const supplierWithEntryOrders = await prisma.supplier.findUnique({
      where: { supplier_id: supplierId },
      include: {
        entryOrderProducts: {
          select: { entry_order_product_id: true }
        }
      }
    });
    
    if (supplierWithEntryOrders?.entryOrderProducts?.length > 0) {
      throw new Error("Cannot delete supplier with related entry order products");
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
  return prisma.country.findMany({
    orderBy: { name: 'asc' }
  });
};

const getSupplierCategories = async () => {
  try {
    const categories = await prisma.supplier.findMany({
      where: {
        category: {
          not: null
        }
      },
      select: {
        category: true
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
      }
    });
    
    return categories.map(item => item.category).filter(Boolean);
  } catch (error) {
    console.error("Error fetching supplier categories:", error);
    return [];
  }
};

const getFormFields = async () => {
  try {
    const [
      countries,
      supplierCategories
    ] = await Promise.all([
      getCountry(),
      getSupplierCategories(),
    ]);

    return {
      countries,
      supplierCategories,
      country: countries,
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
  getSupplierCategories,
};