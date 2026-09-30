const { calculateInventoryMetrics } = require('../services/inventoryService');
const { sendSuccess, sendError } = require('../utils/response');

const getInventory = async (req, res) => {
  try {
    let baseId = req.query.base || req.query.baseId;
    const equipmentTypeId = req.query.equipmentType || req.query.equipmentTypeId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (req.user.role === 'BASE_COMMANDER') {
      baseId = req.user.base_id;
    }

    const inventoryData = await calculateInventoryMetrics({
      baseId: baseId ? parseInt(baseId, 10) : null,
      equipmentTypeId: equipmentTypeId ? parseInt(equipmentTypeId, 10) : null,
      startDate,
      endDate
    });

    return sendSuccess(res, 'Inventory data retrieved successfully', inventoryData);
  } catch (err) {
    console.error('Inventory fetch error:', err);
    return sendError(res, 'Failed to fetch inventory data', 500);
  }
};

module.exports = {
  getInventory
};
