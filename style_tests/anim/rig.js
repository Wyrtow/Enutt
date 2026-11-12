// Риг Марка: 2D-скелет (суставы + IK ног + FK рук), лицо, шарф-цепочка с физикой.
// Чистые функции от состояния → SVG-строка. Используется и в браузере, и в Node.
(function (root) {
  const D2R = Math.PI / 180;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const smoother = u => { u = clamp01(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const lerp = (a, b, u) => a + (b - a) * u;
  // дорожка ключей [[кадр, значение], …] со smootherstep между ключами
  const track = (keys, f) => {
    if (f <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) {
      const [f0, v0] = keys[i - 1], [f1, v1] = keys[i];
      return lerp(v0, v1, smoother((f - f0) / (f1 - f0)));
    }
    return keys[keys.length - 1][1];
  };
  // двухзвенная IK: бедро H → щиколотка A, колено выгибается в сторону bend (+1 вправо / −1 влево)
  function ik2(H, A, L1, L2, bend) {
    let dx = A[0] - H[0], dy = A[1] - H[1], d = Math.hypot(dx, dy);
    const dm = L1 + L2 - 0.5;
    if (d > dm) { dx *= dm / d; dy *= dm / d; d = dm; A = [H[0] + dx, H[1] + dy]; }
    const a = Math.atan2(dy, dx);
    const c = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    const t = Math.acos(Math.max(-1, Math.min(1, c)));
    const k = a - bend * t;
    return { knee: [H[0] + L1 * Math.cos(k), H[1] + L1 * Math.sin(k)], ankle: A };
  }
  const P = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  const COL = {
    hood: '#2f5279', hoodHi: '#3f6a98', hoodLo: '#1c3350', hoodFar: '#22405f',
    jeans: '#262a42', jeansHi: '#353a5a', jeansFar: '#1b1e31',
    skin: '#f0c7a2', skinLo: '#d9a882', hair: '#2e2019', scarf: '#ff8a2a', scarfLo: '#d8611c',
    shoe: '#e4e0d8', shoeLo: '#b9b3a8', ink: '#15131c', brow: '#2a1b14',
  };

  // s — состояние позы (все в единицах персонажа, ноги на y=0, рост ~620)
  function mark(s) {
    const T = s.turn || 0, F = s.facing || 1;           // 0 — анфас, 1 — три четверти; F — куда смотрит
    const bx = s.hipX || 0, hipY = -312 + (s.hipDY || 0);
    const lean = (s.lean || 0) * D2R;
    const breath = s.breath || 0;
    const narrow = 1 - 0.33 * T, shift = 10 * T * F;
    // таз и плечи
    const hipA = [bx - 20 * narrow + shift * .3, hipY], hipB = [bx + 20 * narrow + shift * .3, hipY];
    const rot = (p, o, a) => { const c = Math.cos(a), sn = Math.sin(a), x = p[0] - o[0], y = p[1] - o[1]; return [o[0] + x * c - y * sn, o[1] + x * sn + y * c]; };
    const pelvis = [bx, hipY];
    const shY = -458 - 2 * breath + (s.hipDY || 0) * 0.9;
    let shA = [bx - 62 * narrow + shift, shY], shB = [bx + 62 * narrow + shift, shY];
    shA = rot(shA, pelvis, lean * F); shB = rot(shB, pelvis, lean * F);
    const neck = rot([bx + shift * 1.1, -490 - 2 * breath + (s.hipDY || 0) * 0.9], pelvis, lean * F);
    const head = [neck[0] + (s.headDX || 0), neck[1] - 64 + (s.headDY || 0)];

    // ноги (IK). Стопы задаются в мировых координатах персонажа
    const legA = ik2(hipA, s.footA, 152, 150, F >= 0 ? 1 : -1);
    const legB = ik2(hipB, s.footB, 152, 150, F >= 0 ? 1 : -1);
    // руки (FK): угол плеча (0 — вниз, + вперёд по F), сгиб локтя
    const arm = (sh, a, b) => {
      const A = a * D2R * F, B = (a + b) * D2R * F;
      const el = [sh[0] + Math.sin(A) * 92, sh[1] + Math.cos(A) * 92];
      const ha = [el[0] + Math.sin(B) * 86, el[1] + Math.cos(B) * 86];
      return { el, ha };
    };
    const armA = arm([shA[0] + 4, shA[1] + 10], s.armA || 0, s.elbA ?? 10);
    const armB = arm([shB[0] - 4, shB[1] + 10], s.armB || 0, s.elbB ?? 10);

    const leg = (L, far, pitch) => {
      const c = far ? COL.jeansFar : COL.jeans;
      const shoeLen = 30 + 20 * T, back = 14;
      const p = (pitch || 0) * D2R * F;
      const toe = [L.ankle[0] + Math.cos(p) * shoeLen * (T > .3 ? F : 1), L.ankle[1] + 4 + Math.sin(p) * shoeLen];
      const heel = [L.ankle[0] - Math.cos(p) * back * (T > .3 ? F : 1), L.ankle[1] + 4 - Math.sin(p) * back];
      const shoe = T > .3
        ? `<path d="M${P(heel)} L${P(toe)}" stroke="${far ? COL.shoeLo : COL.shoe}" stroke-width="20" stroke-linecap="round"/>`
        : `<path d="M${L.ankle[0] - 20},${L.ankle[1] + 4} L${L.ankle[0] + 20},${L.ankle[1] + 4}" stroke="${far ? COL.shoeLo : COL.shoe}" stroke-width="20" stroke-linecap="round"/>`;
      return `<path d="M${P(L === legA ? hipA : hipB)} L${P(L.knee)} L${P(L.ankle)}" stroke="${c}" stroke-width="33" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        ${far ? '' : `<path d="M${P([L.knee[0] - 7, L.knee[1] - 60])} L${P([L.knee[0] - 7, L.knee[1]])} L${P([L.ankle[0] - 6, L.ankle[1] - 20])}" stroke="${COL.jeansHi}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".55"/>`}
        ${shoe}`;
    };
    const armSvg = (sh, A, far) => `<path d="M${P(sh)} L${P(A.el)} L${P(A.ha)}" stroke="${far ? COL.hoodFar : COL.hood}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      ${far ? '' : `<path d="M${P([sh[0] - 6, sh[1] + 8])} L${P([A.el[0] - 6, A.el[1]])}" stroke="${COL.hoodHi}" stroke-width="6" stroke-linecap="round" opacity=".6"/>`}
      <circle cx="${A.ha[0].toFixed(1)}" cy="${A.ha[1].toFixed(1)}" r="15" fill="${far ? COL.skinLo : COL.skin}"/>`;

    // корпус (худи): дыхание чуть расширяет грудь
    const hemY = -296 + (s.hipDY || 0), w = narrow;
    const hemA = rot([bx - 56 * w + shift * .4, hemY], pelvis, lean * F * .3), hemB = rot([bx + 56 * w + shift * .4, hemY], pelvis, lean * F * .3);
    const chest = 1 + 0.015 * breath;
    const torso = `<path d="M${P(shA)} Q${P([neck[0], neck[1] - 14])} ${P(shB)}
        Q${P([shB[0] + 8 * chest * w, shB[1] + 60])} ${P([hemB[0] + 2, hemB[1] - 70])} L${P(hemB)}
        Q${P([bx + shift * .4, hemY + 12])} ${P(hemA)} L${P([hemA[0] - 2, hemA[1] - 70])}
        Q${P([shA[0] - 8 * chest * w, shA[1] + 60])} ${P(shA)}Z" fill="url(#mkHood)"/>
      <path d="M${P([shB[0] - 2, shB[1] + 6])} Q${P([shB[0] + 6, shB[1] + 70])} ${P([hemB[0], hemB[1] - 8])}" stroke="${s.rim || '#ffc98a'}" stroke-width="5" fill="none" opacity=".7"/>
      <rect x="${(hemA[0] + hemB[0]) / 2 - 22 - 6 * T * -F}" y="${hemY - 18}" width="${(hemB[0] - hemA[0]) + 4}" height="22" rx="10" fill="${COL.hoodLo}" transform="translate(${-((hemB[0] - hemA[0]) / 2) + 20},0)"/>
      <path d="M${P([bx - 32 * w + shift * .7, hemY - 82])} h${64 * w} l-6,40 h${-52 * w}z" fill="${COL.hoodLo}" opacity=".85"/>
      <path d="M${P([neck[0] - 40, neck[1] + 4])} Q${P([neck[0], neck[1] - 22])} ${P([neck[0] + 40, neck[1] + 4])} Q${P([neck[0] + 30, neck[1] + 22])} ${P([neck[0], neck[1] + 24])} Q${P([neck[0] - 30, neck[1] + 22])} ${P([neck[0] - 40, neck[1] + 4])}Z" fill="${COL.hoodLo}"/>`;

    // шарф: обмотка + хвост-цепочка из симуляции (точки в координатах персонажа)
    const sc = s.scarf || [[neck[0] + 14, neck[1] + 28], [neck[0] + 18, neck[1] + 52], [neck[0] + 22, neck[1] + 76], [neck[0] + 26, neck[1] + 100]];
    const scarf = `<path d="M${P([neck[0] - 40, neck[1] + 2])} Q${P([neck[0], neck[1] + 20])} ${P([neck[0] + 40, neck[1] + 2])} L${P([neck[0] + 38, neck[1] + 26])} Q${P([neck[0], neck[1] + 42])} ${P([neck[0] - 38, neck[1] + 26])}Z" fill="${COL.scarf}"/>
      <path d="M${P([neck[0] - 38, neck[1] + 22])} Q${P([neck[0], neck[1] + 38])} ${P([neck[0] + 38, neck[1] + 22])}" stroke="${COL.scarfLo}" stroke-width="5" fill="none" opacity=".7"/>
      <path d="M${P(sc[0])} L${P(sc[1])} L${P(sc[2])} L${P(sc[3])}" stroke="${COL.scarf}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${P(sc[0])} L${P(sc[1])} L${P(sc[2])}" stroke="${COL.scarfLo}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6" transform="translate(5,0)"/>`;

    // голова: черты сдвигаются при повороте, дальнее ухо исчезает
    const hx = head[0], hy = head[1], tilt = (s.headTilt || 0);
    const fx = 13 * T * F + (s.lookX || 0) * .5, lx = s.lookX || 0, ly = s.lookY || 0;
    const blink = clamp01(s.blink || 0), eyeRy = Math.max(.7, 5.8 * (1 - blink));
    const brw = s.brows || 0; // 0 спокойно, 1 тревога (внутренние концы вверх), −1 хмурится
    const mo = clamp01(s.mouth || 0);
    const ex1 = hx - 14 + fx, ex2 = hx + 14 + fx + (T * F > 0 ? -2 : 0);
    const eyeW1 = 1 - (T * F < 0 ? .25 * T : 0), eyeW2 = 1 - (T * F > 0 ? .25 * T : 0);
    const headSvg = `<g transform="rotate(${tilt.toFixed(2)} ${hx} ${hy + 40})">
      <rect x="${neck[0] - 13}" y="${neck[1] - 16}" width="26" height="28" fill="${COL.skinLo}"/>
      <path d="M${hx - 40},${hy - 14} Q${hx - 42},${hy - 50} ${hx},${hy - 52} Q${hx + 42},${hy - 50} ${hx + 40},${hy - 14} L${hx + 38 - 4 * T * (F < 0)},${hy + 26} Q${hx + 34 + fx * .3},${hy + 54} ${hx + fx * .4},${hy + 58} Q${hx - 34 + fx * .3},${hy + 54} ${hx - 38 + 4 * T * (F > 0)},${hy + 26}Z" fill="url(#mkSkin)"/>
      <path d="M${hx - 37 + 6 * T * (F > 0)},${hy + 24} Q${hx - 32 + fx * .3},${hy + 54} ${hx + fx * .4},${hy + 58} Q${hx + 32 + fx * .3},${hy + 54} ${hx + 37 - 6 * T * (F < 0)},${hy + 24} Q${hx + 18 + fx * .5},${hy + 40} ${hx + fx * .5},${hy + 40} Q${hx - 18 + fx * .5},${hy + 40} ${hx - 37 + 6 * T * (F > 0)},${hy + 24}Z" fill="#6b4a3a" opacity=".26"/>
      <ellipse cx="${hx - F * (41 - 10 * T)}" cy="${hy + 4}" rx="${7 - 1.5 * T}" ry="12" fill="${COL.skinLo}"/>
      ${T < .5 ? `<ellipse cx="${hx + F * 41}" cy="${hy + 4}" rx="${7 * (1 - 2 * T)}" ry="12" fill="${COL.skinLo}"/>` : ''}
      <path d="M${hx - 44},${hy - 6} Q${hx - 48},${hy - 60} ${hx - 6 + 4 * T * F},${hy - 66} Q${hx + 40},${hy - 70} ${hx + 46},${hy - 28} Q${hx + 46},${hy - 10} ${hx + 42},${hy - 2} Q${hx + 38},${hy - 28} ${hx + 20 + 6 * T * F},${hy - 32} Q${hx + 6 + 6 * T * F},${hy - 20} ${hx - 14 + 6 * T * F},${hy - 28} Q${hx - 30},${hy - 30} ${hx - 36},${hy - 10}Z" fill="${COL.hair}"/>
      <path d="M${hx - 6 + 4 * T * F},${hy - 66} Q${hx + 22},${hy - 76 + (s.hairBounce || 0)} ${hx + 38},${hy - 56} Q${hx + 26},${hy - 60} ${hx + 14},${hy - 54}Z" fill="${COL.hair}"/>
      <ellipse cx="${ex1 + lx}" cy="${hy + ly}" rx="${5.4 * eyeW1}" ry="${eyeRy}" fill="${COL.ink}"/>
      <ellipse cx="${ex2 + lx}" cy="${hy + ly}" rx="${5.4 * eyeW2}" ry="${eyeRy}" fill="${COL.ink}"/>
      <path d="M${ex1 - 12},${hy - 16 - 2 * brw} L${ex1 + 6},${hy - 19 - 6 * brw}" stroke="${COL.brow}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M${ex2 - 6},${hy - 19 - 6 * brw} L${ex2 + 12},${hy - 16 - 2 * brw}" stroke="${COL.brow}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M${hx + 2 + fx * 1.2},${hy + 14} q${-3 + 2 * T * F},8 ${2 + 2 * T * F},10" stroke="#b9876a" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${mo > .05 ? `<ellipse cx="${hx + fx * 1.1}" cy="${hy + 37}" rx="${6 + 2 * mo}" ry="${2 + 8 * mo}" fill="#4a2420"/>`
                 : `<path d="M${hx - 8 + fx * 1.1},${hy + 36} h16" stroke="#8a5240" stroke-width="3.5" stroke-linecap="round"/>`}
    </g>`;

    const shadow = `<ellipse cx="${(s.footA[0] + s.footB[0]) / 2}" cy="4" rx="${50 + Math.abs(s.footA[0] - s.footB[0]) / 2}" ry="11" fill="#000" opacity=".5"/>`;
    const nearIsA = !(T > .3 && F < 0); // при повороте вправо ближняя сторона — A (левая на экране)
    const farArm = T > .3 ? (nearIsA ? armSvg([shB[0] - 4, shB[1] + 10], armB, true) : armSvg([shA[0] + 4, shA[1] + 10], armA, true)) : '';
    const nearArms = T > .3 ? (nearIsA ? armSvg([shA[0] + 4, shA[1] + 10], armA, false) : armSvg([shB[0] - 4, shB[1] + 10], armB, false))
      : armSvg([shA[0] + 4, shA[1] + 10], armA, false) + armSvg([shB[0] - 4, shB[1] + 10], armB, false);
    const legs = T > .3
      ? (nearIsA ? leg(legB, true, s.pitchB) + leg(legA, false, s.pitchA) : leg(legA, true, s.pitchA) + leg(legB, false, s.pitchB))
      : leg(legA, false, s.pitchA) + leg(legB, false, s.pitchB);
    return `<g transform="translate(${s.x},${s.y}) scale(${s.sc})">${shadow}${farArm}${legs}${torso}${scarf}${nearArms}${headSvg}</g>`;
  }

  const DEFS = `
    <linearGradient id="mkHood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a5f86"/><stop offset=".55" stop-color="#2b4a6d"/><stop offset="1" stop-color="#1a2f4a"/></linearGradient>
    <linearGradient id="mkSkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d2b0"/><stop offset="1" stop-color="#d9a882"/></linearGradient>`;

  root.RIG = { mark, track, smoother, clamp01, lerp, DEFS };
})(typeof window !== 'undefined' ? window : globalThis);
