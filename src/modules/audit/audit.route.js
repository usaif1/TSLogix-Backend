const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');


router.post('/', auditController.createAudit);

router.get('/entry-order/:entry_order_id', auditController.getEntryOrderAudits);

router.get('/:audit_id', auditController.getAuditById);

router.get('/', auditController.getAllAudits);

router.get('/statistics/summary', auditController.getAuditStatistics);

module.exports = router;