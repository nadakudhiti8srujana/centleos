import { test, expect } from '@playwright/test';

test.describe('Authentication and Registration Flows', () => {

  test('Flow 1: Super Admin Login', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Click Super Admin tab
    await page.click('button:has-text("Super Admin Login")');
    await page.waitForTimeout(500);
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'superadmin@centleos.com');
    await page.fill('input[type="password"]', 'SuperAdmin@123');
    
    // Click Submit
    await page.click('button[type="submit"]');
    
    // Wait for redirect to /super-admin
    await page.waitForURL('**/super-admin');
    await page.waitForTimeout(2000); // Allow dashboard to load
    
    // Save screenshot
    await page.screenshot({ path: 'screenshots/1_super_admin_dashboard.png', fullPage: true });
    
    // Verify role header or elements
    await expect(page.locator('text=Global Super Admin')).toBeVisible();
  });

  test('Flow 2: Company Admin Login', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Click Company / User Login tab
    await page.click('button:has-text("Company / User Login")');
    await page.waitForTimeout(500);
    
    // Select Company dropdown
    await page.selectOption('select', 'saasum');
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@saasum.com');
    await page.fill('input[type="password"]', 'CompanyAdmin@123');
    
    // Click Submit
    await page.click('button[type="submit"]');
    
    // Wait for redirect to /dashboard
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(2000); // Allow dashboard to load
    
    // Save screenshot
    await page.screenshot({ path: 'screenshots/2_company_admin_dashboard.png', fullPage: true });
  });

  test('Flow 3: New User Registration', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    await page.waitForTimeout(1000);
    
    // Select Company dropdown
    await page.selectOption('select', 'saasum');
    
    // Fill in registration details using nth inputs
    await page.locator('input').nth(0).fill('Audit User');
    await page.locator('input[type="email"]').fill('audituser@saasum.com');
    await page.locator('input[type="password"]').fill('AuditUser@123');
    
    // Save screenshot of registration page filled
    await page.screenshot({ path: 'screenshots/3_register_page_filled.png' });
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to /user-dashboard
    await page.waitForURL('**/user-dashboard');
    await page.waitForTimeout(2000); // Allow dashboard to load
    
    // Save screenshot
    await page.screenshot({ path: 'screenshots/3_user_dashboard_after_registration.png', fullPage: true });
  });

  test('Flow 4: New User Login', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    
    // Click Company / User Login tab
    await page.click('button:has-text("Company / User Login")');
    await page.waitForTimeout(500);
    
    // Select Company dropdown
    await page.selectOption('select', 'saasum');
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'audituser@saasum.com');
    await page.fill('input[type="password"]', 'AuditUser@123');
    
    // Click Submit
    await page.click('button[type="submit"]');
    
    // Wait for redirect to /user-dashboard
    await page.waitForURL('**/user-dashboard');
    await page.waitForTimeout(2000); // Allow dashboard to load
    
    // Save screenshot
    await page.screenshot({ path: 'screenshots/4_user_dashboard_after_login.png', fullPage: true });
  });

});
