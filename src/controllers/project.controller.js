const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const projectService = require('../services/project.service');

exports.create = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Project created successfully', data: project });
});

exports.list = asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user.id, req.query);
  sendSuccess(res, { message: 'Projects fetched successfully', data: projects });
});

exports.getOne = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.params.id, req.user.id);
  sendSuccess(res, { message: 'Project fetched successfully', data: project });
});

exports.update = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
  sendSuccess(res, { message: 'Project updated successfully', data: project });
});

exports.remove = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user.id);
  sendSuccess(res, { message: 'Project and its tasks deleted successfully' });
});
