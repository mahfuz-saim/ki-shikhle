import { Router } from 'express';
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

router.get('/files/:key', auth(), async (req, res, next) => {
  try {
    const key = String(req.params.key || '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!key) throw notFound('File not found');

    const note: any = await prisma.note
      .findFirst({ where: { fileUrl: { endsWith: key } }, include: { child: true } })
      .catch(() => null);
    if (!note) throw notFound('File not found');

    const user = req.user!;
    const isOwnerParent = note.child?.parentId === user.userId;
    const isTheChild = user.childId && note.childId === user.childId;
    if (!isOwnerParent && !isTheChild) throw forbidden('Not yours');

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
