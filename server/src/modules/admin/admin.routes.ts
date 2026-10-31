import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as ctrl from './admin.controller';
const router=Router();
// In real, require admin role: auth('admin')
router.use(auth());
router.get('/metrics', ctrl.metrics);
router.get('/ai-usage', ctrl.aiUsage);
router.get('/users', ctrl.users);
router.post('/users/:id/extend-trial', ctrl.extendTrial);
export default router;
