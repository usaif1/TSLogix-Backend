const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createProduct = async (data) => {
  return prisma.product.create({
    data: {
      // ✅ REQUIRED: Product code and name
      product_code: data.product_code,
      name: data.name,
      
      // ✅ NEW: Category system fields
      category_id: data.category_id || null,
      subcategory1_id: data.subcategory1_id || null,
      subcategory2_id: data.subcategory2_id || null,
      
      // ✅ NEW: Enhanced product fields
      manufacturer: data.manufacturer || null,
      humidity: data.humidity || null,
      observations: data.observations || null,
      uploaded_documents: data.uploaded_documents || null,
      
      // ✅ DEPRECATED: Keep old fields for backward compatibility
      product_line_id: data.product_line_id || null,
      group_id: data.group_id || null,
      active_state_id: data.active_state_id || null,
      storage_conditions: data.storage_conditions || null,
      temperature_range_id: data.temperature_range_id || null,
      unit_weight: data.unit_weight || null,
      unit_volume: data.unit_volume || null,
    },
    include: {
      // ✅ NEW: Include new category relations
      category: {
        select: {
          category_id: true,
          name: true,
          description: true
        }
      },
      subcategory1: {
        select: {
          subcategory1_id: true,
          name: true,
          description: true
        }
      },
      subcategory2: {
        select: {
          subcategory2_id: true,
          name: true,
          description: true
        }
      },
      temperature_range: true,
      
      // ✅ DEPRECATED: Keep old relations for backward compatibility
      product_line: true,
      group: true,
      active_state: { select: { name: true } },
    },
  });
};

const getAllProducts = async (filters = {}, userRole = null, userId = null) => {
  const where = {};
  
  // ✅ NEW: Client-specific filtering
  if (userRole === "CLIENT" && userId) {
    // For CLIENT role, only show products assigned to this client
    const clientUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { clientUserAccount: true }
    });
    
    if (clientUser?.clientUserAccount) {
      where.clientAssignments = {
        some: {
          client_id: clientUser.clientUserAccount.client_id,
          is_active: true
        }
      };
    } else {
      // If client user account not found, return empty array
      return [];
    }
  }
  
  // ✅ NEW: Category-based filtering
  if (filters.category_id) {
    where.category_id = filters.category_id;
  }
  if (filters.subcategory1_id) {
    where.subcategory1_id = filters.subcategory1_id;
  }
  if (filters.subcategory2_id) {
    where.subcategory2_id = filters.subcategory2_id;
  }
  if (filters.manufacturer) {
    where.manufacturer = {
      contains: filters.manufacturer,
      mode: "insensitive",
    };
  }
  
  // ✅ DEPRECATED: Keep old filters for backward compatibility
  if (filters.product_line_id) {
    where.product_line_id = filters.product_line_id;
  }
  if (filters.group_id) {
    where.group_id = filters.group_id;
  }
  if (filters.name) {
    where.name = {
      contains: filters.name,
      mode: "insensitive",
    };
  }

  return prisma.product.findMany({
    where,
    include: {
      // ✅ NEW: Include new category relations
      category: {
        select: {
          category_id: true,
          name: true,
          description: true
        }
      },
      subcategory1: {
        select: {
          subcategory1_id: true,
          name: true,
          description: true,
          category: {
            select: {
              category_id: true,
              name: true
            }
          }
        }
      },
      subcategory2: {
        select: {
          subcategory2_id: true,
          name: true,
          description: true,
          subcategory1: {
            select: {
              subcategory1_id: true,
              name: true
            }
          }
        }
      },
      temperature_range: true,
      
      // ✅ DEPRECATED: Keep old relations for backward compatibility
      product_line: true,
      group: true,
      active_state: { select: { name: true } },
      
      // ✅ NEW: Include client assignment info for debugging
      clientAssignments: userRole === "CLIENT" ? {
        where: { is_active: true },
        include: {
          client: {
            select: {
              client_id: true,
              company_name: true,
              first_names: true,
              last_name: true
            }
          }
        }
      } : false,
    },
    orderBy: {
      created_at: "desc",
    },
  });
};

const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { product_id: id },
    include: {
      // ✅ NEW: Include new category relations
      category: {
        select: {
          category_id: true,
          name: true,
          description: true
        }
      },
      subcategory1: {
        select: {
          subcategory1_id: true,
          name: true,
          description: true,
          category: {
            select: {
              category_id: true,
              name: true
            }
          }
        }
      },
      subcategory2: {
        select: {
          subcategory2_id: true,
          name: true,
          description: true,
          subcategory1: {
            select: {
              subcategory1_id: true,
              name: true
            }
          }
        }
      },
      temperature_range: true,
      
      // ✅ DEPRECATED: Keep old relations for backward compatibility
      product_line: true,
      group: true,
      active_state: { select: { name: true } },
      
      // ✅ NEW: Include client assignments
      clientAssignments: {
        where: { is_active: true },
        include: {
          client: {
            select: {
              client_id: true,
              company_name: true,
              first_names: true,
              last_name: true
            }
          },
          assignedBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      },
    },
  });
};

const updateProduct = async (id, data) => {
  return prisma.product.update({
    where: { product_id: id },
    data: {
      // ✅ NEW: Support new fields
      ...(data.product_code && { product_code: data.product_code }),
      ...(data.name && { name: data.name }),
      ...(data.category_id !== undefined && { category_id: data.category_id }),
      ...(data.subcategory1_id !== undefined && { subcategory1_id: data.subcategory1_id }),
      ...(data.subcategory2_id !== undefined && { subcategory2_id: data.subcategory2_id }),
      ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
      ...(data.humidity !== undefined && { humidity: data.humidity }),
      ...(data.observations !== undefined && { observations: data.observations }),
      ...(data.uploaded_documents !== undefined && { uploaded_documents: data.uploaded_documents }),
      
      // ✅ DEPRECATED: Keep old fields for backward compatibility
      ...(data.product_line_id !== undefined && { product_line_id: data.product_line_id }),
      ...(data.group_id !== undefined && { group_id: data.group_id }),
      ...(data.active_state_id !== undefined && { active_state_id: data.active_state_id }),
      ...(data.storage_conditions !== undefined && { storage_conditions: data.storage_conditions }),
      ...(data.temperature_range_id !== undefined && { temperature_range_id: data.temperature_range_id }),
      ...(data.unit_weight !== undefined && { unit_weight: data.unit_weight }),
      ...(data.unit_volume !== undefined && { unit_volume: data.unit_volume }),
    },
    include: {
      // ✅ NEW: Include new category relations
      category: true,
      subcategory1: {
        include: { category: true }
      },
      subcategory2: {
        include: { subcategory1: { include: { category: true } } }
      },
      temperature_range: true,
      
      // ✅ DEPRECATED: Keep old relations for backward compatibility
      product_line: true,
      group: true,
      active_state: { select: { name: true } },
    },
  });
};

const deleteProduct = async (id) => {
  return prisma.product.delete({ where: { product_id: id } });
};

// ✅ NEW: Get product categories
const getProductCategories = async () => {
  return prisma.productCategory.findMany({
    orderBy: { name: 'asc' }
  });
};

// ✅ NEW: Get subcategories for a category
const getSubCategories1 = async (categoryId = null) => {
  const where = categoryId ? { category_id: categoryId } : {};
  return prisma.productSubCategory1.findMany({
    where,
    include: {
      category: {
        select: {
          category_id: true,
          name: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
};

// ✅ NEW: Get subcategories2 for a subcategory1
const getSubCategories2 = async (subcategory1Id = null) => {
  const where = subcategory1Id ? { subcategory1_id: subcategory1Id } : {};
  return prisma.productSubCategory2.findMany({
    where,
    include: {
      subcategory1: {
        select: {
          subcategory1_id: true,
          name: true,
          category: {
            select: {
              category_id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
};

// ✅ DEPRECATED: Keep old functions for backward compatibility
const getProductLines = async () => {
  return prisma.productLine.findMany();
};

const getGroups = async () => {
  return prisma.groupName.findMany();
};

const getTemperatureRanges = async () => {
  return prisma.temperatureRange.findMany();
};

const getFormFields = async () => {
  try {
    const [
      // ✅ NEW: Category system fields
      productCategories,
      subcategories1,
      subcategories2,
      temperatureRanges,
      
      // ✅ DEPRECATED: Keep old fields for backward compatibility
      productLines,
      groups,
    ] = await Promise.all([
      getProductCategories(),
      getSubCategories1(),
      getSubCategories2(),
      getTemperatureRanges(),
      getProductLines(),
      getGroups(),
    ]);

    return {
      // ✅ NEW: Category system
      productCategories,
      subcategories1,
      subcategories2,
      temperatureRanges,
      
      // ✅ DEPRECATED: Keep old fields for backward compatibility
      productLines,
      groups,
    };
  } catch (error) {
    throw new Error("Failed to fetch form fields");
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  
  // ✅ NEW: Category system functions
  getProductCategories,
  getSubCategories1,
  getSubCategories2,
  
  // ✅ DEPRECATED: Keep old functions for backward compatibility
  getProductLines,
  getGroups,
  getTemperatureRanges,
  getFormFields,
};
