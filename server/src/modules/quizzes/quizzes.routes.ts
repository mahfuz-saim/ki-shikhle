import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { generateQuizSchema, questionPatchSchema } from './quizzes.schema';
import * as ctrl from './quizzes.controller';

const router = Router();
router.use(auth());

router.post('/children/:id/quizzes/generate', validate(generateQuizSchema), ctrl.generate);
router.get('/children/:id/quizzes', ctrl.list);
router.get('/children/:id/quizzes/auto-schedule', ctrl.getAutoSchedule);
router.post('/children/:id/quizzes/auto-schedule', ctrl.saveAutoSchedule);
router.post('/children/:id/quizzes/auto-schedule/run', ctrl.runAutoSchedule);

router.get('/quizzes/:id', ctrl.getOne);
router.patch('/quizzes/:id/questions/:qid', validate(questionPatchSchema), ctrl.patchQ);
router.post('/quizzes/:id/questions/:qid/regenerate', ctrl.regenQ);
router.post('/quizzes/:id/assign', ctrl.assign);
router.post('/quizzes/:id/attempts', ctrl.createAttempt);
router.put('/attempts/:id/answers', ctrl.saveAnswers);
router.post('/attempts/:id/submit', ctrl.submit);
// `GET /attempts/:id` is NOT registered here. It used to be — and because the quizzes
// router is mounted before the results router, this shadowed the results router's
// handler, so the client never received `perTopic` or the AI explanation. The results
// router is now the single source: `GET /attempts/:id` -> {attempt, perTopic, explanation}.
router.post('/questions/:id/report', ctrl.report);

export default router;
