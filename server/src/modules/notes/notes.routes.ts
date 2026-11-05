import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validateUpload } from '../../middleware/upload';
import * as ctrl from './notes.controller';

const router = Router();
router.use(auth());

// The upload guard runs before the handler, so an oversized or mistyped file is
// rejected before it reaches disk or object storage.
router.post('/children/:id/notes', validateUpload(), ctrl.create);
router.get('/children/:id/notes', ctrl.list);
router.post('/children/:id/notes/ai-make', validateUpload(), ctrl.aiMake);
router.patch('/notes/:id', ctrl.update);
router.delete('/notes/:id', ctrl.remove);
router.post('/notes/:id/ai-ocr', ctrl.aiOcr);

export default router;
