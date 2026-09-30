const jwt = require('jsonwebtoken');
const { User, Base } = require('../models');
const { sendError } = require('../utils/response');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return sendError(res, 'Authentication token required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Base, as: 'base', attributes: ['id', 'name', 'location'] }]
    });

    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      base_id: user.base_id,
      base: user.base
    };
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden: You do not have permission to access this resource', 403);
    }
    next();
  };
};

// Ensures BASE_COMMANDER can only view/operate on their own base
const verifyBaseAccess = (req, res, next) => {
  if (req.user.role === 'BASE_COMMANDER') {
    const requestedBaseId = req.params.baseId || req.query.base || req.query.baseId || req.body.base_id || req.body.from_base_id;
    
    // If a base parameter was explicitly specified in request and differs from user's base_id
    if (requestedBaseId && parseInt(requestedBaseId, 10) !== parseInt(req.user.base_id, 10)) {
      return sendError(res, 'Forbidden: Base Commanders cannot access or operate on another base', 403);
    }

    // Force query/body base to user's base_id if appropriate
    req.baseIdOverride = req.user.base_id;
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  verifyBaseAccess
};
