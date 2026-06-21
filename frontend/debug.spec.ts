import { test, expect } from '@playwright/test';

test('check console errors', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR LOG:', msg.text());
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  page.on('response', response => {
    if(response.status() >= 400) {
      console.log('BAD RESPONSE:', response.status(), response.url());
    }
  });
  
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000); 
});
