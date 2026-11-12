// Рендер тестовой анимации: node render.js [кадры через запятую для стоп-кадров]
// Без аргументов — все кадры → frames/ → mark_anim_test.mp4 (ffmpeg).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = __dirname, out = path.join(dir, 'frames');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.setContent(`<html><body style="margin:0;background:#000"><div id="v"></div>
    <script>${fs.readFileSync(path.join(dir, 'rig.js'), 'utf8')}</script>
    <script>${fs.readFileSync(path.join(dir, 'scene.js'), 'utf8')}</script></body></html>`);
  const N = await p.evaluate(() => SCENE.N);
  const list = process.argv[2] ? process.argv[2].split(',').map(Number) : [...Array(N).keys()];
  for (const f of list) {
    await p.evaluate(f => { document.getElementById('v').innerHTML = SCENE.frame(f); }, f);
    await p.screenshot({ path: path.join(out, `f${String(f).padStart(4, '0')}.png`) });
  }
  await b.close();
  if (!process.argv[2]) {
    execSync(`ffmpeg -v error -y -framerate 30 -i ${out}/f%04d.png -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p ${dir}/mark_anim_test.mp4`);
    console.log('ok', path.join(dir, 'mark_anim_test.mp4'));
  } else console.log('stills ok');
})();
