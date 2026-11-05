import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import * as ctrl from './admin.controller';

const router = Router();

/**
 * The admin API is admin-only.
 *
 * This used to be `router.use(auth())` with a comment saying "In real, require admin
 * role" — which meant **any** authenticated parent or child could list every user on the
 * platform. The role is now enforced, and the role itself is re-read from the database by
 * `core/tenancy.ts`, so a demoted admin cannot keep using an old token.
 */
router.use(auth('admin'));

router.get('/metrics', ctrl.metrics);
router.get('/ai-usage', ctrl.aiUsage);
router.get('/users', ctrl.users);
router.post('/users/:id/extend-trial', ctrl.extendTrial);

export default router;
