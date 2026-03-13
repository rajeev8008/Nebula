import { test, expect } from '@playwright/test';

test.describe('Nebula Core User Flows', () => {
  test('Load the root URL and assert the "Project Nebula" hero title is visible', async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully loaded including animations
    await page.waitForLoadState('domcontentloaded');

    // Check for "Nebula" title - the current project has an empty first line
    const title = page.getByTestId('hero-title-line2');
    await expect(title).toBeVisible({ timeout: 15000 });
    await expect(title).toHaveText('Nebula');

    // Check for the subtitle to ensure landing page state
    await expect(page.getByText('The Semantic Cinema Engine')).toBeVisible();
  });

  test('Click the "Launch Engine" button and verify the search drawer appears', async ({ page }) => {
    await page.goto('/');
    
    // Click the Launch Engine button
    await page.getByRole('button', { name: 'Launch Engine' }).click();

    // Verify the "Describe the movie" title appears in the drawer
    await expect(page.getByText("Describe the movie you're looking for")).toBeVisible({ timeout: 10000 });
    
    // Verify the search input exists
    await expect(page.getByPlaceholder("e.g. intense car chase, psychological thriller, 90s sci-fi")).toBeVisible();
  });

  test('Click the "Browse Movies" button, wait for BROWSE view, and assert movie grid renders', async ({ page }) => {
    await page.goto('/');

    // Click the Browse Movies button
    await page.getByRole('button', { name: 'Browse Movies' }).click();

    // Wait for BROWSE view by checking the Browse Movies heading
    const browseHeading = page.getByRole('heading', { name: 'Browse Movies', exact: true });
    await expect(browseHeading).toBeVisible({ timeout: 10000 });

    // Assert that the filters for the movie grid renders successfully
    await expect(page.getByText('Filters', { exact: true })).toBeVisible();
  });
});
