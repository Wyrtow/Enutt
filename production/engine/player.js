// Проигрыватель кадра (браузер). window.PLAYER.init(timeline), await window.PLAYER.frame(f).
// Камера multiplane: слой глубины d двигается/масштабируется в 1/d от камеры героя (d=1).
(function () {
  const { human, dog, smoother, clamp01, lerp, hash } = window.RIG;
  const W = 1920, H = 1080, BW = 2400, BH = 1350, CX = 1200, CY = 675, GROUND = 1035;
  let TL, stages = [], imgCache = {};
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; };
  const ih = (n) => { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967295; };
  const ease = (u, e) => { u = clamp01(u); if (e === 'lin') return u; if (e === 'soft') return .45 * u + .55 * (.5 - .5 * Math.cos(Math.PI * u)); return smoother(u); };

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
       <filter id="puff" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>
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
      if (l.name === 'fg' && shot.nofg) continue;
      const im = new Image(); im.src = (shot.dof && l.soft) ? l.soft : l.src; im.className = 'lay'; im.dataset.z = l.z; im.dataset.name = l.name;
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
    // «дыхание» камеры: очень медленные плавные колебания (не тряска)
    const tt = f / TL.fps;
    x += 2.2 * Math.sin(tt * 0.31) + .6 * Math.sin(tt * .73); y += 1.6 * Math.sin(tt * 0.27 + 1) + .5 * Math.sin(tt * .61); roll += 0.04 * Math.sin(tt * 0.19);
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
    // текущее действие: a._acts = [[кадр, act], ...] (смена по слову текста); у массовки — настроение (mood)
    let k = a.act;
    if (a._acts) for (const [fr, ac] of a._acts) if (f >= fr) k = ac;
    const kSince = a._acts ? (a._acts.filter(q => f >= q[0]).map(q => q[0]).pop() ?? shot.a) : shot.a, kt = (f - kSince) / fps, rin = smoother(clamp01(kt / .35));
    if (a.mood) {
      const MO = { panic: ['panic', 'shout', 'scared', 'grab_head', 'look_up', 'point', 'shout', 'panic'], chatter: ['talk', 'look_back', 'phone_look', 'idle', 'shrug', 'talk', 'point'], cold: ['shiver', 'idle', 'look_up', 'talk', 'shiver'], cheer: ['wave', 'idle', 'wave', 'talk'], work: ['carry', 'talk', 'point', 'carry'] }[a.mood] || ['idle'];
      const seg = 1.6 + hash(id + 'sg') * 1.6, si = Math.floor((t + ph0 * 3) / seg);
      if (!moving || a.mood === 'panic') k = MO[Math.floor(hash(id + 'm' + si) * MO.length)];
      if (moving && k === 'panic' && !run) k = 'idle';
      if (!moving && a.mood === 'panic') { s.hipX += 18 * Math.sin(t * .9 + ph0 * 6); s.footA[0] += 18 * Math.sin(t * .9 + ph0 * 6); s.footB[0] += 18 * Math.sin(t * .9 + ph0 * 6); }
    }
    // говорит без особого действия — жестикулирует
    const speaking = a.voice && (() => { const w = TL.subsAt(f); return w && w.v === a.voice && (w.q || a.voice !== 'MALE'); })();
    if (speaking && (!k || k === 'idle') && !walkW) k = 'talk';
    const tq = s.turn > .3; // ¾: жестовая рука — ближняя A; анфас — B
    const GA = (fa_, fb_, qa, qb, up = 1, lo = 1) => { if (tq) { s.armA = lerp(s.armA, qa, rin); s.elbA = lerp(s.elbA, qb, rin); } else { s.armB = lerp(s.armB, fa_, rin); s.elbB = lerp(s.elbB, fb_, rin); s.upB = lerp(1, up, rin); s.loB = lerp(1, lo, rin); } };
    if (k === 'scratch') { GA(160, 85 + 14 * Math.sin(t * 15), 165, 80 + 14 * Math.sin(t * 15)); s.handFront = 1; s.headTilt = 6 * rin; s.brows = .45; s.lookX = 5; s.lookY = -3; }
    if (k === 'phone') { GA(175, 105, 150, 120); s.handFront = 1; s.hold = 'phone'; s.phoneOn = 0; s.lookX = -5; s.brows = .5 + .2 * Math.sin(t * 2); }
    if (k === 'phone_look') { GA(-30, -120 + 6 * Math.sin(t * 9), 40, 100 + 5 * Math.sin(t * 9), .5, .7); s.hold = 'phone'; s.lookY = 8; s.headTilt = 5; }
    if (k === 'cry') { s.armA = lerp(s.armA, 50, rin); s.elbA = lerp(s.elbA, 125, rin); s.upA = .45; s.armB = lerp(s.armB, -50, rin); s.elbB = lerp(s.elbB, -125, rin); s.upB = .45; s.handFront = 1; s.headTilt = 8; s.lookY = 6; s.brows = 1; s.hipDY += 3 * Math.abs(Math.sin(t * 9)); }
    if (k === 'grab_head') { s.armA = -150; s.elbA = -110; s.armB = 150; s.elbB = 110; s.brows = 1; s.mouth = .5 + .3 * Math.abs(Math.sin(t * 5)); s.headTilt = 5 * Math.sin(t * 2.2); }
    if (k === 'panic') { s.armA = -150 + 22 * Math.sin(t * 8 + ph0); s.elbA = -20 + 20 * Math.sin(t * 11); s.armB = 150 + 22 * Math.sin(t * 8.6 + ph0 + 1); s.elbB = 20 + 20 * Math.sin(t * 10); s.mouth = .65 + .3 * Math.abs(Math.sin(t * 7)); s.brows = 1; s.hipDY += 6 * Math.abs(Math.sin(t * 6)); s.headTilt = 6 * Math.sin(t * 4); }
    if (k === 'talk') { const g = Math.sin(t * 1.9 + ph0), g2 = Math.sin(t * 2.7 + ph0 * 2); GA(28 + 18 * g, 70 + 28 * g2, 45 + 20 * g, 60 + 25 * g2); s.armA = tq ? s.armA : -8 + 10 * Math.sin(t * 1.3 + ph0); s.elbA = tq ? s.elbA : -20 - 20 * Math.max(0, g2); s.headTilt += 3 * Math.sin(t * 1.4 + ph0); s.brows = Math.max(s.brows, .3 + .2 * g); }
    if (k === 'shrug') { const c = Math.max(0, Math.sin(t * 2.2 + ph0)); s.armA = -35 * c - 4; s.elbA = -80 * c + 12; s.armB = 35 * c + 4; s.elbB = 80 * c + 12; s.brows = .6 * c; s.headTilt = 6 * c; }
    if (k === 'facepalm') { GA(130, 110, 140, 120); s.handFront = 1; s.headTilt = 8; s.lookY = 7; }
    if (k === 'knock') { const kn = Math.max(0, Math.sin(t * 15)) * (Math.sin(t * 2.4) > 0 ? 1 : 0); GA(80, 70 + 30 * kn, 80, 70 + 30 * kn); s.lean = 4; s.brows = .8; s.mouth = Math.max(s.mouth, .4 * kn); }
    if (k === 'push') { s.armA = 85; s.elbA = 5; s.armB = 90; s.elbB = 5; s.lean = 12 + 3 * Math.sin(t * 3); s.brows = 1; s.mouth = .3; }
    if (k === 'carry') { s.armA = 55; s.elbA = 40; s.armB = 60; s.elbB = 40; s.hold = s.hold || a.hold || 'box'; }
    if (k === 'bandage') { s.armA = 60 + 10 * Math.sin(t * 5); s.elbA = 50 + 18 * Math.cos(t * 5); s.armB = 70 + 8 * Math.cos(t * 5); s.elbB = 30 + 15 * Math.sin(t * 5); s.lean = 14; s.lookY = 8; s.hold = 'bandage'; s.brows = .6; }
    if (k === 'look_hands') { if (tq) { s.armA = 50; s.elbA = 60; s.armB = 60; s.elbB = 50; } else { s.armA = 30; s.elbA = 80; s.upA = .6; s.loA = .6; s.armB = -30; s.elbB = -80; s.upB = .6; s.loB = .6; } s.lookY = 9; s.headTilt = 4; s.brows = .7; }
    if (k === 'shiver') { s.armA = 40; s.elbA = 95; s.upA = .7; s.armB = -40; s.elbB = -95; s.upB = .7; s.hipX += 1.6 * Math.sin(t * 40); s.hipDY += 4; s.brows = .7; }
    if (k === 'nod') { s.headDY = 7 * Math.max(0, Math.sin(t * 5)); s.lookY = 4; }
    if (k === 'shake_head') { s.headDX = 6 * Math.sin(t * 7); s.lookX = 8 * Math.sin(t * 7); s.brows = .6; }
    if (k === 'dodge') { s.lean = -16; s.armA = -40; s.elbA = 130; s.armB = 40; s.elbB = -130; s.brows = 1; s.mouth = .5; s.hipX -= 30 * F * rin; }
    if (k === 'beckon') { GA(70 + 30 * Math.sin(t * 6), 70, 90 + 30 * Math.sin(t * 6), 60); s.mouth = Math.max(s.mouth, .5 + .3 * Math.abs(Math.sin(t * 6))); s.brows = .9; }
    if (k === 'wave_both') { s.armA = -150 + 25 * Math.sin(t * 6); s.elbA = -20; s.armB = 150 - 25 * Math.sin(t * 6); s.elbB = 20; s.mouth = .6; }
    if (k === 'point_up') { GA(165, 0, 160, 0); s.lookY = -9; }
    if (k === 'flail' || (run && a.flail)) { s.armA = -120 + 40 * Math.sin(t * 10); s.elbA = -40; s.armB = 120 + 40 * Math.sin(t * 11); s.elbB = 40; s.mouth = .7; s.brows = 1; }
    if (k === 'lantern_up') { s.armB = lerp(s.armB, 105, rin); s.elbB = lerp(s.elbB, -15, rin); s.lean = 3; }
    if (k === 'drink') { const sip = Math.max(0, Math.sin(t * 1.3 + ph0)); GA(lerp(-30, -40, sip), lerp(-120, -135, sip), lerp(40, 150, sip), lerp(100, 120, sip), .5, .7); s.hold = 'cup'; s.handFront = 1; s.lookY = 3 * sip; }
    if (k === 'put_cup') { const r = smoother(clamp01(kt / .8)); GA(lerp(-30, 40, r), lerp(-120, 30, r), lerp(40, 60, r), lerp(100, 20, r)); s.hold = r < .95 ? 'cup' : ''; s.lean = 6 * r; }
    if (k === 'heart') { GA(-30, -115, 30, 110, .5, .75); s.handFront = 1; s.brows = .8; s.lean = 4; s.headTilt = 4; s.hipDY += 4; }
    if (a.hold && !s.hold) s.hold = a.hold;
    if (a.noBunny && k !== 'holdup') s.noProp = 1;
    if (k === 'scared') { s.armA = -18; s.elbA = 105; s.armB = 18; s.elbB = -105; s.brows = 1; s.mouth = .5 + .2 * Math.sin(t * 3); s.hipDY = 6; }
    if (k === 'protect') { s.armA = -40; s.elbA = 130; s.armB = 40; s.elbB = -130; s.brows = .9; s.hipDY = 14; s.lean = -3; }
    if (k === 'reach') { const r = smoother(clamp01(lt / .6)); s.armB = lerp(4, 160, r) * (F > 0 ? 1 : 1); s.elbB = lerp(12, -10, r); s.lookY = -10; s.brows = .3; }
    if (k === 'panel') { const r = smoother(clamp01(lt / .5)); s.armA = lerp(-4, 70, r); s.elbA = lerp(12, 20, r); s.armB = lerp(4, 75, r); s.elbB = lerp(12, 15, r); s.lean = 6 * r; s.brows = .6 + .2 * Math.sin(t * 5); s.turn = .85; }
    if (k === 'point') { s.armB = 95; s.elbB = 0; }
    if (k === 'wave') { s.armB = 150 + 15 * Math.sin(t * 9); s.elbB = 20; }
    if (k === 'hold') { s.armB = 34; s.elbB = 20; }           // держит ребёнка за руку (рука вниз-вбок)
    if (k === 'holdup') { s.armB = 60; s.elbB = 10; s.lookY = -8; } // ребёнок тянет руку вверх
    if (k === 'sit' || k === 'kneel' || a.sitting || a.kneeling) { s.hipDY = a.sitDY !== undefined ? a.sitDY : (k === 'kneel' || a.kneeling) ? 140 : a.seatY !== undefined ? 312 - a.seatY - 18 : 120; s.footA = a.sitDY !== undefined ? [x + 70 * F, 0] : a.seatY !== undefined ? [x + 135 * F, 0] : [x - 20 + 70 * F, 0]; s.footB = a.sitDY !== undefined ? [x + 90 * F, 0] : a.seatY !== undefined ? [x + 165 * F, 0] : [x + 26 + 80 * F, 0]; s.turn = .85; }
    if (k === 'lie') { s.lie = 1; s.blink = a.awake ? s.blink : 1; s.mouth = 0; s.turn = .85; s.footA = [x - 26 * F, -14]; s.footB = [x - 6 * F, 0]; s.pitchA = 0; s.pitchB = 0; s.armA = -8; s.elbA = 20; s.armB = 6; s.elbB = 35; s.breath *= .5; }
    if (k === 'look_up') { s.lookY = -9; s.headTilt = -6 * F; s.brows = .7; }
    if (k === 'look_back') { s.lookX = -9 * F; s.headTilt = -5; s.turn = .6; }
    if (k === 'shout') { s.hipDY += 4 * Math.abs(Math.sin(t * 7)); s.mouth = .7 + .3 * Math.abs(Math.sin(t * 7)); s.brows = .9; s.armA = -30; s.elbA = 60; s.armB = 30; s.elbB = -60; }
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
    if (a._u !== undefined && f >= a._u) return '';
    const t = f / TL.fps;
    const qk = TL.quakes.reduce((m, q) => { const d = f - q.f; return d >= -2 && d < q.len * 3 ? Math.max(m, q.amp * Math.max(0, 1 - Math.max(0, d) / (q.len * 3))) : m; }, 0);
    if (a.prop === 'lamp') { const ang = (a.swing || 0) * Math.sin(t * 3.1) + qk * 1.4 * Math.sin(t * 3.4); const on = !(a.flick && hash('lf' + Math.floor(f / 2)) < Math.min(.5, qk / 30));
      return `<g transform="rotate(${ang.toFixed(2)} ${a.x0} 0)"><path d="M${a.x0},0 V${a.y}" stroke="#0c0b1c" stroke-width="5"/><path d="M${a.x0 - 24},${a.y} h48 l32,58 h-112z" fill="#3c375f"/>${on ? `<circle cx="${a.x0}" cy="${a.y + 62}" r="20" fill="#fff2cf" filter="url(#glow)"/><ellipse cx="${a.x0}" cy="${a.y + 220}" rx="620" ry="520" fill="url(#lampG)"/>` : ''}</g>`; }
    if (a.prop === 'glow') { if (a._f !== undefined && f < a._f) return ''; const v = a.pulse ? .5 + .5 * Math.sin(t * a.pulse) : 1; return `<circle cx="${a.x0}" cy="${a.y}" r="${a.r || 60}" fill="${a.c || '#ff3030'}" opacity="${(.5 * v).toFixed(2)}" filter="url(#glow)"/><circle cx="${a.x0}" cy="${a.y}" r="${(a.r || 60) * 4}" fill="${a.c || '#ff3030'}" opacity="${(.10 * v).toFixed(2)}"/>`; }
    if (a.prop === 'bolt') { const on = hash('bo' + Math.floor(f / 2)) < .7; return on ? `<path d="M${a.x0},${a.y} l${-20 + 40 * hash('a' + f)},40 l20,0 l-30,60" stroke="#bff0ff" stroke-width="5" fill="none" filter="url(#glow)"/>` : ''; }
    // ---- физика предметов: время от a._f (кадр начала, по слову текста) ----
    const t0 = a._f ?? shot.a, lt = (f - t0) / TL.fps, GRD = a.y1 ?? GROUND;
    const ITEM = (it, c) => ({
      book: `<rect x="-26" y="-9" width="52" height="18" rx="2" fill="${c || '#a8442e'}"/><rect x="-22" y="-6" width="44" height="3" fill="#f2e6cf" opacity=".7"/>`,
      cup: `<path d="M-12,-14 h24 l-3,26 h-18z" fill="#e8e2d6"/><path d="M12,-8 q10,4 0,12" stroke="#e8e2d6" stroke-width="3" fill="none"/>`,
      plate: `<ellipse rx="24" ry="6" fill="#ecebe6"/>`,
      frame: `<rect x="-26" y="-20" width="52" height="40" fill="#6a4a2e"/><rect x="-20" y="-14" width="40" height="28" fill="#8fb0c8"/>`,
      brick: `<rect x="-22" y="-10" width="44" height="20" fill="${c || '#8a5a44'}"/>`,
      plaster: `<path d="M-14,-8 l18,-4 l10,10 l-8,10 l-20,-2z" fill="${c || '#8c88a8'}"/>`,
      keys: `<circle r="8" fill="none" stroke="#c9c2a8" stroke-width="3"/><path d="M4,6 l9,12" stroke="#d8cf9c" stroke-width="4"/>`,
      bunny: `<ellipse rx="14" ry="17" fill="#ece5f2"/><ellipse cx="-6" cy="-25" rx="4" ry="13" fill="#ece5f2"/><ellipse cx="6" cy="-25" rx="4" ry="13" fill="#ece5f2"/>`,
      glass: `<path d="M-10,-12 l18,4 l-6,14z" fill="#bfe6ff" opacity=".7"/>`,
      kettle: `<path d="M-24,0 q0,-28 24,-28 q24,0 24,28 v18 h-48z" fill="#b8c4cc"/>`,
      ball: `<circle r="${a.r || 30}" fill="${c || '#e2742e'}"/><path d="M${-(a.r || 30)},0 h${2 * (a.r || 30)} M0,${-(a.r || 30)} v${2 * (a.r || 30)}" stroke="#2a1a14" stroke-width="3"/><path d="M${-(a.r || 30) * .7},${-(a.r || 30) * .7} q${(a.r || 30) * .7},${(a.r || 30) * .7} 0,${(a.r || 30) * 1.4}" stroke="#2a1a14" stroke-width="3" fill="none"/>`,
      snow: `<ellipse rx="22" ry="12" fill="#e6ecf8"/>`,
    }[it] || '');
    if (a.prop === 'fall') { // падение: n предметов с шагом gap с, с отскоком; до начала — лежат на полке (show)
      let out = ''; const n = a.n || 1;
      for (let i = 0; i < n; i++) {
        const sd = hash((a.id || 'f') + i), tt = lt - i * (a.gap ?? .22) - sd * .1, x00 = a.x0 + (i - (n - 1) / 2) * (a.dx ?? 50), y00 = a.y0 + (a.dy || 0) * i;
        const vx = (a.vx ?? 0) + (sd - .5) * 120, spin = (a.spin ?? 360) * (sd > .5 ? 1 : -1), g = 2600;
        const tl = Math.sqrt(2 * Math.max(1, GRD - y00) / g); let x, y, r;
        if (tt <= 0) { if (!a.show) continue; x = x00; y = y00; r = 0; }
        else if (tt < tl) { x = x00 + vx * tt; y = y00 + .5 * g * tt * tt; r = spin * tt; }
        else { const tb = tt - tl, b = Math.max(0, Math.sin(Math.min(tb, .3) / .3 * Math.PI)) * 30 * (a.bounce ?? 1); x = x00 + vx * tl + vx * .3 * Math.min(tb, .5); y = GRD - b - 6; r = spin * tl + spin * .2 * Math.min(tb, .4); r = Math.round(r / 180) * 180 * clamp01(tb * 3) + r * (1 - clamp01(tb * 3)); }
        out += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${a.sc || 1})">${ITEM(a.item || 'book', (a.cols || [])[i % (a.cols || [1]).length] || a.c)}</g>`;
      }
      return out;
    }
    if (a.prop === 'roll') { // мяч катится x0→x1 за len с, замедляясь, с подпрыгиваниями
      const R = a.r || 30, len = a.len || 3, u = clamp01(lt / len), e = 1 - Math.pow(1 - u, 2.2);
      const x = lt < 0 ? a.x0 : lerp(a.x0, a.x1, e), hop = Math.abs(Math.sin(lt * 7 + (a.ph || 0))) * 26 * (1 - u) * (a.hop ?? 1) * (lt > 0 ? 1 : 0);
      const y = (a.y ?? GROUND) - R - hop, rot = (x - a.x0) / R * 57.3;
      return `<ellipse cx="${x.toFixed(1)}" cy="${(a.y ?? GROUND) - 2}" rx="${R * .9}" ry="${R * .22}" fill="#000" opacity=".35"/><g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(1)})">${ITEM('ball', a.c)}</g>`;
    }
    if (a.prop === 'debris') { // сыплется штукатурка/пыль между x0 и x1 (пока толчок или всегда при always)
      let out = ''; const n = a.n || 10;
      for (let i = 0; i < n; i++) { const per = .9 + hash('dp' + i) * .9, ph = hash('dq' + i) * per, cyc = Math.floor((lt + ph) / per), tt = ((lt + ph) % per);
        if (lt < 0 || (!a.always && qk < 2 && cyc > 1)) continue;
        const x = a.x0 + (a.x1 - a.x0) * hash('dx' + i + 'c' + cyc), y = (a.y0 ?? 0) + .5 * 2400 * tt * tt; if (y > GRD) continue;
        out += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(tt * 400 * (hash('r' + i) - .5)).toFixed(0)}) scale(${(.5 + hash('s' + i) * .7).toFixed(2)})">${ITEM('plaster', a.c)}</g>`; }
      return out;
    }
    if (a.prop === 'car') { // машина сбоку; alarm — мигают фары/поворотники с a._f
      const C = a.c || '#d9dce4', on = a._f !== undefined && lt > 0 && Math.floor(lt * 3) % 2 === 0, x = a.x0, y = a.y ?? GROUND, sc = a.sc || 1, fl = a.facing || 1;
      const bounce = (on ? 2 * Math.sin(lt * 20) : 0) + qk * .4 * Math.sin(t * 17);
      const lite = (cx, cy) => on ? `<circle cx="${cx}" cy="${cy}" r="10" fill="#ffb52e" filter="url(#glow)"/><circle cx="${cx}" cy="${cy}" r="70" fill="#ffb52e" opacity=".18"/>` : `<circle cx="${cx}" cy="${cy}" r="8" fill="#6a5a30"/>`;
      return `<g transform="translate(${x},${(y + bounce).toFixed(1)}) scale(${sc * fl},${sc})"><ellipse cx="0" cy="0" rx="200" ry="14" fill="#000" opacity=".4"/>
        <path d="M-190,-40 v-50 q0,-14 14,-16 l60,-8 l50,-50 q10,-8 24,-8 h110 q16,0 26,10 l46,48 l40,6 q14,2 14,16 v52 z" fill="${C}"/>
        <path d="M-96,-118 l44,-44 h80 v44z M40,-118 v-44 h36 l40,44z" fill="#1d2440" opacity=".85"/>
        <rect x="-190" y="-48" width="380" height="10" fill="#000" opacity=".18"/>
        <circle cx="-110" cy="-34" r="34" fill="#121218"/><circle cx="-110" cy="-34" r="14" fill="#55586a"/><circle cx="110" cy="-34" r="34" fill="#121218"/><circle cx="110" cy="-34" r="14" fill="#55586a"/>
        ${a.stripe ? `<rect x="-190" y="-80" width="380" height="16" fill="${a.stripe}"/><rect x="-60" y="-178" width="80" height="16" rx="6" fill="#3a7aff" filter="url(#glow)" opacity="${Math.floor(t * 4) % 2 ? 1 : .3}"/><rect x="24" y="-178" width="40" height="16" rx="6" fill="#ff3a3a" filter="url(#glow)" opacity="${Math.floor(t * 4) % 2 ? .3 : 1}"/>` : ''}
        ${a.driver ? `<circle cx="80" cy="-136" r="20" fill="#2a2230"/><rect x="62" y="-118" width="38" height="30" fill="#c24d1c"/>` : ''}
        ${lite(188, -86)}${lite(-186, -86)}</g>`;
    }
    if (a.prop === 'crack') { // трещина растёт от x0 к x1
      const u = clamp01(lt / (a.len || 1.2)); if (u <= 0) return ''; let d = `M${a.x0},${a.y}`; const N = 14;
      for (let i = 1; i <= Math.ceil(N * u); i++) d += ` L${(a.x0 + (a.x1 - a.x0) * i / N).toFixed(0)},${(a.y + (hash('ck' + i) - .5) * (a.amp || 22)).toFixed(0)}`;
      return `<path d="${d}" stroke="${a.c || '#07060f'}" stroke-width="${a.w || 7}" fill="none" stroke-linejoin="bevel"/>${a.glow ? `<path d="${d}" stroke="#dff4ff" stroke-width="3" fill="none" filter="url(#glow)"/>` : ''}`;
    }
    if (a.prop === 'beam') { // луч фонаря из (x0,y0), качается вокруг угла ang
      const ang = (a.ang ?? 20) + (a.sweep ?? 12) * Math.sin(t * (a.spd ?? .9)), L = a.len || 900, w = a.w || 22, A = ang * Math.PI / 180;
      const ex = a.x0 + Math.cos(A) * L, ey = a.y0 + Math.sin(A) * L, nx = -Math.sin(A) * L * w / 100, ny = Math.cos(A) * L * w / 100;
      return `<path d="M${a.x0},${a.y0} L${(ex + nx).toFixed(0)},${(ey + ny).toFixed(0)} L${(ex - nx).toFixed(0)},${(ey - ny).toFixed(0)}Z" fill="#fff6d8" opacity=".16"/><circle cx="${a.x0}" cy="${a.y0}" r="10" fill="#fffbe0" filter="url(#glow)"/>`;
    }
    if (a.prop === 'boom') { // огненный шар растёт и гаснет
      if (lt < 0) return ''; const u = clamp01(lt / (a.len || 2.5)), r = (a.r || 260) * (1 - Math.pow(1 - Math.min(1, lt / .6), 3)), op = 1 - u;
      return `<circle cx="${a.x0}" cy="${a.y0}" r="${(r * 2.2).toFixed(0)}" fill="#ff7a2a" opacity="${(.25 * op).toFixed(2)}"/><circle cx="${a.x0}" cy="${a.y0}" r="${r.toFixed(0)}" fill="#ffb347" opacity="${(.9 * op).toFixed(2)}" filter="url(#glow)"/><circle cx="${a.x0}" cy="${a.y0 + r * .1}" r="${(r * .55).toFixed(0)}" fill="#fff1b8" opacity="${op.toFixed(2)}"/>`;
    }
    if (a.prop === 'streetlamp') { // фонарь: загорается в a._f (до этого тёмный), off — гаснет
      const on = a._f === undefined || lt >= 0, fl = on && lt < .25 ? (hash('sl' + f) < .5 ? .3 : 1) : 1, h = a.h || 520, x = a.x0, y = a.y ?? GROUND;
      return `<path d="M${x},${y} V${y - h} q0,-30 40,-34 h40" stroke="#14122a" stroke-width="12" fill="none"/><rect x="${x + 60}" y="${y - h - 46}" width="56" height="16" rx="6" fill="${on ? '#fff0d0' : '#3a3650'}" ${on ? 'filter="url(#glow)"' : ''} opacity="${fl}"/>${on ? `<path d="M${x + 66},${y - h - 32} L${x - 90},${y} H${x + 270} L${x + 110},${y - h - 32}Z" fill="#ffd08a" opacity="${(.13 * fl).toFixed(2)}"/><ellipse cx="${x + 90}" cy="${y}" rx="190" ry="26" fill="#ffd08a" opacity="${(.16 * fl).toFixed(2)}"/>` : ''}`;
    }
    if (a.prop === 'walllamp') { // лампа над подъездом: мигает в кадры a._bl, вспыхивает ярко с a._burst
      const x = a.x0, y = a.y0; let v = 1; for (const b of a._bl || []) { const d = f - b; if (d >= 0 && d < 6) v = d < 2 ? .15 : 1.6; }
      if (a._burst !== undefined && f >= a._burst) v = 2.6 + .4 * Math.sin(t * 30);
      return `<rect x="${x - 26}" y="${y - 12}" width="52" height="24" rx="8" fill="#2a2640"/><ellipse cx="${x}" cy="${y + 10}" rx="22" ry="12" fill="#fff4d6" opacity="${Math.min(1, v)}" filter="url(#glow)"/><ellipse cx="${x}" cy="${y + 200}" rx="${(380 * Math.min(1.5, v)).toFixed(0)}" ry="${(340 * Math.min(1.5, v)).toFixed(0)}" fill="url(#lampG)" opacity="${Math.min(1, .55 * v).toFixed(2)}"/>`;
    }
    if (a.prop === 'grate') { // чугунная решётка + пар
      const x = a.x0, y = a.y ?? GROUND - 6; let st = '';
      for (let i = 0; i < 7; i++) { const u = ((t * .35 + i / 7) % 1); st += `<circle cx="${(x + 30 * Math.sin(u * 6 + i)).toFixed(0)}" cy="${(y - 20 - u * 380).toFixed(0)}" r="${(30 + u * 90).toFixed(0)}" fill="#d8d4ec" opacity="${(.3 * (1 - u)).toFixed(2)}" filter="url(#puff)"/>`; }
      return `${st}<ellipse cx="${x}" cy="${y}" rx="${a.r || 120}" ry="${(a.r || 120) * .28}" fill="#1a1820" stroke="#4a4652" stroke-width="8"/><path d="M${x - 80},${y} h160 M${x},${y - 30} v60 M${x - 55},${y - 20} l110,40" stroke="#4a4652" stroke-width="6"/>`;
    }
    if (a.prop === 'pit') { // провал поля: растёт с a._f
      if (lt < 0) return ''; const u = clamp01(lt / (a.len || 2)), e = u < .35 ? u / .35 * .25 : .25 + .75 * smoother((u - .35) / .65), w = (a.w || 700) * e, y = a.y ?? GROUND + 40;
      let dust = ''; for (let i = 0; i < 9; i++) { const q = ((lt * .5 + i / 9) % 1); dust += `<circle cx="${(a.x0 + (hash('pd' + i) - .5) * w * 1.4).toFixed(0)}" cy="${(y - 40 - q * 420).toFixed(0)}" r="${(60 + q * 160).toFixed(0)}" fill="#eef0ff" opacity="${(.34 * (1 - q) * Math.min(1, lt)).toFixed(2)}" filter="url(#puff)"/>`; }
      return `<ellipse cx="${a.x0}" cy="${y}" rx="${w.toFixed(0)}" ry="${(w * .16).toFixed(0)}" fill="#05040a"/><ellipse cx="${a.x0}" cy="${y - w * .05}" rx="${(w * 1.04).toFixed(0)}" ry="${(w * .17).toFixed(0)}" fill="none" stroke="#e6ecf8" stroke-width="14" opacity=".8"/>${dust}`;
    }
    if (a.prop === 'mast') { // мачта прожектора: с a._f кренится и падает (угол fallDir)
      const u = a._f === undefined || lt < 0 ? 0 : smoother(clamp01(lt / (a.len || 1.6))), ang = (a.dir || 1) * 78 * u * u, x = a.x0, y = a.y ?? GROUND, h = a.h || 760;
      return `<g transform="rotate(${ang.toFixed(1)} ${x} ${y})"><path d="M${x},${y} V${y - h}" stroke="#2a2840" stroke-width="18"/><rect x="${x - 70}" y="${y - h - 40}" width="140" height="44" rx="6" fill="#3a3850"/><circle cx="${x - 35}" cy="${y - h - 18}" r="14" fill="#fff" filter="url(#glow)"/><circle cx="${x + 35}" cy="${y - h - 18}" r="14" fill="#fff" filter="url(#glow)"/><path d="M${x - 60},${y - h} L${x - 500},${y - h + 900} H${x + 500} L${x + 60},${y - h}Z" fill="#eef2ff" opacity=".08"/></g>`;
    }
    if (a.prop === 'alarmbox') { const on = a._f !== undefined && lt >= 0, bl = on && Math.floor(t * 3) % 2 === 0; const x = a.x0, y = a.y0;
      return `<rect x="${x - 50}" y="${y - 65}" width="100" height="130" rx="8" fill="#c8323a"/><rect x="${x - 36}" y="${y - 10}" width="72" height="56" rx="4" fill="#8a1a22"/><circle cx="${x}" cy="${y - 34}" r="18" fill="${bl ? '#ff5050' : '#5a1a1a'}" ${bl ? 'filter="url(#glow)"' : ''}/>${bl ? `<circle cx="${x}" cy="${y - 34}" r="160" fill="#ff3030" opacity=".18"/>` : ''}`; }
    if (a.prop === 'haze') { // марево газа: полупрозрачные волны
      let o = ''; for (let i = 0; i < 6; i++) { const u = ((t * .12 + i / 6) % 1), x = a.x0 + (a.x1 - a.x0) * hash('hz' + i), y = (a.y ?? GROUND) - u * (a.h || 300);
        o += `<ellipse cx="${(x + 40 * Math.sin(t + i)).toFixed(0)}" cy="${y.toFixed(0)}" rx="${(160 + 60 * Math.sin(t * .7 + i)).toFixed(0)}" ry="40" fill="${a.c || '#b8d8a0'}" opacity="${(.16 * Math.sin(Math.PI * u)).toFixed(2)}" filter="url(#puff)"/>`; } return o; }
    if (a.prop === 'block') { const y = a.y ?? GROUND, h = a.h || 90; return `<rect x="${a.x0}" y="${y - h}" width="${a.x1 - a.x0}" height="${h}" fill="${a.c || '#4a4868'}"/><rect x="${a.x0 - 8}" y="${y - h - 14}" width="${a.x1 - a.x0 + 16}" height="18" rx="4" fill="${a.top || '#dfe4f2'}"/><path d="M${a.x0 + (a.x1 - a.x0) / 3},${y - h} v${h} M${a.x0 + 2 * (a.x1 - a.x0) / 3},${y - h} v${h}" stroke="#000" stroke-opacity=".25" stroke-width="4"/>`; }
    if (a.prop === 'tape') { // лента оцепления
      let d = `M${a.x0},${a.y}`; for (let i = 1; i <= 10; i++) d += ` L${(a.x0 + (a.x1 - a.x0) * i / 10).toFixed(0)},${(a.y + 8 * Math.sin(i * 1.3 + t * 3) + 14 * Math.sin(Math.PI * i / 10)).toFixed(1)}`;
      return `<path d="M${a.x0},${a.y - 6} v${GROUND - a.y + 6} M${a.x1},${a.y - 6} v${GROUND - a.y + 6}" stroke="#2a2838" stroke-width="10"/><path d="${d}" stroke="#e8483a" stroke-width="12" fill="none" stroke-dasharray="40 26"/><path d="${d}" stroke="#f2f0ea" stroke-width="12" fill="none" stroke-dasharray="26 40" stroke-dashoffset="-40"/>`;
    }
    if (a.prop === 'stretcher') { // носилки, накрытые; едут x0→x1
      const u = clamp01(lt / (a.len || 6)), x = a.x1 !== undefined ? lerp(a.x0, a.x1, u) : a.x0, y = (a.y ?? GROUND) - 300;
      return `<g transform="translate(${x.toFixed(1)},${(y + 3 * Math.sin(t * 6)).toFixed(1)})"><rect x="-150" y="0" width="300" height="12" fill="#4a4a58"/><path d="M-140,0 q20,-46 140,-50 q120,4 140,50z" fill="#c9cdd8"/>${a.scarf ? `<path d="M-120,-4 q10,-20 30,-26 l10,30z" fill="#ff8a2a" filter="url(#glow)"/>` : ''}${a.hand ? `<path d="M60,4 q12,30 30,40" stroke="#c9cdd8" stroke-width="10" fill="none"/><circle cx="92" cy="46" r="9" fill="#e0b48f"/>` : ''}</g>`;
    }
    if (a.prop === 'doors') { // двустворчатая дверь открывается с a._f
      const u = smoother(clamp01(lt / .5)), w = a.w || 140, h = a.h || 300, x = a.x0, y = a.y ?? GROUND;
      return `<rect x="${x - w}" y="${y - h}" width="${2 * w}" height="${h}" fill="#ffe7b0" opacity="${(.85 * u).toFixed(2)}" filter="url(#glow)"/><rect x="${x - w}" y="${y - h}" width="${(w * (1 - .8 * u)).toFixed(1)}" height="${h}" fill="${a.c || '#6a5e4e'}"/><rect x="${(x + w - w * (1 - .8 * u)).toFixed(1)}" y="${y - h}" width="${(w * (1 - .8 * u)).toFixed(1)}" height="${h}" fill="${a.c || '#6a5e4e'}"/>`;
    }
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
