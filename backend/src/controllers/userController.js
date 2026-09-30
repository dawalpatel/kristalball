const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User, Base } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const logAudit = require('../utils/auditLogger');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Base, as: 'base', attributes: ['id', 'name', 'location'] }],
      order: [['id', 'ASC']]
    });
    return sendSuccess(res, 'Users retrieved successfully', { users });
  } catch (err) {
    console.error('Fetch users error:', err);
    return sendError(res, 'Failed to fetch users', 500);
  }
};

const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { name, email, password, role, base_id } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return sendError(res, 'User with this email already exists', 400);
    }

    if (base_id) {
      const baseExists = await Base.findByPk(base_id);
      if (!baseExists) {
        return sendError(res, 'Specified base does not exist', 400);
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password_hash,
      role: role || 'LOGISTICS_OFFICER',
      base_id: base_id ? parseInt(base_id, 10) : null
    });

    await logAudit({
      userId: req.user.id,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      details: { email, role, base_id },
      ipAddress: clientIp
    });

    const userWithBase = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Base, as: 'base', attributes: ['id', 'name', 'location'] }]
    });

    return sendSuccess(res, 'User created successfully', { user: userWithBase }, 201);
  } catch (err) {
    console.error('Create user error:', err);
    return sendError(res, 'Failed to create user', 500);
  }
};

const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { name, email, password, role, base_id } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return sendError(res, 'Email already in use by another user', 400);
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (base_id !== undefined) user.base_id = base_id ? parseInt(base_id, 10) : null;
    if (password) {
      user.password_hash = await bcrypt.hash(password, 10);
    }

    await user.save();

    await logAudit({
      userId: req.user.id,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, role: user.role, base_id: user.base_id },
      ipAddress: clientIp
    });

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Base, as: 'base', attributes: ['id', 'name', 'location'] }]
    });

    return sendSuccess(res, 'User updated successfully', { user: updatedUser });
  } catch (err) {
    console.error('Update user error:', err);
    return sendError(res, 'Failed to update user', 500);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser
};
