const { calculateInventoryMetrics } = require('../services/inventoryService');
const { sendSuccess, sendError } = require('../utils/response');

const getDashboard = async (req, res) => {
  try {
    let baseId = req.query.base || req.query.baseId;
    const equipmentTypeId = req.query.equipmentType || req.query.equipmentTypeId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Enforce base restriction for Base Commander
    if (req.user.role === 'BASE_COMMANDER') {
      baseId = req.user.base_id;
    }

    const metrics = await calculateInventoryMetrics({
      baseId: baseId ? parseInt(baseId, 10) : null,
      equipmentTypeId: equipmentTypeId ? parseInt(equipmentTypeId, 10) : null,
      startDate,
      endDate
    });

    return sendSuccess(res, 'Dashboard metrics retrieved successfully', metrics);
  } catch (err) {
    console.error('Dashboard error:', err);
    return sendError(res, 'Failed to fetch dashboard metrics', 500);
  }
};

module.exports = {
  getDashboard
};
