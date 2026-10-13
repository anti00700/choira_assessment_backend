const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', config.bcryptSaltRounds);

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.expiresIn,
  });
}

async function register({ name, email, password }) {
  if (await User.findByEmail(email)) {
    throw ApiError.conflict('Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  let userId;
  try {
    userId = await User.create({ name, email, passwordHash });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw ApiError.conflict('Email is already registered');
    throw err;
  }

  const user = await User.findById(userId);
  return { user, token: signToken(userId) };
}

async function login({ email, password }) {
  const record = await User.findByEmailWithPassword(email);
  const matches = await bcrypt.compare(password, record ? record.passwordHash : DUMMY_HASH);

  if (!record || !matches) throw ApiError.unauthorized('Invalid email or password');

  const { passwordHash, ...user } = record;
  return { user, token: signToken(user.id) };
}

async function updateProfile(userId, { name, email, currentPassword, newPassword }) {
  const fields = {};

  if (name !== undefined) fields.name = name;

  if (email !== undefined) {
    const existing = await User.findByEmail(email);
    if (existing && existing.id !== userId) throw ApiError.conflict('Email is already registered');
    fields.email = email;
  }

  if (newPassword !== undefined) {
    const record = await User.findByIdWithPassword(userId);
    const ok = await bcrypt.compare(currentPassword, record.passwordHash);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');
    fields.passwordHash = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
  }

  try {
    await User.update(userId, fields);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw ApiError.conflict('Email is already registered');
    throw err;
  }

  return User.findById(userId);
}

module.exports = { register, login, updateProfile };
