import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createEntrySchema, updateEntrySchema } from './entries.schema';
import * as ctrl from './entries.controller';

const router = Router();
router.use(auth());

/**
 * Verification is the **parent's** act.
 *
 * The entry's `verifiedByParent` flag is the parent's guarantee that they checked
 * the child's log. `assertEntityAccess` only proves the entry is the actor's own
 * child's, so without a role gate a child could self-attest their own entry as
 * parent-verified — which is exactly the field whose value is being forged.
 */
const parentOnly = auth('parent');

router.get('/children/:id/entries', ctrl.list);
router.post('/children/:id/entries', validate(createEntrySchema), ctrl.create);
router.post('/children/:id/entries/voice-structure', ctrl.structureVoice);
router.patch('/entries/:id', validate(updateEntrySchema), ctrl.update);
router.delete('/entries/:id', ctrl.remove);
router.post('/entries/:id/verify', parentOnly, ctrl.verify);

export default router;
