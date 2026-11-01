/**
 * Node-only: loads `server/.env` into process.env.
 *
 * Imported *only* by `src/index.ts` (Node entry). Cloudflare Workers never import this —
 * there is no filesystem there; Workers get their config from `[vars]` + secrets, which
 * Cloudflare exposes through `process.env` when the `nodejs_compat_populate_process_env`
 * compatibility flag is enabled (set in wrangler.toml).
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const serverDir = path.resolve(__dirname, '..', '..');

for (const file of [path.resolve(process.cwd(), '.env'), path.join(serverDir, '.env')]) {
  if (fs.existsSync(file)) dotenv.config({ path: file });
}

export {};
