const express = require('express');
const { body } = require('express-validator');
const { getAssignments, createAssignment } = require('../controllers/assignmentController');
const { authenticateToken, authorizeRoles, verifyBaseAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, verifyBaseAccess, getAssignments);

router.post('/', [
  authenticateToken,
  authorizeRoles('ADMIN', 'BASE_COMMANDER'),
  body('base_id').isInt({ gt: 0 }).withMessage('Valid Base ID is required'),
  body('equipment_type_id').isInt({ gt: 0 }).withMessage('Valid Equipment Type ID is required'),
  body('personnel_name').notEmpty().withMessage('Personnel name is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be greater than zero'),
  body('assignment_date').isISO8601().withMessage('Valid assignment date is required (YYYY-MM-DD)')
], createAssignment);

module.exports = router;
