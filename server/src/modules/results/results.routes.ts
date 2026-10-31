import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as ctrl from './results.controller';
const router = Router();
router.use(auth());
router.get('/attempts/:id', ctrl.getResults);
router.post('/attempts/:id/explanation', ctrl.createExplanation);
export default router;
