const { PrismaClient, AuditResult } = require("@prisma/client");
const { getPackagingCode } = require("../../utils/packagingCodes");
const prisma = new PrismaClient();

/**
 * Get all product-specific audits for an entry order
 */
async function getEntryOrderAudits(entry_order_id) {
  return prisma.entryOrderProductAudit.findMany({
    where: {
      entry_order_product: {
        entry_order_id: parseInt(entry_order_id),
      },
    },
    include: {
      auditor: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      entry_order_product: {
        select: {
          entry_order_product_id: true,
          quantity_packaging: true,
          total_weight: true,
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
          audit_status: true,
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
            },
          },
          entry_order: {
            select: {
              entry_order_id: true,
              entry_order_no: true,
            },
          },
        },
      },
    },
    orderBy: {
      audit_date: "desc",
    },
  });
}

/**
 * Get audit details by ID (product-specific audit)
 */
async function getAuditById(audit_id) {
  return prisma.entryOrderProductAudit.findUnique({
    where: { audit_id: parseInt(audit_id) },
    include: {
      auditor: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      entryOrderProduct: {
        select: {
          entry_order_product_id: true,
          quantity_packaging: true,
          total_qty: true,
          total_weight: true,
          total_volume: true,
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
          remaining_packaging_qty: true,
          remaining_weight: true,
          audit_status: true,
          expiration_date: true,
          product: {
            select: {
              product_id: true,
              product_code: true,
              name: true,
              temperature_range: {
                select: {
                  range: true,
                  min_celsius: true,
                  max_celsius: true,
                },
              },
            },
          },
          entry_order: {
            select: {
              entry_order_id: true,
              entry_order_no: true,
              supplier: {
                select: {
                  supplier_id: true,
                  name: true,
                },
              },
              warehouse: {
                select: {
                  warehouse_id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Get all product-specific audits with optional filters
 */
async function getAllAudits(filters = {}) {
  const where = {};

  if (filters.audit_result) {
    where.audit_result = filters.audit_result;
  }

  if (filters.start_date && filters.end_date) {
    where.audit_date = {
      gte: new Date(filters.start_date),
      lte: new Date(filters.end_date),
    };
  }

  if (filters.product_id) {
    where.entryOrderProduct = {
      product_id: parseInt(filters.product_id),
    };
  }

  if (filters.entry_order_no) {
    where.entryOrderProduct = {
      entry_order: {
        entry_order_no: {
          contains: filters.entry_order_no,
          mode: "insensitive",
        },
      },
    };
  }

  return prisma.entryOrderProductAudit.findMany({
    where,
    include: {
      auditor: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      entry_order_product: {
        select: {
          entry_order_product_id: true,
          quantity_packaging: true,
          total_weight: true,
          packaging_type: true,
          packaging_status: true,
          packaging_code: true,
          audit_status: true,
          product: {
            select: {
              product_code: true,
              name: true,
            },
          },
          entry_order: {
            select: {
              entry_order_id: true,
              entry_order_no: true,
            },
          },
        },
      },
    },
    orderBy: {
      audit_date: filters.sort_order === "asc" ? "asc" : "desc",
    },
  });
}

/**
 * Get audit statistics summary (updated for product-specific audits)
 */
async function getAuditStatistics() {
  const stats = await prisma.$transaction([
    // Product-specific audit counts
    prisma.entryOrderProductAudit.count({
      where: { audit_result: AuditResult.PASSED },
    }),
    prisma.entryOrderProductAudit.count({
      where: { audit_result: AuditResult.FAILED },
    }),
    prisma.entryOrderProductAudit.count({
      where: { audit_result: AuditResult.PENDING },
    }),
    prisma.entryOrderProductAudit.count(),

    // Entry order level statistics
    prisma.entryOrder.count({
      where: { audit_status: AuditResult.PASSED },
    }),
    prisma.entryOrder.count({
      where: { audit_status: AuditResult.FAILED },
    }),
    prisma.entryOrder.count({
      where: { audit_status: AuditResult.PENDING },
    }),
    prisma.entryOrder.count(),

    // Products awaiting audit
    prisma.entryOrderProduct.count({
      where: { audit_status: AuditResult.PENDING },
    }),
  ]);

  return {
    productAudits: {
      passed: stats[0],
      failed: stats[1],
      pending: stats[2],
      total: stats[3],
    },
    entryOrders: {
      passed: stats[4],
      failed: stats[5],
      pending: stats[6],
      total: stats[7],
    },
    productsAwaitingAudit: stats[8],
  };
}

/**
 * Create a new product-specific audit record with packaging updates
 */
async function createProductAudit(auditData) {
  return await prisma.$transaction(async (tx) => {
    // Calculate packaging code if packaging type or status is updated
    let packagingCode = null;
    if (auditData.packaging_type && auditData.packaging_status) {
      packagingCode = getPackagingCode(
        auditData.packaging_type,
        auditData.packaging_status
      );
    }

    // 1. Create the product-specific audit record
    const audit = await tx.entryOrderProductAudit.create({
      data: {
        entry_order_product_id: auditData.entry_order_product_id,
        audited_by: auditData.audited_by,
        audit_result: auditData.audit_result,
        comments: auditData.comments || null,
        discrepancy_notes: auditData.discrepancy_notes || null,
        // NEW: Store updated packaging info in audit record
        updated_packaging_type: auditData.packaging_type || null,
        updated_packaging_status: auditData.packaging_status || null,
        updated_packaging_code: packagingCode,
      },
      include: {
        auditor: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        entry_order_product: {
          select: {
            entry_order_product_id: true,
            entry_order_id: true,
            product: {
              select: {
                product_code: true,
                name: true,
              },
            },
            entry_order: {
              select: {
                entry_order_no: true,
              },
            },
          },
        },
      },
    });

    // 2. Prepare update data for the product
    const productUpdateData = {
      audit_status: auditData.audit_result,
      // If audit failed or has discrepancies, reset remaining quantities
      ...(auditData.audit_result === AuditResult.FAILED && {
        remaining_packaging_qty: 0,
        remaining_weight: 0,
      }),
    };

    // NEW: Update packaging information if provided
    if (auditData.packaging_type) {
      productUpdateData.packaging_type = auditData.packaging_type;
    }
    if (auditData.packaging_status) {
      productUpdateData.packaging_status = auditData.packaging_status;
    }
    if (packagingCode) {
      productUpdateData.packaging_code = packagingCode;
    }
    // Update product comments if provided
    if (auditData.product_comments) {
      productUpdateData.product_description = auditData.product_comments;
    }

    // Update the product's audit status and packaging info
    await tx.entry_order_product.update({
      where: {
        entry_order_product_id: auditData.entry_order_product_id,
      },
      data: productUpdateData,
    });

    // 3. Check if all products in the entry order have been audited
    const entryOrderId = audit.entry_order_product.entry_order_id;
    const allProducts = await tx.entryOrderProduct.findMany({
      where: { entry_order_id: entryOrderId },
      select: { audit_status: true },
    });

    // 4. Update overall entry order audit status based on product audits
    let overallStatus = AuditResult.PENDING;
    const allPassed = allProducts.every(
      (p) => p.audit_status === AuditResult.PASSED
    );
    const anyFailed = allProducts.some(
      (p) => p.audit_status === AuditResult.FAILED
    );
    const allCompleted = allProducts.every(
      (p) => p.audit_status !== AuditResult.PENDING
    );

    if (allCompleted) {
      if (anyFailed) {
        overallStatus = AuditResult.FAILED;
      } else if (allPassed) {
        overallStatus = AuditResult.PASSED;
      }
    }

    // NEW: Prepare entry order update data
    const entryOrderUpdateData = {
      audit_status: overallStatus,
    };

    // Update overall audit comments if provided
    if (auditData.overall_audit_comments) {
      entryOrderUpdateData.comments = auditData.overall_audit_comments;
    }

    await tx.entryOrder.update({
      where: { entry_order_id: entryOrderId },
      data: entryOrderUpdateData,
    });

    return audit;
  });
}

/**
 * Get products pending audit for a specific entry order
 */
async function getPendingProductAudits(entry_order_id, organisationId = null) {
  const where = {
    entry_order_id: parseInt(entry_order_id),
    audit_status: AuditResult.PENDING,
  };

  // Add organization filter if needed
  if (organisationId) {
    where.entry_order = {
      order: { organisation_id: organisationId },
    };
  }

  return prisma.entryOrderProduct.findMany({
    where,
    select: {
      entry_order_product_id: true,
      quantity_packaging: true,
      total_qty: true,
      total_weight: true,
      total_volume: true,
      packaging_type: true,
      packaging_status: true,
      packaging_code: true,
      expiration_date: true,
      mfd_date_time: true,
      presentation: true,
      product_description: true,
      insured_value: true,
      technical_specification: true,
      audit_status: true,
      product: {
        select: {
          product_id: true,
          product_code: true,
          name: true,
          temperature_range: {
            select: {
              range: true,
              min_celsius: true,
              max_celsius: true,
            },
          },
        },
      },
      entry_order: {
        select: {
          entry_order_id: true,
          entry_order_no: true,
          comments: true, // Include current overall comments
          supplier: {
            select: {
              name: true,
            },
          },
          warehouse: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      product: {
        product_code: "asc",
      },
    },
  });
}

/**
 * Get entry orders that have products pending audit
 */
async function getEntryOrdersWithPendingAudits(organisationId = null) {
  const where = {
    products: {
      some: {
        audit_status: AuditResult.PENDING,
      },
    },
  };

  if (organisationId) {
    where.order = { organisation_id: organisationId };
  }

  return prisma.entryOrder.findMany({
    where,
    select: {
      entry_order_id: true,
      entry_order_no: true,
      entry_date: true,
      audit_status: true,
      comments: true, // Include overall comments
      supplier: {
        select: {
          name: true,
        },
      },
      warehouse: {
        select: {
          name: true,
        },
      },
      products: {
        where: {
          audit_status: AuditResult.PENDING,
        },
        select: {
          entry_order_product_id: true,
          quantity_packaging: true,
          total_weight: true,
          packaging_type: true,
          packaging_status: true,
          product_description: true, // Include product comments
          product: {
            select: {
              product_code: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: {
            where: {
              audit_status: AuditResult.PENDING,
            },
          },
        },
      },
    },
    orderBy: {
      entry_date: "desc",
    },
  });
}

/**
 * Bulk audit multiple products at once with packaging updates
 */
async function bulkAuditProducts(auditsData, auditorId) {
  return await prisma.$transaction(async (tx) => {
    const results = [];

    for (const auditData of auditsData) {
      // Calculate packaging code if packaging type or status is updated
      let packagingCode = null;
      if (auditData.packaging_type && auditData.packaging_status) {
        packagingCode = getPackagingCode(
          auditData.packaging_type,
          auditData.packaging_status
        );
      }

      const audit = await tx.entryOrderProductAudit.create({
        data: {
          entry_order_product_id: auditData.entry_order_product_id,
          audited_by: auditorId,
          audit_result: auditData.audit_result,
          comments: auditData.comments || null,
          discrepancy_notes: auditData.discrepancy_notes || null,
          // NEW: Store updated packaging info in audit record
          updated_packaging_type: auditData.packaging_type || null,
          updated_packaging_status: auditData.packaging_status || null,
          updated_packaging_code: packagingCode,
        },
        include: {
          entry_order_product: {
            select: {
              entry_order_id: true,
              product: {
                select: {
                  product_code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Prepare update data for the product
      const productUpdateData = {
        audit_status: auditData.audit_result,
        ...(auditData.audit_result === AuditResult.FAILED && {
          remaining_packaging_qty: 0,
          remaining_weight: 0,
        }),
      };

      // NEW: Update packaging information if provided
      if (auditData.packaging_type) {
        productUpdateData.packaging_type = auditData.packaging_type;
      }
      if (auditData.packaging_status) {
        productUpdateData.packaging_status = auditData.packaging_status;
      }
      if (packagingCode) {
        productUpdateData.packaging_code = packagingCode;
      }
      // Update product comments if provided
      if (auditData.product_comments) {
        productUpdateData.product_description = auditData.product_comments;
      }

      // Update product audit status and packaging info
      await tx.entryOrderProduct.update({
        where: {
          entry_order_product_id: auditData.entry_order_product_id,
        },
        data: productUpdateData,
      });

      results.push(audit);
    }

    // Update overall entry order statuses for affected orders
    const entryOrderIds = [
      ...new Set(results.map((r) => r.entry_order_product.entry_order_id)),
    ];

    for (const entryOrderId of entryOrderIds) {
      const allProducts = await tx.entryOrderProduct.findMany({
        where: { entry_order_id: entryOrderId },
        select: { audit_status: true },
      });

      let overallStatus = AuditResult.PENDING;
      const allPassed = allProducts.every(
        (p) => p.audit_status === AuditResult.PASSED
      );
      const anyFailed = allProducts.some(
        (p) => p.audit_status === AuditResult.FAILED
      );
      const allCompleted = allProducts.every(
        (p) => p.audit_status !== AuditResult.PENDING
      );

      if (allCompleted) {
        if (anyFailed) {
          overallStatus = AuditResult.FAILED;
        } else if (allPassed) {
          overallStatus = AuditResult.PASSED;
        }
      }

      await tx.entryOrder.update({
        where: { entry_order_id: entryOrderId },
        data: { audit_status: overallStatus },
      });
    }

    return results;
  });
}

module.exports = {
  getEntryOrderAudits,
  getAuditById,
  getAllAudits,
  getAuditStatistics,
  createProductAudit,
  getPendingProductAudits,
  getEntryOrdersWithPendingAudits,
  bulkAuditProducts,
};
