const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const schemas = require('../validators/auth.validator');

router.post('/register', validate(schemas.register), controller.register);
router.post('/login', validate(schemas.login), controller.login);
router.get('/me', authenticate, controller.getMe);
router.put('/profile', authenticate, validate(schemas.updateProfile), controller.updateProfile);

module.exports = router;
