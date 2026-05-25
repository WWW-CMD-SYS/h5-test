import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const viewport = { width: 1920, height: 1080 };

  const page1 = await browser.newPage({ viewport });
  await page1.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(3000);
  await page1.screenshot({ path: '/Users/wxj/WorkBuddy/2026-05-22-16-05-56/original-after-fix.png', fullPage: false });

  const page2 = await browser.newPage({ viewport });
  await page2.goto('http://localhost:5176/DataO', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(3000);
  await page2.screenshot({ path: '/Users/wxj/WorkBuddy/2026-05-22-16-05-56/vue-after-fix.png', fullPage: false });

  console.log('Screenshots saved!');
  await browser.close();
})();
