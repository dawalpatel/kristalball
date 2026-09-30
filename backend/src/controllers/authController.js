const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Base } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const logAudit = require('../utils/auditLogger');

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Base, as: 'base', attributes: ['id', 'name', 'location'] }]
    });

    if (!user) {
      await logAudit({
        userId: null,
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        details: { email, reason: 'User not found' },
        ipAddress: clientIp
      });
      return sendError(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        details: { email, reason: 'Invalid password' },
        ipAddress: clientIp
      });
      return sendError(res, 'Invalid email or password', 401);
    }

    const payload = {
      userId: user.id,
      role: user.role,
      baseId: user.base_id
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    await logAudit({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      details: { role: user.role, baseId: user.base_id },
      ipAddress: clientIp
    });

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        base_id: user.base_id,
        base: user.base
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, 'Server error during login', 500);
  }
};

const logout = async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: req.user.id,
      details: { email: req.user.email },
      ipAddress: clientIp
    });
  }
  return sendSuccess(res, 'Logged out successfully');
};

const getMe = async (req, res) => {
  return sendSuccess(res, 'Current user profile', { user: req.user });
};

module.exports = {
  login,
  logout,
  getMe
};
