import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { auth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from './auth.schema';
import * as ctrl from './auth.controller';

const router = Router();

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
router.post('/account/restore', ctrl.restoreAccount);
router.get('/export', auth(), ctrl.exportData);

export default router;
