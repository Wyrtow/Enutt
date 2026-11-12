// Лист персонажей: node lineup.js → lineup.png
const { chromium } = require('playwright');
const fs = require('fs');
require('./rig.js');
const { human, dog } = globalThis.RIG;
const W = 1920, H = 1080;
const cast = [['mark', 300, 'МАРК'], ['olga', 600, 'ОЛЬГА'], ['petrovich', 900, 'ПЕТРОВИЧ'], ['sonya', 1150, 'СОНЯ'], ['timur', 1350, 'ТИМУР'], ['rescuer', 1600, 'СПАСАТЕЛЬ']];
let body = cast.map(([lk, x, n], i) => human({ id: lk, look: lk, x, y: 900, sc: 1, blink: 0, breath: 0.3, armA: -4, armB: 4, brows: 0.2 }) +
  `<text x="${x}" y="990" fill="#cfc8ee" font-family="Inter" font-weight="800" font-size="30" text-anchor="middle">${n}</text>`).join('');
body += dog({ x: 1800, y: 900, sc: 0.9, facing: -1, t: 0 }) + `<text x="1800" y="990" fill="#cfc8ee" font-family="Inter" font-weight="800" font-size="30" text-anchor="middle">ГРАФ</text>`;
body += human({ id: 'm2', look: 'mark', x: 160, y: 620, sc: 0.5, turn: .85, armA: -20, elbA: 20, armB: 20, elbB: 30, footA: [-40, 0], footB: [40, -20], pitchB: 20 });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<radialGradient id="bg" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#2a2752"/><stop offset="1" stop-color="#0c0b1d"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>${body}</svg>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(`<body style="margin:0">${svg}</body>`); await p.screenshot({ path: 'lineup.png' }); await b.close(); console.log('ok'); })();
