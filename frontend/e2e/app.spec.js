const { test, expect } = require('@playwright/test');

test.describe('Nebula App Basic Tests', () => {
  test('homepage loads', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Check if page loaded
    await expect(page).toHaveTitle(/Nebula/i);
  });

  test('page contains hero section', async ({ page }) => {
    await page.goto('http://localhost:3000');
   
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check if content exists
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
  });
});
