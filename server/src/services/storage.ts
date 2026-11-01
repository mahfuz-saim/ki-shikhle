import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface StorageProvider {
  /** Persist a file and return its key + the app-relative URL clients should use. */
  save(buffer: Buffer, originalName: string, mime: string): Promise<{ url: string; key: string }>;
  /** App-relative URL (always routed through the authenticated /api/v1/files/:key endpoint). */
  getUrl(key: string): string;
  /** Direct URL for redirects (local: none; S3/R2: presigned or public URL). */
  getReadUrl(key: string, expiresSeconds?: number): Promise<string | null>;
  read(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

/**
 * Local disk driver.
 * Default for local development — zero configuration, zero cost.
 * Files land in <server>/uploads and are only ever served through the
 * authenticated /api/v1/files/:key route (never a public static folder).
 */
class LocalStorage implements StorageProvider {
  private dir = path.resolve(env.LOCAL_STORAGE_DIR || path.join(path.resolve(__dirname, '..', '..'), 'uploads'));
  constructor() {
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
  }
  async save(buffer: Buffer, originalName: string) {
    const ext = (path.extname(originalName) || '.bin').replace(/[^.\w-]/g, '').slice(0, 12);
    const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(this.dir, key), buffer);
    return { url: this.getUrl(key), key };
  }
  getUrl(key: string) {
    return `/api/v1/files/${key}`;
  }
  async getReadUrl() {
    return null; // served by the files route from disk
  }
  async read(key: string) {
    const p = path.join(this.dir, path.basename(key));
    return fs.existsSync(p) ? fs.readFileSync(p) : null;
  }
  async delete(key: string) {
    const p = path.join(this.dir, path.basename(key));
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

/**
 * S3-compatible object storage driver (Cloudflare R2, AWS S3, Backblaze B2,
 * MinIO, DigitalOcean Spaces, Hetzner…). The AWS SDK is imported lazily so
 * local development never pays for it when STORAGE_DRIVER=local.
 *
 * Required env: R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT
 * Optional env: R2_REGION (default "auto"), R2_PUBLIC_URL (public bucket/CDN base),
 *               R2_FORCE_PATH_STYLE ("true" for MinIO)
 */
class S3Storage implements StorageProvider {
  private clientPromise: Promise<any> | null = null;
  private bucket = () => process.env.R2_BUCKET || env.R2_BUCKET || '';

  private async client() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { S3Client } = await import('@aws-sdk/client-s3');
        const accessKeyId = process.env.R2_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
        if (!this.bucket() || !accessKeyId || !secretAccessKey) {
          throw new Error('S3/R2 storage selected but R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are missing');
        }
        return new S3Client({
          region: process.env.R2_REGION || env.R2_REGION || 'auto',
          endpoint: process.env.R2_ENDPOINT || env.R2_ENDPOINT || undefined,
          credentials: { accessKeyId, secretAccessKey },
          forcePathStyle: (process.env.R2_FORCE_PATH_STYLE || '') === 'true',
        });
      })().catch((e) => {
        this.clientPromise = null; // allow retry after fixing env
        throw e;
      });
    }
    return this.clientPromise;
  }

  async save(buffer: Buffer, originalName: string, mime: string) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const ext = (path.extname(originalName) || '.bin').replace(/[^.\w-]/g, '').slice(0, 12);
    const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const client = await this.client();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: buffer,
        ContentType: mime || 'application/octet-stream',
      })
    );
    return { url: this.getUrl(key), key };
  }

  getUrl(key: string) {
    return `/api/v1/files/${key}`;
  }

  async getReadUrl(key: string, expiresSeconds = 900) {
    const publicBase = process.env.R2_PUBLIC_URL || env.R2_PUBLIC_URL;
    if (publicBase) return `${publicBase.replace(/\/$/, '')}/${key}`;
    const [{ GetObjectCommand }, { getSignedUrl }] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ]);
    const client = await this.client();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: this.bucket(), Key: key }), {
      expiresIn: expiresSeconds,
    });
  }

  async read(key: string) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.client();
    try {
      const res: any = await client.send(new GetObjectCommand({ Bucket: this.bucket(), Key: key }));
      const bytes = await res.Body?.transformToByteArray?.();
      return bytes ? Buffer.from(bytes) : null;
    } catch {
      return null;
    }
  }

  async delete(key: string) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.client();
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key })).catch(() => {});
  }
}

export const storage: StorageProvider =
  env.STORAGE_DRIVER === 's3' || env.STORAGE_DRIVER === 'r2' ? new S3Storage() : new LocalStorage();

logger.info({ driver: env.STORAGE_DRIVER }, 'storage driver ready');
