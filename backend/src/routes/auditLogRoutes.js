const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('ADMIN'), getAuditLogs);

module.exports = router;
