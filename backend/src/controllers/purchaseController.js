const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize, Purchase, Base, EquipmentType, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const logAudit = require('../utils/auditLogger');

const getPurchases = async (req, res) => {
  try {
    let { date, startDate, endDate, base, equipmentType } = req.query;
    const where = {};

    if (req.user.role === 'BASE_COMMANDER') {
      base = req.user.base_id;
    }

    if (base) where.base_id = base;
    if (equipmentType) where.equipment_type_id = equipmentType;

    if (date) {
      where.purchase_date = date;
    } else if (startDate && endDate) {
      where.purchase_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.purchase_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.purchase_date = { [Op.lte]: endDate };
    }

    const purchases = await Purchase.findAll({
      where,
      include: [
        { model: Base, as: 'base', attributes: ['id', 'name', 'location'] },
        { model: EquipmentType, as: 'equipmentType', attributes: ['id', 'name', 'category'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['purchase_date', 'DESC'], ['id', 'DESC']]
    });

    return sendSuccess(res, 'Purchases retrieved successfully', { purchases });
  } catch (err) {
    console.error('Fetch purchases error:', err);
    return sendError(res, 'Failed to fetch purchases', 500);
  }
};

const createPurchase = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }

  const { base_id, equipment_type_id, quantity, purchase_date, reference_number, remarks } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  const t = await sequelize.transaction();
  try {
    const base = await Base.findByPk(base_id, { transaction: t });
    if (!base) {
      await t.rollback();
      return sendError(res, 'Target base does not exist', 400);
    }

    const equipment = await EquipmentType.findByPk(equipment_type_id, { transaction: t });
    if (!equipment) {
      await t.rollback();
      return sendError(res, 'Equipment type does not exist', 400);
    }

    const purchase = await Purchase.create({
      base_id: parseInt(base_id, 10),
      equipment_type_id: parseInt(equipment_type_id, 10),
      quantity: parseInt(quantity, 10),
      purchase_date,
      reference_number: reference_number || null,
      remarks: remarks || null,
      created_by: req.user.id
    }, { transaction: t });

    await logAudit({
      userId: req.user.id,
      action: 'PURCHASE_CREATED',
      entityType: 'PURCHASE',
      entityId: purchase.id,
      details: { base_id, equipment_type_id, quantity, reference_number },
      ipAddress: clientIp
    }, t);

    await t.commit();

    const createdRecord = await Purchase.findByPk(purchase.id, {
      include: [
        { model: Base, as: 'base', attributes: ['id', 'name', 'location'] },
        { model: EquipmentType, as: 'equipmentType', attributes: ['id', 'name', 'category'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    return sendSuccess(res, 'Purchase recorded successfully', { purchase: createdRecord }, 201);
  } catch (err) {
    await t.rollback();
    console.error('Create purchase error:', err);
    return sendError(res, 'Failed to record purchase', 500);
  }
};

module.exports = {
  getPurchases,
  createPurchase
};
