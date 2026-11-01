import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import * as ctrl from './notes.controller';
const router = Router();
router.use(auth());
router.post('/children/:id/notes', ctrl.create); // multipart parsed by the platform layer into req.file
router.get('/children/:id/notes', ctrl.list);
router.patch('/notes/:id', ctrl.update);
router.delete('/notes/:id', ctrl.remove);
router.post('/notes/:id/ai-ocr', ctrl.aiOcr);
export default router;
