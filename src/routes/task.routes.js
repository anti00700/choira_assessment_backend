const router = require('express').Router();
const controller = require('../controllers/task.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const schemas = require('../validators/task.validator');
const { objectIdParam } = require('../validators/common.validator');

router.use(authenticate);

router.post('/', validate(schemas.createTask), controller.create);
router.get('/', validate(schemas.listTasksQuery, 'query'), controller.list);
router.get('/:id', validate(objectIdParam, 'params'), controller.getOne);
router.put('/:id', validate(objectIdParam, 'params'), validate(schemas.updateTask), controller.update);
router.delete('/:id', validate(objectIdParam, 'params'), controller.remove);

module.exports = router;
