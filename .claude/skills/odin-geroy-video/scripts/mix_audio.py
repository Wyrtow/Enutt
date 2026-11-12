#!/usr/bin/env python3
"""Финальный звук ролика: голос (как есть) + музыка (ducking под речь, автоматизация по главам) + SFX,
мастер до −15 LUFS integrated, true peak ≤ −1 dBTP (двухпроходный loudnorm). Только ffmpeg.

Использование:
  python3 mix_audio.py mix.json out/mix.wav
mix.json:
{
  "voice": "audio/voice.wav",                         # склеенный голос всех глав (48 кГц)
  "duration": 1712.4,                                 # длина ролика, с (из таймлайна)
  "music": [{"file":"audio/music_ch1.mp3","start":0,"end":312.5,"gain_db":-4,"fade":2.0}, ...],
  "sfx":   [{"file":"audio/sfx/glass.mp3","at":12.40,"gain_db":-6}, ...],
  "duck_db": 9                                        # насколько прижимать музыку под речь
}
"""
import json, subprocess, sys, re

cfg = json.load(open(sys.argv[1])); outp = sys.argv[2]
D = float(cfg["duration"]); duck = float(cfg.get("duck_db", 9))
inputs, f = ["-i", cfg["voice"]], []
k = 1
mus = []
for m in cfg.get("music", []):
    inputs += ["-i", m["file"]]
    fd = m.get("fade", 2.0); ln = m["end"] - m["start"]
    f.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{ln},asetpts=PTS-STARTPTS,"
             f"afade=t=in:d={fd},afade=t=out:st={max(0, ln - fd)}:d={fd},volume={m.get('gain_db', 0)}dB,"
             f"adelay={int(m['start'] * 1000)}|{int(m['start'] * 1000)}[m{k}]")
    mus.append(f"[m{k}]"); k += 1
sfx = []
for s in cfg.get("sfx", []):
    inputs += ["-i", s["file"]]
    ms = int(s["at"] * 1000)
    f.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,volume={s.get('gain_db', -6)}dB,adelay={ms}|{ms}[s{k}]")
    sfx.append(f"[s{k}]"); k += 1
f.append(f"[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={D}[v]")
f.append("[v]asplit=2[vmix][vkey]")
if mus:
    f.append(f"{''.join(mus)}amix=inputs={len(mus)}:normalize=0,apad=whole_dur={D}[mall]")
    # ducking: сайдчейн от голоса; ratio подобран так, чтобы под речью музыка опускалась примерно на duck_db
    f.append(f"[mall][vkey]sidechaincompress=threshold=0.02:ratio={max(2, duck / 1.5):.1f}:attack=70:release=450:makeup=1[mduck]")
else:
    f.append("[vkey]anullsink"); f.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{D}[mduck]")
if sfx:
    f.append(f"{''.join(sfx)}amix=inputs={len(sfx)}:normalize=0,apad=whole_dur={D}[sall]")
else:
    f.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{D}[sall]")
f.append(f"[vmix][mduck][sall]amix=inputs=3:normalize=0,atrim=0:{D}[pre]")
graph = ";".join(f)

base = ["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex"]
# проход 1: измерить
p1 = subprocess.run(["ffmpeg", "-y", "-nostats", "-v", "info", *inputs, "-filter_complex"] + [graph + ";[pre]loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json[o]", "-map", "[o]", "-f", "null", "-"],
                    capture_output=True, text=True)
m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p1.stderr, re.S)
if not m: sys.exit("loudnorm не вернул замеры:\n" + p1.stderr[-2000:])
js = json.loads(m.group(0))
ln = (f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
# проход 2: применить
subprocess.run(base + [graph + f";[pre]{ln},aresample=48000[o]", "-map", "[o]", "-c:a", "pcm_s16le", outp], check=True)
r = subprocess.run(["ffmpeg", "-nostats", "-i", outp, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print("\n".join(l.strip() for l in r[r.rfind("Summary:"):].splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))))
