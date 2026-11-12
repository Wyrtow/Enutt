// Параметрический риг персонажей канала «Один герой» (2D-скелет: IK ног, FK рук, поворот анфас↔¾, лицо, вторичка).
// Чистые функции: состояние → SVG-строка. Работает в браузере и в Node. Без случайности: всё — функции времени.
(function (root) {
  const D2R = Math.PI / 180;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const smoother = u => { u = clamp01(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const lerp = (a, b, u) => a + (b - a) * u;
  const P = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967295; };

  function ik2(H, A, L1, L2, bend) {
    let dx = A[0] - H[0], dy = A[1] - H[1], d = Math.hypot(dx, dy);
    const dm = L1 + L2 - 0.5;
    if (d > dm) { dx *= dm / d; dy *= dm / d; d = dm; A = [H[0] + dx, H[1] + dy]; }
    if (d < 1) d = 1;
    const a = Math.atan2(dy, dx), c = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    const k = a - bend * Math.acos(Math.max(-1, Math.min(1, c)));
    return { knee: [H[0] + L1 * Math.cos(k), H[1] + L1 * Math.sin(k)], ankle: A };
  }

  // ---------- ВНЕШНОСТЬ ----------
  const LOOKS = {
    mark:     { top: 'hoodie', topC: ['#3a5f86', '#2b4a6d', '#1a2f4a'], pants: '#262a42', shoe: '#e4e0d8', skin: ['#f6d2b0', '#d9a882'], hair: 'side', hairC: '#2e2019', scarf: true, stubble: true, size: 1 },
    sonya:    { top: 'puffer', topC: ['#ffd23f', '#f2b51d', '#c98d0e'], pants: '#3b2b4d', shoe: '#f4f0ea', skin: ['#f8dcc0', '#e2b08c'], hair: 'pigtails', hairC: '#6a3a24', kid: 7, bunny: true, size: 1 },
    olga:     { top: 'coat', topC: ['#2fb3a8', '#1f8d85', '#156760'], pants: '#2a2638', shoe: '#3a2f2a', skin: ['#f3cdaa', '#d6a37c'], hair: 'bun', hairC: '#4a2a1c', female: true, headlamp: true, size: 0.96 },
    timur:    { top: 'hoodie', topC: ['#4d5563', '#3a414d', '#272c35'], pants: '#1f2533', shoe: '#e8e2d6', skin: ['#e9be98', '#c99572'], hair: 'beanie', hairC: '#2a1a12', hatC: '#d8323a', kid: 10, headphones: true, size: 1 },
    petrovich:{ top: 'quilted', topC: ['#4b4f3b', '#3a3d2d', '#272a1e'], pants: '#2b2b2f', shoe: '#1c1a19', skin: ['#efc7a4', '#cf9d78'], hair: 'grey', hairC: '#c9c6c0', moustache: true, elder: true, lantern: true, size: 0.97 },
    rescuer:  { top: 'coat', topC: ['#e2622a', '#c24d1c', '#8f3712'], pants: '#22262e', shoe: '#1b1b1b', skin: ['#f0c8a4', '#d0a07c'], hair: 'helmet', hairC: '#3a2a20', hatC: '#f2f2f2', size: 1 },
  };
  function extra(seed) { // массовка: детерминированные цвета/рост
    const r = n => hash(seed + ':' + n);
    const pal = [['#5b4b7a', '#47395f', '#2f2541'], ['#7a3b3b', '#5e2d2d', '#3f1e1e'], ['#3b6b5b', '#2d5446', '#1f3a30'], ['#6b6b72', '#55555c', '#3c3c42'], ['#8a6a3a', '#6e542d', '#4d3a1f'], ['#2f4f7a', '#243d5f', '#182a42']];
    const p = pal[Math.floor(r(1) * pal.length)];
    const female = r(2) < 0.45;
    return { top: female ? 'coat' : (r(3) < .5 ? 'hoodie' : 'quilted'), topC: p, pants: r(4) < .5 ? '#232533' : '#2f2a26', shoe: '#2a2624',
      skin: r(5) < .7 ? ['#f2c9a6', '#d4a27d'] : ['#d9a780', '#b7845e'], hair: female ? 'bun' : (r(6) < .3 ? 'grey' : 'short'), hairC: ['#2a1d17', '#4a2e1f', '#8a8580', '#1a1412'][Math.floor(r(7) * 4)],
      female, kid: r(8) < 0.12 ? 9 : 0, size: 0.92 + r(9) * 0.12, blanket: r(10) < 0.25 };
  }

  // ---------- ЧЕЛОВЕК ----------
  // s: {x,y,sc, look, facing(±1), turn(0..1), hipX, hipDY, lean, breath, footA, footB, pitchA, pitchB,
  //     armA, armB, elbA, elbB, lookX, lookY, headDX, headTilt, brows, mouth, blink, alpha, glow, scarf:[angles], lie}
  function human(s) {
    const L = typeof s.look === 'string' ? LOOKS[s.look] : s.look;
    const kid = L.kid ? 1 : 0, K = kid ? 0.58 + (L.kid - 7) * 0.03 : 1; // масштаб тела ребёнка
    const HK = kid ? 0.84 : 1;             // голова у детей относительно крупнее
    const T = s.turn || 0, F = s.facing || 1;
    const bx = s.hipX || 0, hipY = (-312 + (s.hipDY || 0)) * K;
    const lean = ((s.lean || 0) + (L.elder ? 7 : 0)) * D2R;
    const breath = s.breath || 0;
    const narrow = (1 - 0.33 * T) * (L.female ? 0.86 : 1), shift = 10 * T * F * K;
    const rot = (p, o, a) => { const c = Math.cos(a), sn = Math.sin(a), x = p[0] - o[0], y = p[1] - o[1]; return [o[0] + x * c - y * sn, o[1] + x * sn + y * c]; };
    const pelvis = [bx, hipY];
    const hipA = [bx - 20 * narrow * K + shift * .3, hipY], hipB = [bx + 20 * narrow * K + shift * .3, hipY];
    const shY = (-458 + (s.hipDY || 0) * 0.9) * K - 2 * breath * K;
    let shA = rot([bx - 62 * narrow * K + shift, shY], pelvis, lean * F), shB = rot([bx + 62 * narrow * K + shift, shY], pelvis, lean * F);
    const neck = rot([bx + shift * 1.1, (-490 + (s.hipDY || 0) * 0.9) * K - 2 * breath * K], pelvis, lean * F);
    const head = [neck[0] + (s.headDX || 0) * K, neck[1] - 64 * K * (kid ? 0.95 : 1) + (s.headDY || 0)];
    const C = { top: L.topC, pants: L.pants, shoe: L.shoe, skin: L.skin, hair: L.hairC };
    const footA = s.footA || [bx - 22 * K, 0], footB = s.footB || [bx + 22 * K, 0];
    const legA = ik2(hipA, footA, 152 * K, 150 * K, F >= 0 ? 1 : -1), legB = ik2(hipB, footB, 152 * K, 150 * K, F >= 0 ? 1 : -1);
    const arm = (sh, a, b, up = 1, lo = 1) => { // up/lo — ракурсное укорочение плеча/предплечья (рука к камере)
      const A = a * D2R * F, B = (a + b) * D2R * F;
      const el = [sh[0] + Math.sin(A) * 92 * K * up, sh[1] + Math.cos(A) * 92 * K * up];
      return { el, ha: [el[0] + Math.sin(B) * 86 * K * lo, el[1] + Math.cos(B) * 86 * K * lo] };
    };
    const sA = [shA[0] + 4 * K, shA[1] + 10 * K], sB = [shB[0] - 4 * K, shB[1] + 10 * K];
    const armA = arm(sA, s.armA || 0, s.elbA ?? 10, s.upA ?? 1, s.loA ?? 1), armB = arm(sB, s.armB || 0, s.elbB ?? 10, s.upB ?? 1, s.loB ?? 1);
    const lw = 33 * K, aw = 27 * K;
    const nearIsA = !(T > .3 && F < 0);
    const topC = C.top;
    const sleeveC = (far) => far ? topC[2] : topC[0];

    const leg = (Lg, hip, far, pitch) => {
      const c = far ? shade(C.pants, -0.25) : C.pants;
      const p = (pitch || 0) * D2R * F, side = T > .3;
      const len = (side ? 46 : 26) * K, back = 12 * K;
      const toe = side ? [Lg.ankle[0] + Math.cos(p) * len * F, Lg.ankle[1] + 4 * K + Math.sin(p) * len] : [Lg.ankle[0] + 18 * K, Lg.ankle[1] + 4 * K];
      const heel = side ? [Lg.ankle[0] - Math.cos(p) * back * F, Lg.ankle[1] + 4 * K - Math.sin(p) * back] : [Lg.ankle[0] - 18 * K, Lg.ankle[1] + 4 * K];
      return `<path d="M${P(hip)} L${P(Lg.knee)} L${P(Lg.ankle)}" stroke="${c}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        ${far ? '' : `<path d="M${P([Lg.knee[0] - 7 * K, Lg.knee[1] - 60 * K])} L${P([Lg.knee[0] - 7 * K, Lg.knee[1]])} L${P([Lg.ankle[0] - 6 * K, Lg.ankle[1] - 20 * K])}" stroke="${shade(C.pants, .18)}" stroke-width="${6 * K}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".5"/>`}
        <path d="M${P(heel)} L${P(toe)}" stroke="${far ? shade(C.shoe, -.25) : C.shoe}" stroke-width="${20 * K}" stroke-linecap="round"/>`;
    };
    const armSvg = (sh, A, far) => `<path d="M${P(sh)} L${P(A.el)} L${P(A.ha)}" stroke="${sleeveC(far)}" stroke-width="${aw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      ${far ? '' : `<path d="M${P([sh[0] - 6 * K, sh[1] + 8 * K])} L${P([A.el[0] - 6 * K, A.el[1]])}" stroke="${shade(topC[0], .15)}" stroke-width="${6 * K}" stroke-linecap="round" opacity=".55"/>`}
      <circle cx="${A.ha[0].toFixed(1)}" cy="${A.ha[1].toFixed(1)}" r="${14 * K}" fill="${far ? C.skin[1] : C.skin[0]}"/>`;

    // корпус: подол зависит от одежды
    const hemDrop = L.top === 'coat' ? 95 : L.top === 'puffer' ? 30 : L.top === 'quilted' ? 45 : 0;
    const hemY = (-296 + hemDrop + (s.hipDY || 0)) * K, w = narrow;
    const hemA = rot([bx - (56 + hemDrop * .12) * w * K + shift * .4, hemY], pelvis, lean * F * .3), hemB = rot([bx + (56 + hemDrop * .12) * w * K + shift * .4, hemY], pelvis, lean * F * .3);
    const chest = 1 + 0.015 * breath;
    const gid = 'g' + (s.id || 'x');
    let torso = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${topC[0]}"/><stop offset=".55" stop-color="${topC[1]}"/><stop offset="1" stop-color="${topC[2]}"/></linearGradient>
       <linearGradient id="${gid}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.skin[0]}"/><stop offset="1" stop-color="${C.skin[1]}"/></linearGradient></defs>
      <path d="M${P(shA)} Q${P([neck[0], neck[1] - 14 * K])} ${P(shB)} Q${P([shB[0] + 8 * chest * w * K, shB[1] + 60 * K])} ${P([hemB[0] + 2, hemB[1] - 70 * K])} L${P(hemB)} Q${P([bx + shift * .4, hemY + 12 * K])} ${P(hemA)} L${P([hemA[0] - 2, hemA[1] - 70 * K])} Q${P([shA[0] - 8 * chest * w * K, shA[1] + 60 * K])} ${P(shA)}Z" fill="url(#${gid})"/>
      <path d="M${P([shB[0] - 2, shB[1] + 6 * K])} Q${P([shB[0] + 6 * K, shB[1] + 70 * K])} ${P([hemB[0], hemB[1] - 8 * K])}" stroke="${s.rim || '#ffc98a'}" stroke-width="${5 * K}" fill="none" opacity=".65"/>`;
    if (L.top === 'hoodie') torso += `<rect x="${(hemA[0] - 2).toFixed(1)}" y="${(hemY - 18 * K).toFixed(1)}" width="${(hemB[0] - hemA[0] + 4).toFixed(1)}" height="${22 * K}" rx="${10 * K}" fill="${topC[2]}"/>
      <path d="M${P([bx - 32 * w * K + shift * .7, hemY - 82 * K])} h${64 * w * K} l${-6 * K},${40 * K} h${-52 * w * K}z" fill="${topC[2]}" opacity=".85"/>
      <path d="M${P([neck[0] - 40 * K, neck[1] + 4 * K])} Q${P([neck[0], neck[1] - 22 * K])} ${P([neck[0] + 40 * K, neck[1] + 4 * K])} Q${P([neck[0] + 30 * K, neck[1] + 22 * K])} ${P([neck[0], neck[1] + 24 * K])} Q${P([neck[0] - 30 * K, neck[1] + 22 * K])} ${P([neck[0] - 40 * K, neck[1] + 4 * K])}Z" fill="${topC[2]}"/>`;
    if (L.top === 'puffer') for (let i = 1; i <= 4; i++) { const yy = lerp(shY + 20 * K, hemY, i / 5); torso += `<path d="M${(hemA[0] + 4).toFixed(1)},${yy.toFixed(1)} Q${bx + shift * .4},${(yy + 8 * K).toFixed(1)} ${(hemB[0] - 4).toFixed(1)},${yy.toFixed(1)}" stroke="${topC[2]}" stroke-width="${4 * K}" fill="none" opacity=".7"/>`; }
    if (L.top === 'quilted') for (let i = -2; i <= 2; i++) torso += `<path d="M${(bx + shift * .7 + i * 22 * w * K).toFixed(1)},${(shY + 20 * K).toFixed(1)} L${(bx + shift * .4 + i * 24 * w * K).toFixed(1)},${(hemY - 6 * K).toFixed(1)}" stroke="${topC[2]}" stroke-width="${3.5 * K}" opacity=".7"/>`;
    if (L.top === 'coat') torso += `<path d="M${P([neck[0] + 4 * K, neck[1] + 20 * K])} L${P([bx + shift * .4 + 4 * K, hemY])}" stroke="${topC[2]}" stroke-width="${4 * K}" opacity=".8"/>
      <path d="M${P([neck[0] - 26 * K, neck[1] + 4 * K])} L${P([neck[0], neck[1] + 34 * K])} L${P([neck[0] + 26 * K, neck[1] + 4 * K])}" stroke="${topC[2]}" stroke-width="${6 * K}" fill="none"/>`;
    if (L.blanket) torso += `<path d="M${P([shA[0] - 6, shA[1] - 4])} Q${P([neck[0], neck[1] - 10])} ${P([shB[0] + 6, shB[1] - 4])} L${P([hemB[0] + 10, hemB[1] - 40 * K])} L${P([hemA[0] - 10, hemA[1] - 30 * K])}Z" fill="#8a7a9a" opacity=".9"/>`;

    // шарф (Марк): обмотка + хвост, углы сегментов из s.scarf (процедурная физика)
    let scarf = '';
    if (L.scarf) {
      const ang = s.scarf || [8, 12, 16];
      let p0 = [neck[0] + 14 * F, neck[1] + 28], pts = [p0];
      for (const a of ang) { const r = a * D2R * F; p0 = [p0[0] + Math.sin(r) * 24, p0[1] + Math.cos(r) * 24]; pts.push(p0); }
      scarf = `<path d="M${P([neck[0] - 40, neck[1] + 2])} Q${P([neck[0], neck[1] + 20])} ${P([neck[0] + 40, neck[1] + 2])} L${P([neck[0] + 38, neck[1] + 26])} Q${P([neck[0], neck[1] + 42])} ${P([neck[0] - 38, neck[1] + 26])}Z" fill="#ff8a2a"/>
        <path d="M${P([neck[0] - 38, neck[1] + 22])} Q${P([neck[0], neck[1] + 38])} ${P([neck[0] + 38, neck[1] + 22])}" stroke="#d8611c" stroke-width="5" fill="none" opacity=".7"/>
        <path d="M${pts.map(P).join(' L')}" stroke="#ff8a2a" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M${pts.slice(0, 3).map(P).join(' L')}" stroke="#d8611c" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6" transform="translate(5,0)"/>`;
    }

    // голова
    const hx = head[0], hy = head[1], tilt = s.headTilt || 0, k = K * HK / K * (kid ? 1 : 1);
    const S = (v) => (v * (kid ? 0.62 * 1.25 : 1)).toFixed(1); // размеры головы
    const hs = kid ? 0.78 : 1;
    const fx = 13 * T * F * hs + (s.lookX || 0) * .5, lx = (s.lookX || 0) * hs, ly = (s.lookY || 0) * hs;
    const blink = clamp01(s.blink || 0), eyeRy = Math.max(.7, 5.8 * (1 - blink)) * (kid ? 0.95 : 1);
    const brw = s.brows || 0, mo = clamp01(s.mouth || 0);
    const ex1 = hx + (-14 + fx) * hs, ex2 = hx + (14 + fx - (T * F > 0 ? 2 : 0)) * hs;
    const eW1 = 1 - (T * F < 0 ? .25 * T : 0), eW2 = 1 - (T * F > 0 ? .25 * T : 0);
    const H = (dx, dy) => `${(hx + dx * hs).toFixed(1)},${(hy + dy * hs).toFixed(1)}`;
    const jaw = L.female || kid ? 0.9 : 1;
    let hair = '';
    const hc = C.hair;
    if (L.hair === 'side') hair = `<path d="M${H(-44, -6)} Q${H(-48, -60)} ${H(-6 + 4 * T * F, -66)} Q${H(40, -70)} ${H(46, -28)} Q${H(46, -10)} ${H(42, -2)} Q${H(38, -28)} ${H(20 + 6 * T * F, -32)} Q${H(6 + 6 * T * F, -20)} ${H(-14 + 6 * T * F, -28)} Q${H(-30, -30)} ${H(-36, -10)}Z" fill="${hc}"/><path d="M${H(-6 + 4 * T * F, -66)} Q${H(22, -76 + (s.hairBounce || 0))} ${H(38, -56)} Q${H(26, -60)} ${H(14, -54)}Z" fill="${hc}"/>`;
    else if (L.hair === 'short') hair = `<path d="M${H(-44, -8)} Q${H(-46, -62)} ${H(0, -64)} Q${H(46, -62)} ${H(44, -8)} Q${H(36, -40)} ${H(0, -42)} Q${H(-36, -40)} ${H(-44, -8)}Z" fill="${hc}"/>`;
    else if (L.hair === 'grey') hair = `<path d="M${H(-44, -2)} Q${H(-48, -50)} ${H(-20, -56)} Q${H(0, -50)} ${H(20, -56)} Q${H(48, -50)} ${H(44, -2)} Q${H(40, -30)} ${H(26, -36)} Q${H(0, -26)} ${H(-26, -36)} Q${H(-40, -30)} ${H(-44, -2)}Z" fill="${hc}"/>`;
    else if (L.hair === 'bun') hair = `<circle cx="${(hx + (-6 - 10 * T * F) * hs).toFixed(1)}" cy="${(hy - 66 * hs).toFixed(1)}" r="${(20 * hs).toFixed(1)}" fill="${hc}"/><path d="M${H(-46, 20)} Q${H(-50, -60)} ${H(0, -62)} Q${H(50, -60)} ${H(46, 20)} Q${H(42, -24)} ${H(18 + 8 * T * F, -34)} Q${H(-10, -22)} ${H(-38, -24)} Q${H(-44, 0)} ${H(-46, 20)}Z" fill="${hc}"/>`;
    else if (L.hair === 'pigtails') hair = `<path d="M${H(-46, 0)} Q${H(-48, -60)} ${H(0, -60)} Q${H(48, -60)} ${H(46, 0)} Q${H(40, -32)} ${H(0, -34)} Q${H(-40, -32)} ${H(-46, 0)}Z" fill="${hc}"/>
      <ellipse cx="${(hx - 52 * hs).toFixed(1)}" cy="${(hy + 14 * hs + (s.hairBounce || 0) * .5).toFixed(1)}" rx="${(15 * hs).toFixed(1)}" ry="${(22 * hs).toFixed(1)}" fill="${hc}"/><ellipse cx="${(hx + 52 * hs).toFixed(1)}" cy="${(hy + 14 * hs + (s.hairBounce || 0) * .5).toFixed(1)}" rx="${(15 * hs).toFixed(1)}" ry="${(22 * hs).toFixed(1)}" fill="${hc}"/>`;
    else if (L.hair === 'beanie' || L.hair === 'helmet') hair = `<path d="M${H(-46, -10)} Q${H(-48, -74)} ${H(0, -74)} Q${H(48, -74)} ${H(46, -10)}Z" fill="${L.hatC}"/><rect x="${(hx - 48 * hs).toFixed(1)}" y="${(hy - 22 * hs).toFixed(1)}" width="${(96 * hs).toFixed(1)}" height="${(14 * hs).toFixed(1)}" rx="${(6 * hs).toFixed(1)}" fill="${shade(L.hatC, -.2)}"/>${L.hair === 'beanie' ? `<circle cx="${hx.toFixed(1)}" cy="${(hy - 76 * hs).toFixed(1)}" r="${(10 * hs).toFixed(1)}" fill="${shade(L.hatC, .1)}"/>` : ''}`;
    const face = `<g transform="rotate(${tilt.toFixed(2)} ${hx.toFixed(1)} ${(hy + 40 * hs).toFixed(1)})">
      <rect x="${(neck[0] - 13 * hs).toFixed(1)}" y="${(neck[1] - 16 * hs).toFixed(1)}" width="${(26 * hs).toFixed(1)}" height="${(28 * hs).toFixed(1)}" fill="${C.skin[1]}"/>
      <path d="M${H(-40, -14)} Q${H(-42, -50)} ${H(0, -52)} Q${H(42, -50)} ${H(40, -14)} L${H(38 * jaw - 4 * T * (F < 0), 26)} Q${H(34 * jaw + fx * .3, 54 * jaw)} ${H(fx * .4, 58 * jaw)} Q${H(-34 * jaw + fx * .3, 54 * jaw)} ${H(-38 * jaw + 4 * T * (F > 0), 26)}Z" fill="url(#${gid}s)"/>
      ${L.stubble ? `<path d="M${H(-37 + 6 * T * (F > 0), 24)} Q${H(-32 + fx * .3, 54)} ${H(fx * .4, 58)} Q${H(32 + fx * .3, 54)} ${H(37 - 6 * T * (F < 0), 24)} Q${H(18 + fx * .5, 40)} ${H(fx * .5, 40)} Q${H(-18 + fx * .5, 40)} ${H(-37 + 6 * T * (F > 0), 24)}Z" fill="#6b4a3a" opacity=".26"/>` : ''}
      <ellipse cx="${(hx - F * (41 - 10 * T) * hs).toFixed(1)}" cy="${(hy + 4 * hs).toFixed(1)}" rx="${((7 - 1.5 * T) * hs).toFixed(1)}" ry="${(12 * hs).toFixed(1)}" fill="${C.skin[1]}"/>
      ${hair}
      <ellipse cx="${(ex1 + lx).toFixed(1)}" cy="${(hy + ly).toFixed(1)}" rx="${(5.4 * eW1 * hs).toFixed(1)}" ry="${(eyeRy * hs).toFixed(1)}" fill="#15131c"/>
      <ellipse cx="${(ex2 + lx).toFixed(1)}" cy="${(hy + ly).toFixed(1)}" rx="${(5.4 * eW2 * hs).toFixed(1)}" ry="${(eyeRy * hs).toFixed(1)}" fill="#15131c"/>
      <path d="M${(ex1 - 12 * hs).toFixed(1)},${(hy - (16 + 2 * brw) * hs).toFixed(1)} L${(ex1 + 6 * hs).toFixed(1)},${(hy - (19 + 6 * brw) * hs).toFixed(1)}" stroke="${L.hair === 'grey' ? '#9a958e' : '#2a1b14'}" stroke-width="${((L.female || kid) ? 4 : 5.5) * hs}" stroke-linecap="round"/>
      <path d="M${(ex2 - 6 * hs).toFixed(1)},${(hy - (19 + 6 * brw) * hs).toFixed(1)} L${(ex2 + 12 * hs).toFixed(1)},${(hy - (16 + 2 * brw) * hs).toFixed(1)}" stroke="${L.hair === 'grey' ? '#9a958e' : '#2a1b14'}" stroke-width="${((L.female || kid) ? 4 : 5.5) * hs}" stroke-linecap="round"/>
      <path d="M${H(2 + fx * 1.2, 14)} q${((-3 + 2 * T * F) * hs).toFixed(1)},${(8 * hs).toFixed(1)} ${((2 + 2 * T * F) * hs).toFixed(1)},${(10 * hs).toFixed(1)}" stroke="${shade(C.skin[1], -.15)}" stroke-width="${3 * hs}" fill="none" stroke-linecap="round"/>
      ${L.moustache ? `<path d="M${H(-20 + fx, 28)} Q${H(fx, 20)} ${H(20 + fx, 28)} Q${H(fx, 34)} ${H(-20 + fx, 28)}Z" fill="#d6d2cc"/>` : ''}
      ${mo > .05 ? `<ellipse cx="${(hx + fx * 1.1 * hs).toFixed(1)}" cy="${(hy + 37 * hs).toFixed(1)}" rx="${((6 + 2 * mo) * hs).toFixed(1)}" ry="${((2 + 8 * mo) * hs).toFixed(1)}" fill="#4a2420"/>`
                 : `<path d="M${H(-8 + fx * 1.1, 36)} h${(16 * hs).toFixed(1)}" stroke="#8a5240" stroke-width="${3.5 * hs}" stroke-linecap="round"/>`}
      ${L.headlamp ? `<path d="M${H(-46, -26)} Q${H(0, -44)} ${H(46, -26)}" stroke="#222" stroke-width="${6 * hs}" fill="none"/><circle cx="${(hx + fx * hs).toFixed(1)}" cy="${(hy - 38 * hs).toFixed(1)}" r="${9 * hs}" fill="#fffbe0" filter="url(#glow)"/>` : ''}
      ${L.headphones ? `<path d="M${H(-36, 66)} Q${H(0, 96)} ${H(36, 66)}" stroke="#1a1a1a" stroke-width="${7 * hs}" fill="none"/><rect x="${(hx - 48 * hs).toFixed(1)}" y="${(hy + 56 * hs).toFixed(1)}" width="${(20 * hs).toFixed(1)}" height="${(24 * hs).toFixed(1)}" rx="${(6 * hs).toFixed(1)}" fill="#1a1a1a"/><rect x="${(hx + 28 * hs).toFixed(1)}" y="${(hy + 56 * hs).toFixed(1)}" width="${(20 * hs).toFixed(1)}" height="${(24 * hs).toFixed(1)}" rx="${(6 * hs).toFixed(1)}" fill="#1a1a1a"/>` : ''}
    </g>`;

    // аксессуары в руках
    let prop = '';
    const hand = nearIsA ? armA.ha : armB.ha, hand2 = nearIsA ? armB.ha : armA.ha;
    if (L.bunny && !s.noProp) { const h = s.bunnyHand === 'B' ? armB.ha : armA.ha; prop += `<g transform="translate(${h[0].toFixed(1)},${(h[1] + 6).toFixed(1)})"><ellipse rx="16" ry="20" fill="#ece5f2"/><ellipse cx="-7" cy="-30" rx="5" ry="16" fill="#ece5f2"/><ellipse cx="7" cy="-30" rx="5" ry="16" fill="#ece5f2"/><circle cx="-5" cy="-4" r="2" fill="#333"/><circle cx="5" cy="-4" r="2" fill="#333"/></g>`; }
    if (L.lantern && !s.noProp) { const h = armB.ha; prop += `<g transform="translate(${h[0].toFixed(1)},${(h[1] + 10).toFixed(1)})"><path d="M-10,0 h20 M0,0 v10" stroke="#222" stroke-width="3"/><rect x="-14" y="10" width="28" height="36" rx="6" fill="#3a3326"/><rect x="-9" y="15" width="18" height="24" rx="4" fill="#ffd27a" filter="url(#glow)"/></g>`; }

    const shadow = `<ellipse cx="${((footA[0] + footB[0]) / 2).toFixed(1)}" cy="4" rx="${(50 * K + Math.abs(footA[0] - footB[0]) / 2).toFixed(1)}" ry="${11 * K}" fill="#000" opacity=".45"/>`;
    const farArm = T > .3 ? armSvg(nearIsA ? sB : sA, nearIsA ? armB : armA, true) : '';
    const nearArms = T > .3 ? armSvg(nearIsA ? sA : sB, nearIsA ? armA : armB, false) : armSvg(sA, armA, false) + armSvg(sB, armB, false);
    const legs = T > .3 ? (nearIsA ? leg(legB, hipB, true, s.pitchB) + leg(legA, hipA, false, s.pitchA) : leg(legA, hipA, true, s.pitchA) + leg(legB, hipB, false, s.pitchB))
                        : leg(legA, hipA, false, s.pitchA) + leg(legB, hipB, false, s.pitchB);
    // предмет в руке: s.hold = phone|keys|cup|kettle|mat|bag|bandage|box|lantern2
    if (s.hold && !s.noProp) { const h = s.holdHand === 'A' ? armA.ha : s.holdHand === 'B' ? armB.ha : (s.turn || 0) > .3 ? hand : armB.ha, hx = h[0].toFixed(1), hy = h[1].toFixed(1), kk = K;
      const P = {
        phone: `<rect x="-11" y="-20" width="22" height="38" rx="5" fill="#15141f"/><rect x="-8" y="-16" width="16" height="28" rx="2" fill="${s.phoneOn === 0 ? '#22202e' : '#9fd4ff'}" ${s.phoneOn === 0 ? '' : 'filter="url(#glow)"'}/>`,
        keys: `<circle r="9" fill="none" stroke="#c9c2a8" stroke-width="3"/><path d="M4,6 l10,14 M8,14 l5,-3" stroke="#d8cf9c" stroke-width="4"/>`,
        cup: `<path d="M-14,-10 h28 l-4,30 h-20z" fill="#e8e2d6"/><path d="M14,-4 q12,4 0,14" stroke="#e8e2d6" stroke-width="4" fill="none"/>`,
        kettle: `<path d="M-26,0 q0,-30 26,-30 q26,0 26,30 v20 h-52z" fill="#b8c4cc"/><path d="M-14,-30 q14,-18 28,0" stroke="#333" stroke-width="5" fill="none"/><path d="M26,6 l22,-14" stroke="#b8c4cc" stroke-width="9"/>`,
        mat: `<rect x="-90" y="-26" width="180" height="52" rx="10" fill="#3d63b0"/><rect x="-90" y="-26" width="180" height="10" rx="5" fill="#5a82d0"/>`,
        bag: `<rect x="-24" y="0" width="48" height="56" rx="8" fill="#5a3b2a"/><path d="M-12,0 q12,-20 24,0" stroke="#3a2618" stroke-width="5" fill="none"/>`,
        bandage: `<rect x="-14" y="-10" width="28" height="22" rx="10" fill="#f2efe8"/><path d="M14,0 q30,10 40,40" stroke="#f2efe8" stroke-width="10" fill="none"/>`,
        box: `<rect x="-40" y="-34" width="80" height="60" rx="4" fill="#a8743f"/><path d="M-40,-14 h80" stroke="#8a5a2c" stroke-width="4"/>`,
        icon: `<rect x="-22" y="-30" width="44" height="56" rx="3" fill="#c9a24a"/><rect x="-15" y="-22" width="30" height="40" fill="#7a3a2a"/><circle cy="-8" r="8" fill="#f0c890"/>`,
        clipboard: `<rect x="-20" y="-28" width="40" height="54" rx="3" fill="#8a6a40"/><rect x="-15" y="-20" width="30" height="42" fill="#f2efe8"/><path d="M-10,-10 h20 M-10,0 h20 M-10,10 h14" stroke="#888" stroke-width="2"/>`,
        lantern2: `<path d="M-10,0 h20 M0,0 v10" stroke="#222" stroke-width="3"/><rect x="-14" y="10" width="28" height="36" rx="6" fill="#3a3326"/><rect x="-9" y="15" width="18" height="24" rx="4" fill="#ffd27a" filter="url(#glow)"/>`,
      }[s.hold] || '';
      prop += `<g transform="translate(${hx},${hy}) scale(${kk.toFixed(2)}) rotate(${(s.holdRot || 0).toFixed(1)})">${P}</g>`; }
    const body = s.handFront ? `${shadow}${farArm}${legs}${torso}${scarf}${face}${nearArms}${prop}` : `${shadow}${farArm}${legs}${torso}${scarf}${nearArms}${face}${prop}`;
    const sc = (s.sc || 1) * (L.size || 1);
    const lie = s.lie ? ` translate(0,${(300 * K).toFixed(1)}) rotate(${-84 * F} ${bx.toFixed(1)} ${hipY.toFixed(1)})` : '';
    const ghost = s.ghost ? ` filter="url(#ghost)"` : '';
    return `<g transform="translate(${(s.x || 0).toFixed(1)},${(s.y || 0).toFixed(1)}) scale(${sc.toFixed(3)})${lie}" opacity="${(s.alpha ?? 1).toFixed(2)}"${ghost}>${body}</g>`;
  }

  // ---------- СОБАКА (Граф) ----------
  function dog(s) {
    const F = s.facing || 1, t = s.t || 0, w = s.walk || 0;
    const ph = t * 2.2;
    const legs = [[-38, 0], [-22, .5], [30, .5], [46, 0]].map(([x, o], i) => {
      const a = w * 22 * Math.sin(2 * Math.PI * (ph + o));
      const far = i % 2;
      return `<path d="M${x},-52 l${(Math.sin(a * D2R) * 46).toFixed(1)},${(Math.cos(a * D2R) * 46).toFixed(1)}" stroke="${far ? '#a8541f' : '#c8692a'}" stroke-width="13" stroke-linecap="round"/>`;
    }).join('');
    const bark = s.bark ? Math.abs(Math.sin(t * 9)) : 0;
    const tail = (s.wag ? 25 * Math.sin(t * 14) : 8 * Math.sin(t * 2)) - 30;
    return `<g transform="translate(${s.x.toFixed(1)},${s.y.toFixed(1)}) scale(${(s.sc || 1) * F},${s.sc || 1})">
      <ellipse cx="0" cy="3" rx="70" ry="9" fill="#000" opacity=".4"/>${legs}
      <path d="M-56,-60 q-24,${(-10 + tail * .3).toFixed(1)} -30,${(-30 + tail * .2).toFixed(1)}" stroke="#c8692a" stroke-width="11" stroke-linecap="round" fill="none"/>
      <ellipse cx="0" cy="-66" rx="62" ry="28" fill="#d97a35"/><ellipse cx="-6" cy="-58" rx="50" ry="16" fill="#f0a35f" opacity=".5"/>
      <g transform="translate(58,${(-92 - bark * 4).toFixed(1)}) rotate(${(bark * -10).toFixed(1)})"><ellipse rx="28" ry="24" fill="#d97a35"/><ellipse cx="22" cy="10" rx="18" ry="12" fill="#e89a58"/><circle cx="36" cy="4" r="6" fill="#1a1412"/>
        <circle cx="8" cy="-6" r="4.5" fill="#1a1412"/><path d="M-14,-18 q-8,-14 4,-26 q8,10 6,24z" fill="#b85a20"/><path d="M8,-20 q14,4 10,30 q-12,-10 -14,-26z" fill="#a04e1c"/>
        ${bark > .3 ? `<path d="M30,16 q8,${(bark * 10).toFixed(1)} 22,2" stroke="#3a1a10" stroke-width="5" fill="none"/>` : ''}</g></g>`;
  }

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  root.RIG = { human, dog, LOOKS, extra, smoother, clamp01, lerp, hash, shade };
})(typeof window !== 'undefined' ? window : globalThis);
