const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

exports.getDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboard(req.user.id);
  sendSuccess(res, { message: 'Dashboard fetched successfully', data: stats });
});
