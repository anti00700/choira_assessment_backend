const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

exports.register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  sendSuccess(res, { statusCode: 201, message: 'User registered successfully', data });
});

exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  sendSuccess(res, { message: 'Login successful', data });
});

exports.getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Profile fetched successfully', data: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  sendSuccess(res, { message: 'Profile updated successfully', data: user });
});
