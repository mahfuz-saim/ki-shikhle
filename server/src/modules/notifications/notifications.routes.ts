import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as ctrl from './notifications.controller';
const router=Router();
router.use(auth());
router.get('/', ctrl.list);
router.post('/:id/read', ctrl.read);
router.post('/read-all', ctrl.readAll);
export default router;
