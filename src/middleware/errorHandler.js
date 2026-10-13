const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON in request body');
  if (err.type === 'entity.too.large') return new ApiError(413, 'Request body too large');

  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Token has expired');
  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token');

  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', errors);
  }
  if (err.name === 'CastError') return ApiError.badRequest(`Invalid value for "${err.path}"`);
  if (err.code === 11000) return ApiError.conflict('Duplicate value');

  if (err.code === 'ER_DUP_ENTRY') return ApiError.conflict('A record with this value already exists');
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return ApiError.badRequest('Referenced record does not exist');
  if (['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT'].includes(err.code) ||
      err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    return new ApiError(503, 'Database temporarily unavailable');
  }

  return new ApiError(500, 'Internal server error');
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);

  if (error.statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body = { success: false, message: error.message };
  if (error.errors) body.errors = error.errors;
  if (!config.isProd && error.statusCode >= 500) body.stack = err.stack;

  res.status(error.statusCode).json(body);
};

module.exports = { notFound, errorHandler };
