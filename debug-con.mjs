import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:5176/DataO', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    const con = document.querySelector('.main_con');
    if (!con) return 'NOT FOUND';
    const cs = window.getComputedStyle(con);
    return {
      position: cs.position,
      left: cs.left,
      right: cs.right,
      top: cs.top,
      bottom: cs.bottom,
      width: cs.width,
      height: cs.height,
      marginLeft: cs.marginLeft,
      marginTop: cs.marginTop,
      marginRight: cs.marginRight,
      marginBottom: cs.marginBottom,
      // Check parent
      parentTag: con.parentElement?.tagName,
      parentClass: con.parentElement?.className,
      parentW: con.parentElement?.clientWidth,
      parentH: con.parentElement?.clientHeight,
      parentPos: con.parentElement ? getComputedStyle(con.parentElement).position : 'N/A',
      // Check grandparent
      gpTag: con.parentElement?.parentElement?.tagName,
      gpClass: con.parentElement?.parentElement?.className,
      gpW: con.parentElement?.parentElement?.clientWidth,
      gpH: con.parentElement?.parentElement?.clientHeight,
      gpPos: con.parentElement?.parentElement ? getComputedStyle(con.parentElement?.parentElement).position : 'N/A',
      // Check CSS rules for .main_con
      sheets: document.styleSheets.length,
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
