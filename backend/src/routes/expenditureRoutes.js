const express = require('express');
const { body } = require('express-validator');
const { getExpenditures, createExpenditure } = require('../controllers/expenditureController');
const { authenticateToken, authorizeRoles, verifyBaseAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, verifyBaseAccess, getExpenditures);

router.post('/', [
  authenticateToken,
  authorizeRoles('ADMIN', 'BASE_COMMANDER'),
  body('base_id').isInt({ gt: 0 }).withMessage('Valid Base ID is required'),
  body('equipment_type_id').isInt({ gt: 0 }).withMessage('Valid Equipment Type ID is required'),
  body('reason').notEmpty().withMessage('Expenditure reason is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than zero'),
  body('expenditure_date').isISO8601().withMessage('Valid expenditure date is required (YYYY-MM-DD)')
], createExpenditure);

module.exports = router;
