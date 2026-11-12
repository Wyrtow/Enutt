// Сборка таймлайна серии: script.md (сцены, плашки, карточки) + audio/epN.timing.json (слова) + scenes.js (визуал).
// node build.js <videoDir> <ep>  →  <videoDir>/build/epN.timeline.json, <videoDir>/build/epN.voice.wav (с паузами под карточки)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const crypto = require('crypto');
const [, , VD, EPS] = process.argv; const EP = +EPS, FPS = 30;
const SC = require(path.resolve(VD, 'scenes.js'));
const timing = JSON.parse(fs.readFileSync(path.join(VD, `audio/ep${EP}.timing.json`), 'utf8'));
const out = path.join(VD, 'build'); fs.mkdirSync(out, { recursive: true });

// ---- 1. сцены серии из script.md ----
const lines = fs.readFileSync(path.join(VD, 'script.md'), 'utf8').split('\n');
let ep = 0; const scenes = [];
for (const ln of lines) {
  if (ln.startsWith('## СЕРИЯ')) { ep++; continue; }
  if (ep !== EP) continue;
  const m = ln.match(/^> СЦЕНА (\S+) \|(.*)$/); if (!m) continue;
  const id = m[1], body = m[2];
  const pills = [...body.matchAll(/плашк[аи] (красная|жёлтая|зелёная|синяя|синие|красные)[^«]*«([^»]+)»/g)].map(x => ({ color: { 'красная': 'red', 'красные': 'red', 'жёлтая': 'yellow', 'зелёная': 'green', 'синяя': 'blue', 'синие': 'blue' }[x[1]], text: x[2] }));
  const multi = body.match(/плашки синие по очереди: (.*?)\|/); if (multi) { pills.length = 0; for (const x of multi[1].matchAll(/«([^»]+)»/g)) pills.push({ color: 'blue', text: x[1] }); }
  const card = body.match(/карточка «СЕРИЯ (\d) · ([^»]+)»/);
  scenes.push({ id, desc: body, pills, card: card ? { num: +card[1], title: card[2] } : null });
}
// ---- 2. время сцен по словам ----
const words = timing.words;
for (const s of scenes) { const w = words.filter(x => x.scene === s.id); if (w.length) { s.t0 = w[0].s; s.t1 = w[w.length - 1].e; } }
// ---- 3. немые сцены: место + вставка тишины ----
const ins = []; // {at, dur}
const DUR = (s) => (SC[s.id] && SC[s.id].dur) || (s.card ? 2.8 : 1.6);
for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i]; if (s.t0 !== undefined) continue;
  const prevEnd = i ? (scenes.slice(0, i).reverse().find(x => x.t1 !== undefined) || { t1: 0 }).t1 + 0.15 : 0;
  const next = scenes.slice(i + 1).find(x => x.t0 !== undefined);
  const nextStart = next ? next.t0 - 0.1 : timing.duration;
  const need = DUR(s);
  // группа подряд идущих немых сцен делит одну паузу
  let j = i; while (j + 1 < scenes.length && scenes[j + 1].t0 === undefined) j++;
  const group = scenes.slice(i, j + 1), total = group.reduce((a, g) => a + DUR(g), 0);
  const gap = Math.max(0, nextStart - prevEnd);
  if (total > gap) ins.push({ at: i === 0 ? 0 : prevEnd, dur: +(total - gap).toFixed(3) });
  let t = i === 0 ? 0 : prevEnd;
  for (const g of group) { g.t0 = t; g.t1 = t + DUR(g); g.silent = true; t += DUR(g); }
  i = j;
}
const shift = (t) => t + ins.filter(x => x.at <= t + 1e-6).reduce((a, x) => a + x.dur, 0);
// немые сцены уже посчитаны в «новом» времени относительно своей паузы: сдвигаем только вставки ДО их начала
for (const s of scenes) { if (s.silent) { const before = ins.filter(x => x.at < s.t0 - 1e-6).reduce((a, x) => a + x.dur, 0); s.t0 += before; s.t1 += before; } else { s.t0 = shift(s.t0); s.t1 = shift(s.t1); } }
const tail = SC._tail ?? 1.2;
const dur = shift(timing.duration) + tail;
// ---- 4. звук серии со вставками ----
const wavIn = path.join(VD, `audio/ep${EP}.wav`), wavOut = path.join(out, `ep${EP}.voice.wav`);
{
  const pts = ins.slice().sort((a, b) => a.at - b.at); let flt = [], prev = 0, k = 0, labels = [];
  for (const p of pts) { flt.push(`[0:a]atrim=${prev}:${p.at},asetpts=PTS-STARTPTS[a${k}]`); labels.push(`[a${k}]`); flt.push(`anullsrc=r=48000:cl=mono,atrim=0:${p.dur}[z${k}]`); labels.push(`[z${k}]`); prev = p.at; k++; }
  flt.push(`[0:a]atrim=${prev},asetpts=PTS-STARTPTS[a${k}]`); labels.push(`[a${k}]`);
  flt.push(`anullsrc=r=48000:cl=mono,atrim=0:${tail}[tl]`); labels.push('[tl]');
  flt.push(`${labels.join('')}concat=n=${labels.length}:v=0:a=1[o]`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', wavIn, '-filter_complex', flt.join(';'), '-map', '[o]', '-ar', '48000', '-ac', '1', wavOut]);
}
// ---- 5. планы (шоты) ----
const F = (t) => Math.round(t * FPS);
const bgs = {}, shots = [], pills = [], cards = [], inserts = [], blacks = [], flashes = [], quakes = [];
const bgKey = (loc, opt) => { const k = loc + '_' + crypto.createHash('md5').update(JSON.stringify(opt)).digest('hex').slice(0, 8); bgs[k] = { loc, opt }; return k; };
const GROUND = 1035;
// границы фраз: смена плана — только на конце предложения/паузе (по тексту), ±3.2 с
const sentEnds = []; for (let i = 0; i < words.length; i++) { const w = words[i], nx = words[i + 1]; const gap = nx ? nx.s - w.e : 9; if (/[.!?…]["»]?$/.test(w.w) || gap > .45) sentEnds.push(F(shift(w.e) + Math.min(.25, gap / 2))); }
const snapB = (f, a, b) => { if (f <= a || f >= b) return f; let best = f, bd = F(3.2); for (const e of sentEnds) { const d = Math.abs(e - f); if (d < bd && e - a >= F(2.5) && b - e >= F(2.5)) { bd = d; best = e; } } return best; };
const FR = { wide: [1.0, 1.05], med: [1.38, 1.46], close: [1.85, 1.95], xwide: [0.92, 0.98] };
for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i], c = SC[s.id] || {};
  const a = F(s.t0), b = i + 1 < scenes.length ? F(scenes[i + 1].t0) : F(dur);
  if (s.card) { cards.push({ a, b, num: s.card.num, title: s.card.title }); }
  s.pills.forEach((p, k) => { const pa = a + F(.25) + k * F(1.6), pb = Math.min(b - 2, pa + F(s.pills.length > 1 ? 1.5 : 3.4)); pills.push({ a: pa, b: pb, ...p, tilt: c.tilt || (p.color === 'yellow' ? -2 : 0) }); });
  for (const x of c.inserts || []) inserts.push({ ...x, a: a + F(x.at || 0), b: x.len ? a + F((x.at || 0) + x.len) : b });
  for (const q of c.quakes || []) quakes.push({ f: a + F(q.at), len: F(q.len || 1.4), amp: q.amp || 14 });
  for (const fl of c.flashes || []) flashes.push(a + F(fl));
  if (c.black) blacks.push({ a: a + F(c.black.at || 0), b: c.black.to !== undefined ? a + F(c.black.to) : b, fin: F(c.black.fin ?? .3), fout: F(c.black.fout ?? .3) });
  if (!c.loc) continue;
  const key0 = bgKey(c.loc, c.opt || {});
  // разбиение на планы ~6–10 с, кадрировка по кругу
  const plan = c.shots || null, durS = (b - a) / FPS; const lastCast = {};
  let P = plan ? plan.map(q => ({ ...q })) : Array.from({ length: Math.max(1, Math.round(durS / (c.shotLen || 9))) }, () => ({}));
  const wsum0 = P.reduce((x, q) => x + (q.w || 1), 0); let acc = 0;
  P.forEach(q => { q._a = snapB(a + Math.round((b - a) * acc / wsum0), a, b); acc += (q.w || 1); q._b = snapB(a + Math.round((b - a) * acc / wsum0), a, b); });
  P[0]._a = a; P[P.length - 1]._b = b; for (let j = 1; j < P.length; j++) P[j]._a = P[j - 1]._b;
  // склейки не чаще, чем раз в MIN с: короткий план сливаем с соседом (остаётся более «весомый»)
  const MIN = F(c.minShot || 6);
  while (P.length > 1) {
    let j = -1, sh = 1e9; P.forEach((q, i) => { const L = q._b - q._a; if (L < MIN && L < sh) { sh = L; j = i; } }); if (j < 0) break;
    const nb = j === 0 ? 1 : j === P.length - 1 ? j - 1 : ((P[j - 1]._b - P[j - 1]._a) <= (P[j + 1]._b - P[j + 1]._a) ? j - 1 : j + 1);
    const lo = Math.min(j, nb), hi = Math.max(j, nb), keep = (P[j].w || 1) > (P[nb].w || 1) ? P[j] : P[nb];
    if (P[j].cast && !keep.cast && (P[j].loc || c.loc) === (keep.loc || c.loc)) keep.cast = P[j].cast;
    const m = { ...keep, _a: P[lo]._a, _b: P[hi]._b }; P.splice(lo, 2, m);
  }
  const n = P.length;
  for (let k = 0; k < n; k++) {
    const sa = P[k]._a, sb = P[k]._b;
    const p = P[k];
    const frame = p.frame || (c.frames || ['wide', 'med', 'close', 'med'])[k % (c.frames || [1, 2, 3, 4]).length] || 'wide';
    const locK = p.loc || c.loc; const cast = (p.cast || (plan ? lastCast[locK] : null) || c.cast || []).map(x => ({ ...x })); if (p.cast) lastCast[locK] = p.cast;
    const focus = cast.find(x => x.id === (p.focus || c.focus)) || cast[0];
    const fx_ = focus ? (focus.x1 !== undefined ? (focus.x0 + focus.x1) / 2 : focus.x0) : 1200;
    const kid = focus && ['sonya', 'timur'].includes(focus.who);
    const hY = focus ? GROUND - (frame === 'close' ? (kid ? 330 : 540) : (kid ? 220 : 360)) * (focus.sc || 1) : 675;
    const [z0, z1] = p.zoom || FR[frame] || FR.wide;
    let cx = frame === 'wide' || frame === 'xwide' ? 1200 + (p.dx || 0) : fx_ + (p.dx || 0), cy = frame === 'wide' || frame === 'xwide' ? 675 : hY;
    if (p.center) { cx = p.center[0]; cy = p.center[1]; }
    const key = p.loc ? bgKey(p.loc, p.opt || c.opt || {}) : key0;
    // ---- движение камеры: пресеты, без повторов подряд ----
    const MOVES = { wide: ['truckL', 'craneDown', 'truckR', 'pullOut', 'arcL', 'craneUp', 'arcR'], xwide: ['craneDown', 'truckR', 'pullOut', 'truckL'], med: ['pushArcR', 'pushIn', 'pushArcL', 'truckR', 'pushIn'], close: ['pushSlow', 'driftL', 'pushSlow', 'driftR'] };
    const fkey = frame === 'xwide' ? 'xwide' : frame;
    const pool = MOVES[fkey] || MOVES.wide;
    let mv = p.move || c.move || pool[(shots.length * 3 + k) % pool.length];
    if (shots.length && shots[shots.length - 1].move === mv) mv = pool[(pool.indexOf(mv) + 1) % pool.length];
    const sec = (sb - sa) / FPS, T = Math.min(1.2, Math.max(.6, sec / 8)) * .38; // мягко: малый путь, медленно
    const zs = z0, zm = (z0 + z1) / 2;
    let from, to;
    switch (mv) {
      case 'truckL': from = [cx + 130 * T, cy, zs + .02]; to = [cx - 130 * T, cy, zs + .05]; break;
      case 'truckR': from = [cx - 130 * T, cy, zs + .02]; to = [cx + 130 * T, cy, zs + .05]; break;
      case 'craneDown': from = [cx, cy - 110 * T, zs + .03]; to = [cx, cy + 8, zs]; break;
      case 'craneUp': from = [cx, cy + 15, zs]; to = [cx, cy - 100 * T, zs + .03]; break;
      case 'pullOut': from = [cx, cy - 8, zs + .07]; to = [cx, cy, zs]; break;
      case 'arcL': from = [cx + 150 * T, cy, zs + .04]; to = [cx - 60 * T, cy - 10, zs + .01]; break;
      case 'arcR': from = [cx - 150 * T, cy, zs + .04]; to = [cx + 60 * T, cy - 10, zs + .01]; break;
      case 'pushIn': from = [cx, cy + 10, zs]; to = [cx, cy - 10, z1 + .03]; break;
      case 'pushArcR': from = [cx - 90 * T, cy + 10, zs]; to = [cx + 40 * T, cy - 8, z1 + .025]; break;
      case 'pushArcL': from = [cx + 90 * T, cy + 10, zs]; to = [cx - 40 * T, cy - 8, z1 + .025]; break;
      case 'pushSlow': from = [cx, cy, zs]; to = [cx, cy - 6, z1 + .02]; break;
      case 'driftL': from = [cx + 18, cy, zm]; to = [cx - 18, cy, zm + .015]; break;
      case 'driftR': from = [cx - 18, cy, zm]; to = [cx + 18, cy, zm + .015]; break;
      default: from = [cx - 40, cy, z0]; to = [cx + 40, cy, z1];
    }
    if (p.rise) to[1] -= p.rise;
    const roll = p.roll || c.roll || 0;
    const dof = p.dof ?? (frame === 'med' || frame === 'close' ? 1 : 0);
    shots.push({ a: sa, b: sb, bg: key, key: key + ':' + i + ':' + k + (dof ? ':d' : '') + (frame === 'wide' || frame === 'xwide' ? '' : ':n'), move: mv, dof, nofg: !(frame === 'wide' || frame === 'xwide'), cast, fx: p.fx0 ? { ...p.fx } : { ...(c.fx || {}), ...(p.fx || {}) }, rim: c.rim,
      cam: { from: [...from, roll], to: [...to, roll], ease: p.ease || 'soft' },
      xin: (k === 0 && c.cut) ? 0 : 18, overlay: c.overlay || '' });
  }
}
// для немых сцен без своего фона (карточки, чернота) продлеваем предыдущий план
shots.sort((x, y) => x.a - y.a);
for (let i = 0; i < shots.length - 1; i++) shots[i].b = Math.max(shots[i].b, shots[i + 1].a);
if (shots.length) shots[shots.length - 1].b = F(dur);
// ---- 6. субтитры: кусками по 2–5 слов, рвём на точках/паузах ----
const subs = words.filter(w => w.v !== undefined).map(w => ({ w: w.w.replace(/[«»]/g, ''), sf: F(shift(w.s)), ef: F(shift(w.e)), v: w.v, q: w.q || 0 }));
const chunks = []; let cur = null;
for (let i = 0; i < subs.length; i++) {
  const w = subs[i];
  if (!cur || cur.words.length >= 4 || (i && (w.sf - subs[i - 1].ef > 9 || /[.!?…:]$/.test(subs[i - 1].w)) && cur.words.length >= 1) || (i && subs[i - 1].v !== w.v)) { cur = { a: w.sf, words: [] }; chunks.push(cur); }
  cur.words.push(w); cur.b = w.ef + 6;
}
for (let i = 0; i < chunks.length - 1; i++) chunks[i].b = Math.min(chunks[i].b, chunks[i + 1].a);
for (const c of cards) for (const ch of chunks) if (ch.a < c.b && ch.b > c.a) ch.b = Math.min(ch.b, c.a);
const tl = { fps: FPS, frames: F(dur), duration: dur, ep: EP, bgs, shots, subs, chunks, pills, cards, inserts, blacks, flashes, quakes, insertions: ins };
fs.writeFileSync(path.join(out, `ep${EP}.timeline.json`), JSON.stringify(tl));
console.log(`серия ${EP}: ${(dur / 60).toFixed(2)} мин, ${tl.frames} кадров, сцен ${scenes.length}, планов ${shots.length}, фонов ${Object.keys(bgs).length}, вставок тишины ${ins.length} (${ins.reduce((a, x) => a + x.dur, 0).toFixed(1)} с)`);
const missing = scenes.filter(s => !SC[s.id]).map(s => s.id); if (missing.length) console.log('нет настроек сцен:', missing.join(' '));
