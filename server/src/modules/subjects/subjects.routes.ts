import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createSubjectSchema, updateSubjectSchema } from './subjects.schema';
import * as ctrl from './subjects.controller';
const router = Router();
router.use(auth());

/**
 * Who may do what.
 *
 * A child may read their own subject list. **Curating** it is the parent's job:
 * `assertChildAccess` passes for the child's own id, so without a role gate a child
 * could assign and unassign subjects on their own profile, and create a custom
 * subject on the parent's account (`createCustom` writes `parentId: actor.ownerId`).
 */
const parentOnly = auth('parent');

// The child's subject list, and the assignment endpoints.
//
// `router.use(auth())` applies to **every** route on this router regardless of
// declaration order, so all of these need a token — including the child-scoped ones.
router.get('/children/:id/subjects', ctrl.listForChild);
router.post('/children/:id/subjects/:subjectId', parentOnly, ctrl.assign);
router.delete('/children/:id/subjects/:subjectId', parentOnly, ctrl.unassign);

router.get('/', ctrl.list);
router.post('/', parentOnly, validate(createSubjectSchema), ctrl.create);
router.patch('/:id', parentOnly, validate(updateSubjectSchema), ctrl.update);
router.delete('/:id', parentOnly, ctrl.remove);
export default router;
