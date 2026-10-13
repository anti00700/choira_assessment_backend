const Joi = require('joi');

const name = Joi.string().trim().min(2).max(100);
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255);
const password = Joi.string()
  .min(8)
  .max(72)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .messages({ 'string.pattern.base': 'password must contain at least one letter and one number' });

const register = Joi.object({
  name: name.required(),
  email: email.required(),
  password: password.required(),
});

const login = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

const updateProfile = Joi.object({
  name,
  email,
  currentPassword: Joi.string(),
  newPassword: password,
})
  .or('name', 'email', 'newPassword')
  .with('newPassword', 'currentPassword')
  .with('currentPassword', 'newPassword')
  .messages({ 'object.missing': 'Provide at least one of: name, email, newPassword' });

module.exports = { register, login, updateProfile };
