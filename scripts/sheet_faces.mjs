// Emotion contact sheet per character: node scripts/sheet_faces.mjs <outdir> [ids...]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openHarness } from './harness.mjs';
const [outDir = 'renders/sheets', ...ids] = process.argv.slice(2);
const EMO = ['neutral', 'smile', 'happy', 'laugh', 'sad', 'angry', 'surprised', 'thinking', 'skeptical', 'wink', 'worried', 'bored', 'embarrassed', 'determined'];
const all = ids.length ? ids : ['max', 'anya', 'boris', 'lev', 'zara', 'tim'];
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(outDir, '.tmp'));
const H = await openHarness();
await H.setup({ width: 300, height: 330, background: '#f3f1ec', camera: { pos: [12, 50, 62], target: [0, 48, 0], fov: 30 } });
for (const id of all) {
  const files = [];
  for (const e of EMO) {
    const f = path.join(tmp, `${id}_${e}.png`);
    await H.frame([{ id, clip: 'idle', t: 0.6, face: e }], f);
    files.push(f);
  }
  // label + tile with ffmpeg
  const labeled = files.map((f, i) => {
    const o = f.replace('.png', '_l.png');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-vf', `drawtext=text='${EMO[i]}':x=(w-tw)/2:y=8:fontsize=24:fontcolor=0x333333`, o]);
    return o;
  });
  const inputs = labeled.flatMap(f => ['-i', f]);
  const n = labeled.length, cols = 7;
  const layout = labeled.map((_, i) => `${(i % cols) * 300}_${Math.floor(i / cols) * 330}`).join('|');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `xstack=inputs=${n}:layout=${layout}`, path.join(outDir, `${id}_emotions.png`)]);
  console.log('sheet', id);
}
fs.rmSync(tmp, { recursive: true });
await H.close();
