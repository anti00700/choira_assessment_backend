const router = require('express').Router();
const controller = require('../controllers/project.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const schemas = require('../validators/project.validator');
const { idParam } = require('../validators/common.validator');

router.use(authenticate);

router.post('/', validate(schemas.createProject), controller.create);
router.get('/', validate(schemas.listProjectsQuery, 'query'), controller.list);
router.get('/:id', validate(idParam, 'params'), controller.getOne);
router.put('/:id', validate(idParam, 'params'), validate(schemas.updateProject), controller.update);
router.delete('/:id', validate(idParam, 'params'), controller.remove);

module.exports = router;
