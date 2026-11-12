// Тестовая сцена 8 с: квартира ночью → толчок → Марк пугается, поворачивается и идёт к двери → оглядывается.
// Всё детерминировано от номера кадра; физика шарфа и походка предрассчитаны последовательно.
(function (root) {
  const { mark, track, smoother, clamp01, DEFS } = root.RIG;
  const W = 1920, H = 1080, FPS = 30, N = 270;
  const T0 = 66;                           // кадр толчка
  const SC = 1.02, BASEY = 1000, X0 = 760; // масштаб и положение героя

  // ---- походка: вес ходьбы, фаза, смещение тела (интегрируем) ----
  const STRIDE = 92, PERIOD = 30;          // полный цикл ноги 1 с (2 шага/с)
  const walkW = f => clamp01((f - 132) / 12) * (1 - clamp01((f - 214) / 14));
  const phase = [0], bodyX = [0];
  for (let f = 1; f < N; f++) {
    const w = walkW(f);
    phase[f] = phase[f - 1] + w / PERIOD;
    bodyX[f] = bodyX[f - 1] + w * (2 * STRIDE / PERIOD);
  }
  // смещение стопы относительно таза в фазе φ: опора — едет назад (стоит в мире), перенос — вперёд по дуге
  const footRel = (ph) => {
    const u = ((ph % 1) + 1) % 1;
    if (u < .5) return { x: STRIDE / 2 - STRIDE * (u / .5), lift: 0, pitch: 0 };
    const v = (u - .5) / .5, e = smoother(v);
    return { x: -STRIDE / 2 + STRIDE * e, lift: Math.sin(Math.PI * v) * 34, pitch: v < .3 ? 28 * (v / .3) : 28 * (1 - (v - .3) / .7) - 6 * Math.sin(Math.PI * v) };
  };

  // ---- моргание: 4 кадра (½, закрыто, закрыто, ½) + двойное моргание после испуга ----
  const BLINKS = [24, 101, 108, 196, 252];
  const blinkAt = f => { for (const b of BLINKS) { const d = f - b; if (d >= 0 && d < 5) return [.5, 1, 1, .5, .1][d]; } return 0; };

  // ---- состояние героя по кадру (до физики шарфа) ----
  function pose(f) {
    const t = f / FPS, w = walkW(f), ph = phase[f];
    const turn = track([[0, 0], [116, 0], [132, .85], [236, .85], [250, .55]], f);
    const idle = 1 - w;
    // перенос веса в покое и дыхание (в испуге дыхание частое)
    const breathRate = f > T0 && f < 160 ? 1.7 : .3;
    let br = 0; for (let k = 0; k < f; k++) br += breathRate / FPS; const breath = Math.sin(2 * Math.PI * br);
    const sway = idle * 5 * Math.sin(2 * Math.PI * t / 4.2);
    // испуг: упреждение (присел) → вздрогнул вверх → оседание (follow-through)
    const crouch = track([[0, 0], [T0, 0], [T0 + 4, 14], [T0 + 9, -8], [T0 + 18, 6], [T0 + 30, 0]], f);
    const bob = w * 7 * Math.cos(4 * Math.PI * ph);              // таз ниже в момент постановки стопы
    const stopLean = track([[0, 0], [212, 0], [222, 5], [232, -2.5], [244, 0]], f); // по инерции вперёд и назад
    const lean = w * 5 + stopLean + track([[0, 0], [T0, 0], [T0 + 5, -4], [T0 + 20, 1.5], [T0 + 34, 0]], f);
    const hipX = X0 + bodyX[f] + sway;
    // стопы
    const standA = -24 + 12 * turn, standB = 24 - 6 * turn;
    const fa = footRel(ph), fb = footRel(ph + .5);
    const footA = [hipX - X0 + (idle * standA + w * (fa.x - 4)) + X0 - (hipX - X0) + (hipX - X0), -fa.lift * w];
    const footB = [hipX - X0 + (idle * standB + w * (fb.x + 8)) + X0 - (hipX - X0) + (hipX - X0), -fb.lift * w];
    // руки: в покое висят, в испуге прижаты, при ходьбе — в противофазе ногам с запаздыванием локтя
    const scare = track([[0, 0], [T0, 0], [T0 + 5, 1], [T0 + 40, .8], [128, .2], [150, 0]], f);
    const swing = w * 24 * Math.sin(2 * Math.PI * (ph + .02));
    // испуг — защитный жест: локти в стороны, кисти к груди (A слева, B справа на экране)
    const armA = -swing - 4 - scare * 18, armB = swing + 4 + scare * 18;
    const elbA = 12 + scare * 105 + w * (10 + 12 * Math.max(0, Math.sin(2 * Math.PI * (ph - .05)))),
          elbB = (12 + w * (10 + 12 * Math.max(0, -Math.sin(2 * Math.PI * (ph - .05))))) * (1 - scare) - scare * 105;
    // голова и взгляд (глаза ведут голову на 2 кадра)
    const lookX = track([[0, 0], [40, 0], [46, -3], [64, -3], [T0 + 3, -7], [96, -7], [100, 5], [114, 5], [124, 7], [222, 7], [228, -9], [262, -9]], f);
    const lookY = track([[0, 0], [T0 + 2, 0], [T0 + 6, -6], [96, -5], [104, 0], [262, 0]], f);
    const headLag = track([[0, 0], [T0 + 5, 0], [T0 + 9, -6], [96, -6], [102, 4], [114, 4], [124, 0], [226, 0], [234, -6], [262, -6]], f + 2 > 0 ? f - 2 : f);
    const headTilt = track([[0, 0], [T0 + 6, -5], [96, -4], [104, 3], [118, 0], [228, 0], [236, -7], [262, -6]], f) + w * 1.5 * Math.sin(4 * Math.PI * (ph - .08));
    const brows = track([[0, 0], [T0, 0], [T0 + 3, 1], [130, .7], [190, .45], [228, .45], [234, .9], [262, .8]], f);
    const mouth = track([[0, 0], [T0 + 1, 0], [T0 + 5, .85], [T0 + 16, .6], [T0 + 30, .1], [T0 + 40, 0], [230, 0], [234, .35], [244, .15]], f);
    return {
      x: 0, y: BASEY, sc: SC, facing: 1, turn, hipX, hipDY: crouch + bob, lean, breath,
      footA, footB, pitchA: w * fa.pitch, pitchB: w * fb.pitch,
      armA, armB, elbA, elbB, lookX, lookY, headDX: headLag, headTilt, brows, mouth, blink: blinkAt(f),
      hairBounce: -bob * .6 + crouch * .4,
    };
  }

  // ---- шарф: цепочка из 4 точек, Верле + ограничения длины, якорь — шея ----
  const SEG = 24, scarfFrames = [];
  {
    let pts = null, prev = null;
    for (let f = 0; f < N; f++) {
      const p = pose(f);
      const neck = [p.hipX + 10 * p.turn * 1.1, -490 + p.hipDY * .9 - 2 * p.breath];
      const anchor = [neck[0] + 14, neck[1] + 28];
      if (!pts) { pts = [0, 1, 2, 3].map(i => [anchor[0] + 4 * i, anchor[1] + SEG * i]); prev = pts.map(q => q.slice()); }
      const quake = f >= T0 && f < T0 + 44 ? 3.5 * Math.sin(f * 2.1) * (1 - (f - T0) / 44) : 0;
      for (let i = 1; i < 4; i++) {
        const vx = (pts[i][0] - prev[i][0]) * .9, vy = (pts[i][1] - prev[i][1]) * .9;
        prev[i] = pts[i].slice();
        pts[i][0] += vx + quake - .4 * walkW(f);   // встречный поток при ходьбе тянет хвост назад
        pts[i][1] += vy + 1.6;                     // гравитация
      }
      pts[0] = anchor.slice(); prev[0] = anchor.slice();
      for (let it = 0; it < 6; it++) for (let i = 1; i < 4; i++) {
        const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, k = (d - SEG) / d;
        if (i > 1) { a[0] += dx * k * .5; a[1] += dy * k * .5; b[0] -= dx * k * .5; b[1] -= dy * k * .5; }
        else { b[0] -= dx * k; b[1] -= dy * k; }
        if (b[1] < a[1] - 4) b[1] = a[1] - 4;     // не задирается вверх
      }
      pts[0] = anchor.slice();
      scarfFrames.push(pts.map(q => q.slice()));
    }
  }

  // ---- камера: наезд ~1 %/с + дрейф; толчок — kicks со сменой знака + низкочастотная качка ----
  function camera(f) {
    const t = f / FPS;
    let zoom = 1 + .010 * t + .035 * smoother((f - T0) / 20) * (1 - smoother((f - 130) / 60)); // ударный наезд на испуге
    let cx = 6 * t + .6 * Math.max(0, bodyX[f] - 0) * .55;   // ведём героя при ходьбе
    let cy = 0, roll = 0;
    for (const k of [T0, T0 + 9, T0 + 19, T0 + 31]) {
      const d = f - k;
      if (d >= 0 && d < 7) { const a = (k === T0 ? 12 : 8) * (1 - d / 7); cx += (d % 2 ? -a : a); cy += (d % 2 ? a : -a) * .6; }
    }
    if (f >= T0 && f < T0 + 45) { const e = 1 - (f - T0) / 45; cx += 6 * e * Math.sin(2 * Math.PI * 1.2 * (f - T0) / FPS); roll = 1.2 * e * Math.sin(2 * Math.PI * .9 * (f - T0) / FPS); }
    return { zoom, cx, cy, roll };
  }

  // ---- фон: многоплановая комната ----
  let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const DUST = Array.from({ length: 140 }, () => ({ x: 300 + rnd() * 1500, y0: -50 - rnd() * 400, v: 3 + rnd() * 5, r: .6 + rnd() * 2, o: .2 + rnd() * .5, ph: rnd() * 6 }));
  const layer = (z, cam, inner) => {
    const s = 1 + (cam.zoom - 1) / z, ox = -cam.cx / z, oy = -cam.cy / z;
    return `<g transform="translate(${W / 2 + ox},${H * .62 + oy}) rotate(${cam.roll / z}) scale(${s}) translate(${-W / 2},${-H * .62})">${inner}</g>`;
  };
  function frame(f) {
    const cam = camera(f), p = pose(f);
    p.scarf = scarfFrames[f];
    const lampA = f < T0 ? 0 : 16 * Math.exp(-(f - T0) / 70) * Math.sin(2 * Math.PI * (f - T0) / 34);
    const lit = f >= T0 + 2 && f < T0 + 5 ? .35 : 1;    // лампа моргает от толчка
    const dustOn = f > T0;
    const dust = dustOn ? DUST.map(d => { const y = d.y0 + d.v * (f - T0); return y > -20 && y < 1100 ? `<circle cx="${d.x + 6 * Math.sin(d.ph + f / 20)}" cy="${y}" r="${d.r}" fill="#d8cfee" opacity="${d.o}"/>` : ''; }).join('') : '';
    const crack = f > T0 + 10 ? `<path d="M520,110 L548,190 L530,250 L566,330 L540,410 L580,500" stroke="#07060f" stroke-width="7" fill="none" stroke-dasharray="520" stroke-dashoffset="${Math.max(0, 520 - (f - T0 - 10) * 40)}"/>` : '';
    const far = `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#wall)"/>
      <rect x="1220" y="170" width="460" height="400" rx="8" fill="url(#night)"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${1220 + i * 58}" y="${560 - (120 + (i * 53) % 190)}" width="52" height="${120 + (i * 53) % 190}" fill="#141a44"/>`).join('')}
      <rect x="1262" y="420" width="10" height="12" fill="#ffc372"/><rect x="1440" y="380" width="10" height="12" fill="#ffc372"/>
      <path d="M1220,170 h460 v400 h-460z M1450,170 v400 M1220,370 h460" stroke="#0c0b1c" stroke-width="16" fill="none"/>
      <rect x="1600" y="300" width="240" height="560" rx="6" fill="#16142c"/><circle cx="1625" cy="590" r="7" fill="#c9a24a"/>
      ${crack}
      <rect x="160" y="360" width="360" height="16" fill="#0f0d1e"/>
      ${['#6b3fa0', '#2f6f8f', '#a8483c', '#d0a24a', '#3d8a63'].map((c, i) => `<rect x="${180 + i * 40}" y="282" width="30" height="78" fill="${c}" transform="rotate(${f > T0 + 6 && i > 2 ? Math.min(28 + i * 6, (f - T0 - 6) * 4) : 0} ${195 + i * 40} 360)"/>`).join('')}
      <path d="M-200,820 H${W + 200} V${H + 300} H-200Z" fill="url(#floor)"/>
      <path d="M1220,570 L820,1080 L1620,1080 L1680,570Z" fill="#9fb4ff" opacity=".08"/>`;
    const lamp = `<g transform="rotate(${lampA} 960 -20)"><path d="M960,-20 L960,240" stroke="#0c0b1c" stroke-width="5"/>
      <path d="M938,240 h44 l30,56 h-104z" fill="#3c375f"/><circle cx="960" cy="298" r="18" fill="#fff2cf" opacity="${lit}" filter="url(#glow)"/>
      <ellipse cx="960" cy="420" rx="520" ry="440" fill="url(#lamp)" opacity="${lit}"/></g>`;
    const sofa = `<rect x="60" y="690" width="460" height="140" rx="22" fill="#2a2244"/><rect x="60" y="640" width="460" height="70" rx="22" fill="#352c55"/>`;
    const fg = `<rect x="-60" y="${-40}" width="120" height="${H + 80}" fill="#05040b" filter="url(#dof)"/><path d="M1850,1080 q40,-140 120,-200 v260z" fill="#06050d" filter="url(#dof)"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1a33"/><stop offset="1" stop-color="#2a2747"/></linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2338"/><stop offset="1" stop-color="#0d0a16"/></linearGradient>
      <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1236"/><stop offset="1" stop-color="#2c3a78"/></linearGradient>
      <radialGradient id="lamp" cx=".5" cy=".3" r=".5"><stop offset="0" stop-color="#ffd08a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd08a" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="#05040c" stop-opacity="0"/><stop offset="1" stop-color="#05040c" stop-opacity=".85"/></radialGradient>
      <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="dof" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="dofS"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
      ${layer(3, cam, `<g filter="url(#dofS)">${far}</g>`)}
      ${layer(2.2, cam, sofa)}
      ${layer(1, cam, lamp + mark(p) + dust)}
      ${layer(.55, cam, fg)}
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
    </svg>`;
  }
  root.SCENE = { frame, N, FPS, W, H };
})(typeof window !== 'undefined' ? window : globalThis);
