const Joi = require('joi');

const idParam = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'id must be a positive integer',
    'number.integer': 'id must be a positive integer',
    'number.positive': 'id must be a positive integer',
  }),
});

const objectIdParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'id must be a valid ObjectId',
    'string.length': 'id must be a valid ObjectId',
  }),
});

module.exports = { idParam, objectIdParam };
