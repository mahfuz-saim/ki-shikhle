# E2E (Playwright)

Lives in `client/` because it drives the frontend. There is no root `package.json` — the config
starts each app from its own folder (`../../server` and `..`), so both apps must be installed
(`npm install` in `server/` and `client/`) and have their `.env` in place.

```bash
cd client/e2e
npm install
npx playwright install
npm test
```

`reuseExistingServer: true` will attach to dev servers you already have running.
