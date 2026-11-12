// Проигрыватель кадра (браузер). window.PLAYER.init(timeline), await window.PLAYER.frame(f).
// Камера multiplane: слой глубины d двигается/масштабируется в 1/d от камеры героя (d=1).
(function () {
  const { human, dog, smoother, clamp01, lerp, hash } = window.RIG;
  const W = 1920, H = 1080, BW = 2400, BH = 1350, CX = 1200, CY = 675, GROUND = 1035;
  let TL, stages = [], imgCache = {};
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; };
  const ih = (n) => { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967295; };
  const ease = (u, e) => e === 'lin' ? clamp01(u) : smoother(u);

  function init(tl) {
    TL = tl;
    // индексы времени
    TL.subsAt = (f) => { const w = TL.subs; let lo = 0, hi = w.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (w[m].ef <= f) lo = m + 1; else if (w[m].sf > f) hi = m - 1; else return w[m]; } return null; };
    TL.subChunkAt = (f) => TL.chunks.find(c => f >= c.a && f < c.b) || null;
    TL.shotsAt = (f) => {
      const i = TL.shots.findIndex(s => f >= s.a && f < s.b); if (i < 0) return [];
      const s = TL.shots[i], prev = TL.shots[i - 1], x = s.xin || 0;
      if (prev && x && f < s.a + x) { const a = (f - s.a + 1) / (x + 1); return [{ shot: prev, alpha: 1 }, { shot: s, alpha: a }]; }
      return [{ shot: s, alpha: 1 }];
    };
    TL.shots.forEach((s, i) => { s.i = i; });
    document.body.innerHTML = `<div id="root" style="position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#000"><div id="grade" style="position:absolute;inset:0;filter:brightness(1.12) saturate(.82) contrast(1.04)">
      <div id="sA" class="stage"></div><div id="sB" class="stage"></div>
      <canvas id="fx" width="${W}" height="${H}" style="position:absolute;inset:0"></canvas>
      <div id="tint" style="position:absolute;inset:0;pointer-events:none"></div></div>
      <div id="vig" style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%, rgba(5,4,12,0) 45%, rgba(5,4,12,.93) 100%)"></div>
      <div id="ui" style="position:absolute;inset:0"></div>
      <div id="black" style="position:absolute;inset:0;background:#000;opacity:0"></div>
      <div id="white" style="position:absolute;inset:0;background:#fff;opacity:0"></div></div>
      <svg width="0" height="0" style="position:absolute"><defs>
       <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
       <radialGradient id="lampG"><stop offset="0" stop-color="#ffd08a" stop-opacity=".38"/><stop offset=".5" stop-color="#ffd08a" stop-opacity=".12"/><stop offset="1" stop-color="#ffd08a" stop-opacity="0"/></radialGradient>
       <filter id="ghost" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" result="b"/><feColorMatrix in="b" values="0.6 0 0 0 .15  0 0.7 0 0 .2  0 0 1 0 .35  0 0 0 .8 0" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs></svg>`;
    const st = document.createElement('style');
    st.textContent = `.stage{position:absolute;inset:0;overflow:hidden} .lay{position:absolute;left:0;top:0;width:${BW}px;height:${BH}px;transform-origin:0 0;will-change:transform}
      .sub{position:absolute;left:0;right:0;bottom:70px;text-align:center;font:900 66px Inter;letter-spacing:1px;text-transform:uppercase;-webkit-text-stroke:12px #05040c;paint-order:stroke fill}
      .sub span{padding:0 10px} .pill{position:absolute;left:50%;top:56px;transform-origin:50% 50%;padding:14px 46px;border-radius:999px;font:900 42px Inter;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.45)}
      .card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#05040c;color:#fff}
      .card .n{font:800 34px Inter;letter-spacing:12px;color:#ff8a2a}.card .t{font:900 96px Inter;letter-spacing:4px;margin-top:10px}.card .l{width:0;height:6px;background:#ff8a2a;margin-top:26px;border-radius:3px}`;
    document.head.appendChild(st);
  }
  function stageFor(i) { return document.getElementById(i ? 'sB' : 'sA'); }
  async function ensureStage(el, shot) {
    if (el.dataset.key === shot.key) return;
    el.dataset.key = shot.key; el.innerHTML = '';
    const B = TL.bgs[shot.bg];
    for (const l of B.layers) {
      const im = new Image(); im.src = l.src; im.className = 'lay'; im.dataset.z = l.z; im.dataset.name = l.name;
      el.appendChild(im);
      if (l.name === 'hero') { const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.setAttribute('class', 'lay chars'); sv.setAttribute('viewBox', `0 0 ${BW} ${BH}`); sv.dataset.z = 1; el.appendChild(sv); }
    }
    if (!el.querySelector('.chars')) { const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.setAttribute('class', 'lay chars'); sv.setAttribute('viewBox', `0 0 ${BW} ${BH}`); sv.dataset.z = 1; const fg = el.querySelector('[data-name=fg]'); el.insertBefore(sv, fg || null); }
    await Promise.all([...el.querySelectorAll('img')].map(im => im.decode().catch(() => {})));
  }

  // ---------- КАМЕРА ----------
  function camAt(shot, f) {
    const u = (f - shot.a) / Math.max(1, shot.b - shot.a), c = shot.cam;
    const e = ease(u, c.ease);
    let x = lerp(c.from[0], c.to[0], e), y = lerp(c.from[1], c.to[1], e), z = lerp(c.from[2], c.to[2], e), roll = lerp(c.from[3] || 0, c.to[3] || 0, e);
    // толчки: смена знака каждый кадр, затухание 7 кадров; землетрясение — серия + низкочастотная качка
    for (const q of TL.quakes) {
      const d = f - q.f;
      if (d >= 0 && d < q.len) {
        const amp = q.amp * (1 - d / q.len);
        const kick = (d % 2 ? -1 : 1) * amp * (d < 7 ? (1 - d / 7) : 0.25);
        x += kick + amp * .8 * Math.sin(d * 0.9); y += kick * .6 + amp * .5 * Math.cos(d * 1.3); roll += amp * .06 * Math.sin(d * .7);
      }
    }
    return { x, y, z, roll };
  }
  function layerTransform(cam, d) {
    const zl = 1 + (cam.z - 1) / d, cx = CX + (cam.x - CX) / d, cy = CY + (cam.y - CY) / d;
    return `translate(${(W / 2 - cx * zl).toFixed(2)}px,${(H / 2 - cy * zl).toFixed(2)}px) scale(${zl.toFixed(4)}) rotate(${(cam.roll / d).toFixed(3)}deg)`;
  }

  // ---------- АКТЁРЫ ----------
  const STRIDE = 92;
  function actorState(a, f, shot) {
    const fps = TL.fps, t = f / fps, lt = (f - shot.a) / fps, span = (shot.b - shot.a) / fps;
    const id = a.id || a.who, ph0 = hash(id) * 10;
    const look = a.who === 'extra' ? window.RIG.extra(a.seed || id) : (a.look || a.who);
    const u = clamp01((f - (a.fa ?? shot.a)) / Math.max(1, (a.fb ?? shot.b) - (a.fa ?? shot.a)));
    const moving = a.x1 !== undefined && a.x1 !== a.x0;
    const xe = moving ? (a.act === 'run' ? clamp01(u) : smoother(u)) : 0;
    const x = moving ? lerp(a.x0, a.x1, xe) : a.x0;
    const F = a.facing || (moving ? Math.sign(a.x1 - a.x0) : 1);
    const run = a.act === 'run';
    const vel = moving ? Math.abs(a.x1 - a.x0) / Math.max(.5, ((a.fb ?? shot.b) - (a.fa ?? shot.a)) / fps) : 0;
    const walkW = moving && u > 0 && u < 1 ? clamp01(Math.min(u, 1 - u) * 8) : 0;
    const dist = Math.abs(x - a.x0);
    const ph = dist / (2 * STRIDE * (run ? 1.5 : 1)) + ph0;
    const breathRate = (a.act === 'scared' || run) ? 1.6 : .3;
    const breath = Math.sin(2 * Math.PI * (t * breathRate + ph0));
    const sway = (1 - walkW) * 4 * Math.sin(2 * Math.PI * (t / 4.2 + ph0));
    // моргание: каждые 2,4–4,6 с по хэшу
    const bp = 2.4 + hash(id + 'b') * 2.2, bt = ((t + ph0) % bp) * fps;
    const blink = bt < 5 ? [.5, 1, 1, .5, .1][Math.floor(bt)] : 0;
    // саккады взгляда
    const sacc = Math.floor((t + ph0) / 1.7), lookX = (a.lookX ?? 0) + (hash(id + sacc) - .5) * 4, lookY = (a.lookY ?? 0);
    const turn = a.turn ?? (moving ? .85 : 0);
    const footRel = (p) => { const v = ((p % 1) + 1) % 1; if (v < .5) return { x: STRIDE / 2 - STRIDE * (v / .5), l: 0, pt: 0 }; const w = (v - .5) / .5, e = smoother(w); return { x: -STRIDE / 2 + STRIDE * e, l: Math.sin(Math.PI * w) * (run ? 50 : 32), pt: w < .3 ? 28 * w / .3 : 28 * (1 - (w - .3) / .7) }; };
    const fa = footRel(ph), fb = footRel(ph + .5);
    const standA = -24 + 12 * turn, standB = 24 - 6 * turn;
    let s = { id, look, x: 0, y: a.y ?? GROUND, sc: a.sc || 1, facing: F, turn, hipX: x + sway, hipDY: 0, lean: 0, breath,
      footA: [x + sway + (walkW ? fa.x * F - 4 : standA), -fa.l * walkW], footB: [x + sway + (walkW ? fb.x * F + 8 : standB), -fb.l * walkW], pitchA: fa.pt * walkW, pitchB: fb.pt * walkW,
      armA: -4, armB: 4, elbA: 12, elbB: 12, lookX, lookY, brows: a.brows ?? 0, mouth: 0, blink, headTilt: 0, hairBounce: 0, alpha: a.alpha ?? 1, ghost: a.ghost };
    if (walkW) {
      const bob = (run ? 12 : 7) * walkW * Math.cos(4 * Math.PI * ph);
      s.hipDY = bob; s.lean = (run ? 14 : 5) * walkW; s.hairBounce = -bob * .6;
      const sw = (run ? 34 : 24) * walkW * Math.sin(2 * Math.PI * ph);
      s.armA = -sw; s.armB = sw; s.elbA = 14 + (run ? 70 : 12) * walkW; s.elbB = 14 + (run ? 70 : 12) * walkW;
      s.headTilt = 1.5 * Math.sin(4 * Math.PI * (ph - .08));
    }
    const k = a.act;
    if (k === 'scared') { s.armA = -18; s.elbA = 105; s.armB = 18; s.elbB = -105; s.brows = 1; s.mouth = .5 + .2 * Math.sin(t * 3); s.hipDY = 6; }
    if (k === 'protect') { s.armA = -40; s.elbA = 130; s.armB = 40; s.elbB = -130; s.brows = .9; s.hipDY = 14; s.lean = -3; }
    if (k === 'reach') { const r = smoother(clamp01(lt / .6)); s.armB = lerp(4, 160, r) * (F > 0 ? 1 : 1); s.elbB = lerp(12, -10, r); s.lookY = -10; s.brows = .3; }
    if (k === 'panel') { const r = smoother(clamp01(lt / .5)); s.armA = lerp(-4, 70, r); s.elbA = lerp(12, 20, r); s.armB = lerp(4, 75, r); s.elbB = lerp(12, 15, r); s.lean = 6 * r; s.brows = .6 + .2 * Math.sin(t * 5); s.turn = .85; }
    if (k === 'point') { s.armB = 95; s.elbB = 0; }
    if (k === 'wave') { s.armB = 150 + 15 * Math.sin(t * 9); s.elbB = 20; }
    if (k === 'hold') { s.armB = 34; s.elbB = 20; }           // держит ребёнка за руку (рука вниз-вбок)
    if (k === 'holdup') { s.armB = 60; s.elbB = 10; s.lookY = -8; } // ребёнок тянет руку вверх
    if (k === 'sit' || k === 'kneel') { s.hipDY = k === 'sit' ? 120 : 140; s.footA = [x - 20 + 70 * F, 0]; s.footB = [x + 26 + 80 * F, 0]; s.turn = .85; }
    if (k === 'lie') { s.lie = 1; s.blink = 1; s.mouth = 0; }
    if (k === 'look_up') { s.lookY = -9; s.headTilt = -6 * F; s.brows = .7; }
    if (k === 'look_back') { s.lookX = -9 * F; s.headTilt = -5; s.turn = .6; }
    if (k === 'shout') { s.mouth = .7 + .3 * Math.abs(Math.sin(t * 7)); s.brows = .9; s.armA = -30; s.elbA = 60; s.armB = 30; s.elbB = -60; }
    if (k === 'cover_eyes') { s.armB = 150; s.elbB = 40; }
    // губы: если в этом кадре звучит реплика голосом актёра
    if (a.voice) { const w = TL.subsAt(f); if (w && w.v === a.voice && (w.q || a.voice !== 'MALE')) { const p = (f - w.sf) / Math.max(1, w.ef - w.sf); s.mouth = Math.max(s.mouth, .25 + .55 * Math.abs(Math.sin(p * Math.PI * Math.max(1, w.w.length / 2.5)))); } }
    // шарф Марка: процедурная «физика»: базовое провисание + раскачка от ходьбы/ветра/толчков
    const qk = TL.quakes.reduce((m, q) => { const d = f - q.f; return d >= 0 && d < q.len ? Math.max(m, q.amp * (1 - d / q.len)) : m; }, 0);
    const wind = 6 * Math.sin(t * 1.3 + ph0) + qk * .9 * Math.sin(t * 13);
    const back = walkW * (run ? 55 : 25);
    s.scarf = [8 + wind * .4 - back * .6, 12 + wind * .7 - back * .9, 16 + wind - back];
    s.rim = TL.shots[shot.i].rim;
    return s;
  }

  // ---------- ЧАСТИЦЫ ----------
  function particles(ctx, shot, f, cam) {
    const fx = shot.fx || {}, t = f / TL.fps;
    ctx.clearRect(0, 0, W, H);
    if (fx.snow) for (let i = 0; i < fx.snow; i++) {
      const r1 = ih(i * 7 + 1), r2 = ih(i * 13 + 5), depth = .4 + r1 * 1.6;
      const sp = 40 + 60 / depth, x = ((r2 * W * 1.4 + t * 18 * depth + Math.sin(t * .7 + i) * 20 - (cam.x - CX) / depth) % (W * 1.2)) - W * .1;
      const y = ((r1 * H * 1.3 + t * sp) % (H * 1.15)) - H * .1;
      ctx.globalAlpha = Math.min(1, .25 + .5 / depth); ctx.fillStyle = '#e6e2ff';
      ctx.beginPath(); ctx.arc(x, y, (1 + 2.2 / depth) * (fx.snowBig ? 1.5 : 1), 0, 7); ctx.fill();
    }
    if (fx.dust) { const d0 = fx.dustFrom ?? shot.a; if (f >= d0) for (let i = 0; i < 160; i++) { const r = ih(i * 17 + 3), r2 = ih(i * 29 + 11); const y = -40 + ((f - d0) / TL.fps) * (60 + r * 120) - r2 * 300; if (y < -10 || y > H) continue; ctx.globalAlpha = .25 + r * .4; ctx.fillStyle = '#d8cfee'; ctx.beginPath(); ctx.arc(r2 * W + Math.sin(t * 2 + i) * 6, y, .8 + r * 2, 0, 7); ctx.fill(); } }
    if (fx.sparks) for (let i = 0; i < 26; i++) { const r = ih(i * 31 + 7), life = ((t * 1.6 + r) % 1); const sx = fx.sparks[0] + Math.cos(r * 9) * life * 160, sy = fx.sparks[1] - Math.sin(r * 5 + 1) * life * 140 + life * life * 200; ctx.globalAlpha = 1 - life; ctx.fillStyle = r < .5 ? '#9fe8ff' : '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, 7); ctx.fill(); }
    if (fx.embers) for (let i = 0; i < 60; i++) { const r = ih(i * 37 + 9), life = ((t * .5 + r) % 1); ctx.globalAlpha = (1 - life) * .8; ctx.fillStyle = '#ffb35a'; ctx.beginPath(); ctx.arc(r * W + Math.sin(t + i) * 30, H - life * H * 1.1, 2 + r * 2, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // ---------- ГРАФИКА ПОВЕРХ ----------
  function ui(f) {
    let h = '';
    const pill = TL.pills.find(p => f >= p.a && f < p.b);
    if (pill) { const u = (f - pill.a) / 6, out = (pill.b - f) / 6, sc = Math.min(1, smoother(clamp01(u))) * Math.min(1, clamp01(out) * 0 + 1); const op = Math.min(clamp01(u), clamp01(out));
      const C = { red: ['#e5383b', '#fff'], yellow: ['#f2c230', '#1a1426'], green: ['#2fb36a', '#fff'], blue: ['#3a6fd8', '#fff'] }[pill.color] || ['#fff', '#111'];
      h += `<div class="pill" style="background:${C[0]};color:${C[1]};opacity:${op.toFixed(2)};transform:translateX(-50%) scale(${(.8 + .2 * sc).toFixed(3)}) rotate(${pill.tilt || 0}deg)">${pill.text}</div>`; }
    const sub = TL.subChunkAt(f);
    if (sub) h += `<div class="sub">${sub.words.map(w => `<span style="color:${f >= w.ef ? '#fff' : f >= w.sf ? '#ffc93a' : '#8b8a99'}">${w.w}</span>`).join('')}</div>`;
    const card = TL.cards.find(c => f >= c.a && f < c.b);
    if (card) { const u = (f - card.a) / (card.b - card.a), op = Math.min(clamp01(u * 8), clamp01((1 - u) * 6));
      h += `<div class="card" style="opacity:${op.toFixed(2)}"><div class="n">СЕРИЯ ${card.num}</div><div class="t">${card.title}</div><div class="l" style="width:${(smoother(clamp01(u * 2)) * 420).toFixed(0)}px"></div></div>`; }
    for (const ins of TL.inserts) if (f >= ins.a && f < ins.b) h += insertHtml(ins, f);
    document.getElementById('ui').innerHTML = h;
  }
  function insertHtml(ins, f) {
    const u = clamp01((f - ins.a) / 8), op = Math.min(u, clamp01((ins.b - f) / 8));
    const box = (inner, w = 520) => `<div style="position:absolute;right:120px;top:200px;width:${w}px;opacity:${op};transform:translateY(${((1 - u) * 30).toFixed(1)}px)">${inner}</div>`;
    if (ins.type === 'phone') return box(`<div style="background:#0b0a16;border-radius:46px;padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.6)"><div style="background:linear-gradient(#1a1838,#2a2652);border-radius:30px;height:640px;color:#fff;font-family:Inter;text-align:center;padding-top:70px">
      <div style="font:200 120px Inter">${ins.time}</div><div style="font:600 30px Inter;opacity:.7;margin-top:8px">${ins.sub || 'нет сети'}</div>
      ${ins.vm ? `<div style="margin:70px 30px 0;background:rgba(255,255,255,.12);border-radius:22px;padding:22px;text-align:left;font:700 30px Inter">🎤 Вика · голосовое<div style="font:500 26px Inter;opacity:.8;margin-top:8px">${ins.vm}</div></div>` : ''}</div></div>`, 360);
    if (ins.type === 'clock') return `<div style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) scale(${(.9 + .1 * u).toFixed(3)});opacity:${op};background:#0b0a16;border-radius:30px;padding:30px 70px;font:900 180px Inter;color:#ff4d4d;text-shadow:0 0 40px #ff3030">${ins.text}</div>`;
    if (ins.type === 'choice') return `<div style="position:absolute;left:0;right:0;top:40%;display:flex;justify-content:center;gap:60px;opacity:${op}">${ins.opts.map((o, i) => `<div style="background:${i ? '#e5383b' : '#3a6fd8'};color:#fff;font:900 52px Inter;padding:26px 50px;border-radius:24px;box-shadow:0 20px 50px rgba(0,0,0,.5)">${i ? '' : '← '}${o}${i ? ' →' : ''}</div>`).join('<div style="font:900 60px Inter;color:#fff;align-self:center">или</div>')}</div>`;
    if (ins.type === 'plan') return `<div style="position:absolute;left:110px;top:200px;opacity:${op};font-family:Inter">${ins.items.map((it, i) => { const on = f >= ins.a + i * ins.step; return `<div style="display:flex;align-items:center;gap:22px;margin:18px 0;font:800 44px Inter;color:${on ? '#fff' : '#77758c'}"><div style="width:58px;height:58px;border-radius:50%;background:${on ? '#2fb36a' : '#2a2840'};display:flex;align-items:center;justify-content:center">${on ? '✓' : i + 1}</div>${it}</div>`; }).join('')}</div>`;
    if (ins.type === 'timer') return `<div style="position:absolute;left:70px;top:60px;opacity:${op};font:900 56px Inter;color:#fff;background:rgba(10,8,20,.7);border:3px solid #e5383b;border-radius:20px;padding:12px 30px">⏱ ${ins.text}</div>`;
    if (ins.type === 'tablet') return box(`<div style="background:#1a1d24;border-radius:24px;padding:30px;font:700 40px Inter;color:#e8e8f0;box-shadow:0 30px 80px rgba(0,0,0,.6)">Спасатель · запись<div style="height:3px;background:#3a3d48;margin:20px 0"></div><span style="color:#ff6a5a">${ins.text}</span></div>`, 640);
    if (ins.type === 'logo') return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:${op};background:radial-gradient(#1a1838,#05040c)"><div style="font:900 120px Inter;color:#fff;letter-spacing:8px">ОДИН ГЕРОЙ</div><div style="width:${(smoother(u) * 520).toFixed(0)}px;height:10px;background:#ff8a2a;border-radius:5px;margin-top:20px"></div><div style="font:600 36px Inter;color:#b8b4d8;margin-top:24px">Один герой. Бесконечное количество миров.</div></div>`;
    return '';
  }

  // ---------- КАДР ----------
  async function frame(f) {
    const act = TL.shotsAt(f); // [{shot, alpha}]
    for (let i = 0; i < 2; i++) {
      const el = stageFor(i), it = act[i];
      if (!it) { el.style.opacity = 0; continue; }
      await ensureStage(el, it.shot);
      el.style.opacity = it.alpha;
      const cam = camAt(it.shot, f);
      for (const l of el.querySelectorAll('.lay')) l.style.transform = layerTransform(cam, +l.dataset.z);
      const sv = el.querySelector('.chars');
      sv.innerHTML = it.shot.cast.map(a => a.prop ? propSvg(a, f, it.shot) : a.dog ? dog(dogState(a, f, it.shot)) : human(actorState(a, f, it.shot))).join('') + (it.shot.overlay || '');
      if (i === 0) { particles(document.getElementById('fx').getContext('2d'), it.shot, f, cam); fxOverlay(it.shot, f); }
    }
    ui(f);
    const blk = TL.blacks.reduce((m, b) => f >= b.a && f < b.b ? Math.max(m, Math.min(1, (f - b.a) / Math.max(1, b.fin), (b.b - f) / Math.max(1, b.fout))) : m, 0);
    document.getElementById('black').style.opacity = blk.toFixed(3);
    const wh = TL.flashes.reduce((m, b) => f >= b && f < b + 6 ? Math.max(m, 1 - (f - b) / 6) : m, 0);
    document.getElementById('white').style.opacity = wh.toFixed(3);
  }
  function propSvg(a, f, shot) {
    const t = f / TL.fps;
    const qk = TL.quakes.reduce((m, q) => { const d = f - q.f; return d >= -2 && d < q.len * 3 ? Math.max(m, q.amp * Math.max(0, 1 - Math.max(0, d) / (q.len * 3))) : m; }, 0);
    if (a.prop === 'lamp') { const ang = (a.swing || 0) * Math.sin(t * 3.1) + qk * 1.4 * Math.sin(t * 3.4); const on = !(a.flick && hash('lf' + Math.floor(f / 2)) < Math.min(.5, qk / 30));
      return `<g transform="rotate(${ang.toFixed(2)} ${a.x0} 0)"><path d="M${a.x0},0 V${a.y}" stroke="#0c0b1c" stroke-width="5"/><path d="M${a.x0 - 24},${a.y} h48 l32,58 h-112z" fill="#3c375f"/>${on ? `<circle cx="${a.x0}" cy="${a.y + 62}" r="20" fill="#fff2cf" filter="url(#glow)"/><ellipse cx="${a.x0}" cy="${a.y + 220}" rx="620" ry="520" fill="url(#lampG)"/>` : ''}</g>`; }
    if (a.prop === 'glow') { const v = a.pulse ? .5 + .5 * Math.sin(t * a.pulse) : 1; return `<circle cx="${a.x0}" cy="${a.y}" r="${a.r || 60}" fill="${a.c || '#ff3030'}" opacity="${(.5 * v).toFixed(2)}" filter="url(#glow)"/><circle cx="${a.x0}" cy="${a.y}" r="${(a.r || 60) * 4}" fill="${a.c || '#ff3030'}" opacity="${(.10 * v).toFixed(2)}"/>`; }
    if (a.prop === 'bolt') { const on = hash('bo' + Math.floor(f / 2)) < .7; return on ? `<path d="M${a.x0},${a.y} l${-20 + 40 * hash('a' + f)},40 l20,0 l-30,60" stroke="#bff0ff" stroke-width="5" fill="none" filter="url(#glow)"/>` : ''; }
    return '';
  }
  function dogState(a, f, shot) {
    const u = clamp01((f - shot.a) / Math.max(1, shot.b - shot.a)), x = a.x1 !== undefined ? lerp(a.x0, a.x1, smoother(u)) : a.x0;
    return { x, y: a.y ?? GROUND, sc: a.sc || .9, facing: a.facing || 1, t: f / TL.fps, walk: a.x1 !== undefined ? 1 : 0, bark: a.bark, wag: a.wag };
  }
  function fxOverlay(shot, f) {
    const fx = shot.fx || {}, t = f / TL.fps; let bg = 'none';
    if (fx.alarm) bg = `rgba(255,30,30,${(.10 + .10 * Math.max(0, Math.sin(t * 6))).toFixed(3)})`;
    if (fx.fire) bg = `radial-gradient(ellipse at 60% 70%, rgba(255,120,40,${(.22 + .06 * Math.sin(t * 9)).toFixed(3)}), rgba(0,0,0,0) 70%)`;
    if (fx.dawn) bg = `linear-gradient(rgba(255,190,140,.10), rgba(0,0,0,0))`;
    if (fx.flicker) { const v = hash('fl' + Math.floor(f / 3)); bg = `rgba(0,0,0,${v < .25 ? .45 : 0})`; }
    document.getElementById('tint').style.background = bg;
  }

  window.PLAYER = { init, frame };
})();
