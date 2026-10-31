import app from './app';
import { env } from './config/env';
import { connectDb } from './db/client';
import { startCrons } from './jobs/cron';

async function main() {
  await connectDb();
  startCrons();
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${env.PORT}`);
    console.log(`   Health: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`   Client origin: ${env.CLIENT_ORIGIN}`);
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
