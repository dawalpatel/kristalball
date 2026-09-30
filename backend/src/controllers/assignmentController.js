const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize, Assignment, Base, EquipmentType, User } = require('../models');
const { getAvailableStock } = require('../services/inventoryService');
const { sendSuccess, sendError } = require('../utils/response');
const logAudit = require('../utils/auditLogger');

const getAssignments = async (req, res) => {
  try {
    let { base, equipmentType, startDate, endDate } = req.query;
    const where = {};

    if (req.user.role === 'BASE_COMMANDER') {
      base = req.user.base_id;
    }

    if (base) where.base_id = base;
    if (equipmentType) where.equipment_type_id = equipmentType;

    if (startDate && endDate) {
      where.assignment_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.assignment_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.assignment_date = { [Op.lte]: endDate };
    }

    const assignments = await Assignment.findAll({
      where,
      include: [
        { model: Base, as: 'base', attributes: ['id', 'name', 'location'] },
        { model: EquipmentType, as: 'equipmentType', attributes: ['id', 'name', 'category'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['assignment_date', 'DESC'], ['id', 'DESC']]
    });

    return sendSuccess(res, 'Assignments retrieved successfully', { assignments });
  } catch (err) {
    console.error('Fetch assignments error:', err);
    return sendError(res, 'Failed to fetch assignments', 500);
  }
};

const createAssignment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { base_id, equipment_type_id, personnel_name, quantity, assignment_date, remarks } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (req.user.role === 'BASE_COMMANDER' && parseInt(base_id, 10) !== parseInt(req.user.base_id, 10)) {
    return sendError(res, 'Base Commanders can only create assignments for their assigned base', 403);
  }

  const t = await sequelize.transaction();
  try {
    const base = await Base.findByPk(base_id, { transaction: t });
    if (!base) {
      await t.rollback();
      return sendError(res, 'Base does not exist', 400);
    }

    const equipment = await EquipmentType.findByPk(equipment_type_id, { transaction: t });
    if (!equipment) {
      await t.rollback();
      return sendError(res, 'Equipment type does not exist', 400);
    }

    const available = await getAvailableStock(base_id, equipment_type_id, t);
    const reqQty = parseInt(quantity, 10);
    if (available < reqQty) {
      await t.rollback();
      return sendError(res, `Insufficient inventory. Available: ${available}, Requested: ${reqQty}`, 400);
    }

    const assignment = await Assignment.create({
      base_id: parseInt(base_id, 10),
      equipment_type_id: parseInt(equipment_type_id, 10),
      personnel_name,
      quantity: reqQty,
      assignment_date,
      remarks: remarks || null,
      created_by: req.user.id
    }, { transaction: t });

    await logAudit({
      userId: req.user.id,
      action: 'ASSIGNMENT_CREATED',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: { base_id, equipment_type_id, personnel_name, quantity: reqQty },
      ipAddress: clientIp
    }, t);

    await t.commit();

    const createdRecord = await Assignment.findByPk(assignment.id, {
      include: [
        { model: Base, as: 'base', attributes: ['id', 'name', 'location'] },
        { model: EquipmentType, as: 'equipmentType', attributes: ['id', 'name', 'category'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    return sendSuccess(res, 'Assignment recorded successfully', { assignment: createdRecord }, 201);
  } catch (err) {
    await t.rollback();
    console.error('Create assignment error:', err);
    return sendError(res, 'Failed to record assignment', 500);
  }
};

module.exports = {
  getAssignments,
  createAssignment
};
