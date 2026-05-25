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

  const extractLayout = async (page) => {
    return await page.evaluate(() => {
      function gi(el) {
        const r = el.getBoundingClientRect();
        return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      }
      function gc(el) {
        const cs = window.getComputedStyle(el);
        return {
          ...gi(el),
          ml: cs.marginLeft, mr: cs.marginRight, mt: cs.marginTop, mb: cs.marginBottom,
          pl: cs.paddingLeft, pr: cs.paddingRight, pt: cs.paddingTop, pb: cs.paddingBottom,
          fl: cs.float, bs: cs.boxSizing, pos: cs.position, disp: cs.display, ovf: cs.overflow,
        };
      }
      const R = {};
      const h = document.documentElement, b = document.body;
      R['_html'] = { cw: h.clientWidth, ch: h.clientHeight, sw: h.scrollWidth, sh: h.scrollHeight, bs: getComputedStyle(h).boxSizing };
      R['_body'] = { cw: b.clientWidth, ch: b.clientHeight, sw: b.scrollWidth, sh: b.scrollHeight, bs: getComputedStyle(b).boxSizing, mg: getComputedStyle(b).margin, pd: getComputedStyle(b).padding };
      const main = document.querySelector('.main') || document.querySelector('.datao-main');
      if (main) R['.main'] = gc(main);
      ['main_top','main_middle','main_bottom'].forEach(c => {
        const el = document.querySelector('.'+c);
        if (el) {
          R['.'+c] = gc(el);
          [...el.children].forEach(ch => {
            const cc = ch.className ? ch.className.split(' ')[0] : ch.tagName;
            R['.'+c+'>'+cc] = gc(ch);
          });
        }
      });
      document.querySelectorAll('.nav').forEach((el,i) => R['.nav['+i+']'] = gc(el));
      document.querySelectorAll('.leftBox,.rightBox,.centerBox,.baseBox').forEach((el,i) => {
        const c = el.className.split(' ').filter(x => ['leftBox','rightBox','centerBox','baseBox'].includes(x))[0];
        R[c+'['+i+']'] = gc(el);
      });
      return R;
    });
  };

  const O = await extractLayout(page1);
  const V = await extractLayout(page2);

  const diffs = [];
  for (const k of new Set([...Object.keys(O),...Object.keys(V)])) {
    const o=O[k], v=V[k];
    if (!o||!v) { diffs.push({k,MISSING:o?'vue':'original'}); continue; }
    const fd = [];
    for (const f of new Set([...Object.keys(o),...Object.keys(v)])) {
      if (JSON.stringify(o[f])!==JSON.stringify(v[f])) fd.push(f+': O='+JSON.stringify(o[f])+' V='+JSON.stringify(v[f]));
    }
    if (fd.length) diffs.push({k,d:fd});
  }

  console.log(JSON.stringify(diffs, null, 2));
  await browser.close();
})();
