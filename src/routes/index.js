const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/projects', require('./project.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
