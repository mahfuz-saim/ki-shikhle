import { Router } from 'express';
const router = Router();
// Stub - real implementation in later phases
router.get('/', (req, res) => res.json({ success: true, data: { message: 'quizzes - coming soon', module: 'quizzes' }, error: null }));
router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', module: 'quizzes' }, error: null }));
export default router;
