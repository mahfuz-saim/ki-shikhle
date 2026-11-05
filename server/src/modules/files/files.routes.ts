import { Router, type Request, type Response, type NextFunction } from '../../platform/express-compat';
import { auth } from '../../middleware/auth';
import { prisma } from '../../db/client';
import { storage } from '../../services/storage';
import { notFound, forbidden } from '../../utils/errors';

/**
 * Authenticated file access.
 *
 * Note images/PDFs are private: the URL stored in the DB (`/api/v1/files/<key>`)
 * is only readable by the parent who owns the child, or by that child. Local files
 * are streamed from disk; S3/R2 objects are served with a short-lived redirect to a
 * presigned URL (or the public bucket URL if R2_PUBLIC_URL is set).
 */
const router = Router();

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

/** Sanitise the key and check the caller may read the note that owns this file. */
async function authorizeFileKey(req: Request): Promise<string> {
  const key = String(req.params.key || '').replace(/[^a-zA-Z0-9._-]/g, '');
  if (!key) throw notFound('File not found');

  // Only the child's parent id is needed to decide access. Loading the whole
  // Child row would pull its `passwordHash` and `pinHash` into memory for no
  // reason — and into the response if this handler ever starts returning the
  // note.
  const note: any = await prisma.note
    .findFirst({ where: { fileUrl: { endsWith: key } }, include: { child: { select: { id: true, parentId: true } } } })
    .catch(() => null);
  if (!note) throw notFound('File not found');

  const user = req.user!;
  const isOwnerParent = note.child?.parentId === user.userId;
  const isTheChild = user.childId && note.childId === user.childId;
  if (!isOwnerParent && !isTheChild) throw forbidden('Not yours');
  return key;
}

/**
 * Resolve a viewable URL for a file.
 *
 * `<img>` tags cannot send the Bearer token, so the client calls this endpoint through
 * the authenticated API and uses the returned short-lived presigned (or public) URL as
 * the image source. `url` is null for the local-disk driver — the client then fetches
 * the bytes from `/files/:key` with its token instead.
 */
router.get('/files/:key/url', auth(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = await authorizeFileKey(req);
    const url = await storage.getReadUrl(key).catch(() => null);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ success: true, data: { url: url || null }, error: null });
  } catch (e) {
    next(e);
  }
});

router.get('/files/:key', auth(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = await authorizeFileKey(req);

    const ext = key.slice(key.lastIndexOf('.')).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    // Object storage: redirect to a presigned/public URL (never proxies big files)
    const direct = await storage.getReadUrl(key).catch(() => null);
    if (direct) return res.redirect(302, direct);

    // Local disk: stream
    const buf = await storage.read(key);
    if (!buf) throw notFound('File not found');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.end(buf);
  } catch (e) {
    next(e);
  }
});

export default router;
