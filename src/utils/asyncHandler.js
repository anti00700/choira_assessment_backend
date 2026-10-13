// Pass rejected promises to Express.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
