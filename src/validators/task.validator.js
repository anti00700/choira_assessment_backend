const Joi = require('joi');
const { TASK_STATUSES, TASK_PRIORITIES, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../constants');

const title = Joi.string().trim().min(1).max(200);
const description = Joi.string().trim().allow('').max(2000);
const status = Joi.string().valid(...TASK_STATUSES);
const priority = Joi.string().valid(...TASK_PRIORITIES);
const dueDate = Joi.date().iso().allow(null);
const projectId = Joi.number().integer().positive();

const createTask = Joi.object({
  title: title.required(),
  description,
  status: status.default('todo'),
  priority: priority.default('medium'),
  dueDate,
  projectId: projectId.required(),
});

const updateTask = Joi.object({ title, description, status, priority, dueDate, projectId }).min(1);

const listTasksQuery = Joi.object({
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  status,
  priority,
  projectId,
});

module.exports = { createTask, updateTask, listTasksQuery };
