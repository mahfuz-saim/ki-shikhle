# Deployment Guide

## Docker
```bash
docker-compose up -d postgres redis
npm install
npm run db:generate --workspace=server
npm run db:migrate --workspace=server
npm run db:seed --workspace=server
npm run build
npm start --workspace=server
npm start --workspace=client
```

## Managed PostgreSQL
- Set DATABASE_URL to managed instance (Neon, Supabase, RDS)
- Run migrations: `npm run db:migrate --workspace=server` (or `prisma migrate deploy` in CI)
- Backups: provider snapshots + daily pg_dump to S3
- Restore: `psql $DATABASE_URL < backup.sql`

## Env
- Server: `JWT_*`, `ANTHROPIC_API_KEY`, `AI_MODEL_*`, `SMTP`, `STORAGE_DRIVER=s3` + S3 creds
- Client: `NEXT_PUBLIC_API_BASE_URL=https://api.kishikhle.com/api/v1`

## Health
- `GET /api/v1/health` for LB

## Scaling
- Stateless server, files in object storage, jobs in queue (BullMQ+Redis later), DB pooling
