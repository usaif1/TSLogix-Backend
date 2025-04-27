const auditService = require('./audit.service');

/**
 * Create a new audit record for an entry order
 */
async function createAudit(req, res) {
  try {
    const auditData = req.body;
    
    // Ensure required fields are present
    if (!auditData.entry_order_id || !auditData.audit_result) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: entry_order_id and audit_result',
      });
    }
    
    // Set audited_by to the current user if not specified
    if (!auditData.audited_by) {
      auditData.audited_by = req.user.id;
    }
    
    const audit = await auditService.createEntryOrderAudit(auditData);
    
    return res.status(201).json({
      success: true,
      data: audit,
      message: `Audit created successfully with result: ${audit.audit_result}`,
    });
  } catch (error) {
    console.error('Error creating audit:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating audit',
      error: error.message,
    });
  }
}

/**
 * Get all audits for an entry order
 */
async function getEntryOrderAudits(req, res) {
  try {
    const { entry_order_id } = req.params;
    
    if (!entry_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Entry order ID is required',
      });
    }
    
    const audits = await auditService.getEntryOrderAudits(entry_order_id);
    
    return res.status(200).json({
      success: true,
      data: audits,
      count: audits.length,
    });
  } catch (error) {
    console.error('Error getting audits:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting audits',
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
        message: 'Audit ID is required',
      });
    }
    
    const audit = await auditService.getAuditById(audit_id);
    
    if (!audit) {
      return res.status(404).json({
        success: false,
        message: 'Audit not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: audit,
    });
  } catch (error) {
    console.error('Error getting audit:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting audit',
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
      sort_order: req.query.sort || 'desc',
    };
    
    const audits = await auditService.getAllAudits(filters);
    
    return res.status(200).json({
      success: true,
      data: audits,
      count: audits.length,
    });
  } catch (error) {
    console.error('Error getting all audits:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting all audits',
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
    console.error('Error getting audit statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting audit statistics',
      error: error.message,
    });
  }
}

module.exports = {
  createAudit,
  getEntryOrderAudits,
  getAuditById,
  getAllAudits,
  getAuditStatistics,
};