const auditService = require("./audit.service");

/**
 * Create a new product-specific audit record with packaging updates
 */
async function createAudit(req, res) {
  try {
    const auditData = req.body;

    // Ensure required fields are present
    if (!auditData.entry_order_product_id || !auditData.audit_result) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: entry_order_product_id and audit_result",
      });
    }

    // Validate packaging type and status if provided
    if (auditData.packaging_type && !auditData.packaging_status) {
      return res.status(400).json({
        success: false,
        message: "packaging_status is required when packaging_type is provided",
      });
    }

    if (auditData.packaging_status && !auditData.packaging_type) {
      return res.status(400).json({
        success: false,
        message: "packaging_type is required when packaging_status is provided",
      });
    }

    // Set audited_by to the current user if not specified
    if (!auditData.audited_by) {
      auditData.audited_by = req.user.id;
    }

    const audit = await auditService.createProductAudit(auditData);

    return res.status(201).json({
      success: true,
      data: audit,
      message: `Product audit created successfully with result: ${audit.audit_result}`,
    });
  } catch (error) {
    console.error("Error creating audit:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating audit",
      error: error.message,
    });
  }
}

/**
 * Create multiple product audits at once with packaging updates
 */
async function createBulkAudits(req, res) {
  try {
    // FIX: Handle both 'audits' and 'auditsData' parameter names
    const { audits, auditsData, overall_audit_comments, auditorId } = req.body;

    // Use either audits or auditsData
    const auditsList = audits || auditsData;

    if (!auditsList || !Array.isArray(auditsList) || auditsList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: audits or auditsData array",
      });
    }

    // Validate each audit data
    for (let i = 0; i < auditsList.length; i++) {
      if (
        !auditsList[i].entry_order_product_id ||
        !auditsList[i].audit_result
      ) {
        return res.status(400).json({
          success: false,
          message: `Audit ${
            i + 1
          }: Missing required fields (entry_order_product_id, audit_result)`,
        });
      }

      // Validate packaging data
      if (auditsList[i].packaging_type && !auditsList[i].packaging_status) {
        return res.status(400).json({
          success: false,
          message: `Audit ${
            i + 1
          }: packaging_status is required when packaging_type is provided`,
        });
      }

      if (auditsList[i].packaging_status && !auditsList[i].packaging_type) {
        return res.status(400).json({
          success: false,
          message: `Audit ${
            i + 1
          }: packaging_type is required when packaging_status is provided`,
        });
      }

      // Add overall comments to each audit if provided
      if (overall_audit_comments) {
        auditsList[i].overall_audit_comments = overall_audit_comments;
      }
    }

    // Use provided auditorId or current user
    const finalAuditorId = auditorId || req.user.id;

    const results = await auditService.bulkAuditProducts(
      auditsList,
      finalAuditorId
    );

    return res.status(201).json({
      success: true,
      data: results,
      message: `${results.length} product audits created successfully`,
    });
  } catch (error) {
    console.error("Error creating bulk audits:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating bulk audits",
      error: error.message,
    });
  }
}

/**
 * Get all product audits for an entry order
 */
async function getEntryOrderAudits(req, res) {
  try {
    const { entry_order_id } = req.params;

    if (!entry_order_id) {
      return res.status(400).json({
        success: false,
        message: "Entry order ID is required",
      });
    }

    const audits = await auditService.getEntryOrderAudits(entry_order_id);

    return res.status(200).json({
      success: true,
      data: audits,
      count: audits.length,
    });
  } catch (error) {
    console.error("Error getting audits:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting audits",
      error: error.message,
    });
  }
}

/**
 * Get audit details by ID
 */
async function getAuditById(req, res) {
  try {
    const { audit_id } = req.params;

    if (!audit_id) {
      return res.status(400).json({
        success: false,
        message: "Audit ID is required",
      });
    }

    const audit = await auditService.getAuditById(audit_id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: "Audit not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: audit,
    });
  } catch (error) {
    console.error("Error getting audit:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting audit",
      error: error.message,
    });
  }
}

/**
 * Get all audits with optional filters
 */
async function getAllAudits(req, res) {
  try {
    const filters = {
      audit_result: req.query.result,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      product_id: req.query.product_id,
      entry_order_no: req.query.entry_order_no,
      sort_order: req.query.sort || "desc",
    };

    const audits = await auditService.getAllAudits(filters);

    return res.status(200).json({
      success: true,
      data: audits,
      count: audits.length,
    });
  } catch (error) {
    console.error("Error getting all audits:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting all audits",
      error: error.message,
    });
  }
}

/**
 * Get audit statistics summary
 */
async function getAuditStatistics(req, res) {
  try {
    const stats = await auditService.getAuditStatistics();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting audit statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting audit statistics",
      error: error.message,
    });
  }
}

/**
 * Get products pending audit for a specific entry order
 */
async function getPendingProductAudits(req, res) {
  try {
    const { entry_order_id } = req.params;
    const organisationId = req.user?.organisation_id;

    if (!entry_order_id) {
      return res.status(400).json({
        success: false,
        message: "Entry order ID is required",
      });
    }

    const products = await auditService.getPendingProductAudits(
      entry_order_id,
      organisationId
    );

    return res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error getting pending product audits:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting pending product audits",
      error: error.message,
    });
  }
}

/**
 * Get entry orders that have products pending audit
 */
async function getEntryOrdersWithPendingAudits(req, res) {
  try {
    const organisationId = req.user?.organisation_id;
    const userRole = req.user?.role?.name;

    // Only allow admin to see all organizations
    const filterOrg = userRole === "ADMIN" ? null : organisationId;

    const entryOrders = await auditService.getEntryOrdersWithPendingAudits(
      filterOrg
    );

    return res.status(200).json({
      success: true,
      data: entryOrders,
      count: entryOrders.length,
    });
  } catch (error) {
    console.error("Error getting entry orders with pending audits:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting entry orders with pending audits",
      error: error.message,
    });
  }
}

module.exports = {
  createAudit,
  createBulkAudits,
  getEntryOrderAudits,
  getAuditById,
  getAllAudits,
  getAuditStatistics,
  getPendingProductAudits,
  getEntryOrdersWithPendingAudits,
};
