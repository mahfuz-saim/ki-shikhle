import { Router } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { checkoutSchema } from './billing.schema';
import * as ctrl from './billing.controller';

/**
 * The pricing page is public — a visitor must be able to read the plan list before they
 * have an account.
 *
 * It lives on its own router because `mountRouter` applies a router's `use()` middleware to
 * **every** route on that router regardless of declaration order (true Express semantics
 * would apply it only to routes registered after it). Declaring `/plans` above
 * `router.use(auth())` therefore did NOT make it public — it was still auth-gated, and the
 * pricing page 401'd for signed-out visitors.
 */
export const publicRouter = Router();
publicRouter.get('/plans', ctrl.plans);

const router = Router();

/**
 * Billing is the **parent's** account, not the child's.
 *
 * `auth()` with no role gate let a child token through, and `getInvoices` reads
 * `actor.ownerId` — which for a child actor is the **parent's** id. So a child could
 * read the family's invoices, subscription and plan. Every route on this router is
 * parent-only.
 */
router.use(auth('parent'));
router.get('/subscription', ctrl.subscription);
router.post('/demo-checkout', validate(checkoutSchema), ctrl.checkout);
router.post('/cancel', ctrl.cancel);
router.get('/invoices', ctrl.invoices);

export default router;
