import { Router } from 'express';
const router = Router();
// Stub - real implementation in later phases
router.get('/', (req, res) => res.json({ success: true, data: { message: 'subjects - coming soon', module: 'subjects' }, error: null }));
router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', module: 'subjects' }, error: null }));
export default router;
