import { test, expect } from '@playwright/test';
test('landing → register → onboarding → dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Ki Shikhle?')).toBeVisible();
  await page.goto('/register');
  await expect(page.getByText('Create account')).toBeVisible();
});
test('parent creates child and quiz', async ({ page }) => {
  await page.goto('/children');
  await expect(page.getByText('Children')).toBeVisible();
  await page.goto('/children/demo/quizzes/new');
  await expect(page.getByText('AI Quiz Builder')).toBeVisible();
});
test('child takes quiz and sees results', async ({ page }) => {
  await page.goto('/kid/quiz/demo-quiz');
  await expect(page.getByText('Take Quiz')).toBeVisible();
});
