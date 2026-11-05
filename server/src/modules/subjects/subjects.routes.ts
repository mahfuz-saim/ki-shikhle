import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createSubjectSchema, updateSubjectSchema } from './subjects.schema';
import * as ctrl from './subjects.controller';
const router = Router();
router.use(auth());

// The child's subject list, and the assignment endpoints.
//
// `router.use(auth())` applies to **every** route on this router regardless of
// declaration order, so all of these need a token — including the child-scoped ones.
router.get('/children/:id/subjects', ctrl.listForChild);
router.post('/children/:id/subjects/:subjectId', ctrl.assign);
router.delete('/children/:id/subjects/:subjectId', ctrl.unassign);

router.get('/', ctrl.list);
router.post('/', validate(createSubjectSchema), ctrl.create);
router.patch('/:id', validate(updateSubjectSchema), ctrl.update);
router.delete('/:id', ctrl.remove);
export default router;
