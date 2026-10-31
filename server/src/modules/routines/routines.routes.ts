import { Router } from 'express';
const router = Router();
// Stub - real implementation in later phases
router.get('/', (req, res) => res.json({ success: true, data: { message: 'routines - coming soon', module: 'routines' }, error: null }));
router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', module: 'routines' }, error: null }));
export default router;
