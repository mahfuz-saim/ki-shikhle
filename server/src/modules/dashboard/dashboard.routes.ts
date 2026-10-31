import { Router } from 'express';
const router = Router();
// Stub - real implementation in later phases
router.get('/', (req, res) => res.json({ success: true, data: { message: 'dashboard - coming soon', module: 'dashboard' }, error: null }));
router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', module: 'dashboard' }, error: null }));
export default router;
