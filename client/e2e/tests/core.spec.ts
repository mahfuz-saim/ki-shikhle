import { test, expect } from '@playwright/test';

/**
 * End-to-end coverage of the paths a real user takes.
 *
 * The old spec asserted on strings that do not exist in the app ("Ki Shikhle?" as
 * visible text, "Create account", "Children", "Take Quiz") and navigated to
 * `/children/demo/quizzes/new` and `/child/quiz/demo-quiz` — ids that no longer
 * exist (the demo children are deterministic UUIDs now). One of those tests
 * passed only because the page had a hardcoded client-side fallback.
 *
 * These tests use the real copy from the real pages, and they create their own
 * account so they never depend on demo data.
 */

/** A unique email per test run, so a re-run never collides with a prior account. */
function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

const PASSWORD = 'Password123!';

test.describe('Public pages', () => {
  test('the landing page renders its real headline', async ({ page }) => {
    await page.goto('/');
    // The headline is split across a highlighted <span>, so match the lead-in text.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Know what your child');
  });

  test('the register page shows the real form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create Free Account' })).toBeVisible();
    await expect(page.getByLabel("Parent's Full Name")).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password (min 8 characters)')).toBeVisible();
  });

  test('the login page shows the real form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email Address')).toBeVisible();
    // `exact` matters here: the reveal-password button carries `aria-label="Show
    // password"`, so a substring match on "Password" resolves to two elements.
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  });
});

test.describe('Registration', () => {
  test('a brand-new parent registers and lands on the dashboard', async ({ page }) => {
    const email = uniqueEmail('e2e-parent');

    await page.goto('/register');
    await page.getByLabel("Parent's Full Name").fill('E2E Test Parent');
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password (min 8 characters)').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create Free Account' }).click();

    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('a wrong password is rejected instead of logging the visitor in', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('parent@demo.com');
    await page.getByLabel('Password', { exact: true }).fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // The page must show the server's real error and must NOT navigate into the app.
    // The message is "Invalid credentials" — the server's own wording, surfaced by the
    // login page rather than replaced with a generic string.
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Account isolation', () => {
  test('a new parent sees none of the demo family\'s children', async ({ page }) => {
    const email = uniqueEmail('e2e-isolated');

    await page.goto('/register');
    await page.getByLabel("Parent's Full Name").fill('Isolation Test Parent');
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password (min 8 characters)').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create Free Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // The demo children are named Rahim / Tasnim / Fahim. A brand-new account
    // must not see any of them.
    await page.goto('/children');
    await expect(page.locator('text=Rahim Ahmed')).toHaveCount(0);
    await expect(page.locator('text=Tasnim Islam')).toHaveCount(0);
    await expect(page.locator('text=Fahim Hasan')).toHaveCount(0);
  });
});

test.describe('Authenticated routes', () => {
  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail('e2e-auth');
    await page.goto('/register');
    await page.getByLabel("Parent's Full Name").fill('Auth Test Parent');
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password (min 8 characters)').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create Free Account' }).click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
  });

  test('the children page renders its real heading', async ({ page }) => {
    await page.goto('/children');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('the quizzes page renders its real heading', async ({ page }) => {
    await page.goto('/quizzes');
    await expect(page.getByRole('heading', { name: 'AI Quizzes' })).toBeVisible();
  });

  test('the schedule page renders its real heading', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('an unauthenticated visitor is sent to the login page', async ({ page }) => {
    // The session lives in `localStorage`, not in a cookie, so clearing cookies alone
    // leaves the visitor signed in. Clear the stored tokens and reload: the auth
    // provider then finds no session, and the route guard must send them to sign in.
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 20000 });
  });
});
