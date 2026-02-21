import { test, expect } from '@playwright/test';

test.describe('Nebula Core User Flows', () => {
  test('Load the root URL and assert the "Project Nebula" hero title is visible', async ({ page }) => {
    await page.goto('/');

    // Check for "Project" and "Nebula" since they might be in separate spans/lines
    await expect(page.locator('text=Project')).toBeVisible();
    await expect(page.locator('text=Nebula')).toBeVisible();
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
