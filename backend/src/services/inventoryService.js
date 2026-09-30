const { Op } = require('sequelize');
const { Purchase, Transfer, Assignment, Expenditure, Base, EquipmentType } = require('../models');

/**
 * Helper to sum quantity for a given model and query options
 */
const sumQuantity = async (model, whereClause, transaction = null) => {
  const result = await model.sum('quantity', { where: whereClause, transaction });
  return result || 0;
};

/**
 * Calculate current total available stock for a given base and equipment type up to now.
 */
const getAvailableStock = async (baseId, equipmentTypeId, transaction = null) => {
  const baseIdNum = parseInt(baseId, 10);
  const equipIdNum = parseInt(equipmentTypeId, 10);

  const purchases = await sumQuantity(Purchase, { base_id: baseIdNum, equipment_type_id: equipIdNum }, transaction);
  const transferIn = await sumQuantity(Transfer, { to_base_id: baseIdNum, equipment_type_id: equipIdNum }, transaction);
  const transferOut = await sumQuantity(Transfer, { from_base_id: baseIdNum, equipment_type_id: equipIdNum }, transaction);
  const assigned = await sumQuantity(Assignment, { base_id: baseIdNum, equipment_type_id: equipIdNum }, transaction);
  const expended = await sumQuantity(Expenditure, { base_id: baseIdNum, equipment_type_id: equipIdNum }, transaction);

  return purchases + transferIn - transferOut - assigned - expended;
};

/**
 * Calculates inventory metrics (Opening, Purchases, Transfer In, Transfer Out, Net Movement, Assigned, Expended, Closing)
 * based on filters (baseId, equipmentTypeId, startDate, endDate).
 */
const calculateInventoryMetrics = async ({ baseId, equipmentTypeId, startDate, endDate }) => {
  // Build base where filters
  const baseWhere = baseId ? { id: baseId } : {};
  const equipWhere = equipmentTypeId ? { id: equipmentTypeId } : {};

  const bases = await Base.findAll({ where: baseWhere, order: [['name', 'ASC']] });
  const equipmentTypes = await EquipmentType.findAll({ where: equipWhere, order: [['name', 'ASC']] });

  const items = [];

  for (const b of bases) {
    for (const e of equipmentTypes) {
      // 1. Opening Balance (all transactions before startDate)
      let openingBalance = 0;
      if (startDate) {
        const preDateFilter = { [Op.lt]: startDate };

        const prevPurchases = await sumQuantity(Purchase, { base_id: b.id, equipment_type_id: e.id, purchase_date: preDateFilter });
        const prevTransferIn = await sumQuantity(Transfer, { to_base_id: b.id, equipment_type_id: e.id, transfer_date: preDateFilter });
        const prevTransferOut = await sumQuantity(Transfer, { from_base_id: b.id, equipment_type_id: e.id, transfer_date: preDateFilter });
        const prevAssigned = await sumQuantity(Assignment, { base_id: b.id, equipment_type_id: e.id, assignment_date: preDateFilter });
        const prevExpended = await sumQuantity(Expenditure, { base_id: b.id, equipment_type_id: e.id, expenditure_date: preDateFilter });

        openingBalance = prevPurchases + prevTransferIn - prevTransferOut - prevAssigned - prevExpended;
      }

      // 2. Current period date filter
      const periodFilter = {};
      if (startDate && endDate) {
        periodFilter[Op.between] = [startDate, endDate];
      } else if (startDate) {
        periodFilter[Op.gte] = startDate;
      } else if (endDate) {
        periodFilter[Op.lte] = endDate;
      }

      const purchaseWhere = { base_id: b.id, equipment_type_id: e.id };
      const transferInWhere = { to_base_id: b.id, equipment_type_id: e.id };
      const transferOutWhere = { from_base_id: b.id, equipment_type_id: e.id };
      const assignedWhere = { base_id: b.id, equipment_type_id: e.id };
      const expendedWhere = { base_id: b.id, equipment_type_id: e.id };

      if (Object.keys(periodFilter).length > 0) {
        purchaseWhere.purchase_date = periodFilter;
        transferInWhere.transfer_date = periodFilter;
        transferOutWhere.transfer_date = periodFilter;
        assignedWhere.assignment_date = periodFilter;
        expendedWhere.expenditure_date = periodFilter;
      }

      const purchases = await sumQuantity(Purchase, purchaseWhere);
      const transferIn = await sumQuantity(Transfer, transferInWhere);
      const transferOut = await sumQuantity(Transfer, transferOutWhere);
      const assigned = await sumQuantity(Assignment, assignedWhere);
      const expended = await sumQuantity(Expenditure, expendedWhere);

      const netMovement = purchases + transferIn - transferOut;
      const closingBalance = openingBalance + netMovement - assigned - expended;

      // Only include items if there's any activity or balance unless filters specifically target single base/equipment
      if (baseId || equipmentTypeId || openingBalance !== 0 || purchases !== 0 || transferIn !== 0 || transferOut !== 0 || assigned !== 0 || expended !== 0 || closingBalance !== 0) {
        items.push({
          baseId: b.id,
          baseName: b.name,
          location: b.location,
          equipmentTypeId: e.id,
          equipmentName: e.name,
          category: e.category,
          openingBalance,
          purchases,
          transferIn,
          transferOut,
          netMovement,
          assigned,
          expended,
          closingBalance
        });
      }
    }
  }

  // Summary totals for dashboard
  const totalOpening = items.reduce((acc, curr) => acc + curr.openingBalance, 0);
  const totalPurchases = items.reduce((acc, curr) => acc + curr.purchases, 0);
  const totalTransferIn = items.reduce((acc, curr) => acc + curr.transferIn, 0);
  const totalTransferOut = items.reduce((acc, curr) => acc + curr.transferOut, 0);
  const totalNetMovement = items.reduce((acc, curr) => acc + curr.netMovement, 0);
  const totalAssigned = items.reduce((acc, curr) => acc + curr.assigned, 0);
  const totalExpended = items.reduce((acc, curr) => acc + curr.expended, 0);
  const totalClosing = items.reduce((acc, curr) => acc + curr.closingBalance, 0);

  return {
    summary: {
      openingBalance: totalOpening,
      purchases: totalPurchases,
      transferIn: totalTransferIn,
      transferOut: totalTransferOut,
      netMovement: totalNetMovement,
      assigned: totalAssigned,
      expended: totalExpended,
      closingBalance: totalClosing
    },
    items
  };
};

module.exports = {
  getAvailableStock,
  calculateInventoryMetrics
};
