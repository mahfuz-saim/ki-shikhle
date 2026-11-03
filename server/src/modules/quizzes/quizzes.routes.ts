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
router.get('/attempts/:id', ctrl.getAttempt);
router.post('/questions/:id/report', ctrl.report);

export default router;
