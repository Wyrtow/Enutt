// Рендер серии: node render.js <videoDir> <ep> [--stills=f1,f2,...] [--range=a-b] [--workers=4] [--q=88]
// 1) пререндер фонов (слои PNG ×1.5, блюр запечён) в <videoDir>/build/bg/
// 2) параллельные воркеры: кадр → JPEG → ffmpeg (image2pipe) → куски mp4 → склейка + звук серии
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
require('./backgrounds.js'); const { bg, BW, BH } = globalThis.BG;
const [, , VD, EPS, ...flags] = process.argv; const EP = +EPS;
const opt = Object.fromEntries(flags.map(f => f.replace(/^--/, '').split('=')));
const B = path.join(path.resolve(VD), 'build'), BGD = path.join(B, 'bg'); fs.mkdirSync(BGD, { recursive: true });
const tl = JSON.parse(fs.readFileSync(path.join(B, `ep${EP}.timeline.json`), 'utf8'));
const ENG = __dirname;
if (opt.noui) { tl.pills = []; tl.cards = []; tl.inserts = []; }
const DSF = +(opt.dsf || 1);

async function prerender(browser) {
  const p = await browser.newPage({ viewport: { width: BW, height: BH }, deviceScaleFactor: 1.5 });
  for (const [key, v] of Object.entries(tl.bgs)) {
    const r = bg(v.loc, v.opt);
    tl.bgs[key].layers = [];
    for (const l of r.layers) {
      const file = path.join(BGD, `${key}_${l.name}.png`);
      const soft = ['far', 'mid'].includes(l.name) ? path.join(BGD, `${key}_${l.name}_soft.png`) : null;
      tl.bgs[key].layers.push({ name: l.name, z: l.z, src: 'file://' + file, soft: soft ? 'file://' + soft : null });
      for (const [fn, bl] of [[file, l.blur], [soft, l.blur + (l.name === 'far' ? 7 : 4)]]) {
        if (!fn || fs.existsSync(fn)) continue;
        await p.setContent(`<body style="margin:0;background:transparent"><div style="filter:blur(${bl}px)">${l.svg}</div></body>`);
        await p.screenshot({ path: fn, omitBackground: l.name !== 'sky' && !(r.interior && l.name === 'mid'), clip: { x: 0, y: 0, width: BW, height: BH } });
      }
    }
  }
  await p.close();
}
async function worker(id, frames, outFile) {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: DSF });
  await page.goto('file://' + path.join(ENG, 'blank.html'));
  await page.addScriptTag({ path: path.join(ENG, 'rig.js') });
  await page.addScriptTag({ path: path.join(ENG, 'player.js') });
  await page.evaluate(t => window.PLAYER.init(t), tl);
  await page.evaluate(() => document.fonts.ready);
  let ff = null;
  if (outFile) ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(tl.fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(tl.fps), outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  let n = 0; const t0 = Date.now();
  for (const f of frames) {
    await page.evaluate(f => window.PLAYER.frame(f), f);
    const buf = await page.screenshot({ type: 'jpeg', quality: +(opt.q || 90) });
    if (ff) { if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); }
    else fs.writeFileSync(path.join(B, `still_ep${EP}_${String(f).padStart(5, '0')}.jpg`), buf);
    if (++n % 300 === 0) console.log(`w${id}: ${n}/${frames.length} (${(n / ((Date.now() - t0) / 1000)).toFixed(1)} к/с)`);
  }
  if (ff) { ff.stdin.end(); await new Promise(r => ff.on('close', r)); }
  await browser.close();
}
(async () => {
  fs.writeFileSync(path.join(ENG, 'blank.html'), '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#000;overflow:hidden}</style></head><body></body></html>');
  const b = await chromium.launch(); await prerender(b); await b.close();
  if (opt.stills) { await worker(0, opt.stills.split(',').map(Number)); console.log('stills ok'); return; }
  const [ra, rb] = opt.range ? opt.range.split('-').map(Number) : [0, tl.frames];
  const W = +(opt.workers || 4), all = []; for (let f = ra; f < rb; f++) all.push(f);
  const per = Math.ceil(all.length / W), parts = [];
  const t0 = Date.now();
  await Promise.all(Array.from({ length: W }, (_, i) => { const fr = all.slice(i * per, (i + 1) * per); if (!fr.length) return; const o = path.join(B, `ep${EP}_part${i}.mp4`); parts.push(o); return worker(i, fr, o); }));
  fs.writeFileSync(path.join(B, `ep${EP}_parts.txt`), parts.sort().map(p => `file '${p}'`).join('\n'));
  const vid = path.join(B, `ep${EP}_video.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(B, `ep${EP}_parts.txt`), '-c', 'copy', vid]);
  const mix = fs.existsSync(path.join(B, `ep${EP}.mix.wav`)) ? path.join(B, `ep${EP}.mix.wav`) : path.join(B, `ep${EP}.voice.wav`);
  const fin = path.join(B, opt.out || (opt.range ? `ep${EP}_${ra}-${rb}.mp4` : `ep${EP}.mp4`));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', vid, '-ss', String(ra / tl.fps), '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', fin]);
  console.log(`готово: ${fin} · ${(all.length / ((Date.now() - t0) / 1000)).toFixed(1)} к/с`);
})();
