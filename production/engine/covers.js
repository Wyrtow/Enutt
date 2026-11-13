// Обложки: node covers.js <bgFull.jpg> <bgVert.jpg> <outDir>
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const [, , BGF0, BGV0, OUT] = process.argv;
const uri = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64'); const BGF = uri(BGF0), BGV = uri(BGV0);
const css = `*{margin:0;box-sizing:border-box} body{font-family:Inter;overflow:hidden;background:#000}
.bg{position:absolute;inset:0;background-size:cover;background-position:var(--pos,center)}
.t{font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:2px;-webkit-text-stroke:var(--st,10px) #07050f;paint-order:stroke fill;line-height:.95}
.clock{display:inline-block;background:#0b0a16;border:6px solid #ff3b3b;border-radius:28px;color:#ff4d4d;font-weight:900;text-shadow:0 0 36px #ff2a2a,0 0 10px #ff2a2a;box-shadow:0 0 60px rgba(255,40,40,.45)}
.tag{display:inline-block;background:#ff8a2a;color:#120a04;font-weight:900;border-radius:999px;letter-spacing:3px}`;
const full = `<div class="bg" style="background-image:url(${BGF});--pos:60% 40%"></div>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 45% 70% at 78% 45%,rgba(255,120,40,.38),rgba(0,0,0,0) 70%),radial-gradient(ellipse 30% 40% at 95% 85%,rgba(255,80,20,.35),rgba(0,0,0,0) 70%)"></div>
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,4,16,.92) 0%,rgba(6,4,16,.7) 34%,rgba(6,4,16,0) 58%)"></div>
<div style="position:absolute;inset:0;box-shadow:inset 0 0 220px 60px rgba(0,0,0,.75)"></div>
<div style="position:absolute;left:70px;top:70px"><div class="tag" style="font-size:34px;padding:12px 30px">ОДИН ГЕРОЙ</div></div>
<div style="position:absolute;left:70px;top:190px;transform:rotate(-4deg)"><div class="clock" style="font-size:190px;padding:6px 44px">5:12</div></div>
<div style="position:absolute;left:66px;bottom:150px" class="t"><div style="font-size:150px">ВТОРОЙ</div><div style="font-size:150px;color:#ffc93a">ТОЛЧОК</div></div>
<div style="position:absolute;left:74px;bottom:86px;width:520px;height:12px;background:#ff8a2a;border-radius:6px;box-shadow:0 0 30px #ff8a2a"></div>`;
const vert = `<div class="bg" style="background-image:url(${BGV});--pos:50% 40%"></div>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 40% at 50% 45%,rgba(255,120,40,.32),rgba(0,0,0,0) 70%)"></div>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,4,16,.92) 0%,rgba(6,4,16,.15) 30%,rgba(6,4,16,0) 55%,rgba(6,4,16,.92) 82%)"></div>
<div style="position:absolute;inset:0;box-shadow:inset 0 0 200px 50px rgba(0,0,0,.7)"></div>
<div style="position:absolute;left:0;right:0;top:120px;text-align:center"><div class="tag" style="font-size:64px;padding:18px 60px;background:#ff3b3b;color:#fff;box-shadow:0 0 60px rgba(255,59,59,.6)">▶ ТРЕЙЛЕР</div></div>
<div style="position:absolute;left:0;right:0;bottom:330px;text-align:center" class="t"><div style="font-size:170px;--st:14px">ВТОРОЙ</div><div style="font-size:170px;color:#ffc93a;--st:14px">ТОЛЧОК</div></div>
<div style="position:absolute;left:0;right:0;bottom:180px;text-align:center"><div class="clock" style="font-size:96px;padding:6px 40px;transform:rotate(-3deg)">3:17 → 5:12</div></div>
<div style="position:absolute;left:0;right:0;bottom:80px;text-align:center"><div class="tag" style="font-size:40px;padding:12px 40px">ОДИН ГЕРОЙ</div></div>`;
// карточки для трейлера (прозрачные PNG 1080×1920)
const ovTitle = `<div style="position:absolute;left:0;right:0;top:150px;text-align:center"><div class="tag" style="font-size:52px;padding:14px 46px;background:#ff3b3b;color:#fff">ТРЕЙЛЕР</div></div>
<div style="position:absolute;left:0;right:0;top:270px;text-align:center" class="t"><div style="font-size:92px;--st:11px">ВТОРОЙ <span style="color:#ffc93a">ТОЛЧОК</span></div></div>`;
const endCard = `<div style="position:absolute;inset:0;background:radial-gradient(#1a1838,#05040c)"></div>
<div style="position:absolute;left:0;right:0;top:560px;text-align:center" class="t"><div style="font-size:170px;--st:14px">ВТОРОЙ</div><div style="font-size:170px;color:#ffc93a;--st:14px">ТОЛЧОК</div></div>
<div style="position:absolute;left:0;right:0;top:1000px;text-align:center"><div class="clock" style="font-size:90px;padding:6px 40px">3:17 → 5:12</div></div>
<div style="position:absolute;left:0;right:0;top:1230px;text-align:center;color:#fff;font:800 64px Inter">Вся история — 29 минут</div>
<div style="position:absolute;left:0;right:0;top:1330px;text-align:center;color:#ffc93a;font:900 64px Inter">на канале ↓</div>
<div style="position:absolute;left:0;right:0;bottom:180px;text-align:center"><div class="tag" style="font-size:52px;padding:16px 52px">ОДИН ГЕРОЙ</div></div>`;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const shot = async (w, h, html, file, transparent) => { const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<html><head><style>${css}</style></head><body style="width:${w}px;height:${h}px;${transparent ? 'background:transparent' : ''}">${html}</body></html>`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, file), ...(file.endsWith('.jpg') ? { type: 'jpeg', quality: 92 } : { omitBackground: !!transparent }) }); await p.close(); };
  await shot(1920, 1080, full, 'cover_full.jpg');
  await shot(1080, 1920, vert, 'cover_trailer.jpg');
  await shot(1080, 1920, ovTitle, 'trailer_title.png', true);
  await shot(1080, 1920, endCard, 'trailer_end.png');
  await b.close(); console.log('ok');
})();
