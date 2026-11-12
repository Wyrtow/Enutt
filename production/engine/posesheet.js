// Лист поз: node posesheet.js '<json [{label, s}]>' out.png  — калибровка действий
const { chromium } = require('playwright');
require('./rig.js'); const { human } = globalThis.RIG;
const list = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8')), out = process.argv[3];
const cols = 6, cw = 320, ch = 560, W = cols * cw, H = Math.ceil(list.length / cols) * ch;
let body = list.map((p, i) => { const x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * ch + ch - 60;
  return human({ id: 'm' + i, look: 'mark', x: 0, y: 0, sc: .8, blink: 0, breath: 0, ...p.s, hipX: x / .8, ...(p.s.hipX ? { hipX: x / .8 + p.s.hipX } : {}), footA: [x / .8 - 22, 0], footB: [x / .8 + 22, 0], x: 0, y }).replace('<g transform="translate(0.0,', `<g transform="translate(0.0,`) +
    `<text x="${x}" y="${y + 40}" fill="#fff" font-family="Inter" font-size="22" text-anchor="middle">${p.label}</text>`; }).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><filter id="glow"><feGaussianBlur stdDeviation="4"/></filter></defs><rect width="${W}" height="${H}" fill="#2a2752"/>${body}</svg>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } }); await p.setContent(`<body style="margin:0">${svg}</body>`); await p.screenshot({ path: out }); await b.close(); })();
