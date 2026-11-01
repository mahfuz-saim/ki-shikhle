/**
 * Minimal Express-compatible layer on top of Hono.
 *
 * Why: this API must run on **Cloudflare Workers** (no `http` server, no filesystem,
 * no native modules). Express itself cannot run there, but rewriting 30+ controllers
 * and route files would be a huge, risky diff. Instead we keep the Express-style
 * `(req, res, next)` contract and run it on Hono — which works both on Workers
 * (`export default { fetch: app.fetch }`) and on Node (`@hono/node-server`).
 *
 * Supported Express surface (all this app uses):
 *   Router: .get/.post/.put/.patch/.delete/.use  •  paths with `:param`
 *   req:    .body .params .query .headers .header() .get() .cookies .user .file .files .raw .ip .method .path
 *   res:    .status() .json() .send() .end() .set() .setHeader() .cookie() .clearCookie() .redirect()
 *   next(): continues the chain; next(err) aborts into the error handler
 */
import type { Context, Next as HonoNext } from 'hono';

export type NextFunction = (err?: any) => void;
export type ExpressHandler = (req: any, res: any, next: NextFunction) => any;

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname: string;
}

export interface Request {
  method: string;
  path: string;
  url: string;
  ip: string | undefined;
  headers: Record<string, string | undefined>;
  body: any;
  params: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
  cookies: Record<string, string>;
  user?: any;
  file?: UploadedFile;
  files?: UploadedFile[];
  raw: globalThis.Request;
  header(name: string): string | undefined;
  get(name: string): string | undefined;
}

export interface Response {
  statusCode: number;
  sent: boolean;
  status(code: number): Response;
  json(payload: any): void;
  send(payload: any): void;
  end(payload?: any): void;
  set(field: string, value: string): Response;
  setHeader(field: string, value: string): Response;
  cookie(name: string, value: string, options?: CookieOptions): Response;
  clearCookie(name: string, options?: CookieOptions): Response;
  redirect(status: number, url: string): void;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none' | boolean;
  maxAge?: number;
  path?: string;
  domain?: string;
  expires?: Date;
}

type Route = { method: string; path: string; handlers: ExpressHandler[] };

class ExpressRouter {
  routes: Route[] = [];
  middlewares: ExpressHandler[] = [];
  use(...handlers: ExpressHandler[]) {
    this.middlewares.push(...handlers);
    return this;
  }
  private add(method: string) {
    return (path: string, ...handlers: ExpressHandler[]) => {
      this.routes.push({ method, path, handlers });
      return this;
    };
  }
  get = this.add('get');
  post = this.add('post');
  put = this.add('put');
  patch = this.add('patch');
  delete = this.add('delete');
  all = this.add('all');
}

/** Express-compatible factory: `const router = Router();` */
export const Router = () => new ExpressRouter();
export type Router = ExpressRouter;

/* ------------------------------------------------------------------ helpers */

const parseCookies = (header?: string): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
};

export function serializeCookie(name: string, value: string, opts: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(opts.maxAge / 1000)}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) {
    const s = typeof opts.sameSite === 'boolean' ? 'Lax' : opts.sameSite;
    parts.push(`SameSite=${s.charAt(0).toUpperCase()}${s.slice(1)}`);
  }
  return parts.join('; ');
}

const toUploadedFile = (field: string, value: any): UploadedFile | null => {
  const file = value as { name?: string; type?: string; size?: number; arrayBuffer?: () => Promise<ArrayBuffer> };
  if (!file || typeof file.arrayBuffer !== 'function') return null;
  return {
    fieldname: field,
    originalname: file.name || 'upload',
    mimetype: file.type || 'application/octet-stream',
    size: typeof file.size === 'number' ? file.size : 0,
    buffer: undefined as unknown as Buffer, // filled in below (async)
    ...(file as any),
  } as UploadedFile;
};

async function buildReq(c: Context): Promise<{ req: Request }> {
  const raw = c.req.raw;
  const headers: Record<string, string | undefined> = {};
  raw.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });

  let body: any = undefined;
  let file: UploadedFile | undefined;
  let files: UploadedFile[] | undefined;
  const contentType = headers['content-type'] || '';
  const method = raw.method.toUpperCase();

  if (method !== 'GET' && method !== 'HEAD' && contentType) {
    try {
      if (contentType.includes('multipart/form-data')) {
        const parsed: Record<string, any> = (await (c.req as any).parseBody({ all: true })) || {};
        body = {};
        for (const [key, value] of Object.entries(parsed)) {
          const list = Array.isArray(value) ? value : [value];
          for (const item of list) {
            if (item && typeof item === 'object' && typeof (item as any).arrayBuffer === 'function') {
              const buf = Buffer.from(await (item as any).arrayBuffer());
              const f: UploadedFile = {
                fieldname: key,
                originalname: (item as any).name || 'upload',
                mimetype: (item as any).type || 'application/octet-stream',
                size: buf.length,
                buffer: buf,
              };
              if (!file) file = f;
              (files ||= []).push(f);
            } else {
              body[key] = item as string;
            }
          }
        }
      } else if (contentType.includes('application/json')) {
        const text = await raw.clone().text();
        body = text ? JSON.parse(text) : {};
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await raw.clone().text();
        body = Object.fromEntries(new URLSearchParams(text));
      }
    } catch {
      /* leave body undefined; validation middleware will report it */
    }
  }

  const url = new URL(raw.url);
  const req: Request = {
    method,
    path: url.pathname,
    url: raw.url,
    ip: headers['cf-connecting-ip'] || (headers['x-forwarded-for'] || '').split(',')[0]?.trim() || undefined,
    headers,
    body,
    params: (c.req.param() || {}) as Record<string, string>,
    query: c.req.query() as Record<string, string | string[] | undefined>,
    cookies: parseCookies(headers.cookie),
    file,
    files,
    raw,
    header(name: string) {
      return headers[name.toLowerCase()];
    },
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  };
  return { req };
}

function buildRes() {
  let statusCode = 200;
  let sent = false;
  const headers = new Headers();
  let payload: any = undefined;
  let isJson = false;

  const res: Response = {
    get statusCode() {
      return statusCode;
    },
    get sent() {
      return sent;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    set(field: string, value: string) {
      headers.set(field, value);
      return res;
    },
    setHeader(field: string, value: string) {
      headers.set(field, value);
      return res;
    },
    json(p: any) {
      payload = p;
      isJson = true;
      sent = true;
    },
    send(p: any) {
      payload = p;
      sent = true;
    },
    end(p?: any) {
      if (p !== undefined) payload = p;
      sent = true;
    },
    cookie(name: string, value: string, options?: CookieOptions) {
      headers.append('Set-Cookie', serializeCookie(name, value, options));
      return res;
    },
    clearCookie(name: string, options?: CookieOptions) {
      headers.append('Set-Cookie', serializeCookie(name, '', { ...options, maxAge: 0 }));
      return res;
    },
    redirect(status: number, url: string) {
      statusCode = status;
      headers.set('Location', url);
      sent = true;
    },
  };

  const finish = (): globalThis.Response => {
    if (!sent) return new globalThis.Response(undefined, { status: 404, headers });
    let bodyOut: any = undefined;
    if (payload !== undefined && payload !== null) {
      if (typeof payload === 'string' || payload instanceof Uint8Array) {
        bodyOut = payload;
        if (!headers.has('Content-Type')) headers.set('Content-Type', 'text/plain; charset=utf-8');
      } else {
        bodyOut = JSON.stringify(payload);
        if (isJson && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json; charset=utf-8');
      }
    }
    return new globalThis.Response(bodyOut, { status: statusCode, headers });
  };
  return { res, finish };
}

async function runChain(handlers: ExpressHandler[], req: Request, res: Response) {
  for (const h of handlers) {
    if (res.sent) break;
    if (h.length >= 4) continue; // Express error middleware (handled centrally)
    let called = false;
    await h(req, res, (err?: any) => {
      called = true;
      if (err) throw err;
    });
    // Express semantics: if the handler called next() with an error we already threw.
    void called;
  }
}

const joinPath = (base: string, path: string) => {
  const b = base.replace(/\/+$/, '');
  const p = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}` || '/';
};

/** Mount an Express-style Router onto a Hono app (e.g. base `/api/v1/auth`). */
export function mountRouter(app: any, base: string, router: Router) {
  for (const r of router.routes) {
    const path = joinPath(base, r.path);
    const handlers = [...router.middlewares, ...r.handlers];
    const runner = async (c: Context, next: HonoNext) => {
      const { req } = await buildReq(c);
      const { res, finish } = buildRes();
      try {
        await runChain(handlers, req, res);
      } catch (err) {
        if (!res.sent) throw err;
      }
      if (!res.sent) return next();
      return finish();
    };
    if (r.method === 'all') app.all(path, runner);
    else app[r.method](path, runner);
  }
  return app;
}

/** Wrap an Express-style handler (e.g. `res => res.json(...)`) as a Hono handler. */
export function wrap(handler: ExpressHandler) {
  return async (c: Context, next: HonoNext) => {
    const { req } = await buildReq(c);
    const { res, finish } = buildRes();
    try {
      await runChain([handler], req, res);
    } catch (err) {
      if (!res.sent) throw err;
    }
    if (!res.sent) return next();
    return finish();
  };
}
