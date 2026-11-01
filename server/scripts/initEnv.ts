/**
 * One-shot local bootstrap: `npm run setup` (from server/).
 *
 * Creates `server/.env` from `.env.example` with randomly generated JWT secrets and
 * pepper. Everything else (AI key, SMTP, R2, cron secret) stays commented out — the
 * app runs without them: no key → mock AI, no SMTP → console email, local disk storage.
 *
 * Never overwrites an existing .env.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dir = path.resolve(__dirname, '..');
const envPath = path.join(dir, '.env');
const examplePath = path.join(dir, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('✔ server/.env already exists — leaving it untouched.');
  process.exit(0);
}
if (!fs.existsSync(examplePath)) {
  console.error('✖ server/.env.example not found');
  process.exit(1);
}

const rand = () => crypto.randomBytes(32).toString('hex');
let contents = fs
  .readFileSync(examplePath, 'utf8')
  .replace(/^JWT_ACCESS_SECRET=.*$/m, `JWT_ACCESS_SECRET=${rand()}`)
  .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${rand()}`)
  .replace(/^PASSWORD_PEPPER=.*$/m, `PASSWORD_PEPPER=${rand()}`);

fs.writeFileSync(envPath, contents, { mode: 0o600 });

console.log('✔ Created server/.env with fresh JWT secrets (mode 600).');
console.log('  Only DATABASE_URL is left to check — default matches docker compose:');
console.log('    postgresql://kishikhle:kishikhle_dev_password@localhost:5432/learntrack');
console.log('\nNext:');
console.log('  cd server && docker compose up -d     # PostgreSQL + Redis');
console.log('  npm run db:generate && npm run db:migrate && npm run db:seed');
console.log('  npm run dev');
