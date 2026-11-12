// Генератор тестовых кадров: одна сцена в трёх 2D-стилях.
// Запуск: node gen.js  → A_vector.png, B_comic.png, C_cinematic.png
const { chromium } = require('playwright');
const fs = require('fs');

const W = 1920, H = 1080;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const reset = (s) => { seed = s; };

// Ряд зданий: возвращает массив {x,w,h}
function skyline(s, y0, minH, maxH, minW, maxW) {
  reset(s);
  const out = []; let x = -40;
  while (x < W + 40) { const w = minW + rnd() * (maxW - minW); out.push({ x, w, h: minH + rnd() * (maxH - minH) }); x += w + 6 + rnd() * 14; }
  return out.map(b => ({ ...b, y: y0 - b.h }));
}
function windows(b, cols, litP, litColor, offColor, s, opts = {}) {
  reset(s);
  let r = ''; const pad = 14, gw = (b.w - pad * 2) / cols, rows = Math.floor((b.h - 40) / (opts.rowH || 34));
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const lit = rnd() < litP;
    r += `<rect x="${b.x + pad + j * gw + 4}" y="${b.y + 24 + i * (opts.rowH || 34)}" width="${gw - 8}" height="${(opts.rowH || 34) - 14}" rx="${opts.rx ?? 2}" fill="${lit ? litColor : offColor}" ${lit && opts.glow ? 'filter="url(#glow)"' : ''}/>`;
  }
  return r;
}
const subtitle = (words, hi) => `
  <g font-family="Inter" font-weight="900" font-size="64" text-anchor="middle" letter-spacing="1">
    <text x="${W / 2}" y="${H - 92}" stroke="#05060c" stroke-width="12" stroke-linejoin="round" fill="none">${words}</text>
    <text x="${W / 2}" y="${H - 92}" fill="#fff">${hi}</text>
  </g>`;

// ---------- ГЕРОЙ (одна модель, три отрисовки) ----------
function hero(style, cx, base, sc = 1) {
  const ink = style === 'B' ? 'stroke="#0a0a0a" stroke-width="7" stroke-linejoin="round"' : style === 'C' ? 'stroke="#10121c" stroke-width="3"' : '';
  const hood = style === 'B' ? '#1f5f63' : '#24465e', hoodDark = style === 'B' ? '#123a3d' : '#182f42';
  const skin = '#f2c6a0', scarf = '#ff8a2a', pants = '#1b2030', hair = '#2a1d17';
  return `<g transform="translate(${cx},${base}) scale(${sc})">
    ${style !== 'B' ? `<ellipse cx="0" cy="4" rx="70" ry="12" fill="#000" opacity=".45"/>` : ''}
    <!-- ноги -->
    <path d="M-30,-150 L-34,-8 L-6,-8 L-4,-150 Z" fill="${pants}" ${ink}/>
    <path d="M6,-150 L8,-8 L36,-8 L30,-150 Z" fill="${pants}" ${ink}/>
    <path d="M-44,-14 h42 v14 h-46 a8 8 0 0 1 4,-14Z" fill="#e9e6df" ${ink}/>
    <path d="M4,-14 h42 a8 8 0 0 1 4,14 h-46Z" fill="#e9e6df" ${ink}/>
    <!-- худи -->
    <path d="M-52,-300 Q0,-330 52,-300 L60,-140 Q0,-128 -60,-140 Z" fill="${hood}" ${ink}/>
    ${style !== 'B' ? `<path d="M10,-310 Q50,-300 58,-150 L60,-140 Q30,-134 18,-136 Z" fill="${hoodDark}" opacity=".8"/>` : `<g opacity=".55">${[...Array(9)].map((_, i) => `<line x1="${20 + i * 4}" y1="${-290 + i * 6}" x2="${50 + i}" y2="${-150 + i * 2}" stroke="#0a0a0a" stroke-width="3"/>`).join('')}</g>`}
    <path d="M-20,-200 h40 v26 h-40z" fill="${hoodDark}" ${style === 'B' ? ink : ''}/>
    <!-- руки -->
    <path d="M-52,-292 Q-80,-220 -70,-150" fill="none" stroke="${style === 'B' ? '#0a0a0a' : hood}" stroke-width="${style === 'B' ? 36 : 28}" stroke-linecap="round"/>
    ${style === 'B' ? `<path d="M-52,-292 Q-80,-220 -70,-150" fill="none" stroke="${hood}" stroke-width="22" stroke-linecap="round"/>` : ''}
    <path d="M52,-292 Q84,-240 92,-196" fill="none" stroke="${style === 'B' ? '#0a0a0a' : hood}" stroke-width="${style === 'B' ? 36 : 28}" stroke-linecap="round"/>
    ${style === 'B' ? `<path d="M52,-292 Q84,-240 92,-196" fill="none" stroke="${hood}" stroke-width="22" stroke-linecap="round"/>` : ''}
    <circle cx="-70" cy="-146" r="13" fill="${skin}" ${ink}/>
    <!-- телефон в руке -->
    <rect x="82" y="-232" width="26" height="44" rx="5" fill="#0d0f16" ${ink} transform="rotate(-12 95 -210)"/>
    <rect x="86" y="-228" width="18" height="34" rx="3" fill="#8fe3ff" ${style === 'A' || style === 'C' ? 'filter="url(#glow)"' : ''} transform="rotate(-12 95 -210)"/>
    <circle cx="92" cy="-196" r="13" fill="${skin}" ${ink}/>
    <!-- шарф — фирменная деталь героя -->
    <path d="M-40,-306 Q0,-288 40,-306 L42,-286 Q0,-268 -42,-286Z" fill="${scarf}" ${ink}/>
    <path d="M18,-290 L30,-232 L12,-236 L6,-288Z" fill="${scarf}" ${ink}/>
    <!-- голова -->
    <rect x="-12" y="-322" width="24" height="22" fill="${skin}"/>
    <ellipse cx="0" cy="-372" rx="50" ry="56" fill="${skin}" ${ink}/>
    <path d="M-52,-380 Q-50,-440 4,-438 Q56,-436 52,-372 Q36,-404 -2,-402 Q-30,-400 -52,-380Z" fill="${hair}" ${ink}/>
    <path d="M-10,-430 Q10,-462 30,-432" fill="${hair}" ${ink}/>
    <!-- лицо: глаза смотрят вверх-вправо, на пустой город -->
    <ellipse cx="-16" cy="-372" rx="${style === 'C' ? 9 : 7}" ry="${style === 'C' ? 12 : 10}" fill="#14161f"/>
    <ellipse cx="22" cy="-372" rx="${style === 'C' ? 9 : 7}" ry="${style === 'C' ? 12 : 10}" fill="#14161f"/>
    <circle cx="-13" cy="-376" r="3" fill="#fff"/><circle cx="25" cy="-376" r="3" fill="#fff"/>
    <path d="M-28,-392 q10,-6 20,-2 M12,-394 q10,-4 20,2" stroke="#2a1d17" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M-2,-340 q6,3 12,0" stroke="#7a3d2c" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${style === 'C' ? `<path d="M48,-400 Q60,-360 44,-330" stroke="#8fe3ff" stroke-width="5" fill="none" opacity=".8" filter="url(#glow)"/>
      <path d="M52,-300 L60,-150" stroke="#8fe3ff" stroke-width="5" opacity=".6" filter="url(#glow)"/>` : ''}
  </g>`;
}

// ---------- A: ВЕКТОРНЫЙ МУЛЬТ ----------
function styleA() {
  const far = skyline(11, 760, 260, 520, 90, 170), mid = skyline(22, 800, 200, 420, 140, 240), near = skyline(33, 860, 120, 300, 220, 360);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0f2a"/><stop offset=".55" stop-color="#2a2a63"/><stop offset="1" stop-color="#6b3f78"/></linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22223f"/><stop offset="1" stop-color="#0c0c1c"/></linearGradient>
    <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a86d6" stop-opacity="0"/><stop offset=".6" stop-color="#9a86d6" stop-opacity=".35"/><stop offset="1" stop-color="#9a86d6" stop-opacity="0"/></linearGradient>
    <radialGradient id="cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${[...Array(70)].map(() => `<circle cx="${rnd() * W}" cy="${rnd() * 420}" r="${rnd() * 2 + .6}" fill="#fff" opacity="${rnd() * .7 + .2}"/>`).join('')}
  <circle cx="1480" cy="210" r="90" fill="#ffe9c4" filter="url(#glow)"/><circle cx="1510" cy="190" r="80" fill="url(#sky)" opacity=".0"/>
  <g filter="url(#blur3)" opacity=".9">${far.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#3a356e"/>${windows(b, 3, .08, '#ffcf7a', '#3a356e', b.x | 0, { rowH: 30 })}`).join('')}</g>
  <rect y="520" width="${W}" height="240" fill="url(#fog)"/>
  ${mid.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#252450"/>${windows(b, 4, .07, '#ffc86b', '#2d2c5c', (b.x | 0) + 3, { glow: true })}`).join('')}
  <rect y="640" width="${W}" height="200" fill="url(#fog)"/>
  ${near.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h + 10}" fill="#16163a"/><rect x="${b.x}" y="${b.y}" width="${b.w}" height="8" fill="#2e2d66"/>${windows(b, 5, .04, '#ffc86b', '#1d1c47', (b.x | 0) + 9, { glow: true })}`).join('')}
  <!-- неоновая вывеска -->
  <g filter="url(#glow)"><rect x="300" y="610" width="230" height="64" rx="12" fill="none" stroke="#ff4fa3" stroke-width="6"/>
  <text x="415" y="656" font-family="Inter" font-weight="800" font-size="38" fill="#ff8cc6" text-anchor="middle">24 ЧАСА</text></g>
  <rect y="860" width="${W}" height="220" fill="url(#road)"/>
  ${[...Array(8)].map((_, i) => `<rect x="${i * 260 + 40}" y="958" width="140" height="10" rx="5" fill="#ffd27a" opacity=".55"/>`).join('')}
  <!-- фонарь -->
  <rect x="1236" y="420" width="12" height="450" fill="#0c0c22"/><path d="M1242,430 q0,-40 60,-40 h30" stroke="#0c0c22" stroke-width="12" fill="none"/>
  <rect x="1310" y="384" width="56" height="18" rx="6" fill="#ffe2a8" filter="url(#glow)"/>
  <path d="M1338,400 L1120,1080 L1560,1080 Z" fill="url(#cone)"/>
  <!-- светофор мигает жёлтым -->
  <rect x="560" y="560" width="10" height="310" fill="#0c0c22"/><rect x="540" y="500" width="50" height="120" rx="10" fill="#0c0c22"/>
  <circle cx="565" cy="530" r="12" fill="#311"/><circle cx="565" cy="562" r="14" fill="#ffbf2f" filter="url(#glow)"/><circle cx="565" cy="594" r="12" fill="#131"/>
  <!-- брошенная машина -->
  <g transform="translate(180,820)"><path d="M0,60 h330 a20 20 0 0 0 -10,-50 L250,0 L200,-50 H90 L50,0 L10,10 a18 18 0 0 0 -10,50Z" fill="#3b2f6d"/>
  <path d="M100,-40 H190 L230,0 H75Z" fill="#7d8de0" opacity=".5"/><circle cx="80" cy="64" r="28" fill="#0b0b1a"/><circle cx="260" cy="64" r="28" fill="#0b0b1a"/>
  <rect x="318" y="20" width="16" height="12" rx="3" fill="#ff5a3a" filter="url(#glow)"/></g>
  <!-- листья/пыль -->
  ${[...Array(40)].map(() => `<circle cx="${rnd() * W}" cy="${380 + rnd() * 600}" r="${rnd() * 3 + 1}" fill="#ffd9a0" opacity="${rnd() * .5 + .2}"/>`).join('')}
  ${hero('A', 1080, 940, 1.05)}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  ${subtitle('ГОРОД БЫЛ ПУСТ.', 'ГОРОД БЫЛ <tspan fill="#ffcf3a">ПУСТ.</tspan>')}
  <text x="60" y="80" font-family="Inter" font-weight="800" font-size="30" fill="#fff" opacity=".85">A · ВЕКТОРНЫЙ МУЛЬТ</text>
  </svg>`;
}

// ---------- B: КОМИКС / ГРАФНОВЕЛЛА ----------
function styleB() {
  const mid = skyline(22, 830, 260, 560, 150, 260), near = skyline(44, 860, 120, 260, 260, 380);
  const ink = 'stroke="#0a0a0a" stroke-width="8" stroke-linejoin="round"';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="7" cy="7" r="3.2" fill="#0a0a0a"/></pattern>
    <pattern id="dotsS" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="5" cy="5" r="1.6" fill="#0a0a0a"/></pattern>
    <pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><line x1="0" y1="0" x2="0" y2="12" stroke="#0a0a0a" stroke-width="4"/></pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="skyMask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    <filter id="glow"><feGaussianBlur stdDeviation="0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#e8dcc0"/>
  <rect width="${W}" height="${H}" fill="#2d8a8a"/>
  <rect width="${W}" height="720" fill="url(#dots)" mask="url(#skyMask)" opacity=".7"/>
  <circle cx="1500" cy="230" r="120" fill="#f6e7c1" ${ink}/>
  <circle cx="1460" cy="200" r="18" fill="url(#dotsS)" opacity=".5"/><circle cx="1540" cy="270" r="26" fill="url(#dotsS)" opacity=".5"/>
  ${mid.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#1c5457" ${ink}/><rect x="${b.x + b.w * .62}" y="${b.y}" width="${b.w * .38}" height="${b.h}" fill="url(#hatch)" opacity=".7"/>${windows(b, 4, .09, '#ff8a2a', '#123a3d', (b.x | 0) + 3, { rx: 0 })}`).join('')}
  ${near.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h + 10}" fill="#0f2f31" ${ink}/>${windows(b, 5, .05, '#ff8a2a', '#0a2224', (b.x | 0) + 9, { rx: 0 })}`).join('')}
  <rect y="860" width="${W}" height="220" fill="#173f42" ${ink}/>
  <rect y="860" width="${W}" height="220" fill="url(#dots)" opacity=".35"/>
  ${[...Array(8)].map((_, i) => `<rect x="${i * 260 + 40}" y="958" width="140" height="14" fill="#f6e7c1" ${ink.replace('8', '5')}/>`).join('')}
  <!-- фонарь: жёсткий конус света -->
  <path d="M1338,400 L1100,1080 L1580,1080 Z" fill="#f6e7c1" opacity=".22"/>
  <rect x="1236" y="420" width="16" height="450" fill="#0a0a0a"/><path d="M1244,430 q0,-40 60,-40 h30" stroke="#0a0a0a" stroke-width="16" fill="none"/>
  <rect x="1310" y="384" width="56" height="20" fill="#ff8a2a" ${ink.replace('8', '5')}/>
  <!-- светофор -->
  <rect x="556" y="560" width="14" height="310" fill="#0a0a0a"/><rect x="536" y="500" width="54" height="124" rx="6" fill="#0a0a0a"/>
  <circle cx="563" cy="562" r="16" fill="#ffc21a" stroke="#0a0a0a" stroke-width="4"/>
  <g stroke="#ffc21a" stroke-width="6" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = Math.PI * a / 180; return `<line x1="${563 + Math.cos(r) * 26}" y1="${562 + Math.sin(r) * 26}" x2="${563 + Math.cos(r) * 40}" y2="${562 + Math.sin(r) * 40}"/>`; }).join('')}</g>
  <!-- машина -->
  <g transform="translate(180,820)"><path d="M0,60 h330 a20 20 0 0 0 -10,-50 L250,0 L200,-50 H90 L50,0 L10,10 a18 18 0 0 0 -10,50Z" fill="#c4452c" ${ink}/>
  <path d="M100,-40 H190 L230,0 H75Z" fill="#f6e7c1" ${ink.replace('8', '5')}/><circle cx="80" cy="64" r="28" fill="#0a0a0a"/><circle cx="260" cy="64" r="28" fill="#0a0a0a"/>
  <rect x="0" y="10" width="330" height="50" fill="url(#dotsS)" opacity=".4"/></g>
  ${hero('B', 1080, 940, 1.05)}
  <!-- звукоподражание -->
  <text x="640" y="470" font-family="Inter" font-weight="900" font-size="54" fill="#ffc21a" stroke="#0a0a0a" stroke-width="5" paint-order="stroke" transform="rotate(-8 640 470)">ЩЁЛК… ЩЁЛК…</text>
  <!-- рамка панели -->
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="#0a0a0a" stroke-width="22"/>
  <!-- плашка рассказчика, как в комиксе -->
  <g transform="translate(70,70)"><rect width="720" height="120" fill="#f6e7c1" stroke="#0a0a0a" stroke-width="6"/>
  <text x="28" y="54" font-family="Inter" font-weight="800" font-size="36" fill="#0a0a0a">Я ОТКРЫЛ ГЛАЗА.</text>
  <text x="28" y="98" font-family="Inter" font-weight="800" font-size="36" fill="#0a0a0a">И ГОРОД БЫЛ ПУСТ.</text></g>
  ${subtitle('ГОРОД БЫЛ ПУСТ.', 'ГОРОД БЫЛ <tspan fill="#ffc21a">ПУСТ.</tspan>')}
  <text x="${W - 60}" y="80" text-anchor="end" font-family="Inter" font-weight="800" font-size="30" fill="#0a0a0a">B · КОМИКС</text>
  </svg>`;
}

// ---------- C: КИНО-АНИМЕ (живописный свет) ----------
function styleC() {
  const far = skyline(11, 740, 300, 600, 80, 150), mid = skyline(22, 800, 220, 460, 130, 220), near = skyline(33, 860, 140, 320, 220, 360);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040b1f"/><stop offset=".45" stop-color="#0f2e5c"/><stop offset=".8" stop-color="#3d7fb0"/><stop offset="1" stop-color="#a8d6e8"/></linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16314f"/><stop offset="1" stop-color="#050a16"/></linearGradient>
    <radialGradient id="moon" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#f4fbff"/><stop offset=".62" stop-color="#cdeaff" stop-opacity=".6"/><stop offset="1" stop-color="#8fc7ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeaff" stop-opacity=".35"/><stop offset="1" stop-color="#cfeaff" stop-opacity="0"/></linearGradient>
    <linearGradient id="bFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b5584"/><stop offset="1" stop-color="#6aa3c7"/></linearGradient>
    <linearGradient id="bMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#132b4d"/><stop offset="1" stop-color="#2c5a82"/></linearGradient>
    <linearGradient id="bNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a33"/><stop offset="1" stop-color="#0f2443"/></linearGradient>
    <radialGradient id="cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".6"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>
    <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="bokeh"><feGaussianBlur stdDeviation="10"/></filter>
    <linearGradient id="refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="reflMask"><rect y="860" width="${W}" height="220" fill="url(#refl)"/></mask>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${(reset(5), [...Array(160)].map(() => `<circle cx="${rnd() * W}" cy="${rnd() * 520}" r="${rnd() * 1.8 + .4}" fill="#fff" opacity="${rnd() * .8 + .2}"/>`).join(''))}
  <circle cx="1460" cy="250" r="260" fill="url(#moon)"/>
  <g opacity=".8">${[-30, -12, 6, 22].map(a => `<path d="M1460,250 L${1460 + Math.tan(a * Math.PI / 180) * 900 - 120},1080 L${1460 + Math.tan(a * Math.PI / 180) * 900 + 60},1080Z" fill="url(#ray)" filter="url(#soft)"/>`).join('')}</g>
  <g filter="url(#soft)">${far.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#bFar)" opacity=".85"/>`).join('')}</g>
  ${mid.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#bMid)"/><rect x="${b.x + b.w - 6}" y="${b.y}" width="6" height="${b.h}" fill="#8fd0ff" opacity=".35"/>${windows(b, 5, .06, '#ffd79a', '#183457', (b.x | 0) + 3, { rowH: 26, glow: true, rx: 1 })}`).join('')}
  ${near.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h + 10}" fill="url(#bNear)"/><rect x="${b.x}" y="${b.y}" width="${b.w}" height="4" fill="#9fd8ff" opacity=".6"/>${windows(b, 6, .04, '#ffd79a', '#0f2240', (b.x | 0) + 9, { rowH: 28, glow: true, rx: 1 })}`).join('')}
  <!-- мокрая дорога с отражениями -->
  <rect y="860" width="${W}" height="220" fill="url(#road)"/>
  <g mask="url(#reflMask)" filter="url(#soft)" opacity=".7" transform="translate(0,1720) scale(1,-1)">
    ${near.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h + 10}" fill="#173a63"/>`).join('')}
  </g>
  <rect x="1300" y="870" width="80" height="210" fill="#ffcf8a" opacity=".35" filter="url(#bokeh)"/>
  <rect x="545" y="870" width="40" height="160" fill="#ffbf2f" opacity=".5" filter="url(#bokeh)"/>
  <!-- фонарь -->
  <rect x="1236" y="420" width="12" height="450" fill="#060c1a"/><path d="M1242,430 q0,-40 60,-40 h30" stroke="#060c1a" stroke-width="12" fill="none"/>
  <rect x="1310" y="384" width="56" height="18" rx="6" fill="#fff1d2" filter="url(#glow)"/>
  <path d="M1338,400 L1100,1080 L1580,1080 Z" fill="url(#cone)"/>
  <!-- светофор -->
  <rect x="560" y="560" width="10" height="310" fill="#060c1a"/><rect x="540" y="500" width="50" height="120" rx="10" fill="#060c1a"/>
  <circle cx="565" cy="562" r="14" fill="#ffbf2f" filter="url(#glow)"/>
  <!-- машина -->
  <g transform="translate(180,820)"><path d="M0,60 h330 a20 20 0 0 0 -10,-50 L250,0 L200,-50 H90 L50,0 L10,10 a18 18 0 0 0 -10,50Z" fill="#1b3150" stroke="#9fd8ff" stroke-width="2"/>
  <path d="M100,-40 H190 L230,0 H75Z" fill="#9fd8ff" opacity=".35"/><circle cx="80" cy="64" r="28" fill="#03060e"/><circle cx="260" cy="64" r="28" fill="#03060e"/>
  <rect x="318" y="20" width="16" height="12" rx="3" fill="#ff5a3a" filter="url(#glow)"/></g>
  <!-- светлячки-частицы и боке на переднем плане -->
  ${(reset(9), [...Array(50)].map(() => `<circle cx="${rnd() * W}" cy="${300 + rnd() * 700}" r="${rnd() * 2.5 + .8}" fill="#cfeaff" opacity="${rnd() * .7 + .2}" filter="url(#glow)"/>`).join(''))}
  ${hero('C', 1080, 940, 1.05)}
  <circle cx="120" cy="980" r="90" fill="#ffd79a" opacity=".18" filter="url(#bokeh)"/><circle cx="1820" cy="160" r="70" fill="#9fd8ff" opacity=".15" filter="url(#bokeh)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <!-- плёночная полоса кадра -->
  <rect width="${W}" height="60" fill="#000"/><rect y="${H - 60}" width="${W}" height="60" fill="#000"/>
  ${subtitle('ГОРОД БЫЛ ПУСТ.', 'ГОРОД БЫЛ <tspan fill="#ffcf3a">ПУСТ.</tspan>')}
  <text x="60" y="120" font-family="Inter" font-weight="800" font-size="30" fill="#fff" opacity=".85">C · КИНО-АНИМЕ</text>
  </svg>`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const [name, fn] of [['A_vector', styleA], ['B_comic', styleB], ['C_cinematic', styleC]]) {
    reset(1);
    const svg = fn();
    fs.writeFileSync(`${name}.svg`, svg);
    await page.setContent(`<html><body style="margin:0;background:#000">${svg}</body></html>`);
    await page.screenshot({ path: `${name}.png` });
    console.log('ok', name);
  }
  await browser.close();
})();
