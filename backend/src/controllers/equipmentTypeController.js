const { validationResult } = require('express-validator');
const { EquipmentType } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const logAudit = require('../utils/auditLogger');

const getEquipmentTypes = async (req, res) => {
  try {
    const equipmentTypes = await EquipmentType.findAll({ order: [['name', 'ASC']] });
    return sendSuccess(res, 'Equipment types retrieved successfully', { equipmentTypes });
  } catch (err) {
    console.error('Fetch equipment types error:', err);
    return sendError(res, 'Failed to fetch equipment types', 500);
  }
};

const createEquipmentType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { name, category, description } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    const existing = await EquipmentType.findOne({ where: { name } });
    if (existing) {
      return sendError(res, 'Equipment type name already exists', 400);
    }

    const equipmentType = await EquipmentType.create({ name, category, description });

    await logAudit({
      userId: req.user.id,
      action: 'EQUIPMENT_CREATED',
      entityType: 'EQUIPMENT_TYPE',
      entityId: equipmentType.id,
      details: { name, category },
      ipAddress: clientIp
    });

    return sendSuccess(res, 'Equipment type created successfully', { equipmentType }, 201);
  } catch (err) {
    console.error('Create equipment type error:', err);
    return sendError(res, 'Failed to create equipment type', 500);
  }
};

const updateEquipmentType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { name, category, description } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    const equipmentType = await EquipmentType.findByPk(id);
    if (!equipmentType) {
      return sendError(res, 'Equipment type not found', 404);
    }

    if (name && name !== equipmentType.name) {
      const existing = await EquipmentType.findOne({ where: { name } });
      if (existing) {
        return sendError(res, 'Equipment type name already in use', 400);
      }
      equipmentType.name = name;
    }

    if (category) equipmentType.category = category;
    if (description !== undefined) equipmentType.description = description;

    await equipmentType.save();

    await logAudit({
      userId: req.user.id,
      action: 'EQUIPMENT_UPDATED',
      entityType: 'EQUIPMENT_TYPE',
      entityId: equipmentType.id,
      details: { name: equipmentType.name, category: equipmentType.category },
      ipAddress: clientIp
    });

    return sendSuccess(res, 'Equipment type updated successfully', { equipmentType });
  } catch (err) {
    console.error('Update equipment type error:', err);
    return sendError(res, 'Failed to update equipment type', 500);
  }
};

module.exports = {
  getEquipmentTypes,
  createEquipmentType,
  updateEquipmentType
};
