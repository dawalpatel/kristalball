const { AuditLog } = require('../models');

const logAudit = async ({ userId, action, entityType, entityId = null, details = null, ipAddress = null }, transaction = null) => {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
    await AuditLog.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: detailsStr,
      ip_address: ipAddress
    }, transaction ? { transaction } : {});
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = logAudit;
