const { PrismaClient, AuditResult } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get all audits for an entry order
 */
async function getEntryOrderAudits(entry_order_id) {
  return prisma.entryOrderAudit.findMany({
    where: { entry_order_id },
    include: {
      auditor: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      audit_date: "desc",
    },
  });
}

/**
 * Get audit details by ID
 */
async function getAuditById(audit_id) {
  return prisma.entryOrderAudit.findUnique({
    where: { audit_id },
    include: {
      auditor: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      entry_order: {
        select: {
          entry_order_id: true,
          entry_order_no: true,
          product: {
            select: {
              product_id: true,
              name: true,
            },
          },
          supplier: {
            select: {
              supplier_id: true,
              name: true,
            },
          },
          total_qty: true,
        },
      },
      inventoryLogs: {
        select: {
          log_id: true,
          timestamp: true,
          notes: true,
        },
      },
    },
  });
}

/**
 * Get all audits with optional filters
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

  return prisma.entryOrderAudit.findMany({
    where,
    include: {
      auditor: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      entry_order: {
        select: {
          entry_order_id: true,
          entry_order_no: true,
          product: {
            select: {
              name: true,
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
 * Get audit statistics summary
 */
async function getAuditStatistics() {
  const stats = await prisma.$transaction([
    prisma.entryOrderAudit.count({
      where: { audit_result: AuditResult.PASSED },
    }),
    prisma.entryOrderAudit.count({
      where: { audit_result: AuditResult.FAILED },
    }),
    prisma.entryOrderAudit.count({
      where: { audit_result: AuditResult.PENDING },
    }),
    prisma.entryOrderAudit.count(),
    prisma.entryOrder.count({
      where: { audit_status: null },
    }),
  ]);

  return {
    passed: stats[0],
    failed: stats[1],
    pending: stats[2],
    total: stats[3],
    unaudited: stats[4],
  };
}

/**
 * Create a new audit record for an entry order
 * and set the entry order's audit_status to the same result.
 */
async function createEntryOrderAudit(auditData) {
  // 1️⃣ Create the audit record (including relational selects)
  const audit = await prisma.entryOrderAudit.create({
    data: {
      entry_order_id: auditData.entry_order_id,
      audited_by: auditData.audited_by,
      audit_result: auditData.audit_result,
      comments: auditData.comments || null,
      discrepancy_notes: auditData.discrepancy_notes || null,
    },
    include: {
      auditor: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
      entry_order: {
        select: { entry_order_id: true, entry_order_no: true },
      },
    },
  });

  // 2️⃣ Update the entry order status in one go—no need for ifs
  await prisma.entryOrder.update({
    where: { entry_order_id: auditData.entry_order_id },
    data: { audit_status: auditData.audit_result },
  });

  return audit;
}

module.exports = {
  getEntryOrderAudits,
  getAuditById,
  getAllAudits,
  getAuditStatistics,
  createEntryOrderAudit, // Add the new function
};
