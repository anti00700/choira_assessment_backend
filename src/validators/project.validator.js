const Joi = require('joi');
const { PROJECT_STATUSES } = require('../constants');

const name = Joi.string().trim().min(1).max(150);
const description = Joi.string().trim().allow('').max(2000);
const status = Joi.string().valid(...PROJECT_STATUSES);

const createProject = Joi.object({
  name: name.required(),
  description,
  status: status.default('active'),
});

const updateProject = Joi.object({ name, description, status }).min(1);

const listProjectsQuery = Joi.object({ status });

module.exports = { createProject, updateProject, listProjectsQuery };
