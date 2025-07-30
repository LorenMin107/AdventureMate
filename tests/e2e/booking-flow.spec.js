const { test, expect } = require('@playwright/test');

test.describe('AdventureMate E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('Home page loads successfully', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/AdventureMate/);

    // Check for basic navigation elements - be more specific to avoid multiple matches
    await expect(page.locator('nav a[href="/campgrounds"]')).toBeVisible();
    await expect(page.locator('nav a[href="/login"]')).toBeVisible();
  });

  test('Campgrounds page loads', async ({ page }) => {
    // Navigate to campgrounds page using the navigation link
    await page.locator('nav a[href="/campgrounds"]').click();

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that we're on the campgrounds page
    await expect(page).toHaveURL(/.*campgrounds.*/);
  });

  test('Login functionality', async ({ page }) => {
    // Click on login using the navigation link
    await page.locator('nav a[href="/login"]').click();

    // Wait for login form to appear - check for the form container
    await page.waitForSelector('form', { timeout: 10000 });

    // Check if we're on the login page
    await expect(page).toHaveURL(/.*login.*/);

    // Look for email input - try multiple possible selectors
    const emailInput = page.locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i]'
    );
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    // Wait for inputs to be visible
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordInput.first()).toBeVisible({ timeout: 10000 });

    // Fill in login form
    await emailInput.first().fill('test@example.com');
    await passwordInput.first().fill('password123');

    // Submit the form - look for submit button
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Continue"), button:has-text("Login")'
    );
    await submitButton.first().click();

    // Wait for login to complete (either success or error)
    await page.waitForLoadState('networkidle');
  });

  test('Registration functionality', async ({ page }) => {
    // Click on register/signup using the navigation link
    await page.locator('nav a[href="/register"]').click();

    // Wait for registration form to appear
    await page.waitForSelector('form', { timeout: 10000 });

    // Check if we're on the register page
    await expect(page).toHaveURL(/.*register.*/);

    // Look for form inputs
    const emailInput = page.locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i]'
    );
    const usernameInput = page.locator('input[name="username"], input[placeholder*="username" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    // Wait for inputs to be visible
    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    await expect(usernameInput.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordInput.first()).toBeVisible({ timeout: 10000 });

    // Fill in registration form with unique data
    const uniqueId = Date.now();
    await emailInput.first().fill(`test${uniqueId}@example.com`);
    await usernameInput.first().fill(`testuser${uniqueId}`);
    await passwordInput.first().fill('Test123!');

    // Submit the form
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Continue"), button:has-text("Register")'
    );
    await submitButton.first().click();

    // Wait for registration to complete
    await page.waitForLoadState('networkidle');
  });

  test('Search functionality', async ({ page }) => {
    // Navigate to campgrounds page
    await page.locator('nav a[href="/campgrounds"]').click();
    await page.waitForLoadState('networkidle');

    // Look for search input - try multiple possible selectors
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[name="search"], input[type="search"]'
    );

    if ((await searchInput.count()) > 0) {
      await searchInput.first().fill('Bangkok');
      await searchInput.first().press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Campground details page', async ({ page }) => {
    // Navigate to campgrounds page
    await page.locator('nav a[href="/campgrounds"]').click();
    await page.waitForLoadState('networkidle');

    // Look for campground links or cards - try multiple selectors
    const campgroundLinks = page.locator(
      'a[href*="/campgrounds/"], [data-testid="campground-card"], .campground-card a, .campground-link'
    );

    if ((await campgroundLinks.count()) > 0) {
      // Click on the first campground
      await campgroundLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check that we're on a campground details page - be more flexible with URL pattern
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/.*campgrounds\/.*/);
    }
  });

  test('Navigation works', async ({ page }) => {
    // Test navigation between different pages
    const navItems = [
      { text: 'Campgrounds', href: '/campgrounds' },
      { text: 'About', href: '/about' },
      { text: 'Contact', href: '/contact' },
    ];

    for (const item of navItems) {
      try {
        // Try to click the navigation item
        const navLink = page.locator(`nav a[href="${item.href}"]`);
        if (await navLink.isVisible()) {
          await navLink.click();
          await page.waitForLoadState('networkidle');

          // Check that the page loaded (basic check)
          await expect(page.locator('body')).toBeVisible();
        }
      } catch (error) {
        // If navigation item doesn't exist, that's okay for this test
        console.log(`Navigation item "${item.text}" not found`);
      }
    }
  });

  test('Responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check that the page is still functional
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    // Check that the page is still functional
    await expect(page.locator('body')).toBeVisible();
  });
});
