const {
  PrismaClient,
  ReviewStatus,
  OrderStatusEntry,
  TemperatureRangeType,
  PresentationType,
} = require("@prisma/client");
const { toUTC } = require("../../utils/index");
const prisma = new PrismaClient();

/**
 * Creates Entry Order with multiple products in the new flow
 * Customer creates → Admin reviews → Warehouse allocates
 */
async function createEntryOrder(entryData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create base order
    const newOrder = await tx.order.create({
      data: {
        order_type: "ENTRY",
        status: "PENDING",
        organisation_id: entryData.organisation_id,
        created_by: entryData.created_by,
        priority: entryData.priority || "NORMAL",
      },
    });

    // 2. Create entry order with new schema fields
    const newEntryOrder = await tx.entryOrder.create({
      data: {
        order_id: newOrder.order_id,
        entry_order_no: entryData.entry_order_no,

        // Basic order info
        origin_id: entryData.origin_id,
        document_type_id: entryData.document_type_id,
        registration_date: toUTC(entryData.registration_date) || new Date(),
        document_date: toUTC(entryData.document_date),
        entry_date_time: toUTC(entryData.entry_date_time),
        created_by: entryData.created_by,

        // Order details
        order_status: entryData.order_status || OrderStatusEntry.REVISION,
        total_volume: parseFloat(entryData.total_volume) || null,
        total_weight: parseFloat(entryData.total_weight) || null,
        cif_value: parseFloat(entryData.cif_value) || null,
        total_pallets: parseInt(entryData.total_pallets) || null,
        observation: entryData.observation,

        // Document uploads
        uploaded_documents: entryData.uploaded_documents || null,

        // Review status (initially pending)
        review_status: ReviewStatus.PENDING,

        // Warehouse assignment (will be set later)
        warehouse_id: entryData.warehouse_id || null,
      },
    });

    // 3. ✅ FIXED: Create products for this entry order with duplicate validation
    const entryOrderProducts = [];
    if (entryData.products && Array.isArray(entryData.products)) {
      // ✅ Check for duplicate product codes
      const productCodes = entryData.products.map(p => p.product_code);
      const duplicateProductCodes = productCodes.filter((code, index) => productCodes.indexOf(code) !== index);
      
      if (duplicateProductCodes.length > 0) {
        throw new Error(`Duplicate product codes found in entry order: ${[...new Set(duplicateProductCodes)].join(', ')}. Each product can only appear once per entry order.`);
      }

      // ✅ Validate each product has required fields
      for (let i = 0; i < entryData.products.length; i++) {
        const productData = entryData.products[i];
        
        if (!productData.product_code || !productData.product_id) {
          throw new Error(`Product ${i + 1}: Missing required fields product_code and product_id`);
        }
        
        if (!productData.inventory_quantity || !productData.package_quantity || !productData.weight_kg) {
          throw new Error(`Product ${i + 1} (${productData.product_code}): Missing required quantity fields`);
        }

        // ✅ Verify the product exists in the database
        const existingProduct = await tx.product.findUnique({
          where: { product_id: productData.product_id }
        });
        
        if (!existingProduct) {
          throw new Error(`Product ${i + 1}: Product with ID ${productData.product_id} not found`);
        }

        // ✅ Verify product_code matches the product
        if (existingProduct.product_code !== productData.product_code) {
          throw new Error(`Product ${i + 1}: Product code mismatch. Expected ${existingProduct.product_code}, got ${productData.product_code}`);
        }
      }

      // ✅ Create products after validation
      for (const productData of entryData.products) {
        try {
          const entryOrderProduct = await tx.entryOrderProduct.create({
            data: {
              entry_order_id: newEntryOrder.entry_order_id,

              // Product identification
              serial_number: productData.serial_number,
              supplier_id: productData.supplier_id,
              product_code: productData.product_code,
              product_id: productData.product_id,
              lot_series: productData.lot_series,

              // Dates
              manufacturing_date: toUTC(productData.manufacturing_date),
              expiration_date: toUTC(productData.expiration_date),

              // Quantities (as received)
              inventory_quantity: parseInt(productData.inventory_quantity),
              package_quantity: parseInt(productData.package_quantity),
              quantity_pallets: parseInt(productData.quantity_pallets) || null,
              presentation: productData.presentation || PresentationType.CAJA,
              guide_number: productData.guide_number,
              weight_kg: parseFloat(productData.weight_kg),
              volume_m3: parseFloat(productData.volume_m3) || null,
              insured_value: parseFloat(productData.insured_value) || null,

              // Environmental conditions
              temperature_range:
                productData.temperature_range || TemperatureRangeType.AMBIENTE,
              humidity: productData.humidity,
              health_registration: productData.health_registration,
            },
          });
          entryOrderProducts.push(entryOrderProduct);
        } catch (error) {
          // ✅ More specific error handling
          if (error.code === 'P2002' && error.meta?.target?.includes('entry_order_product_unique')) {
            throw new Error(`Product code ${productData.product_code} already exists in this entry order. Each product can only be added once per entry order.`);
          }
          throw error;
        }
      }
    }

    return { entryOrder: newEntryOrder, products: entryOrderProducts };
  });
}

/**
 * Get all entry orders with new schema structure
 */
async function getAllEntryOrders(
  organisationId = null,
  sortOptions = null,
  entryOrderNo = null
) {
  const query = {
    select: {
      entry_order_id: true,
      entry_order_no: true,
      registration_date: true,
      document_date: true,
      entry_date_time: true,
      order_status: true,
      review_status: true,
      total_volume: true,
      total_weight: true,
      cif_value: true,
      total_pallets: true,
      observation: true,
      uploaded_documents: true,
      review_comments: true,
      reviewed_at: true,

      // Relations
      origin: { select: { name: true, type: true } },
      documentType: { select: { name: true, type: true } },
      warehouse: { select: { name: true, warehouse_id: true } },
      creator: {
        select: {
          first_name: true,
          last_name: true,
          organisation: { select: { name: true } },
        },
      },
      reviewer: {
        select: { first_name: true, last_name: true },
      },
      order: {
        select: {
          created_at: true,
          status: true,
          priority: true,
        },
      },

      // Include products with new schema
      products: {
        select: {
          entry_order_product_id: true,
          serial_number: true,
          product_code: true,
          lot_series: true,
          manufacturing_date: true,
          expiration_date: true,
          inventory_quantity: true,
          package_quantity: true,
          quantity_pallets: true,
          presentation: true,
          guide_number: true,
          weight_kg: true,
          volume_m3: true,
          insured_value: true,
          temperature_range: true,
          humidity: true,
          health_registration: true,

          // Product relation
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
            },
          },

          // Supplier relation
          supplier: {
            select: {
              name: true,
              supplier_id: true,
            },
          },
        },
      },

      // Inventory allocations (filled by warehouse)
      inventoryAllocations: {
        select: {
          allocation_id: true,
          inventory_quantity: true,
          package_quantity: true,
          weight_kg: true,
          product_status: true,
          status_code: true,
          allocated_at: true,
          observations: true,

          // Cell assignment
          cell: {
            select: {
              id: true,
              row: true,
              bay: true,
              position: true,
              status: true,
            },
          },

          // Allocator
          allocator: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      [sortOptions?.orderBy || "registration_date"]:
        sortOptions?.direction || "desc",
    },
    where: {},
  };

  // Build where conditions
  const whereConds = {};
  if (organisationId) {
    whereConds.order = { organisation_id: organisationId };
  }
  if (entryOrderNo) {
    whereConds.entry_order_no = { contains: entryOrderNo, mode: "insensitive" };
  }
  if (Object.keys(whereConds).length) {
    query.where = whereConds;
  }

  const orders = await prisma.entryOrder.findMany(query);

  return orders.map((order) => {
    // Calculate totals from products
    const totalInventoryQuantity = order.products.reduce(
      (sum, p) => sum + p.inventory_quantity,
      0
    );
    const totalPackageQuantity = order.products.reduce(
      (sum, p) => sum + p.package_quantity,
      0
    );
    const totalWeight = order.products.reduce(
      (sum, p) => sum + parseFloat(p.weight_kg),
      0
    );
    const totalVolume = order.products.reduce(
      (sum, p) => sum + parseFloat(p.volume_m3 || 0),
      0
    );
    const totalInsuredValue = order.products.reduce(
      (sum, p) => sum + parseFloat(p.insured_value || 0),
      0
    );

    // Calculate allocated quantities
    const totalAllocatedQuantity = order.inventoryAllocations.reduce(
      (sum, a) => sum + a.inventory_quantity,
      0
    );
    const totalAllocatedWeight = order.inventoryAllocations.reduce(
      (sum, a) => sum + parseFloat(a.weight_kg),
      0
    );

    // Transform allocations with cell references
    const transformedAllocations = order.inventoryAllocations?.map(
      (allocation) => ({
        ...allocation,
        cellReference: `${allocation.cell.row}.${String(
          allocation.cell.bay
        ).padStart(2, "0")}.${String(allocation.cell.position).padStart(
          2,
          "0"
        )}`,
        allocator_name: `${allocation.allocator.first_name || ""} ${
          allocation.allocator.last_name || ""
        }`.trim(),
      })
    );

    return {
      ...order,
      creator_name: `${order.creator.first_name || ""} ${
        order.creator.last_name || ""
      }`.trim(),
      reviewer_name: order.reviewer
        ? `${order.reviewer.first_name || ""} ${
            order.reviewer.last_name || ""
          }`.trim()
        : null,
      organisation_name: order.creator.organisation.name,

      // Calculated totals
      total_inventory_quantity: totalInventoryQuantity,
      total_package_quantity: totalPackageQuantity,
      calculated_total_weight: totalWeight,
      calculated_total_volume: totalVolume,
      total_insured_value: totalInsuredValue,

      // Allocation status
      total_allocated_quantity: totalAllocatedQuantity,
      total_allocated_weight: totalAllocatedWeight,
      allocation_percentage:
        totalInventoryQuantity > 0
          ? (totalAllocatedQuantity / totalInventoryQuantity) * 100
          : 0,
      is_fully_allocated: totalAllocatedQuantity >= totalInventoryQuantity,

      // Transform data
      inventoryAllocations: transformedAllocations,
    };
  });
}

/**
 * Get form fields for entry order creation
 */
async function getEntryFormFields() {
  const [
    origins,
    documentTypes,
    users,
    suppliers,
    products,
    warehouses,
    temperatureRanges,
  ] = await Promise.all([
    prisma.origin.findMany({
      select: {
        origin_id: true,
        name: true,
        type: true,
        description: true,
      },
    }),
    prisma.documentType.findMany({
      select: {
        document_type_id: true,
        name: true,
        type: true,
        description: true,
      },
    }),
    prisma.user.findMany({
      where: {
        active_state: { name: "Active" },
      },
      select: {
        id: true,
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: { select: { name: true } },
      },
    }),
    prisma.supplier.findMany({
      select: {
        supplier_id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        country: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: {
        active_state: { name: "Active" },
      },
      select: {
        product_id: true,
        product_code: true,
        name: true,
        unit_weight: true,
        unit_volume: true,
        manufacturer: true,
        storage_conditions: true,
        product_line: { select: { name: true } },
        group: { select: { name: true } },
        temperature_range: {
          select: {
            range: true,
            min_celsius: true,
            max_celsius: true,
          },
        },
      },
    }),
    prisma.warehouse.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        warehouse_id: true,
        name: true,
        location: true,
        capacity: true,
        max_occupancy: true,
      },
    }),
    prisma.temperatureRange.findMany({
      select: {
        temperature_range_id: true,
        range: true,
        min_celsius: true,
        max_celsius: true,
      },
    }),
  ]);

  // Enum options for dropdowns
  const originTypes = Object.values({
    COMPRA_LOCAL: "Compra Local",
    IMPORTACION: "Importación",
    DEVOLUCION: "Devolución",
    ACONDICIONADO: "Acondicionado",
    TRANSFERENCIA_INTERNA: "Transferencia Interna",
    FRACCIONADO: "Fraccionado",
  }).map((label, index) => ({
    value: Object.keys({
      COMPRA_LOCAL: "Compra Local",
      IMPORTACION: "Importación",
      DEVOLUCION: "Devolución",
      ACONDICIONADO: "Acondicionado",
      TRANSFERENCIA_INTERNA: "Transferencia Interna",
      FRACCIONADO: "Fraccionado",
    })[index],
    label,
  }));

  const documentTypeOptions = Object.values({
    PACKING_LIST: "Packing List",
    FACTURA: "Factura",
    CERTIFICADO_ANALISIS: "Certificado de Análisis",
    RRSS: "RRSS",
    PERMISO_ESPECIAL: "Permiso Especial",
    OTRO: "Otro",
  }).map((label, index) => ({
    value: Object.keys({
      PACKING_LIST: "Packing List",
      FACTURA: "Factura",
      CERTIFICADO_ANALISIS: "Certificado de Análisis",
      RRSS: "RRSS",
      PERMISO_ESPECIAL: "Permiso Especial",
      OTRO: "Otro",
    })[index],
    label,
  }));

  const orderStatusOptions = Object.values({
    REVISION: "Revisión",
    PRESENTACION: "Presentación",
    FINALIZACION: "Finalización",
  }).map((label, index) => ({
    value: Object.keys({
      REVISION: "Revisión",
      PRESENTACION: "Presentación",
      FINALIZACION: "Finalización",
    })[index],
    label,
  }));

  const presentationOptions = Object.values({
    CAJA: "Caja",
    PALETA: "Paleta",
    SACO: "Saco",
    UNIDAD: "Unidad",
    PAQUETE: "Paquete",
    TAMBOS: "Tambos",
    BULTO: "Bulto",
    OTRO: "Otro",
  }).map((label, index) => ({
    value: Object.keys({
      CAJA: "Caja",
      PALETA: "Paleta",
      SACO: "Saco",
      UNIDAD: "Unidad",
      PAQUETE: "Paquete",
      TAMBOS: "Tambos",
      BULTO: "Bulto",
      OTRO: "Otro",
    })[index],
    label,
  }));

  const temperatureRangeOptions = Object.values({
    RANGE_15_30: "15°C - 30°C",
    RANGE_15_25: "15°C - 25°C",
    RANGE_2_8: "2°C - 8°C",
    AMBIENTE: "Ambiente",
  }).map((label, index) => ({
    value: Object.keys({
      RANGE_15_30: "15°C - 30°C",
      RANGE_15_25: "15°C - 25°C",
      RANGE_2_8: "2°C - 8°C",
      AMBIENTE: "Ambiente",
    })[index],
    label,
  }));

  return {
    origins,
    documentTypes,
    users,
    suppliers,
    products,
    warehouses,
    temperatureRanges,
    // Enum options
    originTypes,
    documentTypeOptions,
    orderStatusOptions,
    presentationOptions,
    temperatureRangeOptions,
  };
}

/**
 * Generate next entry order number in format OI202501
 * OI = Entry Order prefix, 2025 = full year, 01 = incremental count
 */
async function getCurrentEntryOrderNo() {
  const currentYear = new Date().getFullYear().toString(); // Full 4-digit year
  const yearPrefix = `OI${currentYear}`;
  
  const lastOrder = await prisma.entryOrder.findFirst({
    where: {
      entry_order_no: { startsWith: yearPrefix },
    },
    orderBy: { registration_date: "desc" },
  });

  let nextCount = 1;
  if (lastOrder?.entry_order_no) {
    // Extract count from format like "OI202501" -> "01"
    const countPart = lastOrder.entry_order_no.substring(yearPrefix.length);
    if (!isNaN(countPart)) {
      nextCount = parseInt(countPart) + 1;
    }
  }

  return `${yearPrefix}${String(nextCount).padStart(2, "0")}`;
}

/**
 * Get single entry order by order number with full details
 */
async function getEntryOrderByNo(orderNo, organisationId = null) {
  const where = { entry_order_no: orderNo };
  if (organisationId) {
    where.order = { organisation_id: organisationId };
  }

  const order = await prisma.entryOrder.findFirst({
    where,
    select: {
      entry_order_id: true,
      entry_order_no: true,
      registration_date: true,
      document_date: true,
      entry_date_time: true,
      order_status: true,
      total_volume: true,
      total_weight: true,
      cif_value: true,
      total_pallets: true,
      observation: true,
      uploaded_documents: true,
      review_status: true,
      review_comments: true,
      reviewed_at: true,

      // Relations
      origin: {
        select: {
          origin_id: true,
          name: true,
          type: true,
        },
      },
      documentType: {
        select: {
          document_type_id: true,
          name: true,
          type: true,
        },
      },
      warehouse: {
        select: {
          warehouse_id: true,
          name: true,
          location: true,
        },
      },
      creator: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      order: {
        select: {
          order_id: true,
          created_at: true,
          status: true,
          priority: true,
          organisation: { select: { name: true } },
        },
      },

      // Products with full details
      products: {
        select: {
          entry_order_product_id: true,
          serial_number: true,
          product_code: true,
          lot_series: true,
          manufacturing_date: true,
          expiration_date: true,
          inventory_quantity: true,
          package_quantity: true,
          quantity_pallets: true,
          presentation: true,
          guide_number: true,
          weight_kg: true,
          volume_m3: true,
          insured_value: true,
          temperature_range: true,
          humidity: true,
          health_registration: true,

          // Product details
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
              manufacturer: true,
              storage_conditions: true,
              unit_weight: true,
              unit_volume: true,
              product_line: { select: { name: true } },
              group: { select: { name: true } },
              temperature_range: {
                select: {
                  range: true,
                  min_celsius: true,
                  max_celsius: true,
                },
              },
            },
          },

          // Supplier details
          supplier: {
            select: {
              supplier_id: true,
              name: true,
              address: true,
              city: true,
              phone: true,
              email: true,
              country: { select: { name: true } },
            },
          },

          // Inventory allocations for this product
          inventoryAllocations: {
            select: {
              allocation_id: true,
              inventory_quantity: true,
              package_quantity: true,
              quantity_pallets: true,
              presentation: true,
              weight_kg: true,
              volume_m3: true,
              product_status: true,
              status_code: true,
              guide_number: true,
              observations: true,
              allocated_at: true,
              status: true,

              // Cell assignment
              cell: {
                select: {
                  id: true,
                  row: true,
                  bay: true,
                  position: true,
                  status: true,
                  capacity: true,
                  currentUsage: true,
                },
              },

              // Allocator info
              allocator: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      },

      // Overall inventory allocations
      inventoryAllocations: {
        select: {
          allocation_id: true,
          allocated_at: true,
          status: true,
          allocator: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  // Transform products with allocations
  const transformedProducts = order.products.map((product) => {
    const allocations = product.inventoryAllocations?.map((allocation) => ({
      ...allocation,
      cellReference: `${allocation.cell.row}.${String(
        allocation.cell.bay
      ).padStart(2, "0")}.${String(allocation.cell.position).padStart(2, "0")}`,
      allocator_name: `${allocation.allocator.first_name || ""} ${
        allocation.allocator.last_name || ""
      }`.trim(),
    }));

    return {
      ...product,
      inventoryAllocations: allocations,
      supplier_name: product.supplier?.name,
      supplier_country: product.supplier?.country?.name,
    };
  });

  // Calculate totals
  const totals = order.products.reduce(
    (acc, product) => ({
      inventory_quantity: acc.inventory_quantity + product.inventory_quantity,
      package_quantity: acc.package_quantity + product.package_quantity,
      weight_kg: acc.weight_kg + parseFloat(product.weight_kg),
      volume_m3: acc.volume_m3 + parseFloat(product.volume_m3 || 0),
      insured_value: acc.insured_value + parseFloat(product.insured_value || 0),
    }),
    {
      inventory_quantity: 0,
      package_quantity: 0,
      weight_kg: 0,
      volume_m3: 0,
      insured_value: 0,
    }
  );

  // Calculate allocation totals
  const allocationTotals = order.inventoryAllocations.reduce(
    (acc, allocation) => ({
      allocated_quantity:
        acc.allocated_quantity + allocation.inventory_quantity,
      allocated_weight: acc.allocated_weight + parseFloat(allocation.weight_kg),
    }),
    { allocated_quantity: 0, allocated_weight: 0 }
  );

  return {
    ...order,
    creator_name: `${order.creator.first_name || ""} ${
      order.creator.last_name || ""
    }`.trim(),
    reviewer_name: order.reviewer
      ? `${order.reviewer.first_name || ""} ${
          order.reviewer.last_name || ""
        }`.trim()
      : null,
    organisation_name: order.order.organisation.name,
    products: transformedProducts,

    // Calculated totals
    calculated_totals: totals,
    allocation_totals: allocationTotals,
    allocation_percentage:
      totals.inventory_quantity > 0
        ? (allocationTotals.allocated_quantity / totals.inventory_quantity) *
          100
        : 0,
  };
}

/**
 * Get approved entry orders that are ready for inventory allocation
 */
async function getApprovedEntryOrders(organisationId = null, searchNo = null) {
  const where = {
    review_status: ReviewStatus.APPROVED,
    // Only orders that don't have full allocation yet
    inventoryAllocations: {
      none: {},
    },
  };

  if (organisationId) {
    where.order = { organisation_id: organisationId };
  }
  if (searchNo) {
    where.entry_order_no = { contains: searchNo, mode: "insensitive" };
  }

  const orders = await prisma.entryOrder.findMany({
    where,
    select: {
      entry_order_id: true,
      entry_order_no: true,
      registration_date: true,
      review_status: true,
      warehouse_id: true,
      warehouse: { select: { name: true } },

      products: {
        select: {
          entry_order_product_id: true,
          product_code: true,
          inventory_quantity: true,
          package_quantity: true,
          weight_kg: true,
          volume_m3: true,

          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { registration_date: "desc" },
  });

  return orders.map((order) => ({
    ...order,
    total_products: order.products.length,
    total_quantity: order.products.reduce(
      (sum, p) => sum + p.inventory_quantity,
      0
    ),
    total_weight: order.products.reduce(
      (sum, p) => sum + parseFloat(p.weight_kg),
      0
    ),
  }));
}

/**
 * Review entry order (Admin function)
 */
async function reviewEntryOrder(orderNo, reviewData) {
  return await prisma.$transaction(async (tx) => {
    const entryOrder = await tx.entryOrder.findFirst({
      where: { entry_order_no: orderNo },
    });

    if (!entryOrder) {
      return null;
    }

    const updatedOrder = await tx.entryOrder.update({
      where: { entry_order_id: entryOrder.entry_order_id },
      data: {
        review_status: reviewData.review_status,
        review_comments: reviewData.review_comments,
        reviewed_by: reviewData.reviewed_by,
        reviewed_at: reviewData.reviewed_at,
      },
      include: {
        creator: {
          select: { first_name: true, last_name: true, email: true },
        },
        reviewer: {
          select: { first_name: true, last_name: true },
        },
      },
    });

    return updatedOrder;
  });
}

/**
 * Get entry orders by review status
 */
async function getEntryOrdersByStatus(reviewStatus, organisationId = null) {
  const where = { review_status: reviewStatus };

  if (organisationId) {
    where.order = { organisation_id: organisationId };
  }

  const orders = await prisma.entryOrder.findMany({
    where,
    select: {
      entry_order_id: true,
      entry_order_no: true,
      registration_date: true,
      order_status: true,
      review_status: true,
      review_comments: true,
      reviewed_at: true,

      creator: {
        select: {
          first_name: true,
          last_name: true,
          organisation: { select: { name: true } },
        },
      },
      reviewer: {
        select: { first_name: true, last_name: true },
      },

      products: {
        select: {
          product_code: true,
          inventory_quantity: true,
          package_quantity: true,
          weight_kg: true,
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { registration_date: "desc" },
  });

  return orders.map((order) => ({
    ...order,
    creator_name: `${order.creator.first_name || ""} ${
      order.creator.last_name || ""
    }`.trim(),
    reviewer_name: order.reviewer
      ? `${order.reviewer.first_name || ""} ${
          order.reviewer.last_name || ""
        }`.trim()
      : null,
    organisation_name: order.creator.organisation.name,
    total_products: order.products.length,
    total_quantity: order.products.reduce(
      (sum, p) => sum + p.inventory_quantity,
      0
    ),
    total_weight: order.products.reduce(
      (sum, p) => sum + parseFloat(p.weight_kg),
      0
    ),
  }));
}

/**
 * Update Entry Order (only for NEEDS_REVISION status)
 */
async function updateEntryOrder(orderNo, updateData, userId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get existing order with validation
    const existingOrder = await tx.entryOrder.findFirst({
      where: { entry_order_no: orderNo },
      include: {
        products: true,
        order: true,
      },
    });

    if (!existingOrder) {
      throw new Error("Entry order not found");
    }

    // 2. Business rule validations
    if (existingOrder.review_status !== ReviewStatus.NEEDS_REVISION) {
      throw new Error(
        "Entry order can only be updated when status is NEEDS_REVISION"
      );
    }

    // Check if user has permission to update this order
    if (existingOrder.created_by !== userId) {
      // Only admin can update others' orders
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (user?.role?.name !== "ADMIN") {
        throw new Error("You can only update your own entry orders");
      }
    }

    // 3. ✅ FIXED: Prepare update data based on your actual schema
    const allowedUpdates = {};

    // ✅ FIXED: These are direct ID fields in your schema, not relations
    if (updateData.origin_id !== undefined) {
      allowedUpdates.origin_id = updateData.origin_id;
    }
    if (updateData.document_type_id !== undefined) {
      allowedUpdates.document_type_id = updateData.document_type_id;
    }
    if (updateData.warehouse_id !== undefined) {
      allowedUpdates.warehouse_id = updateData.warehouse_id;
    }

    // ✅ Basic fields (these are direct fields)
    if (updateData.document_date !== undefined)
      allowedUpdates.document_date = toUTC(updateData.document_date);
    if (updateData.entry_date_time !== undefined)
      allowedUpdates.entry_date_time = toUTC(updateData.entry_date_time);
    if (updateData.order_status !== undefined)
      allowedUpdates.order_status = updateData.order_status;
    if (updateData.total_volume !== undefined)
      allowedUpdates.total_volume = parseFloat(updateData.total_volume);
    if (updateData.total_weight !== undefined)
      allowedUpdates.total_weight = parseFloat(updateData.total_weight);
    if (updateData.cif_value !== undefined)
      allowedUpdates.cif_value = parseFloat(updateData.cif_value);
    if (updateData.total_pallets !== undefined)
      allowedUpdates.total_pallets = parseInt(updateData.total_pallets);
    if (updateData.observation !== undefined)
      allowedUpdates.observation = updateData.observation;
    if (updateData.uploaded_documents !== undefined)
      allowedUpdates.uploaded_documents = updateData.uploaded_documents;

    // ✅ FIXED: Reset review status - these are direct fields in your schema
    allowedUpdates.review_status = ReviewStatus.PENDING;
    allowedUpdates.review_comments = null;
    allowedUpdates.reviewed_by = null; // ✅ Direct field assignment
    allowedUpdates.reviewed_at = null;

    // Add update tracking - check if these exist in your schema
    // allowedUpdates.updated_at = new Date();    // ✅ Only if this field exists
    // allowedUpdates.updated_by = userId;        // ✅ Only if this field exists

    // 4. Update the entry order
    const updatedOrder = await tx.entryOrder.update({
      where: { entry_order_id: existingOrder.entry_order_id },
      data: allowedUpdates,
    });

    // 5. Handle product updates if provided
    if (updateData.products && Array.isArray(updateData.products)) {
      // ✅ FIXED: Check for duplicate product codes ONLY within the incoming update data
      const incomingProductCodes = updateData.products.map(p => p.product_code).filter(Boolean);
      const duplicatesInIncoming = incomingProductCodes.filter((code, index) => incomingProductCodes.indexOf(code) !== index);
      
      if (duplicatesInIncoming.length > 0) {
        throw new Error(`Duplicate product codes found in update request: ${[...new Set(duplicatesInIncoming)].join(', ')}. Each product can only appear once in the update.`);
      }

      // ✅ NEW: Also check for duplicates between new products and existing products (excluding products being updated)
      const existingProductCodes = existingOrder.products.map(p => p.product_code);
      const newProducts = updateData.products.filter(p => !p.entry_order_product_id); // Products without ID are new
      const conflictingProducts = newProducts.filter(newP => existingProductCodes.includes(newP.product_code));
      
      if (conflictingProducts.length > 0) {
        throw new Error(`Product codes already exist in this entry order: ${conflictingProducts.map(p => p.product_code).join(', ')}. Cannot add duplicate products.`);
      }

      // Get existing product IDs
      const existingProductIds = existingOrder.products.map(
        (p) => p.entry_order_product_id
      );
      const updateProductIds = updateData.products
        .filter((p) => p.entry_order_product_id)
        .map((p) => p.entry_order_product_id);

      // Delete removed products
      const productsToDelete = existingProductIds.filter(
        (id) => !updateProductIds.includes(id)
      );
      if (productsToDelete.length > 0) {
        await tx.entryOrderProduct.deleteMany({
          where: {
            entry_order_product_id: { in: productsToDelete },
          },
        });
      }

      // Update or create products
      for (const productData of updateData.products) {
        // ✅ Enhanced validation
        if (
          !productData.product_id ||
          !productData.product_code ||
          !productData.inventory_quantity ||
          !productData.package_quantity ||
          !productData.weight_kg
        ) {
          throw new Error(
            `Product missing required fields: product_id, product_code, inventory_quantity, package_quantity, weight_kg`
          );
        }

        // ✅ Verify the product exists
        const existingProduct = await tx.product.findUnique({
          where: { product_id: productData.product_id }
        });
        
        if (!existingProduct) {
          throw new Error(`Product with ID ${productData.product_id} not found`);
        }

        // ✅ Verify product_code matches
        if (existingProduct.product_code !== productData.product_code) {
          throw new Error(`Product code mismatch for ${productData.product_id}. Expected ${existingProduct.product_code}, got ${productData.product_code}`);
        }

        // ✅ FIXED: Use direct field assignments for EntryOrderProduct
        const productUpdateData = {
          serial_number: productData.serial_number,
          supplier_id: productData.supplier_id, // ✅ Direct field
          product_code: productData.product_code,
          product_id: productData.product_id, // ✅ Direct field
          lot_series: productData.lot_series,
          manufacturing_date: productData.manufacturing_date
            ? toUTC(productData.manufacturing_date)
            : null,
          expiration_date: productData.expiration_date
            ? toUTC(productData.expiration_date)
            : null,
          inventory_quantity: parseInt(productData.inventory_quantity),
          package_quantity: parseInt(productData.package_quantity),
          quantity_pallets: parseInt(productData.quantity_pallets) || null,
          presentation: productData.presentation || PresentationType.CAJA,
          guide_number: productData.guide_number,
          weight_kg: parseFloat(productData.weight_kg),
          volume_m3: parseFloat(productData.volume_m3) || null,
          insured_value: parseFloat(productData.insured_value) || null,
          temperature_range:
            productData.temperature_range || TemperatureRangeType.AMBIENTE,
          humidity: productData.humidity,
          health_registration: productData.health_registration,
        };

        try {
          if (productData.entry_order_product_id) {
            // Update existing product
            await tx.entryOrderProduct.update({
              where: {
                entry_order_product_id: productData.entry_order_product_id,
              },
              data: productUpdateData,
            });
          } else {
            // Create new product
            await tx.entryOrderProduct.create({
              data: {
                entry_order_id: existingOrder.entry_order_id,
                ...productUpdateData,
              },
            });
          }
        } catch (error) {
          // ✅ Handle unique constraint violation
          if (error.code === 'P2002' && error.meta?.target?.includes('entry_order_product_unique')) {
            throw new Error(`Product code ${productData.product_code} already exists in this entry order. Each product can only be added once per entry order.`);
          }
          throw error;
        }
      }
    }

    // 6. Return updated order with full details
    return await tx.entryOrder.findUnique({
      where: { entry_order_id: updatedOrder.entry_order_id },
      include: {
        products: {
          include: {
            product: { select: { product_code: true, name: true } },
            supplier: { select: { name: true } },
          },
        },
        origin: { select: { name: true, type: true } },
        documentType: { select: { name: true, type: true } },
        warehouse: { select: { name: true } },
        creator: { select: { first_name: true, last_name: true } },
        order: { select: { status: true, priority: true } },
      },
    });
  });
}

module.exports = {
  createEntryOrder,
  updateEntryOrder,
  getAllEntryOrders,
  getEntryFormFields,
  getCurrentEntryOrderNo,
  getEntryOrderByNo,
  getApprovedEntryOrders,
  reviewEntryOrder,
  getEntryOrdersByStatus,
};
