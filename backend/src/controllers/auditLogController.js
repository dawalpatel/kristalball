const { AuditLog, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, userId } = req.query;
    const where = {};

    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;
    if (userId) where.user_id = userId;

    const logs = await AuditLog.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: 500
    });

    return sendSuccess(res, 'Audit logs retrieved successfully', { logs });
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    return sendError(res, 'Failed to fetch audit logs', 500);
  }
};

module.exports = {
  getAuditLogs
};
