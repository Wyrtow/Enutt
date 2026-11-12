// Лист всех локаций (кадр 1920×1080, слои сложены без параллакса) → bgsheet.png
const { chromium } = require('playwright'); require('./backgrounds.js'); const { bg, BW, BH, OX, OY, LOCATIONS } = globalThis.BG;
const list = (process.argv[2] || LOCATIONS.join(',')).split(',');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const loc of list) { const [name, state, time] = loc.split(':'); const r = bg(name, { state: state || 'ok', time: time || 'night', crowd: 1, mchs: 1, gymLit: 1, scarf: 1, leak: 1 });
    const html = r.layers.map(l => `<div style="position:absolute;left:${-OX}px;top:${-OY}px;filter:blur(${l.blur}px)">${l.svg}</div>`).join('');
    await p.setContent(`<body style="margin:0;width:1920px;height:1080px;overflow:hidden;position:relative;background:#000">${html}</body>`);
    await p.screenshot({ path: `/tmp/claude-0/-home-user-Enutt/0e7b05eb-715e-515c-9058-3d3d9955e82a/scratchpad/bg_${name}_${state||'ok'}.png` }); }
  await b.close(); console.log('ok', list.length); })();
