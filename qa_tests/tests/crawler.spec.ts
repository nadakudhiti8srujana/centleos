import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Store results
const results: any = {
  routes: {},
  networkErrors: [],
  consoleErrors: [],
  brokenFeatures: [],
  workingFeatures: [],
};

const timestamp = Date.now();
const testEmail = `qa.test.${timestamp}@example.com`;
const testPassword = 'Password123!';

test.describe('CentleOS QA Audit', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.consoleErrors.push({ text: msg.text(), location: msg.location() });
      }
    });

    // Listen for failed network requests
    page.on('response', response => {
      if (response.status() >= 400) {
        results.networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });
  });

  test.afterAll(async () => {
    fs.writeFileSync('qa_results.json', JSON.stringify(results, null, 2));
  });

  test('Module 1: Authentication - Registration & Login', async () => {
    // Attempt registration
    await page.goto('http://localhost:5173/register');
    await page.screenshot({ path: 'screenshots/1_register_page.png' });
    
    // Fill registration form (guessing standard fields)
    const nameInput = page.locator('input[type="text"], input[name="name"], input[placeholder*="Name"]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitBtn = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').first();

    if (await nameInput.isVisible()) await nameInput.fill('QA Tester');
    if (await emailInput.isVisible()) await emailInput.fill(testEmail);
    if (await passwordInput.isVisible()) await passwordInput.fill(testPassword);
    
    await page.screenshot({ path: 'screenshots/2_register_filled.png' });
    
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000); // Wait for potential navigation or error
    } else {
      results.brokenFeatures.push('Register Submit button not found');
    }

    // Check if we are logged in or need to log in
    if (page.url().includes('login') || page.url().includes('register')) {
      // Need to login explicitly
      await page.goto('http://localhost:5173/login');
      if (await emailInput.isVisible()) await emailInput.fill(testEmail);
      if (await passwordInput.isVisible()) await passwordInput.fill(testPassword);
      const loginBtn = page.locator('button[type="submit"], button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign In")').first();
      if (await loginBtn.isVisible()) {
        await loginBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: 'screenshots/3_after_auth.png' });
    
    if (page.url().includes('dashboard')) {
      results.workingFeatures.push('Authentication (Register/Login)');
    } else {
      results.brokenFeatures.push('Authentication (Did not redirect to dashboard)');
    }
  });

  const routesToTest = [
    '/dashboard',
    '/leads',
    '/contacts',
    '/accounts',
    '/deals',
    '/pipeline',
    '/invoices',
    '/referrals',
    '/analytics',
    '/email-templates',
    '/email-logs',
    '/audit-logs',
    '/notifications',
    '/settings',
    '/workspace-settings',
    '/pipeline-settings',
    '/super-admin'
  ];

  for (const route of routesToTest) {
    test(`Module: Navigation & Basic Load for ${route}`, async () => {
      await page.goto(`http://localhost:5173${route}`);
      await page.waitForTimeout(2000); // Allow data to load
      
      const screenshotPath = `screenshots/route_${route.replace('/', '')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const hasErrorText = await page.locator('text=/error|failed to load/i').isVisible();
      if (hasErrorText) {
        results.brokenFeatures.push(`Route ${route} shows error text on page`);
      } else {
        results.workingFeatures.push(`Route ${route} loaded successfully`);
      }
      
      // Attempt to click 'Create' or 'Add' buttons to test CRUD modals
      const createBtn = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `screenshots/route_${route.replace('/', '')}_modal.png` });
        
        // Try filling any form in modal
        const inputs = await page.locator('input[type="text"]').all();
        for (let i = 0; i < Math.min(inputs.length, 3); i++) {
            if (await inputs[i].isVisible()) await inputs[i].fill(`QA Test ${Date.now()}`);
        }
        
        const saveBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Submit")').first();
        if (await saveBtn.isVisible()) {
            await saveBtn.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `screenshots/route_${route.replace('/', '')}_after_save.png` });
        }
        
        // Close modal if still open (escape key)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      results.routes[route] = { tested: true };
    });
  }
});
