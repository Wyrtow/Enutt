// Фоны «Один герой»: 2D-вектор, многоплановые слои (sky/far/mid/hero/fg) для параллакса камеры.
// bg(loc, opt) → { layers:[{name,z,blur,svg}], ground, light } ; холст слоя BW×BH (кадр 1920×1080 + запас по краям).
(function (root) {
  const BW = 2400, BH = 1350, OX = 240, OY = 135; // кадр начинается в (OX,OY) холста
  const GROUND = OY + 900;                       // линия пола/земли под ногами героя (y=900 кадра)
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); const rs = s => { seed = s; };
  const R = (a, b) => a + (b - a) * rnd();
  const pick = a => a[Math.floor(rnd() * a.length)];
  const svgWrap = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}"><defs>${COMMON_DEFS}${defs}</defs>${inner}</svg>`;
  const COMMON_DEFS = `
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bglow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="40"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="dust" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".006 .018" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .66  0 0 0 0 .62  0 0 0 0 .78  0 0 0 1.5 -.5"/><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="snowtex"><feTurbulence type="fractalNoise" baseFrequency=".02 .06" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.15"/></filter>`;

  // ---------- ПАЛИТРЫ ВРЕМЕНИ ----------
  const TIME = {
    night:   { sky: ['#05061a', '#151538', '#2b2652'], far: '#24224a', mid: '#1a1838', near: '#121029', win: '#ffbf6e', winOff: '#1c1a36', snow: '#c9c6e6', snowLo: '#7e7aa8', ground: ['#26233f', '#0d0b19'], fog: '#7d6fb8', lamp: '#ffd08a', stars: 1 },
    blackout:{ sky: ['#04040f', '#10102a', '#211d40'], far: '#1c1a3c', mid: '#141230', near: '#0e0c22', win: '#ffa860', winOff: '#151330', snow: '#b7b4d8', snowLo: '#6c6896', ground: ['#1f1c36', '#0a0914'], fog: '#6c5fa6', lamp: '#ffc070', stars: 1 },
    predawn: { sky: ['#0e1638', '#3a3a78', '#8a6a9a'], far: '#3a3a6c', mid: '#262650', near: '#1a1a3a', win: '#ffc98a', winOff: '#24234a', snow: '#d8d6f0', snowLo: '#8c88b8', ground: ['#34305a', '#121024'], fog: '#a090d0', lamp: '#ffd8a0', stars: .4 },
    dawn:    { sky: ['#5a76b8', '#c79ab8', '#ffd0a0'], far: '#7a7aac', mid: '#4c4c80', near: '#2e2e58', win: '#ffe0b0', winOff: '#3c3c6a', snow: '#f2eef8', snowLo: '#a8a4cc', ground: ['#6a6496', '#2a2648'], fog: '#ffd8c0', lamp: '#ffe8c0', stars: 0 },
  };

  // ---------- БЛОКИ ----------
  function sky(T, opt = {}) {
    rs(opt.seed || 3);
    let s = `<defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset=".6" stop-color="${T.sky[1]}"/><stop offset="1" stop-color="${T.sky[2]}"/></linearGradient></defs>
      <rect width="${BW}" height="${BH}" fill="url(#skyG)"/>`;
    if (T.stars) for (let i = 0; i < 220; i++) s += `<circle cx="${R(0, BW).toFixed(0)}" cy="${R(0, BH * .55).toFixed(0)}" r="${R(.5, 2).toFixed(1)}" fill="#fff" opacity="${(R(.2, .8) * T.stars).toFixed(2)}"/>`;
    if (opt.moon) s += `<circle cx="${opt.moon[0]}" cy="${opt.moon[1]}" r="210" fill="#cfd8ff" opacity=".18" filter="url(#bglow)"/><circle cx="${opt.moon[0]}" cy="${opt.moon[1]}" r="78" fill="#eef0ff" opacity=".95"/><circle cx="${opt.moon[0] - 22}" cy="${opt.moon[1] - 14}" r="14" fill="#cfd4f0" opacity=".6"/><circle cx="${opt.moon[0] + 26}" cy="${opt.moon[1] + 20}" r="9" fill="#cfd4f0" opacity=".6"/>`;
    if (opt.sun) s += `<circle cx="${opt.sun[0]}" cy="${opt.sun[1]}" r="320" fill="#ffd8a0" opacity=".35" filter="url(#bglow)"/><circle cx="${opt.sun[0]}" cy="${opt.sun[1]}" r="90" fill="#fff2d8"/>`;
    if (opt.fireGlow) s += `<ellipse cx="${opt.fireGlow[0]}" cy="${opt.fireGlow[1]}" rx="620" ry="300" fill="#ff7a2a" opacity=".45" filter="url(#bglow)"/>`;
    return s;
  }
  function building(x, base, w, h, c, T, o = {}) {
    let s = `<g transform="rotate(${o.tilt || 0} ${x + w / 2} ${base})"><rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${c}"/>`;
    s += `<rect x="${x}" y="${base - h}" width="${w}" height="10" fill="${o.edge || shade(c, .18)}"/>`;
    if (o.rim) s += `<rect x="${x + w - 6}" y="${base - h}" width="6" height="${h}" fill="${o.rim}" opacity=".35"/>`;
    const cols = Math.max(2, Math.round(w / (o.cell || 54))), rh = o.rowH || 48, rows = Math.floor((h - 40) / rh);
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const lit = rnd() < (o.lit ?? .1);
      const wx = x + 14 + k * (w - 28) / cols + 5, wy = base - h + 28 + r * rh, ww = (w - 28) / cols - 10, wh = rh - 18;
      s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="${ww.toFixed(0)}" height="${wh}" rx="2" fill="${lit ? T.win : T.winOff}"${lit && o.glow ? ' filter="url(#glow)"' : ''}/>`;
      if (lit && rnd() < .3) s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="${(ww * .45).toFixed(0)}" height="${wh}" fill="${shade(T.win, -.25)}" opacity=".6"/>`;
    }
    if (o.crack) s += crack(x + w * R(.2, .8), base - h + 20, Math.floor(h / 40), 6);
    if (o.damaged) s += `<path d="M${x},${base - h} l${w * .3},${R(40, 90)} l${w * .25},${-R(20, 60)} l${w * .45},${R(50, 120)} V${base - h - 2} Z" fill="${shade(c, -.3)}"/>`;
    if (o.door) s += `<rect x="${x + w / 2 - 34}" y="${base - 96}" width="68" height="96" fill="${shade(c, -.35)}"/><rect x="${x + w / 2 - 50}" y="${base - 112}" width="100" height="14" fill="${shade(c, -.2)}"/><circle cx="${x + w / 2}" cy="${base - 124}" r="8" fill="${T.lamp}" filter="url(#glow)" opacity="${o.doorLamp ?? 1}"/>`;
    return s + '</g>';
  }
  function crack(x, y, n, wdt = 5, col = '#07060f') {
    let d = `M${x.toFixed(0)},${y.toFixed(0)}`, cx = x, cy = y, br = '';
    for (let i = 0; i < n; i++) { cx += R(-20, 20); cy += R(14, 34); d += ` L${cx.toFixed(0)},${cy.toFixed(0)}`; if (rnd() < .3) br += `<path d="M${cx.toFixed(0)},${cy.toFixed(0)} l${R(-30, 30).toFixed(0)},${R(10, 30).toFixed(0)}" stroke="${col}" stroke-width="${wdt * .6}" fill="none"/>`; }
    return `<path d="${d}" stroke="${col}" stroke-width="${wdt}" fill="none" stroke-linejoin="round"/>${br}`;
  }
  function groundSnow(T, y0, o = {}) {
    let s = `<defs><linearGradient id="gr${y0}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.ground[0]}"/><stop offset="1" stop-color="${T.ground[1]}"/></linearGradient></defs>
      <rect x="0" y="${y0}" width="${BW}" height="${BH - y0}" fill="url(#gr${y0})"/>`;
    s += `<path d="M0,${y0} ${Array.from({ length: 13 }, (_, i) => `Q${i * 200 + 100},${y0 - R(6, 18)} ${(i + 1) * 200},${y0}`).join(' ')} V${y0 + 30} H0Z" fill="${T.snow}" opacity=".85"/>`;
    if (o.asphalt) s += `<rect x="0" y="${y0 + 26}" width="${BW}" height="${BH - y0 - 26}" fill="${shade(T.ground[0], -.25)}" opacity=".7"/>` + Array.from({ length: 9 }, (_, i) => `<rect x="${i * 290 + 40}" y="${y0 + 120}" width="150" height="10" rx="5" fill="#d9c68a" opacity=".3"/>`).join('');
    if (o.crack) s += `<path d="M${o.crack - 60},${y0 + 10} L${o.crack},${y0 + 70} L${o.crack - 40},${y0 + 110} L${o.crack + 60},${y0 + 170} L${o.crack + 20},${BH} L${o.crack + 120},${BH} L${o.crack + 100},${y0 + 170} L${o.crack + 180},${y0 + 110} L${o.crack + 80},${y0 + 70} L${o.crack}, ${y0 + 10}Z" fill="#05040c"/>
      <path d="M${o.crack},${y0 + 10} L${o.crack + 60},${y0 + 70} L${o.crack + 20},${y0 + 112} L${o.crack + 110},${y0 + 170}" stroke="#ff9a4a" stroke-width="3" fill="none" opacity=".45" filter="url(#glow)"/>`;
    for (let i = 0; i < 30; i++) s += `<ellipse cx="${R(0, BW).toFixed(0)}" cy="${R(y0 + 20, BH).toFixed(0)}" rx="${R(30, 120).toFixed(0)}" ry="${R(4, 10).toFixed(0)}" fill="${T.snow}" opacity="${R(.08, .25).toFixed(2)}"/>`;
    return s;
  }
  function car(x, y, c, T, o = {}) {
    const f = o.flip ? -1 : 1;
    return `<g transform="translate(${x},${y}) scale(${f * (o.s || 1)},${o.s || 1})"><path d="M0,60 h330 a20 20 0 0 0 -10,-50 L250,0 L200,-50 H90 L50,0 L10,10 a18 18 0 0 0 -10,50Z" fill="${c}"/>
      <path d="M100,-40 H190 L230,0 H75Z" fill="#8c95d8" opacity=".35"/><path d="M30,-2 h240" stroke="${T.snow}" stroke-width="10" opacity=".7"/><path d="M90,-52 h110" stroke="${T.snow}" stroke-width="8" opacity=".8"/>
      <circle cx="80" cy="64" r="28" fill="#06050f"/><circle cx="260" cy="64" r="28" fill="#06050f"/>
      ${o.hazard ? `<rect x="-4" y="16" width="18" height="14" rx="4" fill="#ffae2a" filter="url(#glow)"/><rect x="318" y="16" width="18" height="14" rx="4" fill="#ffae2a" filter="url(#glow)"/>` : `<rect x="318" y="18" width="16" height="12" rx="3" fill="#ff5a3a" opacity=".8"/>`}</g>`;
  }
  function lamp(x, base, T, o = {}) {
    const h = o.h || 470, f = o.flip ? -1 : 1;
    return `<g transform="rotate(${o.tilt || 0} ${x} ${base})"><rect x="${x - 6}" y="${base - h}" width="12" height="${h}" fill="#0b0a1c"/><path d="M${x},${base - h + 10} q0,-36 ${56 * f},-36 h${24 * f}" stroke="#0b0a1c" stroke-width="12" fill="none"/>
      ${o.off ? '' : `<rect x="${x + (f > 0 ? 58 : -108)}" y="${base - h - 34}" width="50" height="16" rx="6" fill="#fff0d0" filter="url(#glow)"/>
      <path d="M${x + 83 * f},${base - h - 18} L${x + 83 * f - 230},${base + 160} L${x + 83 * f + 230},${base + 160}Z" fill="${T.lamp}" opacity=".16"/>`}</g>`;
  }
  function tree(x, base, s, T) {
    let b = `<g transform="translate(${x},${base}) scale(${s})"><path d="M-8,0 L-4,-180 L4,-180 L8,0Z" fill="#100e20"/>`;
    for (let i = 0; i < 6; i++) { const y = -60 - i * 26, l = 70 - i * 8, a = i % 2 ? 1 : -1; b += `<path d="M0,${y} q${a * l * .6},${-20} ${a * l},${-40}" stroke="#100e20" stroke-width="${6 - i * .6}" fill="none"/><path d="M${a * l * .7},${y - 34} q${a * 10},-6 ${a * 26},-4" stroke="${T.snow}" stroke-width="5" opacity=".7" fill="none"/>`; }
    return b + '</g>';
  }
  function people(n, x0, x1, y, T, sd, sc = .32) { // силуэты-толпа на среднем плане
    rs(sd); let s = '';
    for (let i = 0; i < n; i++) { const x = R(x0, x1), h = R(150, 190) * sc / .32, c = pick(['#2a2650', '#332d5c', '#241f44', '#3a3366']);
      s += `<g transform="translate(${x.toFixed(0)},${y}) scale(${(h / 190 * sc / .32).toFixed(2)})"><ellipse cx="0" cy="-${(170 * sc / .32 * .0 + 160).toFixed(0)}" rx="18" ry="20" fill="${c}"/><path d="M-26,-140 Q0,-150 26,-140 L22,-60 H-22Z" fill="${c}"/><rect x="-18" y="-62" width="14" height="62" fill="${c}"/><rect x="4" y="-62" width="14" height="62" fill="${c}"/>${rnd() < .3 ? `<circle cx="10" cy="-160" r="4" fill="${T.lamp}" filter="url(#glow)"/>` : ''}</g>`; }
    return s;
  }
  function debris(x, y, n, T, sd) { rs(sd); let s = ''; for (let i = 0; i < n; i++) s += `<rect x="${(x + R(-150, 150)).toFixed(0)}" y="${(y - R(0, 50)).toFixed(0)}" width="${R(14, 60).toFixed(0)}" height="${R(10, 34).toFixed(0)}" fill="${pick(['#3a3660', '#4a4670', '#2a2748', '#5a5272'])}" transform="rotate(${R(-40, 40).toFixed(0)} ${x} ${y})"/>`; return s; }
  function fog(y, h, c, o = .35) { return `<defs><linearGradient id="fg${y}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".55" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><rect y="${y}" width="${BW}" height="${h}" fill="url(#fg${y})"/>`; }
  function dustCloud(x, y, w, h) { return `<mask id="dm${x}"><radialGradient id="dmg${x}" cx=".5" cy=".6" r=".5"><stop offset=".25" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#dmg${x})"/></mask><rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#dust)" mask="url(#dm${x})"/>`; }
  function skyline(T, base, n, hmin, hmax, sd, c, o = {}) { rs(sd); let s = '', x = -60; while (x < BW + 60) { const w = R(100, 200), h = R(hmin, hmax); s += building(x, base, w, h, c, T, { lit: o.lit ?? .1, glow: o.glow, rowH: 40, cell: 48, crack: o.cracks && rnd() < .25, damaged: o.damaged && rnd() < .25 }); x += w + R(6, 24); } return s; }
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join(''); }

  // интерьер: стена, пол, окно
  function room(T, o = {}) {
    const wall = o.wall || ['#1b1a33', '#2a2747'], floor = o.floor || ['#2b2338', '#0d0a16'];
    let s = `<defs><linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall[0]}"/><stop offset="1" stop-color="${wall[1]}"/></linearGradient>
      <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${floor[0]}"/><stop offset="1" stop-color="${floor[1]}"/></linearGradient></defs>
      <rect width="${BW}" height="${BH}" fill="url(#wl)"/><rect y="${GROUND - 80}" width="${BW}" height="${BH - GROUND + 80}" fill="url(#fl)"/>
      <rect y="${GROUND - 92}" width="${BW}" height="12" fill="${shade(wall[1], -.3)}"/>`;
    return s;
  }
  function windowCity(x, y, w, h, T, sd) {
    rs(sd); let s = `<defs><linearGradient id="nw${x}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset="1" stop-color="${T.sky[2]}"/></linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#nw${x})"/>`;
    for (let i = 0; i < 10; i++) { const bw = w / 9, bh = R(.3, .75) * h; s += `<rect x="${x + i * bw}" y="${y + h - bh}" width="${bw - 6}" height="${bh}" fill="${T.far}"/>`; if (rnd() < .6) s += `<rect x="${x + i * bw + 10}" y="${y + h - bh + 20}" width="10" height="12" fill="${T.win}"/>`; }
    s += `<path d="M${x},${y} h${w} v${h} h${-w}z M${x + w / 2},${y} v${h} M${x},${y + h * .48} h${w}" stroke="#0c0b1c" stroke-width="16" fill="none"/>`;
    return s;
  }

  // ---------- ЛОКАЦИИ ----------
  // opt: { time:'night'|'blackout'|'predawn'|'dawn', state:'ok'|'quake'|'ruin', seed }
  const LOC = {};
  const L = (name, fn) => { LOC[name] = fn; };

  L('city_aerial', (T, o) => ({
    sky: sky(T, { moon: [1700, 260], seed: 11 }),
    far: skyline(T, 900, 0, 200, 520, 21, T.far, { lit: .14, glow: false }) + fog(600, 400, T.fog, .3),
    mid: skyline(T, 1060, 0, 260, 620, 22, T.mid, { lit: .1, glow: true, cracks: o.state !== 'ok', damaged: o.state === 'ruin' }) + `<path d="M0,1080 Q1200,1010 2400,1090 V1350 H0Z" fill="#0c1430"/><path d="M0,1100 Q1200,1040 2400,1110" stroke="#5a6ab0" stroke-width="3" opacity=".5" fill="none"/>`,
    hero: `<rect x="300" y="700" width="40" height="420" fill="#14122a"/><rect x="380" y="640" width="46" height="480" fill="#14122a"/><path d="M296,700 h48 M376,640 h54" stroke="${T.snow}" stroke-width="10"/><ellipse cx="360" cy="600" rx="90" ry="40" fill="#8a7aa0" opacity=".25" filter="url(#soft)"/>` + (o.fire ? `<ellipse cx="1500" cy="1000" rx="380" ry="160" fill="#ff7a2a" opacity=".35" filter="url(#bglow)"/>` : ''),
    fg: '', ground: 0,
  }));
  L('rooftop', (T, o) => ({
    sky: sky(T, { moon: [1800, 240], seed: 12 }),
    far: skyline(T, 980, 0, 180, 460, 31, T.far, { lit: .12 }) + fog(700, 400, T.fog, .35),
    mid: skyline(T, 1080, 0, 120, 300, 32, T.mid, { lit: .08, glow: true }),
    hero: `<rect y="${GROUND}" width="${BW}" height="${BH - GROUND}" fill="#16142c"/><rect y="${GROUND - 8}" width="${BW}" height="16" fill="${T.snow}" opacity=".85"/><rect x="1500" y="${GROUND - 160}" width="180" height="160" fill="#1e1b3a"/><rect x="1530" y="${GROUND - 210}" width="20" height="60" fill="#14122a"/><path d="M1520,${GROUND - 170} h140" stroke="${T.snow}" stroke-width="10"/>`,
    fg: `<path d="M0,${BH} V${GROUND + 120} h300 l40,-60 h80 V${BH}Z" fill="#05040b"/>`,
  }));
  L('apartment', (T, o) => {
    rs(41); const q = o.state !== 'ok';
    let mid = room(T) + windowCity(1380, 300, 520, 440, T, 42) + `<path d="M1380,740 L1000,${BH} L1800,${BH} L1900,740Z" fill="#9fb4ff" opacity=".06"/>`;
    mid += `<rect x="1990" y="380" width="260" height="560" rx="6" fill="#16142c"/><circle cx="2015" cy="680" r="8" fill="#c9a24a"/>`;
    mid += `<rect x="360" y="440" width="380" height="16" fill="#0f0d1e"/>` + ['#6b3fa0', '#2f6f8f', '#a8483c', '#d0a24a', '#3d8a63'].map((c, i) => `<rect x="${380 + i * 42}" y="${362 + (q && i > 2 ? 12 : 0)}" width="32" height="78" fill="${c}" transform="rotate(${q && i > 2 ? 22 + i * 4 : 0} ${396 + i * 42} 440)"/>`).join('');
    mid += `<rect x="200" y="610" width="140" height="100" rx="8" fill="#0d0c1a"/><text x="270" y="675" fill="#ff5a5a" font-family="Inter" font-weight="800" font-size="44" text-anchor="middle" filter="url(#glow)">${o.clock || '23:58'}</text>`;
    if (q) mid += crack(900, 140, 24, 7);
    const hero = `<rect x="260" y="${GROUND - 250}" width="560" height="150" rx="26" fill="#2a2244"/><rect x="260" y="${GROUND - 310}" width="560" height="80" rx="26" fill="#352c55"/><rect x="230" y="${GROUND - 300}" width="70" height="200" rx="20" fill="#3a3060"/><rect x="780" y="${GROUND - 300}" width="70" height="200" rx="20" fill="#3a3060"/><rect x="280" y="${GROUND - 104}" width="20" height="30" fill="#1a1530"/><rect x="760" y="${GROUND - 104}" width="20" height="30" fill="#1a1530"/>`;
    return { sky: '', far: '', mid, hero, fg: `<rect x="-40" y="0" width="200" height="${BH}" fill="#05040b"/>`, interior: true, lampAt: [1200, 260] };
  });
  L('yard', (T, o) => {
    const q = o.state !== 'ok', ru = o.state === 'ruin';
    rs(51);
    let mid = building(-40, 1040, 640, 700, '#1c1a3c', T, { lit: q ? .05 : .2, glow: true, crack: q, door: true, doorLamp: q ? .3 : 1 }) +
      building(640, 1040, 560, 640, '#1f1c42', T, { lit: q ? .06 : .18, glow: true, crack: q, door: true }) +
      building(1260, 1040, 720, 760, '#1a1838', T, { lit: q ? .04 : .2, glow: true, crack: q, damaged: ru, door: true }) +
      building(2000, 1040, 460, 600, '#1d1b40', T, { lit: .08, glow: true });
    if (ru) mid += dustCloud(1200, 380, 900, 700);
    const hero = groundSnow(T, GROUND - 20, { asphalt: true, crack: q ? 1080 : 0 }) + car(140, GROUND - 40, '#e8e8f0', T, { hazard: q }) + car(1720, GROUND - 30, '#2c3b78', T, { hazard: q, flip: true, s: .95 }) + lamp(560, GROUND, T, { tilt: q ? -6 : 0 }) + (q ? debris(1400, GROUND + 20, 14, T, 53) : '') + `<g transform="translate(1100,${GROUND - 10})"><rect x="0" y="-60" width="240" height="14" rx="5" fill="#3a2c22"/><rect x="0" y="-100" width="240" height="12" rx="5" fill="#3a2c22"/><rect x="14" y="-50" width="12" height="50" fill="#1a1412"/><rect x="214" y="-50" width="12" height="50" fill="#1a1412"/><path d="M0,-104 h240" stroke="${T.snow}" stroke-width="6" opacity=".8"/></g>`;
    return { sky: sky(T, { moon: [1950, 200], seed: 52 }), far: skyline(T, 520, 0, 120, 300, 54, T.far, { lit: .08 }) + fog(300, 400, T.fog, .3), mid, hero, fg: tree(120, BH + 40, 2.2, T) };
  });
  L('arch', (T, o) => {
    rs(61);
    const mid = `<rect width="${BW}" height="${BH}" fill="#14122a"/><path d="M700,1100 V420 Q1200,180 1700,420 V1100Z" fill="#05040b"/>` + building(-60, 1100, 760, 1100, '#1d1b40', T, { lit: .08, glow: true, crack: o.state !== 'ok' }) + building(1700, 1100, 760, 1100, '#1b1a3c', T, { lit: .08, glow: true }) +
      `<g opacity=".95">${skyline(T, 1000, 0, 140, 340, 62, T.far, { lit: .1 })}</g>`.replace(/<rect x="(-?\d+)/g, (m) => m); // через арку виден дальний двор
    const archMask = `<path d="M0,0 H${BW} V${BH} H0Z M760,1100 V440 Q1200,220 1640,440 V1100Z" fill="#191734" fill-rule="evenodd"/><path d="M760,440 Q1200,220 1640,440" stroke="#2e2b58" stroke-width="18" fill="none"/>`;
    const hero = groundSnow(T, GROUND - 10, {}) + lamp(1580, GROUND - 20, T, { flip: true, h: 380 });
    return { sky: sky(T, { seed: 63 }), far: skyline(T, 1000, 0, 200, 520, 64, T.far, { lit: .12, glow: true }) + fog(500, 500, T.fog, .35), mid: archMask, hero, fg: '' };
  });
  L('street', (T, o) => {
    const q = o.state !== 'ok';
    let mid = skyline(T, 1060, 0, 380, 760, 71, T.mid, { lit: q ? .06 : .14, glow: true, cracks: q, damaged: o.state === 'ruin' });
    if (o.crowd) mid += people(26, 300, 2200, 1060, T, 72, .34);
    let hero = groundSnow(T, GROUND - 20, { asphalt: true, crack: q ? 1300 : 0 }) + lamp(420, GROUND, T) + lamp(1900, GROUND, T, { flip: true, tilt: q ? 4 : 0 });
    if (o.mchs) hero += `<g transform="translate(1250,${GROUND - 40})"><path d="M0,60 h420 v-120 h-80 l-60,-60 h-200 v180Z" fill="#e8e8ee"/><rect x="0" y="0" width="420" height="22" fill="#d8323a"/><rect x="120" y="-160" width="70" height="20" rx="6" fill="#3a7aff" filter="url(#glow)"/><rect x="200" y="-160" width="70" height="20" rx="6" fill="#ff3a3a" filter="url(#glow)"/><text x="160" y="-8" fill="#fff" font-family="Inter" font-weight="900" font-size="34">МЧС</text><circle cx="90" cy="64" r="30" fill="#06050f"/><circle cx="340" cy="64" r="30" fill="#06050f"/><rect x="300" y="-110" width="40" height="30" fill="#2a2a3a"/></g>`;
    return { sky: sky(T, { moon: o.moon ? [2000, 220] : null, seed: 73, fireGlow: o.fire ? [1700, 900] : null }), far: skyline(T, 760, 0, 180, 420, 74, T.far, { lit: .1 }) + fog(400, 500, T.fog, .35), mid, hero, fg: '' };
  });
  L('school_ext', (T, o) => {
    const q = o.state !== 'ok', ru = o.state === 'ruin';
    let mid = `<rect x="200" y="420" width="2000" height="620" fill="#2a2752"/><rect x="200" y="410" width="2000" height="18" fill="${shade('#2a2752', .2)}"/>`;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 14; k++) mid += `<rect x="${250 + k * 138}" y="${460 + r * 180}" width="100" height="120" rx="4" fill="${o.gymLit && r > 0 && k > 7 ? T.win : T.winOff}"${o.gymLit && r > 0 && k > 7 ? ' filter="url(#glow)"' : ''}/>`;
    mid += `<text x="1200" y="395" fill="#cfc8ee" font-family="Inter" font-weight="800" font-size="46" text-anchor="middle" opacity=".8">ШКОЛА № 4</text><rect x="1120" y="900" width="160" height="140" fill="#0e0c1e"/><rect x="1090" y="880" width="220" height="20" fill="#3a3666"/>`;
    mid += `<rect x="960" y="860" width="70" height="90" rx="6" fill="#c8323a"/><circle cx="995" cy="890" r="14" fill="${o.alarm ? '#ff4040' : '#5a1a1a'}"${o.alarm ? ' filter="url(#glow)"' : ''}/><rect x="975" y="915" width="40" height="22" fill="#e8e8e8"/>`;
    if (q) mid += crack(1700, 430, 14, 6) + crack(500, 440, 10, 5);
    if (ru) mid += `<path d="M1300,410 L1500,560 L1700,470 L1900,600 L2200,430 V410Z" fill="${T.sky[1]}"/>` + dustCloud(1250, 200, 1000, 700);
    const hero = groundSnow(T, GROUND - 10, {}) + `<path d="M0,${GROUND - 40} h${BW}" stroke="#2a2648" stroke-width="10"/>` + Array.from({ length: 24 }, (_, i) => `<rect x="${i * 100}" y="${GROUND - 140}" width="8" height="110" fill="#2a2648"/>`).join('') + lamp(200, GROUND, T);
    return { sky: sky(T, { seed: 81, fireGlow: o.fire ? [1800, 700] : null }), far: skyline(T, 700, 0, 160, 360, 82, T.far, { lit: .1 }) + fog(380, 500, T.fog, .35), mid, hero, fg: '' };
  });
  L('gym', (T, o) => {
    rs(91); const q = o.state !== 'ok';
    let mid = room(T, { wall: ['#3a3050', '#4a3d5c'], floor: ['#8a5a3a', '#4a2e1c'] });
    mid += `<rect y="0" width="${BW}" height="120" fill="#1f1a2c"/>` + Array.from({ length: 8 }, (_, i) => `<rect x="${i * 320}" y="0" width="16" height="140" fill="#14101e"/>`).join('');
    for (let i = 0; i < 6; i++) mid += `<rect x="${200 + i * 360}" y="220" width="220" height="200" rx="6" fill="#151230"/><path d="M${200 + i * 360},320 h220 M${310 + i * 360},220 v200" stroke="#2a2440" stroke-width="10"/>`;
    mid += `<g transform="translate(1200,330)"><rect x="-90" y="-60" width="180" height="120" rx="4" fill="#e8e4f0" opacity=".9"/><rect x="-30" y="0" width="60" height="44" fill="none" stroke="#c8323a" stroke-width="6"/><circle cy="80" r="40" fill="none" stroke="#e86a2a" stroke-width="7"/></g>`;
    mid += `<g transform="translate(1200,180)"><circle r="56" fill="#0e0c1a"/><circle r="48" fill="#f2efe6"/><text y="14" fill="#1a1a1a" font-family="Inter" font-weight="800" font-size="34" text-anchor="middle">${o.clock || '4:58'}</text></g>`;
    mid += `<path d="M200,140 Q1200,200 2200,140" stroke="#ffd27a" stroke-width="3" fill="none"/>` + Array.from({ length: 16 }, (_, i) => `<circle cx="${260 + i * 120}" cy="${150 + Math.sin(i / 15 * Math.PI) * 50}" r="10" fill="#fff2cf" filter="url(#glow)"/>`).join('');
    mid += `<rect y="${GROUND - 92}" width="${BW}" height="6" fill="#e8d4a0" opacity=".4"/><path d="M200,${GROUND + 60} Q1200,${GROUND + 20} 2200,${GROUND + 60}" stroke="#e8d4a0" stroke-width="5" fill="none" opacity=".35"/>`;
    if (q) mid += crack(1500, 0, 12, 8);
    let hero = '';
    for (let i = 0; i < 9; i++) hero += `<rect x="${120 + i * 250}" y="${GROUND - 40}" width="210" height="44" rx="8" fill="${pick(['#3a6ab8', '#c8323a', '#3a8a5a'])}" opacity=".9"/>`;
    hero += people(18, 80, 2300, GROUND - 30, T, 92, .42);
    return { sky: '', far: '', mid, hero, fg: '', interior: true, warm: true };
  });
  L('stadium', (T, o) => {
    const sink = o.state === 'ruin';
    let mid = `<path d="M0,760 Q1200,560 2400,760 V900 H0Z" fill="#1c1a3a"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M0,${780 + i * 22} Q1200,${590 + i * 22} 2400,${780 + i * 22}" stroke="#2a2752" stroke-width="10" fill="none"/>`).join('');
    for (const x of [300, 2100]) mid += `<rect x="${x - 10}" y="200" width="20" height="640" fill="#14122a"/><rect x="${x - 90}" y="170" width="180" height="70" fill="#1e1c3a"/>` + Array.from({ length: 8 }, (_, i) => `<circle cx="${x - 70 + (i % 4) * 46}" cy="${190 + Math.floor(i / 4) * 30}" r="11" fill="#fffbe8" filter="url(#glow)"/>`).join('') + `<path d="M${x},230 L${x + (x < 1200 ? 900 : -900)},1350 L${x + (x < 1200 ? 300 : -300)},1350Z" fill="#e8f0ff" opacity=".07"/>`;
    mid += `<g transform="translate(1200,250)"><rect x="-170" y="-60" width="340" height="120" rx="8" fill="#0b0a18"/><text y="28" fill="#ff5040" font-family="Inter" font-weight="900" font-size="80" text-anchor="middle" filter="url(#glow)">${o.clock || '5:09'}</text></g>`;
    let hero = groundSnow(T, GROUND - 30, {}) + `<path d="M0,${GROUND + 80} Q1200,${GROUND + 40} 2400,${GROUND + 80}" stroke="#e8e8f0" stroke-width="6" opacity=".35" fill="none"/>`;
    hero += `<g transform="translate(1900,${GROUND + 40})"><ellipse rx="70" ry="22" fill="#1a1820"/>${Array.from({ length: 5 }, (_, i) => `<path d="M${-56 + i * 28},-16 v32" stroke="#3a3842" stroke-width="6"/>`).join('')}<ellipse cx="0" cy="-60" rx="50" ry="70" fill="#d8d6f0" opacity=".25" filter="url(#soft)"/><text y="44" fill="#8a88a0" font-family="Inter" font-size="14" text-anchor="middle">КОЛЛЕКТОР 1961</text></g>`;
    if (o.crowd) hero += people(40, 200, 2200, GROUND + 10, T, 101, .4);
    if (sink) hero += `<ellipse cx="1150" cy="${GROUND + 120}" rx="620" ry="150" fill="#050409"/><ellipse cx="1150" cy="${GROUND + 110}" rx="640" ry="150" fill="none" stroke="${T.snow}" stroke-width="10" opacity=".7"/>` + dustCloud(500, 500, 1400, 600) + `<g transform="translate(900,${GROUND + 80}) rotate(55)"><rect x="-10" y="-500" width="20" height="500" fill="#14122a"/><rect x="-80" y="-540" width="160" height="60" fill="#1e1c3a"/></g>`;
    return { sky: sky(T, { seed: 102 }), far: skyline(T, 700, 0, 160, 380, 103, T.far, { lit: .1 }) + fog(400, 500, T.fog, .3), mid, hero, fg: Array.from({ length: 30 }, (_, i) => `<rect x="${i * 85}" y="${BH - 300}" width="10" height="300" fill="#0a0914"/>`).join('') + `<rect y="${BH - 290}" width="${BW}" height="10" fill="#0a0914"/>` };
  });
  L('shopwindow', (T, o) => {
    const mid = `<rect width="${BW}" height="${BH}" fill="#1a1836"/><rect x="300" y="200" width="1800" height="840" fill="#0c1022"/>` + `<g opacity=".55">${people(12, 500, 1900, 1000, T, 111, .5)}</g>` + `<path d="M300,200 L2100,1040" stroke="#fff" stroke-width="80" opacity=".04"/><path d="M700,200 L1900,900" stroke="#fff" stroke-width="30" opacity=".05"/>` +
      `<rect x="280" y="180" width="1840" height="40" fill="#2a2752"/><text x="1200" y="140" fill="#ff8ac0" font-family="Inter" font-weight="900" font-size="70" text-anchor="middle" filter="url(#glow)" opacity=".85">ПРОДУКТЫ 24</text>` +
      `<rect x="300" y="200" width="1800" height="840" fill="none" stroke="#0a0914" stroke-width="26"/><path d="M1200,200 v840" stroke="#0a0914" stroke-width="18"/>`;
    return { sky: '', far: '', mid, hero: groundSnow(T, GROUND + 40, {}), fg: '', interior: true };
  });
  L('boiler_ext', (T, o) => {
    let mid = `<rect x="700" y="420" width="1100" height="620" fill="#3a2a2a"/>` + Array.from({ length: 12 }, (_, r) => `<path d="M700,${440 + r * 50} h1100" stroke="#2a1e1e" stroke-width="4"/>`).join('') + `<rect x="1500" y="-60" width="130" height="480" fill="#3e2c2c"/><rect x="1490" y="-60" width="150" height="30" fill="#2a1e1e"/>` +
      `<ellipse cx="1565" cy="-80" rx="120" ry="90" fill="#8a8aa0" opacity=".3" filter="url(#soft)"/><rect x="1060" y="760" width="180" height="280" fill="#ffcf7a" filter="url(#glow)" opacity=".85"/><rect x="1080" y="780" width="140" height="260" fill="#ffe2a8"/>` +
      `<text x="1250" y="500" fill="#cfc0b0" font-family="Inter" font-weight="800" font-size="40" text-anchor="middle" opacity=".7">КОТЕЛЬНАЯ · ЗАВОДСКАЯ</text><rect x="760" y="560" width="160" height="120" fill="#ffb86a" opacity=".6"/><rect x="1580" y="560" width="160" height="120" fill="#ffb86a" opacity=".5"/>`;
    const hero = groundSnow(T, GROUND - 10, {}) + `<path d="M1150,${GROUND} L800,${BH} L1700,${BH} L1350,${GROUND}Z" fill="#ffcf7a" opacity=".12"/>` + `<rect x="1040" y="${GROUND - 30}" width="220" height="30" fill="#3a3030"/><rect x="1060" y="${GROUND - 50}" width="180" height="22" fill="#3a3030"/>`;
    return { sky: sky(T, { seed: 121 }), far: skyline(T, 760, 0, 140, 340, 122, T.far, { lit: .08 }) + fog(400, 500, T.fog, .3), mid, hero, fg: tree(2250, BH + 40, 2, T) };
  });
  L('boiler_int', (T, o) => {
    let mid = room(T, { wall: ['#3a2824', '#4a3229'], floor: ['#3a2a22', '#1a120e'] });
    for (let i = 0; i < 3; i++) mid += `<g transform="translate(${1300 + i * 330},${GROUND - 90})"><rect x="-120" y="-520" width="240" height="520" rx="30" fill="#5a4a40"/><rect x="-120" y="-520" width="240" height="40" rx="20" fill="#6a5a50"/><circle cx="-50" cy="-380" r="34" fill="#e8e0d0"/><path d="M-50,-380 l20,-16" stroke="#c8323a" stroke-width="5"/><rect x="-40" y="-160" width="80" height="60" rx="8" fill="#ff8a3a" filter="url(#glow)"/><path d="M0,-520 v-400" stroke="#4a3a32" stroke-width="40"/></g>`;
    mid += `<rect x="300" y="420" width="260" height="300" fill="#2a1e1a"/><rect x="320" y="440" width="220" height="260" fill="#e8dcc8"/><circle cx="430" cy="530" r="50" fill="#6a5a50"/><rect x="390" y="590" width="80" height="80" fill="#4a3a32"/>`;
    mid += `<rect x="600" y="${GROUND - 260}" width="380" height="18" fill="#4a3a32"/><rect x="620" y="${GROUND - 242}" width="16" height="150" fill="#2a1e1a"/><rect x="944" y="${GROUND - 242}" width="16" height="150" fill="#2a1e1a"/><rect x="760" y="${GROUND - 300}" width="40" height="40" rx="6" fill="#c8c0b0"/><path d="M800,${GROUND - 290} q22,6 0,24" stroke="#c8c0b0" stroke-width="6" fill="none"/><rect x="840" y="${GROUND - 296}" width="70" height="36" rx="8" fill="#3a3a3a"/><circle cx="875" cy="${GROUND - 296}" r="10" fill="#ff5a3a" filter="url(#glow)"/>`;
    return { sky: '', far: '', mid, hero: '', fg: `<path d="M0,0 h300 v80 h-300z" fill="#1a120e"/>`, interior: true, warm: true };
  });
  L('highrise_hall', (T, o) => {
    let mid = room(T, { wall: ['#2a3040', '#3a4252'], floor: ['#4a4a5a', '#1a1a24'] });
    mid += `<rect x="1000" y="300" width="400" height="${GROUND - 380}" fill="#6a7080"/><rect x="1010" y="310" width="185" height="${GROUND - 400}" fill="#8a909c"/><rect x="1205" y="310" width="185" height="${GROUND - 400}" fill="#8a909c"/>`;
    mid += `<g transform="translate(1200,240)"><rect x="-90" y="-40" width="180" height="70" rx="6" fill="#0b0a18"/><text y="14" fill="#ff5040" font-family="Inter" font-weight="900" font-size="40" text-anchor="middle" filter="url(#glow)">${o.floor || '9—10'}</text></g>`;
    mid += `<rect x="1440" y="560" width="40" height="70" rx="6" fill="#2a2a34"/><circle cx="1460" cy="580" r="8" fill="#e8e8e8"/><circle cx="1460" cy="608" r="8" fill="#e8e8e8"/>`;
    mid += Array.from({ length: 6 }, (_, i) => `<rect x="${200 + i * 60}" y="400" width="44" height="64" rx="4" fill="#4a4a5a"/>`).join('') + `<text x="350" y="380" fill="#c8c8d8" font-family="Inter" font-size="24" text-anchor="middle">ПОЧТА</text>`;
    if (o.state !== 'ok') mid += crack(700, 120, 20, 6) + (o.broken ? `<rect x="1700" y="200" width="500" height="500" fill="#1a1a2a"/>` + Array.from({ length: 10 }, () => `<path d="M${1700 + R(0, 500)},${200 + R(0, 500)} l${R(-80, 80)},${R(-80, 80)}" stroke="#aac" stroke-width="3"/>`).join('') : '');
    return { sky: '', far: '', mid, hero: '', fg: '', interior: true };
  });
  L('shaft', (T, o) => {
    let mid = `<rect width="${BW}" height="${BH}" fill="#0a0a12"/><rect x="800" y="0" width="800" height="${BH}" fill="#14141e"/>` + Array.from({ length: 8 }, (_, i) => `<path d="M800,${i * 170 + 60} h800" stroke="#22222e" stroke-width="12"/><text x="780" y="${i * 170 + 70}" fill="#5a5a6a" font-family="Inter" font-size="28" text-anchor="end">${12 - i}</text>`).join('') + `<path d="M1150,0 V${BH} M1250,0 V${BH}" stroke="#3a3a4a" stroke-width="6"/>`;
    const y = o.cabinY ?? 420;
    mid += `<g transform="translate(1000,${y})"><rect width="400" height="380" fill="#5a606e"/><rect x="10" y="10" width="380" height="360" fill="#6a7080"/><rect x="180" y="-380" width="6" height="380" fill="#3a3a4a"/><rect x="214" y="-380" width="6" height="380" fill="#3a3a4a"/><rect x="0" y="0" width="400" height="16" fill="#3a3a4a"/></g>`;
    return { sky: '', far: '', mid, hero: '', fg: '', interior: true };
  });
  L('cabin', (T, o) => {
    let mid = room(T, { wall: ['#5a5e6a', '#6a6e7a'], floor: ['#3a3a44', '#1a1a20'] }) + `<rect x="700" y="160" width="1000" height="${GROUND - 160}" fill="#7a7e8a"/><path d="M1200,160 V${GROUND}" stroke="#4a4e5a" stroke-width="10"/><rect x="1760" y="400" width="90" height="300" rx="8" fill="#3a3a44"/>` + Array.from({ length: 10 }, (_, i) => `<circle cx="${1790 + (i % 2) * 30}" cy="${430 + Math.floor(i / 2) * 50}" r="10" fill="${i === 7 ? '#ff5a3a' : '#c8c8d0'}"/>`).join('') + `<rect x="900" y="40" width="600" height="40" rx="10" fill="#fff6d8" opacity="${o.dark ? .15 : .8}" filter="url(#glow)"/>`;
    return { sky: '', far: '', mid, hero: '', fg: '', interior: true };
  });
  L('switchroom', (T, o) => {
    let mid = room(T, { wall: ['#26303a', '#2e3a46'], floor: ['#2a2a30', '#101014'] });
    for (let i = 0; i < 4; i++) mid += `<g transform="translate(${500 + i * 380},${GROUND - 100})"><rect x="-140" y="-560" width="280" height="560" rx="6" fill="#5a6470"/><rect x="-120" y="-540" width="240" height="520" rx="4" fill="#6a7480"/><rect x="-70" y="-460" width="140" height="80" fill="#3a3a44"/><rect x="-20" y="-470" width="40" height="100" rx="8" fill="#c8323a"/><path d="M-110,-300 h220 M-110,-220 h220" stroke="#4a5460" stroke-width="6"/><text y="-500" fill="#ffcf3a" font-family="Inter" font-weight="900" font-size="34" text-anchor="middle">⚡</text></g>`;
    mid += `<path d="M0,180 H${BW}" stroke="#1a1a20" stroke-width="30"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${200 + i * 380},180 V${GROUND - 660}" stroke="#2a2a30" stroke-width="14"/>`).join('');
    return { sky: '', far: '', mid, hero: '', fg: '', interior: true, cold: true };
  });
  L('gas_station', (T, o) => {
    const boom = o.state === 'ruin';
    let mid = boom ? `<ellipse cx="1300" cy="600" rx="700" ry="420" fill="#ff8a2a" opacity=".5" filter="url(#bglow)"/>` : '';
    mid += `<rect x="500" y="420" width="1500" height="70" fill="${boom ? '#2a1a1a' : '#e8e8f0'}"/><rect x="500" y="420" width="1500" height="24" fill="#2a8a5a"/><text x="1250" y="480" fill="#1a1a1a" font-family="Inter" font-weight="900" font-size="42" text-anchor="middle">${boom ? '' : 'АЗС · 24'}</text>`;
    for (const x of [700, 1800]) mid += `<rect x="${x}" y="490" width="40" height="${GROUND - 490}" fill="#d8d8e0"/>`;
    for (const x of [1000, 1400]) mid += `<g transform="translate(${x},${GROUND})"><rect x="-50" y="-220" width="100" height="220" rx="8" fill="#e8e8f0"/><rect x="-40" y="-200" width="80" height="50" fill="#1a1a2a"/><text y="-168" fill="#3aff8a" font-family="Inter" font-size="22" text-anchor="middle">95</text><path d="M50,-120 q40,0 40,60" stroke="#222" stroke-width="8" fill="none"/></g>`;
    mid += `<rect x="1700" y="${GROUND - 220}" width="300" height="220" fill="#d8d8e0"/><rect x="1730" y="${GROUND - 190}" width="240" height="120" fill="#ffd8a0" opacity=".6"/>`;
    let hero = groundSnow(T, GROUND - 10, { asphalt: true });
    hero += `<g transform="translate(200,${GROUND - 40})"><rect x="0" y="-150" width="520" height="190" rx="70" fill="#d8d8de"/><rect x="0" y="-60" width="520" height="22" fill="#e8622a"/><path d="M540,40 V-150 h140 l60,80 V40Z" fill="#c8323a"/><rect x="580" y="-130" width="90" height="70" fill="#8c95d8" opacity=".5"/><circle cx="110" cy="44" r="34" fill="#06050f"/><circle cx="420" cy="44" r="34" fill="#06050f"/><circle cx="660" cy="44" r="34" fill="#06050f"/><text x="260" y="-90" fill="#c8323a" font-family="Inter" font-weight="900" font-size="40" text-anchor="middle">ОГНЕОПАСНО</text></g>`;
    hero += `<g transform="translate(1600,${GROUND - 20})"><rect x="-60" y="-160" width="120" height="160" rx="8" fill="#e8c83a"/><rect x="-40" y="-130" width="80" height="60" fill="#2a2a2a"/><circle cx="0" cy="-100" r="12" fill="${o.valve === 'closed' ? '#3aff8a' : '#ff4040'}" filter="url(#glow)"/><text y="-40" fill="#1a1a1a" font-family="Inter" font-weight="900" font-size="20" text-anchor="middle">ГАЗ · КЛАПАН</text></g>`;
    if (!boom && o.leak) hero += `<ellipse cx="1300" cy="${GROUND - 20}" rx="300" ry="140" fill="#b8c8a0" opacity=".12" filter="url(#bglow)"/>`;
    if (boom) hero += dustCloud(300, 200, 1800, 900) + `<circle cx="1300" cy="500" r="300" fill="#ffb84a" opacity=".55" filter="url(#bglow)"/>`;
    return { sky: sky(T, { seed: 131, fireGlow: boom ? [1300, 600] : null }), far: skyline(T, 700, 0, 160, 360, 132, T.far, { lit: .08 }) + fog(400, 500, T.fog, .3), mid, hero, fg: '' };
  });
  L('embankment', (T, o) => {
    let mid = `<rect y="760" width="${BW}" height="200" fill="#1a2a50"/><rect y="760" width="${BW}" height="200" fill="#b8c8f0" opacity=".25"/>` + (o.iceCrack ? `<path d="M0,860 L400,840 L700,880 L1100,850 L1500,890 L1900,860 L2400,880" stroke="#fff" stroke-width="5" fill="none" opacity=".9" filter="url(#glow)"/>` : '') +
      `<rect y="940" width="${BW}" height="40" fill="#5a5a72"/>` + Array.from({ length: 24 }, (_, i) => `<rect x="${i * 100}" y="940" width="6" height="40" fill="#3a3a52"/>`).join('');
    mid += `<path d="M1200,760 L1300,560 L1900,560 L2000,760" stroke="#2a2a48" stroke-width="18" fill="none"/>` + Array.from({ length: 8 }, (_, i) => `<path d="M${1300 + i * 85},560 v200" stroke="#2a2a48" stroke-width="6"/>`).join('');
    let hero = groundSnow(T, GROUND - 10, {}) + `<rect y="${GROUND - 120}" width="${BW}" height="40" fill="#6a6a84"/><rect y="${GROUND - 128}" width="${BW}" height="12" fill="${T.snow}"/>` + Array.from({ length: 5 }, (_, i) => lamp(300 + i * 480, GROUND - 120, T, { h: 360, flip: i % 2 })).join('');
    if (o.crowd) hero += people(50, 60, 2340, GROUND - 6, T, 141, .42);
    return { sky: sky(T, { seed: 142, moon: T.stars ? [600, 220] : null, sun: o.sun ? [1800, 700] : null }), far: skyline(T, 760, 0, 140, 420, 143, T.far, { lit: .1, glow: true }) + fog(480, 400, T.fog, .35), mid, hero, fg: '' };
  });
  L('ruins', (T, o) => {
    rs(151);
    let mid = building(-60, 1040, 700, 760, '#1f1c42', T, { lit: .02, crack: true }) + building(1600, 1040, 860, 720, '#1c1a3c', T, { lit: .04, crack: true, door: true });
    mid += `<path d="M640,1040 V500 L800,560 L900,420 L1050,520 L1200,380 L1350,540 L1500,470 L1600,560 V1040Z" fill="#26234a"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${700 + i * 150},${600 + (i % 2) * 60} l120,-30" stroke="#5a5272" stroke-width="18"/>`).join('');
    mid += Array.from({ length: 4 }, (_, i) => `<path d="M${800 + i * 220},${640 + i * 40} l60,-120" stroke="#3a3830" stroke-width="5"/>`).join('');
    for (const x of [500, 1900]) mid += `<rect x="${x}" y="400" width="14" height="640" fill="#1a1830"/><rect x="${x - 50}" y="380" width="114" height="40" fill="#2a2850"/><circle cx="${x + 7}" cy="400" r="22" fill="#fffbe8" filter="url(#glow)"/><path d="M${x + 7},400 L${x + 600 * (x < 1000 ? 1 : -1)},1100 L${x + 200 * (x < 1000 ? 1 : -1)},1100Z" fill="#fff" opacity=".07"/>`;
    let hero = groundSnow(T, GROUND - 10, {}) + debris(1100, GROUND + 30, 30, T, 152) + `<path d="M700,${GROUND + 40} L1100,${GROUND - 130} L1500,${GROUND + 40}Z" fill="#3a3660"/><path d="M820,${GROUND - 20} L1380,${GROUND - 60}" stroke="#5a5272" stroke-width="40"/>`;
    hero += `<g transform="translate(300,${GROUND - 30})"><path d="M0,0 h260 v-80 h-40 l-30,-40 h-120 l-30,40 h-40z" fill="#c8323a"/><rect x="40" y="-110" width="40" height="20" fill="#3a7aff" filter="url(#glow)"/><circle cx="60" cy="10" r="26" fill="#06050f"/><circle cx="210" cy="10" r="26" fill="#06050f"/></g>`;
    if (o.scarf) hero += `<path d="M1128,${GROUND - 60} q16,26 4,52 q12,6 24,0 q-4,-30 -10,-56z" fill="#ff8a2a" filter="url(#glow)"/><path d="M1128,${GROUND - 60} q16,26 4,52" stroke="#d8611c" stroke-width="4" fill="none"/>`;
    if (o.tape) hero += `<path d="M0,${GROUND - 60} L${BW},${GROUND - 80}" stroke="#ff3a3a" stroke-width="10" stroke-dasharray="60 60"/><path d="M0,${GROUND - 60} L${BW},${GROUND - 80}" stroke="#f2f2f2" stroke-width="10" stroke-dasharray="60 60" stroke-dashoffset="60"/>`;
    return { sky: sky(T, { seed: 153, sun: o.sun ? [2000, 500] : null }), far: skyline(T, 760, 0, 160, 400, 154, T.far, { lit: .06 }) + fog(400, 500, T.fog, .35), mid, hero, fg: '' };
  });
  L('bench', (T, o) => { const y = LOC.yard(T, Object.assign({}, o)); y.hero += `<g transform="translate(1100,${GROUND - 10})"><rect x="0" y="-60" width="240" height="14" rx="5" fill="#4a382a"/></g>`; return y; });
  L('tent_camp', (T, o) => {
    let mid = Array.from({ length: 5 }, (_, i) => `<g transform="translate(${300 + i * 460},${GROUND - 40})"><path d="M-160,0 L0,-220 L160,0Z" fill="${['#2a6ab8', '#c8622a', '#2a6ab8', '#3a8a5a', '#c8622a'][i]}"/><path d="M-40,0 L0,-120 L40,0Z" fill="#0a0914"/><rect x="-20" y="-60" width="40" height="40" fill="#ffd8a0" opacity=".5" filter="url(#glow)"/></g>`).join('');
    const hero = groundSnow(T, GROUND - 10, {}) + `<g transform="translate(1800,${GROUND - 20})"><rect x="-80" y="-80" width="160" height="80" fill="#3a3a44"/><rect x="-60" y="-120" width="40" height="50" fill="#e8e8e8"/><path d="M-40,-120 q0,-40 20,-60" stroke="#e8e8f0" stroke-width="10" opacity=".4" fill="none" filter="url(#soft)"/></g>`;
    return { sky: sky(T, { seed: 161, sun: o.sun ? [1900, 600] : null }), far: skyline(T, 760, 0, 140, 380, 162, T.far, { lit: .06 }) + fog(400, 500, T.fog, .35), mid, hero, fg: '' };
  });

  // ---------- СБОРКА СЛОЁВ ----------
  function bg(loc, opt = {}) {
    const T = TIME[opt.time || 'night'];
    rs(opt.seed || 7);
    const r = LOC[loc](T, opt);
    const layers = [];
    if (r.sky) layers.push({ name: 'sky', z: 12, blur: 0, svg: svgWrap(r.sky) });
    if (r.far) layers.push({ name: 'far', z: 5, blur: 4, svg: svgWrap(r.far) });
    if (r.mid) layers.push({ name: 'mid', z: r.interior ? 1.6 : 2.4, blur: r.interior ? 1 : 1.5, svg: svgWrap(r.mid) });
    if (r.hero) layers.push({ name: 'hero', z: 1, blur: 0, svg: svgWrap(r.hero) });
    if (r.fg) layers.push({ name: 'fg', z: .55, blur: 10, svg: svgWrap(r.fg) });
    return { layers, T, interior: !!r.interior, warm: !!r.warm, lampAt: r.lampAt };
  }
  root.BG = { bg, BW, BH, OX, OY, GROUND, TIME, LOCATIONS: Object.keys(LOC) };
})(typeof window !== 'undefined' ? window : globalThis);
