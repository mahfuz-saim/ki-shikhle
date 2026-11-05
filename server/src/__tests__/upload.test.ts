/**
 * Upload validation.
 *
 * The security checklist claimed "upload type/size checks + magic-byte validation".
 * Nothing implemented it: the multipart body was parsed by Hono and handed straight
 * to the storage layer, so any client could store an arbitrarily large file, or a
 * file whose bytes were something else entirely under a `.jpg` name.
 *
 * These tests pin the two checks that matter: a size ceiling, and proof that the
 * bytes are what the type claims.
 */

import { describe, it, expect } from 'vitest';
import { validateUpload, decodeBase64Image, MAX_UPLOAD_BYTES } from '../middleware/upload';
import type { Request, Response, NextFunction } from '../platform/express-compat';

/** Run the middleware over a fake request and return the error it raised (if any). */
function runUploadGuard(
  file: { buffer: Buffer; mimetype: string; originalname: string; size?: number } | undefined,
  maxBytes?: number
): any {
  const req: any = { file };
  let captured: any = null;
  const next: NextFunction = (err?: any) => {
    captured = err ?? null;
  };
  validateUpload(maxBytes ? { maxBytes } : {})(req as Request, {} as Response, next);
  return captured;
}

/** A minimal valid JPEG: SOI marker + APP0 + minimal payload. */
function jpegBytes(): Buffer {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.from([0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]), // "JFIF"
    Buffer.from([0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]),
    Buffer.from([0xff, 0xd9]),
  ]);
}

function pngBytes(): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]),
  ]);
}

/** A Windows PE executable — the classic "renamed to .jpg" payload. */
function exeBytes(): Buffer {
  return Buffer.concat([
    Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // "MZ"
    Buffer.from([0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]),
    Buffer.alloc(64),
  ]);
}

describe('upload validation', () => {
  it('accepts a real JPEG', () => {
    const err = runUploadGuard({
      buffer: jpegBytes(),
      mimetype: 'image/jpeg',
      originalname: 'notebook.jpg',
    });
    expect(err).toBeNull();
  });

  it('accepts a real PNG', () => {
    const err = runUploadGuard({
      buffer: pngBytes(),
      mimetype: 'image/png',
      originalname: 'page.png',
    });
    expect(err).toBeNull();
  });

  it('rejects a file whose bytes are an executable, whatever it claims to be', () => {
    const err = runUploadGuard({
      buffer: exeBytes(),
      mimetype: 'image/jpeg',
      originalname: 'totally-a-photo.jpg',
    });
    expect(err).toBeTruthy();
    expect(err.message).toMatch(/do not match the file type/i);
  });

  it('rejects a file whose type is not allowed at all', () => {
    const err = runUploadGuard({
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'),
      mimetype: 'image/svg+xml',
      originalname: 'x.svg',
    });
    expect(err).toBeTruthy();
    expect(err.message).toMatch(/unsupported file type/i);
  });

  it('rejects a file over the size limit', () => {
    const err = runUploadGuard(
      { buffer: Buffer.alloc(64), mimetype: 'image/jpeg', originalname: 'big.jpg' },
      32 // 32-byte ceiling
    );
    expect(err).toBeTruthy();
    expect(err.message).toMatch(/too large/i);
  });

  it('rejects an empty file', () => {
    const err = runUploadGuard({
      buffer: Buffer.alloc(0),
      mimetype: 'image/jpeg',
      originalname: 'empty.jpg',
    });
    expect(err).toBeTruthy();
    expect(err.message).toMatch(/empty/i);
  });

  it('ignores a request with no file', () => {
    expect(runUploadGuard(undefined)).toBeNull();
  });

  it('identifies the type from the bytes when the client declares a generic one', () => {
    const file: any = { buffer: pngBytes(), mimetype: 'application/octet-stream', originalname: 'x.jpg' };
    const req: any = { file };
    validateUpload()(req as Request, {} as Response, () => {});
    // The declared type was generic, so the PNG magic bytes decide — not the `.jpg`
    // extension, which is just as much of a client-side claim as the MIME type.
    expect(file.mimetype).toBe('image/png');
  });

  it('rejects a file whose declared type disagrees with its bytes', () => {
    // Declares JPEG, but the bytes are PNG. The claim is what we check against,
    // so this is rejected rather than silently retyped.
    const err = runUploadGuard({
      buffer: pngBytes(),
      mimetype: 'image/jpeg',
      originalname: 'x.jpg',
    });
    expect(err).toBeTruthy();
    expect(err.message).toMatch(/do not match the file type/i);
  });

  it('exposes a sane default size limit', () => {
    expect(MAX_UPLOAD_BYTES).toBeGreaterThan(0);
    expect(MAX_UPLOAD_BYTES).toBeLessThanOrEqual(10 * 1024 * 1024);
  });
});

describe('decodeBase64Image', () => {
  it('recognises a base64 JPEG and reports its type', () => {
    const result = decodeBase64Image(jpegBytes().toString('base64'));
    expect(result?.mediaType).toBe('image/jpeg');
  });

  it('recognises a base64 PNG', () => {
    const result = decodeBase64Image(pngBytes().toString('base64'));
    expect(result?.mediaType).toBe('image/png');
  });

  it('rejects an executable disguised as an image', () => {
    expect(decodeBase64Image(exeBytes().toString('base64'))).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(decodeBase64Image('')).toBeNull();
  });

  it('rejects a PDF — an inline AI image must be an image', () => {
    expect(decodeBase64Image(Buffer.from('%PDF-1.4').toString('base64'))).toBeNull();
  });
});
