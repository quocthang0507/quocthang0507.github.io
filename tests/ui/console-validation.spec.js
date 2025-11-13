import { test, expect } from '@playwright/test';

/**
 * Test suite for detecting browser console errors and HTML validation issues
 */

test.describe('Browser Console and HTML Validation Tests', () => {
  let consoleMessages = [];
  let consoleErrors = [];
  let consoleWarnings = [];

  test.beforeEach(async ({ page }) => {
    // Reset message arrays
    consoleMessages = [];
    consoleErrors = [];
    consoleWarnings = [];

    // Listen to all console events
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      consoleMessages.push({ type, text });
      
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Listen to page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
  });

  // Test index page
  test('Index page - check console and HTML', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Log console messages
    console.log('\n=== INDEX PAGE CONSOLE MESSAGES ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\nConsole Warnings:');
      consoleWarnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    // Check for critical errors (but don't fail on warnings)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Failed to load resource') && 
      !err.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Random Number Generator page - check console and HTML', async ({ page }) => {
    await page.goto('/random-number.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== RANDOM NUMBER PAGE CONSOLE MESSAGES ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\nConsole Warnings:');
      consoleWarnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Failed to load resource') && 
      !err.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Password Generator page - check console and HTML', async ({ page }) => {
    await page.goto('/password-generator.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== PASSWORD GENERATOR PAGE CONSOLE MESSAGES ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\nConsole Warnings:');
      consoleWarnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Failed to load resource') && 
      !err.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Random Wheel page - check console and HTML', async ({ page }) => {
    await page.goto('/random-wheel.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== RANDOM WHEEL PAGE CONSOLE MESSAGES ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\nConsole Warnings:');
      consoleWarnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Failed to load resource') && 
      !err.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('QR Generator page - check console and HTML', async ({ page }) => {
    await page.goto('/qr-generator.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== QR GENERATOR PAGE CONSOLE MESSAGES ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\nConsole Warnings:');
      consoleWarnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Failed to load resource') && 
      !err.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Unit Converter page - check console and HTML', async ({ page }) => {
    await page.goto('/unit-converter.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== UNIT CONVERTER PAGE CONSOLE MESSAGES ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\nConsole Warnings:');
      consoleWarnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Failed to load resource') && 
      !err.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('World Clocks page - check console and HTML', async ({ page }) => {
    await page.goto('/world-clocks.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== WORLD CLOCKS PAGE CONSOLE MESSAGES ===');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    if (consoleWarnings.length > 0) {
      console.log('\nConsole Warnings:');
      consoleWarnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Failed to load resource') && 
      !err.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('HTML Validation and Accessibility', () => {
  test('Check for missing alt attributes on images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for images without alt text
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
    
    console.log(`\nImages without alt attribute: ${imagesWithoutAlt}`);
    
    // This is a warning, not an error
    if (imagesWithoutAlt > 0) {
      console.log('⚠️  Some images are missing alt attributes (accessibility concern)');
    }
  });

  test('Check for proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if there's an h1
    const h1Count = await page.$$eval('h1', h1s => h1s.length);
    console.log(`\nH1 headings found: ${h1Count}`);
    
    if (h1Count === 0) {
      console.log('⚠️  No H1 heading found (SEO and accessibility concern)');
    } else if (h1Count > 1) {
      console.log('⚠️  Multiple H1 headings found (should typically have only one)');
    }
  });

  test('Check for form labels', async ({ page }) => {
    await page.goto('/random-number.html');
    await page.waitForLoadState('networkidle');
    
    // Check for inputs without labels or aria-label
    const inputsWithoutLabels = await page.$$eval('input:not([aria-label])', inputs => {
      return inputs.filter(input => {
        const id = input.id;
        if (!id) return true;
        const label = document.querySelector(`label[for="${id}"]`);
        return !label;
      }).length;
    });
    
    console.log(`\nInputs without proper labels: ${inputsWithoutLabels}`);
    
    if (inputsWithoutLabels > 0) {
      console.log('⚠️  Some form inputs are missing labels (accessibility concern)');
    }
  });
});
