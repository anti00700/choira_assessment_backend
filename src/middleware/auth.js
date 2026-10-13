const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/user.model');


const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication required. Send "Authorization: Bearer <token>"');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token');
  }

  // Confirm that the user still exists.
  const user = await User.findById(Number(payload.sub));
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = user;
  next();
});

module.exports = { authenticate };
