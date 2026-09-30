const express = require('express');
const { body } = require('express-validator');
const { getTransfers, createTransfer } = require('../controllers/transferController');
const { authenticateToken, authorizeRoles, verifyBaseAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, verifyBaseAccess, getTransfers);

router.post('/', [
  authenticateToken,
  authorizeRoles('ADMIN', 'LOGISTICS_OFFICER', 'BASE_COMMANDER'),
  body('from_base_id').isInt({ gt: 0 }).withMessage('Valid Source Base ID is required'),
  body('to_base_id').isInt({ gt: 0 }).withMessage('Valid Destination Base ID is required'),
  body('equipment_type_id').isInt({ gt: 0 }).withMessage('Valid Equipment Type ID is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than zero'),
  body('transfer_date').isISO8601().withMessage('Valid transfer date is required (YYYY-MM-DD)')
], createTransfer);

module.exports = router;
