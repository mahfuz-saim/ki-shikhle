import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createChildSchema, updateChildSchema, pinSchema, enterSchema } from './children.schema';
import * as ctrl from './children.controller';

const router = Router();

router.use(auth());

router.get('/', ctrl.list);
router.post('/', validate(createChildSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id', validate(updateChildSchema), ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/pin', validate(pinSchema), ctrl.setPin);
router.post('/:id/enter', validate(enterSchema), ctrl.enter);
router.post('/exit', ctrl.exit);

export default router;
