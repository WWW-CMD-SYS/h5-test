const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const viewport = { width: 1920, height: 1080 };

  // Page 1: Original HTML version
  const page1 = await browser.newPage({ viewport });
  await page1.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(2000);

  // Page 2: Vue version
  const page2 = await browser.newPage({ viewport });
  await page2.goto('http://localhost:5176/DataO', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(2000);

  // Extract positions and computed styles from key layout elements
  const extractLayout = async (page) => {
    return await page.evaluate(() => {
      function getRectInfo(el) {
        const rect = el.getBoundingClientRect();
        return {
          x: Math.round(rect.x * 10) / 10,
          y: Math.round(rect.y * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        };
      }

      function getBoxInfo(el, selector) {
        const cs = window.getComputedStyle(el);
        return {
          ...getRectInfo(el),
          css: {
            width: cs.width,
            height: cs.height,
            marginLeft: cs.marginLeft,
            marginRight: cs.marginRight,
            marginTop: cs.marginTop,
            marginBottom: cs.marginBottom,
            float: cs.float,
            clear: cs.clear,
            boxSizing: cs.boxSizing,
            position: cs.position,
            display: cs.display,
            overflow: cs.overflow,
            paddingLeft: cs.paddingLeft,
            paddingRight: cs.paddingRight,
            paddingTop: cs.paddingTop,
            paddingBottom: cs.paddingBottom,
            borderLeftWidth: cs.borderLeftWidth,
            borderRightWidth: cs.borderRightWidth,
            borderTopWidth: cs.borderTopWidth,
            borderBottomWidth: cs.borderBottomWidth,
          }
        };
      }

      const results = {};

      // Check body/html
      const html = document.documentElement;
      const body = document.body;
      results['html'] = {
        clientW: html.clientWidth,
        clientH: html.clientHeight,
        scrollW: html.scrollWidth,
        scrollH: html.scrollHeight,
        bsHtml: window.getComputedStyle(html).boxSizing,
        bsBody: window.getComputedStyle(body).boxSizing,
        marginBody: window.getComputedStyle(body).margin,
        paddingBody: window.getComputedStyle(body).padding,
        widthBody: window.getComputedStyle(body).width,
        heightBody: window.getComputedStyle(body).height,
      };

      // Get .main
      const main = document.querySelector('.main') || document.querySelector('.datao-main');
      if (main) {
        results['.main'] = getRectInfo(main);
        results['.main_css'] = {
          width: window.getComputedStyle(main).width,
          height: window.getComputedStyle(main).height,
          position: window.getComputedStyle(main).position,
          overflow: window.getComputedStyle(main).overflow,
        };
      }

      // Get .main_top, .main_middle, .main_bottom
      ['main_top', 'main_middle', 'main_bottom'].forEach(cls => {
        const el = document.querySelector('.' + cls);
        if (el) {
          results['.' + cls] = getBoxInfo(el, '.' + cls);
          // Also get children
          Array.from(el.children).forEach(child => {
            const childClass = child.className ? child.className.split(' ')[0] : child.tagName;
            results['.' + cls + ' > .' + childClass] = getBoxInfo(child);
          });
        }
      });

      // Get .nav elements
      document.querySelectorAll('.nav').forEach((el, i) => {
        results['.nav[' + i + ']'] = getBoxInfo(el);
      });

      // Get all leftBox/rightBox/centerBox/baseBox
      document.querySelectorAll('.leftBox, .rightBox, .centerBox, .baseBox').forEach((el, i) => {
        const cls = el.className.split(' ').filter(c => ['leftBox', 'rightBox', 'centerBox', 'baseBox'].includes(c))[0];
        results[cls + '[' + i + ']'] = getBoxInfo(el);
      });

      return results;
    });
  };

  const original = await extractLayout(page1);
  const vue = await extractLayout(page2);

  // Diff the results
  const diffs = [];
  const allKeys = new Set([...Object.keys(original), ...Object.keys(vue)]);

  for (const key of allKeys) {
    const o = original[key];
    const v = vue[key];
    if (!o || !v) {
      diffs.push({ key, issue: 'missing', original: o || '(none)', vue: v || '(none)' });
      continue;
    }
    // Compare all fields
    if (typeof o === 'object' && typeof v === 'object') {
      const allFields = new Set([...Object.keys(o), ...Object.keys(v)]);
      const fieldDiffs = [];
      for (const f of allFields) {
        if (JSON.stringify(o[f]) !== JSON.stringify(v[f])) {
          fieldDiffs.push({ field: f, original: o[f], vue: v[f] });
        }
      }
      if (fieldDiffs.length > 0) {
        diffs.push({ key, diffs: fieldDiffs });
      }
    }
  }

  console.log('=== DIFFERENCES ===');
  diffs.forEach(d => console.log(JSON.stringify(d, null, 2)));

  await browser.close();
})();
