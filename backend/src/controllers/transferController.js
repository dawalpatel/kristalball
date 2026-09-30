const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize, Transfer, Base, EquipmentType, User } = require('../models');
const { getAvailableStock } = require('../services/inventoryService');
const { sendSuccess, sendError } = require('../utils/response');
const logAudit = require('../utils/auditLogger');

const getTransfers = async (req, res) => {
  try {
    let { base, equipmentType, startDate, endDate } = req.query;
    const where = {};

    if (req.user.role === 'BASE_COMMANDER') {
      const userBaseId = parseInt(req.user.base_id, 10);
      where[Op.or] = [
        { from_base_id: userBaseId },
        { to_base_id: userBaseId }
      ];
    } else if (base) {
      const baseNum = parseInt(base, 10);
      where[Op.or] = [
        { from_base_id: baseNum },
        { to_base_id: baseNum }
      ];
    }

    if (equipmentType) where.equipment_type_id = equipmentType;

    if (startDate && endDate) {
      where.transfer_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.transfer_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.transfer_date = { [Op.lte]: endDate };
    }

    const transfers = await Transfer.findAll({
      where,
      include: [
        { model: Base, as: 'fromBase', attributes: ['id', 'name', 'location'] },
        { model: Base, as: 'toBase', attributes: ['id', 'name', 'location'] },
        { model: EquipmentType, as: 'equipmentType', attributes: ['id', 'name', 'category'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['transfer_date', 'DESC'], ['id', 'DESC']]
    });

    return sendSuccess(res, 'Transfers retrieved successfully', { transfers });
  } catch (err) {
    console.error('Fetch transfers error:', err);
    return sendError(res, 'Failed to fetch transfers', 500);
  }
};

const createTransfer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { from_base_id, to_base_id, equipment_type_id, quantity, transfer_date, remarks } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (parseInt(from_base_id, 10) === parseInt(to_base_id, 10)) {
    return sendError(res, 'Source base and destination base cannot be the same', 400);
  }

  // Base Commander check: Can only transfer FROM their own base
  if (req.user.role === 'BASE_COMMANDER' && parseInt(from_base_id, 10) !== parseInt(req.user.base_id, 10)) {
    return sendError(res, 'Base Commanders can only initiate transfers from their assigned base', 403);
  }

  const t = await sequelize.transaction();
  try {
    const fromBase = await Base.findByPk(from_base_id, { transaction: t });
    const toBase = await Base.findByPk(to_base_id, { transaction: t });
    if (!fromBase || !toBase) {
      await t.rollback();
      return sendError(res, 'Source or destination base does not exist', 400);
    }

    const equipment = await EquipmentType.findByPk(equipment_type_id, { transaction: t });
    if (!equipment) {
      await t.rollback();
      return sendError(res, 'Equipment type does not exist', 400);
    }

    // Check available inventory in source base
    const available = await getAvailableStock(from_base_id, equipment_type_id, t);
    const reqQty = parseInt(quantity, 10);
    if (available < reqQty) {
      await t.rollback();
      return sendError(res, `Insufficient inventory. Available: ${available}, Requested: ${reqQty}`, 400);
    }

    const transfer = await Transfer.create({
      from_base_id: parseInt(from_base_id, 10),
      to_base_id: parseInt(to_base_id, 10),
      equipment_type_id: parseInt(equipment_type_id, 10),
      quantity: reqQty,
      transfer_date,
      remarks: remarks || null,
      created_by: req.user.id
    }, { transaction: t });

    await logAudit({
      userId: req.user.id,
      action: 'TRANSFER_CREATED',
      entityType: 'TRANSFER',
      entityId: transfer.id,
      details: { from_base_id, to_base_id, equipment_type_id, quantity: reqQty },
      ipAddress: clientIp
    }, t);

    await t.commit();

    const createdRecord = await Transfer.findByPk(transfer.id, {
      include: [
        { model: Base, as: 'fromBase', attributes: ['id', 'name', 'location'] },
        { model: Base, as: 'toBase', attributes: ['id', 'name', 'location'] },
        { model: EquipmentType, as: 'equipmentType', attributes: ['id', 'name', 'category'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    return sendSuccess(res, 'Transfer created successfully', { transfer: createdRecord }, 201);
  } catch (err) {
    await t.rollback();
    console.error('Create transfer error:', err);
    return sendError(res, 'Failed to create transfer', 500);
  }
};

module.exports = {
  getTransfers,
  createTransfer
};
