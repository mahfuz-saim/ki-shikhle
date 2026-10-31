import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageProvider {
  save(buffer: Buffer, originalName: string, mime: string): Promise<{ url: string; key: string }>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}

class LocalStorage implements StorageProvider {
  private dir = path.join(process.cwd(), 'uploads');
  constructor() { if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true }); }
  async save(buffer: Buffer, originalName: string) {
    const ext = path.extname(originalName) || '.bin';
    const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const full = path.join(this.dir, key);
    fs.writeFileSync(full, buffer);
    return { url: `/uploads/${key}`, key };
  }
  getUrl(key: string) { return `/uploads/${key}`; }
  async delete(key: string) { const p = path.join(this.dir, key); if (fs.existsSync(p)) fs.unlinkSync(p); }
}

export const storage: StorageProvider = new LocalStorage();
