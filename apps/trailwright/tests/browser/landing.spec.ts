import { step } from './nav';
import { expect, test } from '@playwright/test';

test('the app opens on the landing page, which explains Trailwright and links the docs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Design an Azure Local deployment');
  await expect(page.getByRole('navigation', { name: 'Steps' })).toHaveCount(0);
  for (const name of ['Get started', 'How it works', 'What you take away', 'Where it fits', 'Documentation']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: /^User guide/ }).first()).toHaveAttribute('href', /\/docs\/USER-GUIDE\.md$/);
  await expect(page.getByRole('link', { name: /infrastructure\.yml JSON Schema/ })).toHaveAttribute('href', 'schema/infrastructure.schema.json');
});

test('start a new design, then come back to it from the landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /^Continue/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start a new design' }).click();
  await expect(page).toHaveURL(/#\/project$/);
  await page.getByLabel('Project name').fill('Site A');
  await step(page, 'Storage').click();

  await page.getByRole('link', { name: 'Trailwright home' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await page.getByRole('link', { name: /^Continue Site A/ }).click();
  await expect(page).toHaveURL(/#\/storage$/);
});

test('the landing page is usable from the keyboard on a narrow window', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  const start = page.getByRole('button', { name: 'Start a new design' });
  await expect(start).toBeVisible();
  // No sideways scrolling on a phone-sized window.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (let i = 0; i < 12 && !(await start.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(start).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/project$/);
});
