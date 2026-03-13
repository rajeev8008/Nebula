import { test, expect } from '@playwright/test';

test.describe('Nebula Core User Flows', () => {
  test('Load the root URL and assert the "Project Nebula" hero title is visible', async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully loaded including animations
    await page.waitForLoadState('domcontentloaded');

    // Check for "Project" and "Nebula" using more robust test IDs
    await expect(page.getByTestId('hero-title-line1')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('hero-title-line2')).toBeVisible({ timeout: 15000 });
  });

  test('Click the "Browse Movies" button, wait for BROWSE view, and assert movie grid renders', async ({ page }) => {
    await page.goto('/');

    // Click the Browse Movies button
    await page.getByRole('button', { name: 'Browse Movies' }).click();

    // Wait for BROWSE view by checking the Browse Movies heading
    const browseHeading = page.getByRole('heading', { name: 'Browse Movies', exact: true });
    await expect(browseHeading).toBeVisible({ timeout: 10000 });

    // Assert that the main content or filters for the movie grid renders successfully
    await expect(page.getByText('Filters', { exact: true })).toBeVisible();
  });
});
