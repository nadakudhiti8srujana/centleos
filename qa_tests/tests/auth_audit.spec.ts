import { test, expect } from '@playwright/test';

test.describe('Authentication and Registration Flows', () => {
  // Shared email to pass the newly registered user's email from Flow 3 to Flow 4
  let registeredEmail = 'audituser@saasum.com';

  test('Flow 1: Super Admin Login', async ({ page }) => {
    // Force desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173/login');
    const leftPage = page.locator('.origin-right');
    
    // Click Super Admin tab (forcing click to bypass framer-motion stability checks)
    await leftPage.locator('button:has-text("Super Admin")').click({ force: true });
    await page.waitForTimeout(500);
    
    // Fill in credentials
    await leftPage.locator('input[type="email"]').fill('superadmin@centleos.com');
    await leftPage.locator('input[type="password"]').fill('SuperAdmin@123');
    
    // Click Submit
    await leftPage.locator('button[type="submit"]').click({ force: true });
    
    // Wait for redirect to /super-admin
    await page.waitForURL('**/super-admin');
    await page.waitForTimeout(2000); // Allow dashboard to load
    
    // Save screenshot
    await page.screenshot({ path: 'screenshots/1_super_admin_dashboard.png', fullPage: true });
    
    // Verify role header or elements
    await expect(page.locator('text=Super Admin').first()).toBeVisible();
  });

  test('Flow 2: Company Admin Login', async ({ page }) => {
    // Force desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173/login');
    const leftPage = page.locator('.origin-right');
    
    // Click Company / User Login tab
    await leftPage.locator('button:has-text("Company Login")').click({ force: true });
    await page.waitForTimeout(500);
    
    // Select Company dropdown
    await leftPage.locator('button:has-text("Select Workspace")').click({ force: true });
    await page.waitForTimeout(300);
    await leftPage.locator('button:has-text("Saasum")').click({ force: true });
    await page.waitForTimeout(300);
    
    // Fill in credentials
    await leftPage.locator('input[type="email"]').fill('admin@saasum.com');
    await leftPage.locator('input[type="password"]').fill('CompanyAdmin@123');
    
    // Click Submit
    await leftPage.locator('button[type="submit"]').click({ force: true });
    
    // Wait for redirect to /dashboard
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(2000); // Allow dashboard to load
    
    // Save screenshot
    await page.screenshot({ path: 'screenshots/2_company_admin_dashboard.png', fullPage: true });
  });

  test('Flow 3: New User Registration', async ({ page }) => {
    // Force desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173/register');
    const rightPage = page.locator('.origin-left');
    await page.waitForTimeout(1000);
    
    // Click Register User tab
    await rightPage.locator('button:has-text("Register User")').click({ force: true });
    await page.waitForTimeout(500);
    
    // Select Company dropdown
    await rightPage.locator('button:has-text("Select Workspace")').click({ force: true });
    await page.waitForTimeout(300);
    await rightPage.locator('button:has-text("Saasum")').click({ force: true });
    await page.waitForTimeout(300);
    
    // Use dynamic email to avoid "Email already registered" conflict
    registeredEmail = `audituser.${Date.now()}@saasum.com`;
    
    // Fill in registration details using nth inputs
    await rightPage.locator('input').nth(0).fill('Audit User');
    await rightPage.locator('input[type="email"]').fill(registeredEmail);
    await rightPage.locator('input[type="password"]').fill('AuditUser@123');
    
    // Save screenshot of registration page filled
    await page.screenshot({ path: 'screenshots/3_register_page_filled.png' });
    
    // Submit form
    await rightPage.locator('button[type="submit"]').click({ force: true });
    
    // Verify success message is shown
    await expect(page.locator('text=Account created successfully!')).toBeVisible();
    
    // Save screenshot
    await page.screenshot({ path: 'screenshots/3_registration_success.png', fullPage: true });
  });

  test('Flow 4: New User Login', async ({ page }) => {
    // Force desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173/login');
    const rightPage = page.locator('.origin-left');
    await page.waitForTimeout(1000);
    
    // Click Company / User Login tab
    await rightPage.locator('button:has-text("User Login")').click({ force: true });
    await page.waitForTimeout(500);
    
    // Select Company dropdown
    await rightPage.locator('button:has-text("Select Workspace")').click({ force: true });
    await page.waitForTimeout(300);
    await rightPage.locator('button:has-text("Saasum")').click({ force: true });
    await page.waitForTimeout(300);
    
    // Fill in credentials using shared dynamic email
    await rightPage.locator('input[type="email"]').fill(registeredEmail);
    await rightPage.locator('input[type="password"]').fill('AuditUser@123');
    
    // Click Submit
    await rightPage.locator('button[type="submit"]').click({ force: true });
    
    // Wait for redirect to /user-dashboard
    await page.waitForURL('**/user-dashboard');
    await page.waitForTimeout(2000); // Allow dashboard to load
    
    // Save screenshot
    await page.screenshot({ path: 'screenshots/4_user_dashboard_after_login.png', fullPage: true });
  });

});
