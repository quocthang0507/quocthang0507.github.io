import { test, expect } from '@playwright/test';

test.describe('Homepage UI and Responsive Navigation Menu', () => {
  // Test desktop layout
  test('Desktop layout displays navbar horizontally with hidden toggler', async ({ page }) => {
    // Set desktop resolution
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    // Check site title
    const brand = page.locator('.navbar-brand');
    await expect(brand).toBeVisible();

    // Verify search and theme action buttons are visible
    const actionsGroup = page.locator('.nav-actions-group');
    await expect(actionsGroup).toBeVisible();

    // Verify hamburger menu toggler is hidden on desktop
    const toggler = page.locator('.navbar-toggler');
    await expect(toggler).not.toBeVisible();

    // Check main navigation links
    const homeLink = page.locator('.navbar-nav >> text=Trang chủ');
    await expect(homeLink).toBeVisible();
  });

  // Test mobile layout & toggler behavior
  test('Mobile layout collapses menu, toggles correctly, and displays nested dropdown inline', async ({ page }) => {
    // Set mobile resolution (iPhone 11/12 dimensions)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // 1. Verify Brand is visible, but the collapsible menu is initially hidden
    const brand = page.locator('.navbar-brand');
    await expect(brand).toBeVisible();

    const collapseMenu = page.locator('#navbarNav');
    await expect(collapseMenu).not.toBeVisible();

    // 2. Verify hamburger toggler is visible on mobile
    const toggler = page.locator('.navbar-toggler');
    await expect(toggler).toBeVisible();

    // Take screenshot of collapsed mobile layout
    await page.screenshot({ path: 'tests/screenshots/mobile-collapsed.png' });

    // 3. Click the toggler to expand the menu
    await toggler.click();
    
    // Wait for the collapse animation to finish
    await page.waitForTimeout(500);
    await expect(collapseMenu).toBeVisible();

    // Take screenshot of expanded mobile layout
    await page.screenshot({ path: 'tests/screenshots/mobile-expanded.png' });

    // 4. Verify vertical layout on mobile (items should wrap/stack vertically)
    const navList = page.locator('.navbar-nav');
    await expect(navList).toHaveCSS('flex-direction', 'column');

    // 5. Test Tools dropdown behavior in mobile view
    const toolsToggle = page.locator('#toolsDropdown');
    await expect(toolsToggle).toBeVisible();

    const dropdownMenu = page.locator('.dropdown-menu[aria-labelledby="toolsDropdown"]');
    await expect(dropdownMenu).not.toBeVisible();

    // Click to open dropdown
    await toolsToggle.click();
    await page.waitForTimeout(300);

    // Verify dropdown menu displays block inline (position static)
    await expect(dropdownMenu).toBeVisible();
    await expect(dropdownMenu).toHaveCSS('position', 'static');

    // Take screenshot of expanded dropdown on mobile
    await page.screenshot({ path: 'tests/screenshots/mobile-expanded-dropdown.png' });

    // 6. Verify that it contains expected links, e.g., "Tạo số ngẫu nhiên"
    const randomNumberLink = page.locator('.dropdown-item >> text=Tạo số ngẫu nhiên');
    await expect(randomNumberLink).toBeVisible();
  });

  test('Clicking a day on the calendar opens the details modal with traditional good/bad day information', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    // Wait for the calendar to render
    const dayLink = page.locator('.calendar-day-link').first();
    await expect(dayLink).toBeVisible();

    // Click on the first day
    await dayLink.click();

    // Wait for the modal to open
    const modal = page.locator('#dateDetailsModal');
    await expect(modal).toBeVisible();

    // Check if the Can Chi of the day and evaluations are rendered
    const dayStatus = modal.locator('.date-card >> text=Đánh giá ngày');
    await expect(dayStatus).toBeVisible();

    // Take screenshot of the date details modal
    await page.screenshot({ path: 'tests/screenshots/desktop-date-details-modal.png' });
  });
});
