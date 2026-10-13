const router = require('express').Router();
const controller = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, controller.getDashboard);

module.exports = router;
