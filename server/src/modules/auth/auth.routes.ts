import { Router } from '../../platform/express-compat';
import { validate } from '../../middleware/validate';
import { auth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { requireSameOrigin } from '../../middleware/csrf';
import { registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from './auth.schema';
import * as ctrl from './auth.controller';

const router = Router();

/**
 * The refresh token lives in an `httpOnly` cookie that is `SameSite=None` in
 * production (the web app and the API are on different domains). A `SameSite=None`
 * cookie **is** attached to cross-site requests, so the state-changing routes that
 * read it must check the `Origin` themselves.
 *
 * `router.use()` applies to every route on this router, so the check covers
 * register / login / refresh / logout — the four that touch the cookie. The other
 * routes are unaffected: a request with no `Origin` header is not a browser form
 * post and passes through.
 */
router.use(requireSameOrigin);

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);

router.post('/verify-email', validate(verifyEmailSchema), ctrl.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), ctrl.resendVerification);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), ctrl.resetPassword);

router.post('/change-password', auth(), validate(changePasswordSchema), ctrl.changePassword);
router.get('/me', auth(), ctrl.me);
router.delete('/account', auth(), ctrl.deleteAccount);
// Restoring an account requires a session. It used to be public AND took the target
// account id from the request body — an unauthenticated "un-delete any account" API.
router.post('/account/restore', auth(), ctrl.restoreAccount);
router.get('/export', auth(), ctrl.exportData);

export default router;
