#!/usr/bin/env python3
"""script.md → сегменты для озвучки по голосам (MALE/FEMALE/GIRL/BOY), по сериям.

Использование: python3 split_voice.py videos/<...>/script.md videos/<...>/voice_text/
Пишет segments.json: [{"id":"e1_003","ep":1,"voice":"MALE","text":"…","pause_after":0.35}, …]
- Рассказ и реплики без метки → MALE; строка с @F/@G/@B: слова автора до метки — MALE, сама реплика — свой голос.
- Подряд идущие строки одного голоса внутри одной СЦЕНЫ склеиваются (≤ 2 400 символов).
- [ПАУЗА x] → pause_after у предыдущего сегмента; [ВЫБОР …] → пауза 2,5 с.
- Эмоции добавляются отдельно: файл tags.json {"id": "[tag] …полный текст с тегами…"} перекрывает text.
"""
import json, re, sys, os

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
VO = {'@F': 'FEMALE', '@G': 'GIRL', '@B': 'BOY'}
segs, ep, scene = [], 0, ''
def push(voice, text, sc):
    text = text.strip()
    if not text: return
    if segs and segs[-1]['voice'] == voice and segs[-1]['scene'] == sc and segs[-1]['ep'] == ep \
       and len(segs[-1]['text']) + len(text) < 2400 and segs[-1]['pause_after'] == 0:
        segs[-1]['text'] += '\n' + text
    else:
        segs.append({'ep': ep, 'scene': sc, 'voice': voice, 'text': text, 'pause_after': 0.0})

for ln in open(src, encoding='utf-8'):
    s = ln.strip()
    if s.startswith('## СЕРИЯ'):
        ep += 1; continue
    if s.startswith('> СЦЕНА'):
        scene = s.split('|')[0].replace('> СЦЕНА', '').strip(); continue
    if not s or s.startswith(('#', '>', '---')) or ep == 0:
        continue
    m = re.match(r'\[ПАУЗА\s*([\d.]+)\]', s)
    if m:
        if segs: segs[-1]['pause_after'] = float(m.group(1))
        continue
    if s.startswith('[ВЫБОР'):
        if segs: segs[-1]['pause_after'] = 2.5
        continue
    m = re.search(r'@([FGB])\s*«(.+)»\s*$', s)
    if m:
        pre = s[:m.start()].strip()
        if pre: push('MALE', pre, scene)
        push(VO['@' + m.group(1)], m.group(2), scene)
        if segs: segs[-1]['pause_after'] = max(segs[-1]['pause_after'], 0.3)
        continue
    push('MALE', s, scene)

for i, sg in enumerate(segs):
    sg['id'] = f"e{sg['ep']}_{i:03d}"
json.dump(segs, open(os.path.join(out, 'segments.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
tot = {}
for sg in segs: tot[sg['voice']] = tot.get(sg['voice'], 0) + len(sg['text'])
print(f"сегментов: {len(segs)}; символов по голосам: {tot}; всего {sum(tot.values())}")
