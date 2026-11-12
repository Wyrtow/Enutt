// Pose filmstrip: node scripts/sheet_poses.mjs out.png <charId> <clip> [frames=8]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openHarness } from './harness.mjs';
import { CLIPS } from '../src/clips.js';
const [out, id = 'max', clip = 'wave', n = 8] = process.argv.slice(2);
const H = await openHarness();
await H.setup({ width: 300, height: 420, background: '#f3f1ec', camera: { pos: [30, 38, 150], target: [0, 32, 0], fov: 30 } });
const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.p'));
const files = [];
for (let i = 0; i < n; i++) {
  const t = CLIPS[clip].duration * i / (n - (CLIPS[clip].loop ? 0 : 1));
  const f = path.join(tmp, i + '.png');
  await H.frame([{ id, clip, t }], f); files.push(f);
}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex', `hstack=inputs=${n}`, out]);
fs.rmSync(tmp, { recursive: true });
await H.close();
