export class AppError extends Error {
  constructor(public statusCode: number, message: string, public code?: string, public details?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}
export const notFound = (msg = 'Not found') => new AppError(404, msg, 'NOT_FOUND');
export const unauthorized = (msg = 'Unauthorized') => new AppError(401, msg, 'UNAUTHORIZED');
export const forbidden = (msg = 'Forbidden') => new AppError(403, msg, 'FORBIDDEN');
export const badRequest = (msg = 'Bad request', details?: unknown) => new AppError(400, msg, 'BAD_REQUEST', details);
export const conflict = (msg = 'Conflict') => new AppError(409, msg, 'CONFLICT');
export const tooMany = (msg = 'Too many requests') => new AppError(429, msg, 'RATE_LIMITED');
