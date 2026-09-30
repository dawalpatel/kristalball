const express = require('express');
const { body } = require('express-validator');
const { getBases, createBase, updateBase } = require('../controllers/baseController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getBases);

router.post('/', [
  authenticateToken,
  authorizeRoles('ADMIN'),
  body('name').notEmpty().withMessage('Base name is required'),
  body('location').notEmpty().withMessage('Base location is required')
], createBase);

router.put('/:id', [
  authenticateToken,
  authorizeRoles('ADMIN'),
  body('name').optional().notEmpty().withMessage('Base name cannot be empty'),
  body('location').optional().notEmpty().withMessage('Base location cannot be empty')
], updateBase);

module.exports = router;
