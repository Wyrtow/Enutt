// Тестовые кадры «Землетрясение» в утверждённом типе графики:
// плоские фигурки без контура + 2D-векторный мир с объёмным светом, туманом, виньеткой.
// Запуск: node gen_quake.js → Q1_street.png, Q2_room.png
const { chromium } = require('playwright');
const fs = require('fs');
const W = 1920, H = 1080;
let seed = 3;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const reset = s => { seed = s; };

const DEFS = `
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="bigglow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="dof"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="dust"><feTurbulence type="fractalNoise" baseFrequency=".008 .02" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .62  0 0 0 0 .56  0 0 0 0 .74  0 0 0 1.6 -.55"/><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="8"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .05 0"/></filter>
  <radialGradient id="vig" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="#05040c" stop-opacity="0"/><stop offset="1" stop-color="#05040c" stop-opacity=".88"/></radialGradient>
  <linearGradient id="hoodG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a5f86"/><stop offset=".55" stop-color="#2b4a6d"/><stop offset="1" stop-color="#1a2f4a"/></linearGradient>
  <linearGradient id="pantG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2d44"/><stop offset="1" stop-color="#171a2c"/></linearGradient>
  <linearGradient id="skinG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d2b0"/><stop offset="1" stop-color="#d9a882"/></linearGradient>
  <linearGradient id="scarfG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa04a"/><stop offset="1" stop-color="#e2611c"/></linearGradient>
  <linearGradient id="hairG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a22"/><stop offset="1" stop-color="#22160f"/></linearGradient>
`;

// ГЕРОЙ: Марк, парень ~25, пропорция ~1:5.5, без контура, мягкий градиентный объём,
// глаза-точки, рот почти не виден, руки-«трубки». Фирменная деталь — оранжевый шарф.
// rimColor — контровой свет от источника сцены.
function hero(x, base, sc, { flip = false, rim = '#ffb36b', look = 0, armUp = false } = {}) {
  const f = flip ? -1 : 1;
  return `<g transform="translate(${x},${base}) scale(${sc * f},${sc})">
   <ellipse cx="0" cy="2" rx="70" ry="11" fill="#000" opacity=".5"/>
   <!-- ноги: прямые джинсы -->
   <rect x="-36" y="-320" width="32" height="312" rx="12" fill="url(#pantG)"/>
   <rect x="4" y="-320" width="32" height="312" rx="12" fill="url(#pantG)" transform="rotate(2.5 20 -320)"/>
   <!-- кроссовки, крупные -->
   <path d="M-46,-18 h46 v18 h-54 a10 10 0 0 1 8,-18Z" fill="#e4e0d8"/><rect x="-54" y="-4" width="56" height="5" rx="2" fill="#b9b3a8"/>
   <path d="M10,-16 h44 a10 10 0 0 1 8,16 h-52Z" fill="#e4e0d8"/><rect x="10" y="-2" width="54" height="5" rx="2" fill="#b9b3a8"/>
   <!-- худи: широкие плечи, сужается к поясу, заканчивается на бёдрах -->
   <path d="M-66,-466 Q0,-490 66,-466 Q72,-420 62,-380 L54,-300 Q0,-288 -54,-300 L-62,-380 Q-72,-420 -66,-466Z" fill="url(#hoodG)"/>
   <rect x="-56" y="-316" width="112" height="22" rx="10" fill="#203a58"/>
   <path d="M64,-462 Q70,-420 60,-380 L52,-304" stroke="${rim}" stroke-width="5" fill="none" opacity=".75" filter="url(#soft)"/>
   <path d="M-34,-372 h68 l-6,42 h-56z" fill="#24405f"/>
   <!-- капюшон, сложен за шеей -->
   <path d="M-40,-486 Q0,-512 40,-486 Q34,-462 0,-460 Q-34,-462 -40,-486Z" fill="#2a4769"/>
   <!-- руки-трубки, от плеч -->
   <path d="M-62,-456 Q-86,-380 -78,-300" stroke="#2f5279" stroke-width="28" stroke-linecap="round" fill="none"/>
   <circle cx="-78" cy="-292" r="15" fill="url(#skinG)"/>
   ${armUp
     ? `<path d="M62,-456 Q110,-470 116,-540" stroke="#2b4a6d" stroke-width="28" stroke-linecap="round" fill="none"/><circle cx="116" cy="-550" r="15" fill="url(#skinG)"/>`
     : `<path d="M62,-456 Q86,-380 78,-300" stroke="#24405f" stroke-width="28" stroke-linecap="round" fill="none"/><circle cx="78" cy="-292" r="15" fill="url(#skinG)"/>`}
   <!-- шарф -->
   <path d="M-38,-488 Q0,-470 38,-488 Q42,-474 38,-458 Q0,-444 -38,-458 Q-42,-474 -38,-488Z" fill="url(#scarfG)"/>
   <path d="M16,-462 Q26,-424 32,-392 L16,-394 Q12,-424 4,-460Z" fill="url(#scarfG)"/>
   <!-- шея и голова: квадратнее челюсть -->
   <rect x="-14" y="-506" width="28" height="26" fill="#d9a882"/>
   <path d="M-40,-570 Q-42,-606 0,-608 Q42,-606 40,-570 L38,-530 Q34,-502 0,-498 Q-34,-502 -38,-530Z" fill="url(#skinG)"/>
   <!-- лёгкая щетина -->
   <path d="M-37,-532 Q-32,-502 0,-498 Q32,-502 37,-532 Q20,-516 0,-516 Q-20,-516 -37,-532Z" fill="#6b4a3a" opacity=".28"/>
   <!-- ухо -->
   <ellipse cx="-41" cy="-552" rx="7" ry="12" fill="#d9a882"/>
   <!-- короткая стрижка, чёлка набок, без пучка -->
   <path d="M-44,-562 Q-48,-616 -6,-622 Q40,-626 46,-584 Q46,-566 42,-558 Q38,-584 20,-588 Q6,-576 -14,-584 Q-30,-586 -36,-566Z" fill="url(#hairG)"/>
   <path d="M-6,-622 Q22,-632 38,-612 Q26,-616 14,-610Z" fill="url(#hairG)"/>
   <!-- лицо -->
   <circle cx="${-13 + look}" cy="-556" r="5.5" fill="#15131c"/><circle cx="${15 + look}" cy="-556" r="5.5" fill="#15131c"/>
   <path d="M-26,-572 l18,-3 M8,-575 l18,3" stroke="#22160f" stroke-width="5.5" stroke-linecap="round" fill="none"/>
   <path d="M${2 + look},-542 q-3,8 2,10" stroke="#b9876a" stroke-width="3" fill="none" stroke-linecap="round"/>
   <path d="M-8,-520 h16" stroke="#8a5240" stroke-width="3.5" stroke-linecap="round"/>
   <path d="M38,-590 Q46,-552 36,-520" stroke="${rim}" stroke-width="4" fill="none" opacity=".7" filter="url(#soft)"/>
  </g>`;
}
// второстепенный персонаж: девочка-соседка ~8 лет (та же графика)
function kid(x, base, sc) {
  return `<g transform="translate(${x},${base}) scale(${sc})">
   <ellipse cx="0" cy="2" rx="40" ry="7" fill="#000" opacity=".5"/>
   <rect x="-20" y="-150" width="17" height="146" rx="8" fill="#3b2b4d"/><rect x="3" y="-150" width="17" height="146" rx="8" fill="#33243f"/>
   <path d="M-34,-300 Q0,-314 34,-300 L40,-140 Q0,-130 -40,-140Z" fill="#d84f6a"/>
   <path d="M-32,-292 Q-50,-240 -44,-184" stroke="#c4425c" stroke-width="18" stroke-linecap="round" fill="none"/>
   <path d="M32,-292 Q50,-240 44,-184" stroke="#b03a52" stroke-width="18" stroke-linecap="round" fill="none"/>
   <ellipse cx="0" cy="-344" rx="34" ry="38" fill="url(#skinG)"/>
   <path d="M-38,-344 Q-40,-392 0,-390 Q40,-392 38,-344 Q34,-372 0,-372 Q-34,-372 -38,-344Z" fill="#6a3a24"/>
   <circle cx="-40" cy="-330" r="14" fill="#6a3a24"/><circle cx="40" cy="-330" r="14" fill="#6a3a24"/>
   <circle cx="-10" cy="-342" r="4.5" fill="#15131c"/><circle cx="12" cy="-342" r="4.5" fill="#15131c"/>
   <!-- плюшевый заяц -->
   <g transform="translate(46,-190)"><ellipse rx="16" ry="20" fill="#e8e1ef"/><ellipse cx="-7" cy="-30" rx="5" ry="16" fill="#e8e1ef"/><ellipse cx="7" cy="-30" rx="5" ry="16" fill="#e8e1ef"/></g>
  </g>`;
}
const crack = (x, y, len, s, w = 4) => {
  reset(s); let d = `M${x},${y}`, cx = x, cy = y, br = '';
  for (let i = 0; i < len; i++) { cx += (rnd() - .5) * 40; cy += 14 + rnd() * 22; d += ` L${cx.toFixed(1)},${cy.toFixed(1)}`;
    if (rnd() < .3) br += `<path d="M${cx},${cy} l${(rnd() - .5) * 60},${10 + rnd() * 30}" stroke="#07060f" stroke-width="${w * .6}" fill="none"/>`; }
  return `<path d="${d}" stroke="#07060f" stroke-width="${w}" fill="none" stroke-linejoin="round"/>${br}`;
};
const pill = (text, color, fg = '#fff', tilt = 0) => {
  const w = text.length * 31 + 110;
  return `<g transform="translate(${W / 2},96) rotate(${tilt})"><rect x="${-w / 2}" y="-40" width="${w}" height="80" rx="40" fill="${color}"/>
   <text y="15" text-anchor="middle" font-family="Inter" font-weight="900" font-size="42" fill="${fg}" letter-spacing="1">${text}</text></g>`;
};
// субтитр-караоке: сказанные слова белые, текущее — акцент, будущие — серые
const karaoke = (words, cur, accent = '#ffc93a') => {
  const t = words.map((w, i) => `<tspan fill="${i < cur ? '#fff' : i === cur ? accent : '#8b8a99'}">${w}</tspan>`).join(' ');
  return `<g font-family="Inter" font-weight="900" font-size="66" text-anchor="middle">
   <text x="${W / 2}" y="${H - 86}" stroke="#05040c" stroke-width="14" stroke-linejoin="round" fill="#05040c">${words.join(' ')}</text>
   <text x="${W / 2}" y="${H - 86}">${t}</text></g>`;
};

// ---------- КАДР 1: улица, второй толчок ----------
function street() {
  reset(2);
  const bld = (x, w, h, base, fill, lit, s, tilt = 0) => {
    reset(s); let win = ''; const cols = Math.max(2, Math.round(w / 52)), rows = Math.floor((h - 50) / 46);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const on = rnd() < lit;
      win += `<rect x="${x + 16 + c * (w - 32) / cols + 5}" y="${base - h + 30 + r * 46}" width="${(w - 32) / cols - 10}" height="28" rx="3" fill="${on ? '#ffbf6e' : '#1d1b36'}" ${on ? 'filter="url(#glow)"' : ''}/>`; }
    return `<g transform="rotate(${tilt} ${x + w / 2} ${base})"><rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x}" y="${base - h}" width="${w}" height="10" fill="#3a3870"/>${win}</g>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${DEFS}
   <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07061a"/><stop offset=".6" stop-color="#1c1a44"/><stop offset="1" stop-color="#3b2d5e"/></linearGradient>
   <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232042"/><stop offset="1" stop-color="#08071a"/></linearGradient>
   <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d6fb8" stop-opacity="0"/><stop offset=".55" stop-color="#7d6fb8" stop-opacity=".38"/><stop offset="1" stop-color="#7d6fb8" stop-opacity="0"/></linearGradient>
   <radialGradient id="cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".5"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>
   <radialGradient id="fire" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".75"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>
  </defs>
  <g transform="translate(-12,6) rotate(-.6 960 540)"><!-- камера чуть сбита: идёт толчок -->
  <rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="url(#sky)"/>
  ${[...Array(90)].map(() => `<circle cx="${rnd() * W}" cy="${rnd() * 380}" r="${rnd() * 1.6 + .4}" fill="#fff" opacity="${rnd() * .6 + .2}"/>`).join('')}
  <!-- дальний план, в расфокусе -->
  <g filter="url(#dof)" opacity=".9">${[...Array(14)].map((_, i) => bld(i * 145 - 40, 120 + (i % 3) * 20, 300 + ((i * 97) % 260), 720, '#2b2858', .1, 50 + i)).join('')}</g>
  <!-- зарево пожара за домами -->
  <ellipse cx="1500" cy="640" rx="420" ry="220" fill="url(#fire)" filter="url(#bigglow)"/>
  <rect y="460" width="${W}" height="300" fill="url(#fog)"/>
  <!-- средний план -->
  ${bld(-30, 300, 520, 860, '#1a1838', .06, 7)}
  ${bld(300, 260, 430, 860, '#1d1a3e', .05, 8)}
  ${bld(1380, 330, 560, 860, '#18163a', .07, 9, 3.5)}
  ${bld(1720, 260, 420, 860, '#1b1940', .05, 10)}
  ${crack(1520, 360, 14, 21, 6)}${crack(140, 380, 12, 22, 5)}${crack(420, 470, 9, 23, 4)}
  <!-- падающие обломки -->
  ${[[1610, 300, 30], [1660, 420, 18], [1580, 520, 22], [1700, 230, 14]].map(([x, y, s]) => `<rect x="${x}" y="${y}" width="${s}" height="${s * .7}" fill="#2a2756" transform="rotate(${x % 40} ${x} ${y})"/>`).join('')}
  <!-- пыль от обрушения -->
  <mask id="dm"><radialGradient id="dmg" cx=".5" cy=".6" r=".5"><stop offset=".3" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><rect x="1150" y="360" width="860" height="560" fill="url(#dmg)"/></mask><rect x="1150" y="360" width="860" height="560" filter="url(#dust)" mask="url(#dm)" opacity=".95"/>
  <rect y="760" width="${W}" height="160" fill="url(#fog)"/>
  <!-- дорога с трещиной -->
  <path d="M-40,860 H${W + 40} V${H + 40} H-40Z" fill="url(#road)"/>
  <path d="M640,860 L700,920 L660,960 L760,1010 L720,1080 L820,1080 L800,1010 L880,960 L780,920 L700,860Z" fill="#05040c"/>
  <path d="M700,860 L760,920 L720,962 L810,1010" stroke="#ff9a4a" stroke-width="3" fill="none" opacity=".5" filter="url(#glow)"/>
  ${[...Array(7)].map((_, i) => `<rect x="${i * 300 - 60}" y="962" width="160" height="10" rx="5" fill="#d9c68a" opacity=".35"/>`).join('')}
  <!-- фонарь, покосился -->
  <g transform="rotate(-7 260 870)"><rect x="254" y="420" width="12" height="450" fill="#0b0a1c"/><path d="M260,430 q0,-36 56,-36 h24" stroke="#0b0a1c" stroke-width="12" fill="none"/>
  <rect x="318" y="386" width="50" height="16" rx="6" fill="#fff0d0" filter="url(#glow)"/><path d="M343,400 L150,1080 L560,1080Z" fill="url(#cone)"/></g>
  <!-- машина с мигающей аварийкой -->
  <g transform="translate(1180,830)"><path d="M0,60 h330 a20 20 0 0 0 -10,-50 L250,0 L200,-50 H90 L50,0 L10,10 a18 18 0 0 0 -10,50Z" fill="#2c2858"/>
   <path d="M100,-40 H190 L230,0 H75Z" fill="#6c74c8" opacity=".45"/><circle cx="80" cy="64" r="28" fill="#06050f"/><circle cx="260" cy="64" r="28" fill="#06050f"/>
   <rect x="-4" y="16" width="18" height="14" rx="4" fill="#ffae2a" filter="url(#glow)"/><rect x="318" y="16" width="18" height="14" rx="4" fill="#ffae2a" filter="url(#glow)"/>
   <ellipse cx="160" cy="90" rx="240" ry="16" fill="#ffae2a" opacity=".18" filter="url(#bigglow)"/></g>
  ${hero(930, 960, 1.0, { look: 4, rim: '#ffab66' })}
  ${kid(1060, 965, .95)}
  <!-- пыль и искры в воздухе -->
  ${(reset(11), [...Array(70)].map(() => `<circle cx="${rnd() * W}" cy="${280 + rnd() * 700}" r="${rnd() * 2.6 + .6}" fill="${rnd() < .3 ? '#ffb36b' : '#cfc6ee'}" opacity="${rnd() * .6 + .2}"/>`).join(''))}
  </g>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
  ${pill('ЗЕМЛЯ ДРОГНУЛА ВТОРОЙ РАЗ', '#e5383b')}
  ${karaoke(['И', 'ТОГДА', 'Я', 'ПОНЯЛ:'], 2)}
  </svg>`;
}

// ---------- КАДР 2: квартира, 3:17 ночи, первый толчок ----------
function room() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${DEFS}
   <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1a33"/><stop offset="1" stop-color="#2a2747"/></linearGradient>
   <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2338"/><stop offset="1" stop-color="#0d0a16"/></linearGradient>
   <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1236"/><stop offset="1" stop-color="#2c3a78"/></linearGradient>
   <radialGradient id="lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd08a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd08a" stop-opacity="0"/></radialGradient>
   <linearGradient id="moonbeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fb4ff" stop-opacity=".28"/><stop offset="1" stop-color="#9fb4ff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wall)"/>
  <!-- окно с ночным городом -->
  <rect x="1180" y="170" width="520" height="440" rx="8" fill="url(#night)"/>
  ${(reset(4), [...Array(10)].map((_, i) => { const h = 120 + rnd() * 200; return `<rect x="${1180 + i * 54}" y="${610 - h}" width="48" height="${h}" fill="#141a44"/>${rnd() < .6 ? `<rect x="${1196 + i * 54}" y="${630 - h}" width="10" height="12" fill="#ffc372"/>` : ''}`; }).join(''))}
  <path d="M1180,170 h520 v440 h-520z M1440,170 v440 M1180,390 h520" stroke="#0c0b1c" stroke-width="16" fill="none"/>
  ${crack(1460, 175, 8, 31, 4)}
  <path d="M1180,610 L760,1080 L1560,1080 L1700,610Z" fill="url(#moonbeam)" filter="url(#dof)"/>
  <!-- трещина через всю стену -->
  ${crack(560, 120, 26, 33, 7)}
  <!-- полка, книги падают -->
  <rect x="160" y="360" width="360" height="16" fill="#0f0d1e"/>
  ${[0, 1, 2, 3, 4].map(i => `<rect x="${180 + i * 40}" y="${282 + (i === 3 ? 10 : 0)}" width="30" height="78" fill="${['#6b3fa0', '#2f6f8f', '#a8483c', '#d0a24a', '#3d8a63'][i]}" transform="rotate(${i > 2 ? 18 + i * 6 : 0} ${195 + i * 40} 360)"/>`).join('')}
  <rect x="440" y="520" width="34" height="80" fill="#a8483c" transform="rotate(64 457 560)"/>
  <rect x="380" y="700" width="30" height="76" fill="#2f6f8f" transform="rotate(-30 395 740)"/>
  <!-- раскачивающаяся лампа -->
  <path d="M960,0 L1010,250" stroke="#0c0b1c" stroke-width="5"/>
  <g transform="rotate(-11 960 0)"><path d="M948,250 h44 l30,56 h-104z" fill="#3c375f"/></g>
  <ellipse cx="1012" cy="330" rx="420" ry="360" fill="url(#lamp)"/>
  <circle cx="1013" cy="306" r="18" fill="#fff2cf" filter="url(#glow)"/>
  <!-- пол, мебель -->
  <path d="M0,820 H${W} V${H} H0Z" fill="url(#floor)"/>
  <rect x="80" y="690" width="460" height="140" rx="22" fill="#2a2244"/><rect x="80" y="640" width="460" height="70" rx="22" fill="#352c55"/>
  <!-- телефон на полу с сигналом -->
  <g transform="translate(1340,900) rotate(-18)"><rect x="-28" y="-50" width="56" height="100" rx="10" fill="#0b0a16"/><rect x="-22" y="-42" width="44" height="80" rx="6" fill="#ff3d4f" filter="url(#glow)"/>
   <text y="8" text-anchor="middle" font-family="Inter" font-weight="900" font-size="26" fill="#fff">112</text></g>
  <ellipse cx="1340" cy="930" rx="160" ry="30" fill="#ff3d4f" opacity=".25" filter="url(#bigglow)"/>
  <!-- пыль сыплется с потолка -->
  ${(reset(17), [...Array(120)].map(() => { const x = 400 + rnd() * 1100; return `<circle cx="${x}" cy="${rnd() * 900}" r="${rnd() * 2 + .5}" fill="#d8cfee" opacity="${rnd() * .55 + .15}"/>`; }).join(''))}
  ${hero(860, 990, 1.12, { look: 6, armUp: true, rim: '#ffcf8a' })}
  <!-- часы -->
  <g transform="translate(250,180)"><rect x="-120" y="-50" width="240" height="100" rx="18" fill="#0d0c1a"/>
   <text y="22" text-anchor="middle" font-family="Inter" font-weight="800" font-size="62" fill="#ff5a5a" filter="url(#glow)">03:17</text></g>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
  ${pill('СНАЧАЛА ЗАЗВЕНЕЛА ЛЮСТРА', '#f2c230', '#1a1426', -2)}
  ${karaoke(['ЛАМПА', 'КАЧНУЛАСЬ.', 'ПОТОМ', 'ВТОРОЙ', 'РАЗ.'], 1)}
  </svg>`;
}

function sheet() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${DEFS}
   <radialGradient id="bg" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#2a2752"/><stop offset="1" stop-color="#0c0b1d"/></radialGradient></defs>
   <rect width="${W}" height="${H}" fill="url(#bg)"/>
   ${hero(420, 900, 1.15, { rim: '#ffcf8a' })}
   ${hero(960, 900, 1.15, { rim: '#ffcf8a', armUp: true, look: 5 })}
   ${hero(1500, 900, 1.15, { rim: '#9fc4ff', flip: true, look: 4 })}
   <g font-family="Inter" font-weight="800" font-size="34" fill="#cfc8ee" text-anchor="middle">
    <text x="420" y="990">СТОИТ</text><text x="960" y="990">ТЯНЕТСЯ</text><text x="1500" y="990">ПОВОРОТ</text></g>
   <text x="70" y="100" font-family="Inter" font-weight="900" font-size="54" fill="#fff">МАРК · 25 ЛЕТ</text>
   <text x="70" y="148" font-family="Inter" font-weight="600" font-size="30" fill="#a9a3cc">главный герой канала «Один герой» · фирменная деталь — оранжевый шарф</text>
   <rect width="${W}" height="${H}" fill="url(#vig)" opacity=".6"/>
  </svg>`;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const [n, fn] of [['Q1_street', street], ['Q2_room', room], ['HERO_sheet', sheet]]) {
    const svg = fn(); fs.writeFileSync(n + '.svg', svg);
    await p.setContent(`<body style="margin:0">${svg}</body>`); await p.screenshot({ path: n + '.png' }); console.log('ok', n);
  }
  await b.close();
})();
