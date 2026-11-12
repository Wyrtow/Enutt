// Render clips to PNG sequences (transparent) + WebM with alpha + MP4 preview.
// node scripts/render_clips.mjs [--chars max,anya] [--clips wave,walk] [--size 1024] [--fps 30] [--out renders]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openHarness, ROOT } from './harness.mjs';
import { CLIPS } from '../src/clips.js';
import { CHARACTERS } from '../src/characters.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const chars = arg('chars', Object.keys(CHARACTERS).join(',')).split(',');
const clips = arg('clips', Object.keys(CLIPS).join(',')).split(',');
const size = +arg('size', 1024), fps = +arg('fps', 30), out = path.resolve(ROOT, arg('out', 'renders'));
const keepPng = process.argv.includes('--png');

const H = await openHarness();
await H.setup({ width: size, height: size, camera: { pos: [0, 40, 178], target: [0, 39, 0], fov: 29 } });
for (const id of chars) for (const c of clips) {
  const clip = CLIPS[c];
  const n = Math.round(clip.duration * fps) + (clip.loop ? 0 : 1);
  const dir = path.join(out, 'frames', id, c);
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) await H.frame([{ id, clip: c, t: i / fps }], path.join(dir, String(i).padStart(4, '0') + '.png'));
  const vdir = path.join(out, 'video', id); fs.mkdirSync(vdir, { recursive: true });
  const pdir = path.join(out, 'preview', id); fs.mkdirSync(pdir, { recursive: true });
  const inp = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, '%04d.png')];
  execFileSync('ffmpeg', [...inp, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30', '-auto-alt-ref', '0', path.join(vdir, `${c}.webm`)]);
  execFileSync('ffmpeg', [...inp, '-filter_complex', `color=c=0xf3f1ec:s=${size}x${size}[bg];[bg][0:v]overlay=shortest=1,scale=512:512`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', path.join(pdir, `${c}.mp4`)]);
  if (!keepPng) fs.rmSync(dir, { recursive: true });
  console.log(`${id}/${c}: ${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await H.close();
