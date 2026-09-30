const express = require('express');
const { body } = require('express-validator');
const { getUsers, createUser, updateUser } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Admin only user management
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', getUsers);

router.post('/', [
  body('name').notEmpty().withMessage('User name is required'),
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']).withMessage('Valid role is required')
], createUser);

router.put('/:id', [
  body('name').optional().notEmpty().withMessage('User name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email address is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']).withMessage('Valid role is required')
], updateUser);

module.exports = router;
