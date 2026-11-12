// Отрезки на одном фоне подряд длиннее порога: node bgruns.js <timeline.json> [15]
const t = require(require('path').resolve(process.argv[2])), lim = +(process.argv[3] || 15);
let start = 0, prev = null, keys = [];
const out = [];
t.shots.forEach((s, i) => { if (s.bg !== prev) { if (prev) out.push([prev, start, s.a, keys]); prev = s.bg; start = s.a; keys = []; } keys.push(s.key.split(':')[1]); });
out.push([prev, start, t.frames, keys]);
for (const [bg, a, b, k] of out) if ((b - a) / 30 > lim) console.log(`${((b - a) / 30).toFixed(1)} с  ${bg}  с ${(a / 30).toFixed(0)} с  сцены(idx) ${[...new Set(k)].join(',')}`);
