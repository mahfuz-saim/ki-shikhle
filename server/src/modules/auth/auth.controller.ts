import { Request, Response, NextFunction } from '../../platform/express-compat';
import * as service from './auth.service';
import { env, cookieOptions } from '../../config/env';

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    ...cookieOptions,
    // SameSite=None + Secure in production: the API (Cloudflare) and the web app
    // (Vercel) are on different domains, so the refresh cookie is cross-site.
    maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.registerUser(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({ success: true, data: { user: result.user, accessToken: result.accessToken }, error: null });
  } catch (e) { next(e); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.loginUser(req.body.email, req.body.password, { ip: req.ip, userAgent: req.headers['user-agent'] });
    setRefreshCookie(res, result.refreshToken);
    res.json({ success: true, data: { user: result.user, accessToken: result.accessToken }, error: null });
  } catch (e) { next(e); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'] as string;
    if (!token) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Missing refresh token' } });
    const result = await service.refreshTokens(token);
    setRefreshCookie(res, result.refreshToken);
    res.json({ success: true, data: { accessToken: result.accessToken, user: result.user }, error: null });
  } catch (e) { next(e); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) await service.logout(token);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json({ success: true, data: { message: 'Logged out' }, error: null });
  } catch (e) { next(e); }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.verifyEmail(req.body.token); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.resendVerification(req.body.email); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.forgotPassword(req.body.email); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.resetPassword(req.body.token, req.body.password); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.changePassword((req.user as any).userId, req.body.currentPassword, req.body.newPassword); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.getMe((req.user as any).userId); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.deleteAccount((req.user as any).userId); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
export const restoreAccount = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.restoreAccount(req.body.userId || (req.user as any)?.userId); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
export const exportData = async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await service.exportData((req.user as any).userId); res.json({ success: true, data: r, error: null }); } catch (e) { next(e); }
};
