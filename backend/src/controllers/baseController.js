const { validationResult } = require('express-validator');
const { Base } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const logAudit = require('../utils/auditLogger');

const getBases = async (req, res) => {
  try {
    const bases = await Base.findAll({ order: [['name', 'ASC']] });
    return sendSuccess(res, 'Bases retrieved successfully', { bases });
  } catch (err) {
    console.error('Fetch bases error:', err);
    return sendError(res, 'Failed to fetch bases', 500);
  }
};

const createBase = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { name, location } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    const existing = await Base.findOne({ where: { name } });
    if (existing) {
      return sendError(res, 'Base name already exists', 400);
    }

    const base = await Base.create({ name, location });

    await logAudit({
      userId: req.user.id,
      action: 'BASE_CREATED',
      entityType: 'BASE',
      entityId: base.id,
      details: { name, location },
      ipAddress: clientIp
    });

    return sendSuccess(res, 'Base created successfully', { base }, 201);
  } catch (err) {
    console.error('Create base error:', err);
    return sendError(res, 'Failed to create base', 500);
  }
};

const updateBase = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { name, location } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    const base = await Base.findByPk(id);
    if (!base) {
      return sendError(res, 'Base not found', 404);
    }

    if (name && name !== base.name) {
      const existing = await Base.findOne({ where: { name } });
      if (existing) {
        return sendError(res, 'Base name already in use', 400);
      }
      base.name = name;
    }

    if (location) base.location = location;
    await base.save();

    await logAudit({
      userId: req.user.id,
      action: 'BASE_UPDATED',
      entityType: 'BASE',
      entityId: base.id,
      details: { name: base.name, location: base.location },
      ipAddress: clientIp
    });

    return sendSuccess(res, 'Base updated successfully', { base });
  } catch (err) {
    console.error('Update base error:', err);
    return sendError(res, 'Failed to update base', 500);
  }
};

module.exports = {
  getBases,
  createBase,
  updateBase
};
