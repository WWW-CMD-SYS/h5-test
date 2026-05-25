import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const viewport = { width: 1920, height: 1080 };

  const page1 = await browser.newPage({ viewport });
  await page1.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(2000);

  const page2 = await browser.newPage({ viewport });
  await page2.goto('http://localhost:5176/DataO', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(2000);

  const checkStyles = async (page, label) => {
    return await page.evaluate(() => {
      const results = {};
      const selectors = [
        '.main_top_middle',
        '.main_middle_list',
        '.main_bottom_top',
        '.main_bottom_bottom',
        '.main_top_left',
        '.main_top',
        '.main_middle',
        '.main_bottom',
        '.main_con',
        '.main',
      ];
      selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
          const cs = window.getComputedStyle(el);
          const r = el.getBoundingClientRect();
          results[sel] = {
            found: true,
            x: +r.x.toFixed(1), y: +r.y.toFixed(1),
            w: +r.width.toFixed(1), h: +r.height.toFixed(1),
            ml: cs.marginLeft, mr: cs.marginRight,
            mt: cs.marginTop, mb: cs.marginBottom,
            fl: cs.float, bs: cs.boxSizing,
            pos: cs.position, disp: cs.display,
            w_css: cs.width, h_css: cs.height,
          };
        } else {
          results[sel] = { found: false };
        }
      });

      // Also check: is there any CSS rule overriding margin-left?
      const mtm = document.querySelector('.main_top_middle');
      if (mtm) {
        const sheets = document.styleSheets;
        const rules = [];
        for (const sheet of sheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.style && rule.selectorText && mtm.matches(rule.selectorText)) {
                if (rule.style.marginLeft || rule.style.margin) {
                  rules.push({
                    sel: rule.selectorText,
                    ml: rule.style.marginLeft,
                    m: rule.style.margin,
                  });
                }
              }
            }
          } catch(e) {}
        }
        results['._main_top_middle_rules'] = rules;
      }

      return results;
    });
  };

  const orig = await checkStyles(page1, 'original');
  const vue = await checkStyles(page2, 'vue');

  // Compare
  console.log('=== ORIGINAL ===');
  console.log(JSON.stringify(orig, null, 2));
  console.log('\n=== VUE ===');
  console.log(JSON.stringify(vue, null, 2));

  await browser.close();
})();
