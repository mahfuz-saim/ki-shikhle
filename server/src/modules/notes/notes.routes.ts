import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import * as ctrl from './notes.controller';

const router = Router();
router.use(auth());

router.post('/children/:id/notes', ctrl.create);
router.get('/children/:id/notes', ctrl.list);
router.post('/children/:id/notes/ai-make', ctrl.aiMake);
router.patch('/notes/:id', ctrl.update);
router.delete('/notes/:id', ctrl.remove);
router.post('/notes/:id/ai-ocr', ctrl.aiOcr);

export default router;
