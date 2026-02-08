import { test, expect } from '@playwright/test';

test.describe('Nebula App E2E', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Nebula/i);
  });

  test('page renders main content', async ({ page }) => {
    await page.goto('/');
   
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check if page body exists
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});
