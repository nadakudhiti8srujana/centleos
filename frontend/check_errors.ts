import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
  });
  page.on('pageerror', exception => {
    console.log(`PAGE EXCEPTION: ${exception}`);
  });

  page.on('response', async response => {
    if (response.status() >= 400) {
      console.log(`HTTP ${response.status()} on ${response.url()}`);
      try {
        const text = await response.text();
        console.log(`RESPONSE BODY: ${text}`);
      } catch (e) {}
    }
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log("Page loaded successfully.");
  } catch (e) {
    console.log("Failed to load:", e);
  }

  await browser.close();
}

main().catch(console.error);
