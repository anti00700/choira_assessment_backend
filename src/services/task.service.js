const ApiError = require('../utils/ApiError');
const Project = require('../models/project.model');
const Task = require('../models/task.model');

async function assertProjectOwned(projectId, userId) {
  const project = await Project.findByIdForUser(projectId, userId);
  if (!project) throw ApiError.notFound('Project not found');
}

async function createTask(userId, data) {
  await assertProjectOwned(data.projectId, userId);
  return Task.create({ ...data, userId });
}

async function listTasks(userId, { page, limit, status, priority, projectId }) {
  const filter = { userId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (projectId) filter.projectId = projectId;

  const skip = (page - 1) * limit;

  const [tasks, totalRecords] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  return {
    tasks,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

async function getTask(id, userId) {
  const task = await Task.findOne({ _id: id, userId });
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

async function updateTask(id, userId, data) {
  if (data.projectId !== undefined) await assertProjectOwned(data.projectId, userId);

  const task = await Task.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

async function deleteTask(id, userId) {
  const task = await Task.findOneAndDelete({ _id: id, userId });
  if (!task) throw ApiError.notFound('Task not found');
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };
