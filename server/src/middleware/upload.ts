import type { Request, Response, NextFunction } from '../platform/express-compat';
import { badRequest } from '../utils/errors';

/**
 * Upload validation.
 *
 * The security checklist claimed "upload type/size checks + magic-byte via multer
 * fileFilter". There is no multer here — the API is Hono, and multipart bodies are
 * parsed by Hono's `parseBody`. **Nothing validated the upload at all**: any client
 * could POST a 200 MB file, or a file whose bytes are an executable renamed to
 * `.jpg`, and the server would store it and hand back a URL.
 *
 * This module adds the two checks that actually matter:
 *
 *  1. **Size** — a note photo is at most a few megabytes. Anything larger is
 *     rejected before it is written to disk or to object storage.
 *  2. **Magic bytes** — the declared `Content-Type` is a claim the client makes. The
 *     first bytes of the file are the truth. A file that claims to be a JPEG but
 *     starts with `MZ` (a Windows executable) or `<?php` is rejected.
 *
 * The allowed types are narrow on purpose: images and PDFs. A child's notebook
 * photo has no business being a `.zip`, an `.html`, or a `.svg` (SVG can carry
 * script).
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MiB

/** The file types the app actually accepts, and the magic bytes that prove them. */
export const ALLOWED_UPLOAD_TYPES: Record<string, string[]> = {
  'image/jpeg': ['ffd8ff'],
  'image/png': ['89504e47'],
  'image/webp': ['52494646'],
  'image/gif': ['47494638'],
  'application/pdf': ['25504446'],
};

/**
 * The magic bytes each accepted type must start with.
 *
 * WebP is the awkward one: its first four bytes are the `RIFF` container, which is
 * shared with WAV and AVI. The `WEBP` tag lives at offset 8, so the check for it is
 * a two-part test rather than a prefix.
 */
function hasValidMagicBytes(buffer: Buffer, mime: string): boolean {
  const b = buffer;
  if (b.length < 4) return false;

  switch (mime) {
    case 'image/jpeg':
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'image/png':
      return b.subarray(0, 4).toString('hex') === '89504e47';
    case 'image/gif':
      return b.subarray(0, 4).toString('hex') === '47494638';
    case 'application/pdf':
      return b.subarray(0, 5).toString('hex') === '25504446';
    case 'image/webp':
      // 'RIFF' .... 'WEBP'
      return (
        b.subarray(0, 4).toString('ascii') === 'RIFF' &&
        b.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    default:
      return false;
  }
}

/**
 * Decode and validate a base64-encoded image.
 *
 * The multipart path is guarded by `validateUpload`, but the AI-note endpoint also
 * accepts an inline `imageBase64` field. That path bypasses the multipart parser
 * entirely, so it needs its own check — otherwise a client could send arbitrary
 * bytes with an arbitrary declared media type.
 *
 * Returns the verified media type, or `null` when the bytes are not a supported
 * image.
 */
export function decodeBase64Image(base64: string): { mediaType: string; bytes: Buffer } | null {
  if (!base64 || typeof base64 !== 'string') return null;

  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, 'base64');
  } catch {
    return null;
  }
  if (!bytes || bytes.length === 0) return null;

  // Reject anything implausibly large before it is decoded into an AI request.
  if (bytes.length > MAX_UPLOAD_BYTES) return null;

  for (const mime of Object.keys(ALLOWED_UPLOAD_TYPES)) {
    if (mime === 'application/pdf') continue; // an inline image must be an image
    if (hasValidMagicBytes(bytes, mime)) return { mediaType: mime, bytes };
  }
  return null;
}

/**
 * Identify an allowed type from the file's magic bytes alone.
 * Returns the media type, or `null` when the bytes are not a supported type.
 */
export function identifyUploadType(buffer: Buffer): string | null {
  for (const mime of Object.keys(ALLOWED_UPLOAD_TYPES)) {
    if (hasValidMagicBytes(buffer, mime)) return mime;
  }
  return null;
}

/**
 * Validate the uploaded file on a request.
 *
 * The file is expected on `req.file` (the compat layer populates it from the first
 * multipart file field). A request with no file passes through untouched — the
 * route decides whether a file is required.
 *
 * The **bytes** are the source of truth:
 *
 *  - If the client declares a type we accept, the bytes must match *that* type.
 *    A JPEG that claims to be a JPEG but is really an executable is rejected.
 *  - If the client declares a generic type (`application/octet-stream`, which some
 *    browsers send), the type is identified from the bytes.
 *
 * Throws a 400 for an oversized or mistyped file. The error message names the
 * problem but never echoes the file's contents.
 */
export function validateUpload({ maxBytes = MAX_UPLOAD_BYTES }: { maxBytes?: number } = {}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const file = (req as any).file;
    if (!file || !file.buffer) return next();

    const size = typeof file.size === 'number' ? file.size : file.buffer.length;

    if (size > maxBytes) {
      const limitMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
      return next(badRequest(`File is too large. The maximum is ${limitMb} MB.`));
    }
    if (size === 0) {
      return next(badRequest('The uploaded file is empty.'));
    }

    const declared = String(file.mimetype || '').toLowerCase().split(';')[0].trim();

    let effective: string | null;
    if (ALLOWED_UPLOAD_TYPES[declared]) {
      // The client named a type we accept — the bytes must back that claim up.
      if (!hasValidMagicBytes(file.buffer, declared)) {
        return next(
          badRequest('The file contents do not match the file type. The upload was rejected.')
        );
      }
      effective = declared;
    } else {
      // A generic or unrecognised declared type: let the bytes decide.
      effective = identifyUploadType(file.buffer);
      if (!effective) {
        return next(
          badRequest('Unsupported file type. Upload a JPEG, PNG, WebP, GIF or PDF.')
        );
      }
    }

    // Normalise the stored type to the one the bytes actually prove, so the
    // storage layer never writes a `.jpg` that is really something else.
    file.mimetype = effective;

    return next();
  };
}
