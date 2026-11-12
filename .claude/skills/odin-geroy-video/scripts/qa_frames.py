#!/usr/bin/env python3
"""Покадровая проверка готового ролика «Один герой» (16:9, 20–40 мин), потоково — память не растёт с длиной.

Ищет: чёрные кадры (вне запланированных затемнений), белые вспышки, «заморозки» (≥ 12 кадров без движения —
камера обязана всегда ползти), «рывки» (скачок разницы кадров > 3× локальной медианы вне склеек),
тряску вне событий; считает яркость/контраст/насыщенность/теплоту по планам и сравнивает с нормами STYLE_BIBLE.
Плюс громкость (EBU R128), тишина, листы кадров (раз в 2 с, 10×6) для просмотра глазами.

Использование:
  python3 qa_frames.py out/video.mp4 out/qa [timeline.json]
timeline.json (пишет Remotion-сборка): {"fps":30,
  "shots":[{"id":1,"a":0,"b":270}, ...],            # кадры [a, b)
  "planned":[[a,b], ...],                            # затемнения, вспышки, наплывы — не считать ошибкой
  "shake":[[a,b], ...]}                              # разрешённая тряска (толчки)
"""
import json, os, subprocess, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw

vid, out = sys.argv[1], sys.argv[2]
meta = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
os.makedirs(out, exist_ok=True)
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
planned = set()
for a, b in meta.get("planned", []):
    planned.update(range(a - 1, b + 2))
for s in meta.get("shots", []):
    planned.update(range(s["a"] - 2, s["a"] + 2))
shake_ok = set()
for a, b in meta.get("shake", []):
    shake_ok.update(range(a, b + 1))
R = []

pr = json.loads(run("ffprobe", "-v", "error", "-show_entries",
    "stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration", "-of", "json", vid).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
au = [s for s in pr["streams"] if s["codec_type"] == "audio"]
dur = float(pr["format"]["duration"])
R.append(f"SPECS {v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} fps, {dur / 60:.2f} мин; audio: "
         + (", ".join(f"{s['codec_name']} {s['sample_rate']} Hz {s['channels']}ch" for s in au) if au else "НЕТ"))
R.append(("OK   " if 20 * 60 <= dur <= 40 * 60 else "!!   ") + "длительность 20–40 мин")
R.append(("OK   " if (v["width"], v["height"]) == (1920, 1080) else "!!   ") + "1920×1080")
if au:
    e = run("ffmpeg", "-nostats", "-i", vid, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-").stderr
    tail = e[e.rfind("Summary:"):]
    vals = {l.split(":")[0].strip(): l.split(":")[1].strip() for l in tail.splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))}
    R.append("LOUDNESS " + " | ".join(f"{k}: {x}" for k, x in vals.items()) + "   (цель I −14…−16 LUFS, Peak ≤ −1 dBFS)")
    e = run("ffmpeg", "-nostats", "-i", vid, "-map", "0:a:0", "-af", "silencedetect=n=-45dB:d=2.5", "-f", "null", "-").stderr
    sil = [l.split("] ")[-1] for l in e.splitlines() if "silence_end" in l]
    R.append("SILENCES ≥2.5 c: " + ("; ".join(sil[:20]) or "нет"))

W, H = 320, 180
proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", vid, "-vf", f"scale={W}:{H}:flags=area",
                         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
FS = W * H * 3
lw = np.array([0.2126, 0.7152, 0.0722], np.float32)
yy, xx = np.mgrid[0:H, 0:W]
corner = ((xx < W * .15) | (xx > W * .85)) & ((yy < H * .2) | (yy > H * .8))
center = (abs(xx - W / 2) < W * .2) & (abs(yy - H / 2) < H * .2)
mean, std, sat, warm, vig, diff = [], [], [], [], [], []
prev = None; sheet = None; cw, ch = 192, 108
i = 0
while True:
    buf = proc.stdout.read(FS)
    if len(buf) < FS: break
    fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    f32 = fr.astype(np.float32) / 255
    L = f32 @ lw
    mx, mn = f32.max(-1), f32.min(-1)
    mean.append(L.mean()); std.append(L.std())
    sat.append(np.where(mx > .06, (mx - mn) / np.maximum(mx, 1e-6), 0).mean())
    warm.append((f32[..., 0] - f32[..., 2]).mean())
    vig.append(L[corner].mean() / max(L[center].mean(), 1e-3))
    if prev is not None:
        diff.append(np.abs(fr.astype(np.int16) - prev).mean())
    prev = fr.astype(np.int16)
    if i % 60 == 0:  # лист: 1 кадр раз в 2 с, 60 кадров = 2 мин на лист
        k = (i // 60) % 60
        if k == 0:
            if sheet is not None: sheet.save(os.path.join(out, f"sheet_{(i // 3600) - 1:03d}.jpg"), quality=85)
            sheet = Image.new("RGB", (cw * 10, ch * 6), "black")
        x, y = (k % 10) * cw, (k // 10) * ch
        sheet.paste(Image.fromarray(fr).resize((cw, ch)), (x, y))
        d = ImageDraw.Draw(sheet); t = i // 30
        d.rectangle([x, y, x + 48, y + 12], fill="black"); d.text((x + 2, y + 1), f"{t // 60}:{t % 60:02d}", fill="yellow")
    i += 1
if sheet is not None: sheet.save(os.path.join(out, f"sheet_{i // 3600:03d}.jpg"), quality=85)
n = i
mean, std, sat, warm, vig, diff = map(np.array, (mean, std, sat, warm, vig, diff))
tc = lambda f: f"{f // 1800}:{(f // 30) % 60:02d}.{f % 30:02d}"

# рывки: локальная медиана по окну ±8 кадров (потоково не нужна — массив diff маленький: 1 float на кадр)
pad = np.pad(diff, 8, mode="edge")
win = np.lib.stride_tricks.sliding_window_view(pad, 17)
med = np.median(win, axis=1)
pops = [j + 1 for j in range(len(diff)) if diff[j] > 3 * med[j] + 1.0 and (j + 1) not in planned]
black = [j for j in range(n) if mean[j] < .03 and j not in planned]
white = [j for j in range(n) if mean[j] > .93 and j not in planned]
frozen, st0 = [], None
for j in range(len(diff)):
    if diff[j] < .02: st0 = j if st0 is None else st0
    else:
        if st0 is not None and j - st0 >= 12 and not planned.intersection(range(st0, j)): frozen.append((st0, j))
        st0 = None
jitter = [j for j in range(2, len(diff)) if diff[j] > 4 and diff[j - 1] > 4 and j not in shake_ok and j not in planned]

R.append(f"\nFRAMES {n}")
R.append(f"{'OK  ' if not black else '!!  '} чёрных кадров вне затемнений: {len(black)} {[tc(f) for f in black[:10]]}")
R.append(f"{'OK  ' if not white else '!!  '} белых кадров вне вспышек: {len(white)} {[tc(f) for f in white[:10]]}")
R.append(f"{'OK  ' if not frozen else '!!  '} заморозок ≥12 кадров (камера стоит): {len(frozen)} {[(tc(a), tc(b)) for a, b in frozen[:10]]}")
R.append(f"{'OK  ' if not pops else '!!  '} рывков вне склеек: {len(pops)} {[tc(f) for f in pops[:15]]}")
R.append(f"{'OK  ' if len(jitter) < 30 else '!!  '} подозрение на тряску вне событий: {len(jitter)} кадров")
R.append(f"\nЦВЕТ ВСЕГО РОЛИКА (медианы; Y в шкале 0–255)")
R.append(f"  Y {np.median(mean) * 255:.0f} (ночь 40–60) · σY {np.median(std) * 255:.0f} (~45) · S {np.median(sat) * 255:.0f} (~90) · "
         f"R−B {np.median(warm) * 255:+.0f} (−10…−20) · углы/центр {np.median(vig):.2f} (0,15–0,25)")
shots = meta.get("shots") or [{"id": 0, "a": 0, "b": n}]
R.append("\nПО ПЛАНАМ  id  начало  Y  σY  S  R−B  виньетка")
for s in shots:
    a, b = s["a"], min(s["b"], n)
    if a >= b: continue
    sl = slice(a, b)
    R.append(f"  {s['id']:>4} {tc(a):>9}  {np.median(mean[sl]) * 255:4.0f} {np.median(std[sl]) * 255:4.0f} "
             f"{np.median(sat[sl]) * 255:4.0f} {np.median(warm[sl]) * 255:+5.0f}  {np.median(vig[sl]):.2f}")
np.savez(os.path.join(out, "perframe.npz"), mean=mean, std=std, sat=sat, warm=warm, vig=vig, diff=diff)
open(os.path.join(out, "report.md"), "w", encoding="utf-8").write("\n".join(R) + "\n")
print("\n".join(R))
print(f"\nЛисты кадров: {out}/sheet_*.jpg — просмотри их глазами (герой по эталону, шарф, плашки не на лицах).")
