import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { generateQuizSchema, questionPatchSchema } from './quizzes.schema';
import * as ctrl from './quizzes.controller';

const router = Router();
router.use(auth());

/**
 * Who may do what.
 *
 * A child may **take** a quiz and read their own results. Authoring one is the
 * parent's job: generating a quiz spends the account's AI quota, and assigning one
 * sets the status the child sees. Without a role gate a child could generate a quiz
 * for themselves, regenerate its questions (burning more AI credit), and — because
 * `PATCH .../questions/:qid` also accepts `correctAnswer` — rewrite the answer key.
 *
 * The role is read from the database, not from the JWT claim, so a token minted
 * before an account was demoted cannot keep its old powers.
 */
const parentOnly = auth('parent');

router.post('/children/:id/quizzes/generate', parentOnly, validate(generateQuizSchema), ctrl.generate);
router.get('/children/:id/quizzes', ctrl.list);
router.get('/children/:id/quizzes/auto-schedule', ctrl.getAutoSchedule);
router.post('/children/:id/quizzes/auto-schedule', parentOnly, ctrl.saveAutoSchedule);
router.post('/children/:id/quizzes/auto-schedule/run', parentOnly, ctrl.runAutoSchedule);

router.get('/quizzes/:id', ctrl.getOne);
router.patch('/quizzes/:id/questions/:qid', parentOnly, validate(questionPatchSchema), ctrl.patchQ);
router.post('/quizzes/:id/questions/:qid/regenerate', parentOnly, ctrl.regenQ);
router.post('/quizzes/:id/assign', parentOnly, ctrl.assign);
router.post('/quizzes/:id/attempts', ctrl.createAttempt);
router.put('/attempts/:id/answers', ctrl.saveAnswers);
router.post('/attempts/:id/submit', ctrl.submit);
// `GET /attempts/:id` is NOT registered here. It used to be — and because the quizzes
// router is mounted before the results router, this shadowed the results router's
// handler, so the client never received `perTopic` or the AI explanation. The results
// router is now the single source: `GET /attempts/:id` -> {attempt, perTopic, explanation}.
router.post('/questions/:id/report', ctrl.report);

export default router;
