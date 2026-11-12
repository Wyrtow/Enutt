#!/usr/bin/env python3
"""Укрупнение озвучки: соседние сегменты одного голоса без явной паузы склеиваются в один запрос
(≤ 2 400 символов), теги эмоций каждого сегмента остаются внутри текста. Меньше запросов — та же цена.

Использование: python3 merge_voiced.py <videos/...> <ep_from> [<ep_to>]
Пишет voice_text/batches.json: [{"bid","ep","voice","say","sub","members":[{"id","sub"}],"pause_after"}].
Сборка серии (assemble_voice.py) понимает и сегменты, и батчи: аудио батча лежит в audio/raw/<bid>.mp3.
"""
import json, sys
root = sys.argv[1]; a = int(sys.argv[2]); b = int(sys.argv[3]) if len(sys.argv) > 3 else 99
V = json.load(open(f'{root}/voice_text/voiced.json', encoding='utf-8'))
out = []
for s in V:
    if not (a <= s['ep'] <= b): continue
    last = out[-1] if out else None
    if last and last['ep'] == s['ep'] and last['voice'] == s['voice'] == 'MALE' and last['pause_after'] == 0 \
       and len(last['say']) + len(s['say']) < 2400:
        last['say'] += ' ' + s['say']; last['sub'] += '\n' + s['sub']
        last['members'].append({'id': s['id'], 'sub': s['sub'], 'scene': s['scene']})
        last['pause_after'] = s['pause_after']
    else:
        out.append({'bid': 'b' + s['id'], 'ep': s['ep'], 'voice': s['voice'], 'say': s['say'], 'sub': s['sub'],
                    'members': [{'id': s['id'], 'sub': s['sub'], 'scene': s['scene']}], 'pause_after': s['pause_after']})
import re
for x in out: x['say'] = re.sub(r'(\[[^\]]+\])(\s*\1)+', r'\1', x['say'])
json.dump(out, open(f'{root}/voice_text/batches.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for e in range(a, min(b, 6) + 1):
    n = [x for x in out if x['ep'] == e]
    print(f'серия {e}: {len(n)} запросов вместо {sum(len(x["members"]) for x in n)}')
