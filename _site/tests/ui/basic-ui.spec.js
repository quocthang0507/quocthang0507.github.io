import { test, expect } from '@playwright/test';

test.describe('Navigation and UI Tests', () => {
  test('should load the navigation test page', async ({ page }) => {
    await page.goto('/nav-test.html');
    
    // Check page title
    await expect(page.locator('h3')).toContainText('Navigation Test');
    
    // Check that links are present
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href*="privacy"]')).toBeVisible();
    await expect(page.locator('a[href*="random-number"]')).toBeVisible();
    await expect(page.locator('a[href*="random-wheel"]')).toBeVisible();
  });

  test('should display current URL information', async ({ page }) => {
    await page.goto('/nav-test.html');
    
    // Wait for JavaScript to populate the URL fields
    await page.waitForTimeout(500);
    
    // Check that current URL is displayed
    const currentUrlText = await page.locator('#current-url').textContent();
    expect(currentUrlText).toContain('localhost');
    
    // Check that base URL is displayed
    const baseUrlText = await page.locator('#base-url').textContent();
    expect(baseUrlText).toContain('localhost');
  });
});

test.describe('Random Number Generator UI', () => {
  test('should load random number generator page', async ({ page }) => {
    await page.goto('/random-number.html');
    
    // Check that main elements are present
    await expect(page.locator('#generate-btn')).toBeVisible();
    await expect(page.locator('#min-number')).toBeVisible();
    await expect(page.locator('#max-number')).toBeVisible();
  });

  test('should generate a random number', async ({ page }) => {
    await page.goto('/random-number.html');
    
    // Fill in the form
    await page.fill('#min-number', '1');
    await page.fill('#max-number', '10');
    
    // Click generate button
    await page.click('#generate-btn');
    
    // Wait for result to be displayed
    await page.waitForTimeout(500);
    
    // Check that result is displayed
    const resultText = await page.locator('#result-display').textContent();
    expect(resultText).toBeTruthy();
    const resultNum = parseInt(resultText);
    expect(resultNum).toBeGreaterThanOrEqual(1);
    expect(resultNum).toBeLessThanOrEqual(10);
  });

  test('should validate min < max', async ({ page }) => {
    await page.goto('/random-number.html');
    
    // Fill in invalid values (min > max)
    await page.fill('#min-number', '10');
    await page.fill('#max-number', '5');
    
    // Click generate button
    await page.click('#generate-btn');
    
    // Wait for alert
    await page.waitForTimeout(500);
    
    // Check that an alert appears
    const alertContainer = page.locator('#alert-container');
    await expect(alertContainer).toBeVisible();
  });

  test('should generate multiple numbers', async ({ page }) => {
    await page.goto('/random-number.html');
    
    // Fill in the form
    await page.fill('#min-number', '1');
    await page.fill('#max-number', '100');
    await page.fill('#count-numbers', '5');
    
    // Click generate multiple button
    await page.click('#generate-multiple-btn');
    
    // Wait for result
    await page.waitForTimeout(500);
    
    // Check that multiple numbers are displayed
    const badges = await page.locator('.generated-number').count();
    expect(badges).toBe(5);
  });
});

test.describe('Password Generator UI', () => {
  test('should load password generator page', async ({ page }) => {
    await page.goto('/password-generator.html');
    
    // Check that main elements are present
    await expect(page.locator('#generate-btn')).toBeVisible();
    await expect(page.locator('#password-display')).toBeVisible();
    await expect(page.locator('#password-length')).toBeVisible();
  });

  test('should generate a password on page load', async ({ page }) => {
    await page.goto('/password-generator.html');
    
    // Wait for auto-generation
    await page.waitForTimeout(1000);
    
    // Check that a password is displayed
    const passwordText = await page.locator('#password-display').textContent();
    expect(passwordText).toBeTruthy();
    expect(passwordText.length).toBeGreaterThan(0);
  });

  test('should generate new password on button click', async ({ page }) => {
    await page.goto('/password-generator.html');
    
    // Wait for initial password
    await page.waitForTimeout(1000);
    const initialPassword = await page.locator('#password-display').textContent();
    
    // Click generate button
    await page.click('#generate-btn');
    
    // Wait for new password
    await page.waitForTimeout(500);
    const newPassword = await page.locator('#password-display').textContent();
    
    // Check that password changed
    expect(newPassword).not.toBe(initialPassword);
  });

  test('should adjust password length', async ({ page }) => {
    await page.goto('/password-generator.html');
    
    // Set password length to 20
    await page.locator('#password-length').fill('20');
    
    // Generate new password
    await page.click('#generate-btn');
    
    // Wait for generation
    await page.waitForTimeout(500);
    
    // Check password length
    const password = await page.locator('#password-display').textContent();
    expect(password.length).toBe(20);
  });
});

test.describe('Random Wheel UI', () => {
  test('should load random wheel page', async ({ page }) => {
    await page.goto('/random-wheel.html');
    
    // Check that main elements are present
    await expect(page.locator('#name-input')).toBeVisible();
    await expect(page.locator('#add-name-btn')).toBeVisible();
    await expect(page.locator('#spin-btn')).toBeVisible();
  });

  test('should add names to the wheel', async ({ page }) => {
    await page.goto('/random-wheel.html');
    
    // Add first name
    await page.fill('#name-input', 'Alice');
    await page.click('#add-name-btn');
    
    // Wait for update
    await page.waitForTimeout(300);
    
    // Add second name
    await page.fill('#name-input', 'Bob');
    await page.click('#add-name-btn');
    
    // Wait for update
    await page.waitForTimeout(300);
    
    // Check that names are added
    const namesList = page.locator('#names-list');
    await expect(namesList).toContainText('Alice');
    await expect(namesList).toContainText('Bob');
    
    // Check that spin button is enabled
    await expect(page.locator('#spin-btn')).toBeEnabled();
  });

  test('should validate name length', async ({ page }) => {
    await page.goto('/random-wheel.html');
    
    // Try to add a very long name
    const longName = 'a'.repeat(25);
    await page.fill('#name-input', longName);
    await page.click('#add-name-btn');
    
    // Wait for alert
    await page.waitForTimeout(500);
    
    // Check that an alert appears
    const alertContainer = page.locator('#alert-container');
    await expect(alertContainer).toBeVisible();
  });
});

test.describe('Index Page UI', () => {
  test('should load index page', async ({ page }) => {
    await page.goto('/');
    
    // Check that clock is displayed
    await expect(page.locator('#digital-clock')).toBeVisible();
    
    // Check that calendar is displayed
    await expect(page.locator('#calendar-display')).toBeVisible();
    
    // Check that stopwatch/timer controls are present
    await expect(page.locator('#start-stopwatch')).toBeVisible();
  });

  test('should display current time', async ({ page }) => {
    await page.goto('/');
    
    // Wait for clock to initialize
    await page.waitForTimeout(1000);
    
    // Check that clock shows time (not default --:--:--)
    const clockText = await page.locator('#digital-clock').textContent();
    expect(clockText).not.toBe('--:--:--');
    expect(clockText).toMatch(/\d+:\d+:\d+/);
  });

  test('should toggle time format', async ({ page }) => {
    await page.goto('/');
    
    // Wait for clock to initialize
    await page.waitForTimeout(1000);
    
    const initialClock = await page.locator('#digital-clock').textContent();
    
    // Click toggle format button
    await page.click('#toggle-format');
    
    // Wait for update
    await page.waitForTimeout(500);
    
    const newClock = await page.locator('#digital-clock').textContent();
    
    // Format should have changed (length or content different)
    expect(newClock).not.toBe(initialClock);
  });
});
