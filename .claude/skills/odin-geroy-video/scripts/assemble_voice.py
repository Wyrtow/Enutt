#!/usr/bin/env python3
"""Склейка озвучки серии из сегментов + тайминги сегментов и слов (без STT).

Использование: python3 assemble_voice.py <videos/...> <ep>
Читает voice_text/voiced.json и audio/raw/<id>.mp3, пишет audio/ep<N>.wav (48 кГц моно) и audio/ep<N>.timing.json:
  {"segments":[{"id","voice","start","end"}], "words":[{"w","s","e","v","seg"}]}
Паузы: между сегментами 0,35 с, при смене голоса 0,3 с, явные [ПАУЗА x] — x с.
Слова: внутри сегмента предложения привязываются к паузам в аудио (silencedetect), слова в предложении
распределяются пропорционально числу гласных (≈ слогов). Точность ±0,15–0,3 с — достаточно для караоке.
"""
import json, os, re, subprocess, sys
root, ep = sys.argv[1], int(sys.argv[2])
bpath = f'{root}/voice_text/batches.json'
B = [x for x in json.load(open(bpath, encoding='utf-8')) if x['ep'] == ep] if os.path.exists(bpath) else []
if B:  # укрупнённые запросы: файл audio/raw/<bid>.mp3
    segs = [{'id': x['bid'], 'voice': x['voice'], 'sub': x['sub'], 'pause_after': x['pause_after'],
             'scene': x['members'][0]['scene'], 'members': x['members']} for x in B]
else:
    segs = [dict(s, members=[{'id': s['id'], 'sub': s['sub'], 'scene': s['scene']}])
            for s in json.load(open(f'{root}/voice_text/voiced.json', encoding='utf-8')) if s['ep'] == ep]
SR = 48000
raw = f'{root}/audio/raw'
VOW = set('аеёиоуыэюяaeiouy')
def dur(p): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
def silences(p):
    e = subprocess.run(['ffmpeg', '-nostats', '-i', p, '-af', 'silencedetect=n=-38dB:d=0.18', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', e)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', e)]
    return list(zip(st, en))
def syl(w): return max(1, sum(c in VOW for c in w.lower()))

files, timing_s, words, t = [], [], [], 0.25  # 0,25 с тишины в начале серии
prev_voice = None
for i, s in enumerate(segs):
    p = f"{raw}/{s['id']}.mp3"
    if not os.path.exists(p): sys.exit(f'нет файла {p}')
    d = dur(p)
    gap = 0 if i == 0 else (prev_pause if prev_pause else (0.3 if s['voice'] != prev_voice else 0.35))
    t += gap
    start = t
    # слова: предложения ↔ речевые куски между тишинами
    sil = [(max(0.0, a), min(d, b)) for a, b in silences(p)]
    speech, cur = [], 0.0
    for a, b in sil:
        if a - cur > 0.05: speech.append((cur, a))
        cur = max(cur, b)
    if d - cur > 0.05: speech.append((cur, d))
    if not speech: speech = [(0.0, d)]
    rawt = s['sub'].replace('\n', ' ')
    qflags, inq = [], False
    for tok in rawt.split():
        o = tok.count('«') > tok.count('»'); c = tok.count('»') > tok.count('«')
        if '«' in tok: inq = True
        qflags.append(1 if inq else 0)
        if '»' in tok: inq = False
    text = re.sub(r'[«»]', '', rawt)
    qi = 0
    sents = [x for x in re.split(r'(?<=[.!?…])\s+', text) if x.strip()]
    # сопоставляем предложения речевым кускам по пропорции слогов (жадно)
    tot_syl = sum(syl(w) for w in text.split()) or 1
    tot_sp = sum(b - a for a, b in speech) or d
    # номер члена батча для каждого слова (по порядку слов)
    owner = []
    for m in s['members']:
        owner += [m] * len(re.sub(r'[«»]', '', m['sub'].replace('\n', ' ')).split())
    wi = 0
    k, acc = 0, 0.0
    for sent in sents:
        ws = sent.split(); need = sum(syl(w) for w in ws) / tot_syl * tot_sp
        # время предложения внутри «склеенной речи» → в реальное время файла
        def real(x):
            for a, b in speech:
                if x <= (b - a): return a + x
                x -= (b - a)
            return d
        s0, s1 = acc, acc + need; acc = s1
        cs = s0
        for w in ws:
            wd = syl(w) / max(1, sum(syl(v) for v in ws)) * (s1 - s0)
            m = owner[min(wi, len(owner) - 1)]; wi += 1
            words.append({'w': w, 's': round(start + real(cs), 3), 'e': round(start + real(cs + wd), 3), 'v': s['voice'], 'seg': m['id'], 'scene': m['scene'], 'q': qflags[min(qi, len(qflags) - 1)]})
            qi += 1
            cs += wd
    for m in s['members']:
        mw = [w for w in words if w['seg'] == m['id']]
        if mw: timing_s.append({'id': m['id'], 'voice': s['voice'], 'scene': m['scene'], 'start': mw[0]['s'], 'end': mw[-1]['e']})
    files.append((p, start))
    t = start + d
    prev_voice, prev_pause = s['voice'], s['pause_after']
total = t + 0.6
# сборка: adelay каждого файла на его старт, затем микс
inp, flt = [], []
for j, (p, st) in enumerate(files):
    inp += ['-i', p]; ms = int(st * 1000)
    flt.append(f'[{j}:a]aresample={SR},aformat=channel_layouts=mono,adelay={ms}[a{j}]')
flt.append(''.join(f'[a{j}]' for j in range(len(files))) + f'amix=inputs={len(files)}:normalize=0,apad=whole_dur={total},atrim=0:{total}[o]')
out = f'{root}/audio/ep{ep}.wav'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *inp, '-filter_complex', ';'.join(flt), '-map', '[o]', '-ar', str(SR), out], check=True)
json.dump({'duration': round(total, 3), 'segments': timing_s, 'words': words}, open(f'{root}/audio/ep{ep}.timing.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
nw = len(words)
print(f'серия {ep}: {total / 60:.2f} мин, {len(files)} сегментов, {nw} слов, {nw / (total / 60):.0f} сл/мин → {out}')
