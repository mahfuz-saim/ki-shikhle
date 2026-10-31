import { Router } from 'express';
const router = Router();
// Stub - real implementation in later phases
router.get('/', (req, res) => res.json({ success: true, data: { message: 'users - coming soon', module: 'users' }, error: null }));
router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', module: 'users' }, error: null }));
export default router;
