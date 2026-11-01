# E2E (Playwright)

Lives inside `client/` because it drives the frontend; it boots both apps locally.

```bash
cd client/e2e
npm install
npx playwright install
npm test
```
Set `NEXT_PUBLIC_API_BASE_URL` (client) and server env first; `reuseExistingServer: true` will reuse running dev servers if present.
