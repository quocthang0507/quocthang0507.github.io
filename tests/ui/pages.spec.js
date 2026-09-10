import { test, expect } from '@playwright/test';

const pages = [
  { name: 'Delegate Nameplate', path: '/delegate-nameplate/' },
  { name: 'Home', path: '/' },
  { name: 'Case Converter', path: '/case-converter/' },
  { name: 'Color Picker', path: '/color-picker/' },
  { name: 'Currency Converter', path: '/currency-converter/' },
  { name: 'Date Calculator', path: '/date-calculator/' },
  { name: 'Encoder/Decoder', path: '/encoder-decoder/' },
  { name: 'Gold Price', path: '/gold-price/' },
  { name: 'Hash Generator', path: '/hash-generator/' },
  { name: 'JSON Formatter', path: '/json-formatter/' },
  { name: 'LaTeX Editor', path: '/latex-editor/' },
  { name: 'Markdown Preview', path: '/markdown-preview/' },
  { name: 'Password Generator', path: '/password-generator/' },
  { name: 'Privacy Policy', path: '/privacy/' },
  { name: 'QR Code Generator', path: '/qr-generator/' },
  { name: 'Random Number', path: '/random-number/' },
  { name: 'Random Wheel', path: '/random-wheel/' },
  { name: 'Regex Tester', path: '/regex-tester/' },
  { name: 'Unit Converter', path: '/unit-converter/' },
  { name: 'World Clocks', path: '/world-clocks/' }
];

test.describe('Responsive Pages UI Verification', () => {
  for (const pageObj of pages) {
    test.describe(`${pageObj.name} Page (${pageObj.path})`, () => {
      
      // Desktop Viewport Test
      test('Desktop viewport renders correctly with no JS errors', async ({ page }) => {
        // Collect console errors
        const jsErrors = [];
        page.on('pageerror', (exception) => {
          jsErrors.push(exception.message);
        });

        const consoleErrors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            // Ignore network request failures from proxies or external APIs
            const isExternalNetworkError = 
              text.includes('corsproxy.io') ||
              text.includes('allorigins.win') ||
              text.includes('codetabs.com') ||
              text.includes('vietcombank.com.vn') ||
              text.includes('raw.githubusercontent.com') ||
              text.includes('net::ERR_');
            if (isExternalNetworkError) return;
            consoleErrors.push(text);
          }
        });

        // Set desktop viewport
        await page.setViewportSize({ width: 1200, height: 800 });
        const response = await page.goto(pageObj.path);

        // Assert response status
        expect(response.status()).toBe(200);

        // Verify key structural elements are present
        const brand = page.locator('.navbar-brand');
        await expect(brand).toBeVisible();

        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        // Verify toggler button is hidden on desktop expand-lg
        const toggler = page.locator('.navbar-toggler');
        await expect(toggler).not.toBeVisible();

        // Save screenshot
        const fileName = pageObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await page.screenshot({ path: `tests/screenshots/desktop-${fileName}.png` });

        // Check if there were any runtime JS errors
        expect(jsErrors).toEqual([]);
        expect(consoleErrors).toEqual([]);
      });

      // Mobile Viewport Test
      test('Mobile viewport collapses navbar and renders correctly', async ({ page }) => {
        // Collect console errors
        const jsErrors = [];
        page.on('pageerror', (exception) => {
          jsErrors.push(exception.message);
        });

        const consoleErrors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            // Ignore network request failures from proxies or external APIs
            const isExternalNetworkError = 
              text.includes('corsproxy.io') ||
              text.includes('allorigins.win') ||
              text.includes('codetabs.com') ||
              text.includes('vietcombank.com.vn') ||
              text.includes('raw.githubusercontent.com') ||
              text.includes('net::ERR_');
            if (isExternalNetworkError) return;
            consoleErrors.push(text);
          }
        });

        // Set mobile viewport (iPhone 11/12 dimensions)
        await page.setViewportSize({ width: 375, height: 812 });
        const response = await page.goto(pageObj.path);

        // Assert response status
        expect(response.status()).toBe(200);

        // Verify brand is visible
        const brand = page.locator('.navbar-brand');
        await expect(brand).toBeVisible();

        // Verify toggler button is visible on mobile
        const toggler = page.locator('.navbar-toggler');
        await expect(toggler).toBeVisible();

        // Verify collapsible menu is initially collapsed/hidden
        const collapseMenu = page.locator('#navbarNav');
        await expect(collapseMenu).not.toBeVisible();

        // Save screenshot
        const fileName = pageObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await page.screenshot({ path: `tests/screenshots/mobile-${fileName}.png` });

        // Check if there were any runtime JS errors
        expect(jsErrors).toEqual([]);
        expect(consoleErrors).toEqual([]);
      });
    });
  }
});
