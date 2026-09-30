const express = require('express');
const { body } = require('express-validator');
const { getPurchases, createPurchase } = require('../controllers/purchaseController');
const { authenticateToken, authorizeRoles, verifyBaseAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, verifyBaseAccess, getPurchases);

router.post('/', [
  authenticateToken,
  authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'),
  body('base_id').isInt({ gt: 0 }).withMessage('Valid Base ID is required'),
  body('equipment_type_id').isInt({ gt: 0 }).withMessage('Valid Equipment Type ID is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than zero'),
  body('purchase_date').isISO8601().withMessage('Valid purchase date is required (YYYY-MM-DD)')
], createPurchase);

module.exports = router;
