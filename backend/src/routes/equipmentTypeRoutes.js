const express = require('express');
const { body } = require('express-validator');
const { getEquipmentTypes, createEquipmentType, updateEquipmentType } = require('../controllers/equipmentTypeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getEquipmentTypes);

router.post('/', [
  authenticateToken,
  authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'),
  body('name').notEmpty().withMessage('Equipment name is required'),
  body('category').notEmpty().withMessage('Category is required')
], createEquipmentType);

router.put('/:id', [
  authenticateToken,
  authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'),
  body('name').optional().notEmpty().withMessage('Equipment name cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty')
], updateEquipmentType);

module.exports = router;
