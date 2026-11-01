/**
 * Tiny structured logger.
 *
 * pino/pino-http rely on Node streams, which do not exist on Cloudflare Workers,
 * so we log JSON to the console — which Workers, Docker and `wrangler tail` all capture.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const min = (process.env.LOG_LEVEL as Level) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function write(level: Level, arg1?: unknown, arg2?: unknown) {
  if (ORDER[level] < (ORDER[min as Level] ?? 10)) return;
  const obj = typeof arg1 === 'object' && arg1 !== null ? (arg1 as Record<string, unknown>) : {};
  const msg = typeof arg1 === 'string' ? arg1 : typeof arg2 === 'string' ? arg2 : undefined;
  const line = { level, time: new Date().toISOString(), ...obj, ...(msg ? { msg } : {}) };
  // eslint-disable-next-line no-console
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(JSON.stringify(line));
}

export const logger = {
  debug: (a?: unknown, b?: unknown) => write('debug', a, b),
  info: (a?: unknown, b?: unknown) => write('info', a, b),
  warn: (a?: unknown, b?: unknown) => write('warn', a, b),
  error: (a?: unknown, b?: unknown) => write('error', a, b),
  child: () => logger,
};
export type Logger = typeof logger;
