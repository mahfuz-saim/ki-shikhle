import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createChildSchema, updateChildSchema, pinSchema, enterSchema, unloggedAlertSchema } from './children.schema';
import * as ctrl from './children.controller';

const router = Router();

router.use(auth());

/**
 * Who may do what.
 *
 * A child may read their own profile and enter their own portal. Everything that
 * **manages** a child belongs to the parent: `assertChildAccess` only proves the
 * child row is the actor's own, so without a role gate a child could create a
 * sibling under the parent account, rename or re-grade themselves, soft-delete
 * their own profile, set their own PIN, and rewrite the parent's per-child alert
 * settings.
 *
 * The role is read from the database, not from the JWT claim, so a token minted
 * before an account was demoted cannot keep its old powers.
 */
const parentOnly = auth('parent');

router.get('/', ctrl.list);
router.post('/', parentOnly, validate(createChildSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id', parentOnly, validate(updateChildSchema), ctrl.update);
router.delete('/:id', parentOnly, ctrl.remove);
router.post('/:id/pin', parentOnly, validate(pinSchema), ctrl.setPin);
router.post('/:id/enter', validate(enterSchema), ctrl.enter);
router.post('/exit', ctrl.exit);
router.get('/:id/unlogged-alert', ctrl.getUnloggedAlert);
router.put('/:id/unlogged-alert', parentOnly, validate(unloggedAlertSchema), ctrl.saveUnloggedAlert);
router.post('/:id/unlogged-alert/test', parentOnly, ctrl.testUnloggedAlert);

export default router;
