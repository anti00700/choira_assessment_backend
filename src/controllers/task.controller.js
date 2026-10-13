const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const taskService = require('../services/task.service');

exports.create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Task created successfully', data: task });
});

exports.list = asyncHandler(async (req, res) => {
  const { tasks, pagination } = await taskService.listTasks(req.user.id, req.query);
  sendSuccess(res, { message: 'Tasks fetched successfully', data: tasks, pagination });
});

exports.getOne = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.params.id, req.user.id);
  sendSuccess(res, { message: 'Task fetched successfully', data: task });
});

exports.update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.user.id, req.body);
  sendSuccess(res, { message: 'Task updated successfully', data: task });
});

exports.remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user.id);
  sendSuccess(res, { message: 'Task deleted successfully' });
});
