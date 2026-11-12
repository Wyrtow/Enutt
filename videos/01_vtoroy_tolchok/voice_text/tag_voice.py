#!/usr/bin/env python3
"""Расставляет аудио-теги эмоций (eleven_v4) и нормализует время для озвучки.
segments.json → voiced.json (поле "say" — что отправляется в ElevenLabs).
Теги — по таблице битов из skill references/voice.md. Петрович — inline [elderly voice] внутри сегментов MALE.
"""
import json, re, os
here = os.path.dirname(os.path.abspath(__file__))
segs = json.load(open(os.path.join(here, 'segments.json'), encoding='utf-8'))

H = {'3': 'три', '4': 'четыре', '5': 'пять', '6': 'шесть'}
M = {'17': 'семнадцать', '31': 'тридцать одна', '52': 'пятьдесят две', '14': 'четырнадцать', '33': 'тридцать три',
     '12': 'двенадцать', '58': 'пятьдесят восемь', '05': 'ноль пять', '10': 'десять', '09': 'ноль девять',
     '11': 'одиннадцать', '40': 'сорок'}
GEN = {'3:17': 'трёх семнадцати', '5:12': 'пяти двенадцати'}
def times(t):
    t = re.sub(r'\b([СсДд][о]?)\s+(3:17|5:12)\b', lambda m: f"{m.group(1)} {GEN[m.group(2)]}", t)
    return re.sub(r'\b([3-6]):(\d\d)\b', lambda m: f"{H[m.group(1)]} {M[m.group(2)]}", t)

# префикс-тег каждого сегмента MALE (по умолчанию — спокойный рассказ)
PRE = {
 'e1_000': '[softly]', 'e1_001': '[warmly]', 'e1_002': '[calm]', 'e1_003': '[tired]', 'e1_004': '[softly]',
 'e1_005': '[nervous]', 'e1_006': '[confused]', 'e1_007': '[calm]', 'e1_008': '[cautiously]', 'e1_009': '[warmly]',
 'e1_011': '[warmly]', 'e1_012': '[nervous]', 'e1_013': '[cautiously]', 'e1_015': '[calm]', 'e1_018': '[calm]',
 'e1_019': '[calm]', 'e1_020': '[calm]', 'e1_021': '[softly]', 'e1_022': '[nervous] [slowly]', 'e1_023': '[whispers]',
 'e1_024': '[nervous]', 'e1_025': '[breathless]',
 'e2_026': '[softly]', 'e2_027': '[confused]', 'e2_028': '[nervous]', 'e2_029': '[calm]', 'e2_030': '[frustrated]',
 'e2_031': '[calm]', 'e2_033': '[warmly]', 'e2_035': '[chuckles]', 'e2_037': '[mischievously]', 'e2_038': '[calm]',
 'e2_039': '[frustrated]', 'e2_040': '[frustrated]', 'e2_041': '[tired]', 'e2_043': '[sad]', 'e2_044': '[cautiously]',
 'e2_048': '[calm]', 'e2_050': '[sad]', 'e2_051': '[whispers]', 'e2_052': '[trembling voice]', 'e2_053': '[softly]',
 'e3_055': '[curious]', 'e3_056': '[nervous]', 'e3_057': '[curious]', 'e3_058': '[calm]', 'e3_059': '[excited]',
 'e3_060': '[calm]', 'e3_062': '[excited]', 'e3_063': '[cautiously]', 'e3_064': '[excited]', 'e3_065': '[happy]',
 'e3_066': '[warmly]', 'e3_068': '[mischievously]', 'e3_070': '[chuckles]', 'e3_072': '[sarcastic]', 'e3_073': '[nervous]',
 'e3_074': '[breathless]', 'e3_075': '[trembling voice]', 'e3_076': '[softly] [slowly]',
 'e4_077': '[softly]', 'e4_078': '[tired]', 'e4_079': '[cautiously]', 'e4_081': '[chuckles]', 'e4_083': '[sad]',
 'e4_084': '[calm]', 'e4_085': '[calm]', 'e4_086': '[calm]', 'e4_087': '[calm]', 'e4_088': '[cautiously]',
 'e4_090': '[shouting]', 'e4_092': '[curious] [slowly]', 'e4_093': '[warmly]', 'e4_095': '[sad]', 'e4_096': '[nervous]',
 'e4_097': '[calm] [slowly]', 'e4_098': '[dramatically]', 'e4_099': '[breathless]', 'e4_101': '[happy]', 'e4_103': '[softly]',
 'e4_104': '[dramatically]', 'e4_105': '[sad]',
 'e5_106': '[calm]', 'e5_107': '[softly]', 'e5_108': '[calm]', 'e5_109': '[dramatically]', 'e5_111': '[breathless]',
 'e5_113': '[calm]', 'e5_114': '[dramatically]', 'e5_115': '[excited]', 'e5_116': '[dramatically]', 'e5_117': '[excited]',
 'e5_119': '[chuckles]', 'e5_121': '[warmly]', 'e5_122': '[softly]', 'e5_124': '[softly]', 'e5_126': '[sad]',
 'e5_128': '[softly]', 'e5_129': '[softly] [slowly]', 'e5_130': '[dramatically]', 'e5_131': '[confused]', 'e5_132': '[slowly]',
 'e5_133': '[whispers]',
 'e6_134': '[softly] [slowly]', 'e6_135': '[sad]', 'e6_136': '[softly]', 'e6_137': '[sad]', 'e6_138': '[warmly]',
 'e6_141': '[sad]', 'e6_143': '[softly]', 'e6_145': '[softly]', 'e6_147': '[warmly]', 'e6_148': '[warmly]',
 'e6_149': '[softly]', 'e6_150': '[softly]', 'e6_152': '[softly] [sad]', 'e6_153': '[softly]', 'e6_155': '[warmly]',
 'e6_156': '[softly] [slowly]', 'e6_157': '[warmly]',
}
# эмоции реплик других голосов
PRE_OTHER = {
 'e1_010': '[scared]', 'e1_014': '[crying]', 'e1_016': '[breathless]', 'e1_017': '[softly]',
 'e2_032': '[scared]', 'e2_034': '[curious]', 'e2_036': '[mischievously]', 'e2_042': '[excited]', 'e2_045': '[cautiously]',
 'e2_046': '[tired]', 'e2_047': '[softly]', 'e2_049': '[tired]', 'e2_054': '[whispers]',
 'e3_061': '[excited]', 'e3_067': '[excited]', 'e3_069': '[curious]', 'e3_071': '[curious]',
 'e4_080': '[curious]', 'e4_082': '[softly]', 'e4_089': '[nervous]', 'e4_091': '[curious]', 'e4_094': '[sarcastic]',
 'e4_100': '[excited]', 'e4_102': '[happy]',
 'e5_110': '[scared]', 'e5_112': '[breathless]', 'e5_118': '[excited]', 'e5_120': '[mischievously]',
 'e5_123': '[curious]', 'e5_125': '[curious]', 'e5_127': '[warmly]',
 'e6_139': '[softly]', 'e6_140': '[softly]', 'e6_142': '[softly] [trembling voice]', 'e6_144': '[softly]',
 'e6_146': '[curious]', 'e6_151': '[warmly]', 'e6_154': '[softly]',
}
VOICE_PREFIX = {'GIRL': '[childlike voice]', 'BOY': '[young boy voice]', 'FEMALE': '', 'MALE': ''}

# крик/эмоция только на конкретной фразе внутри сегмента: фраза → (тег до, тег после)
INLINE = {
 'e1_024': {'«Все наружу!»': ('[shouting]', '[softly]')},
 'e2_038': {'«Не ходите в школу. Вы слышите? В 5:12 крыша спортзала рухнет».': ('[shouting]', '[frustrated]')},
 'e1_012': {'«Кто видел Ольгу? Медсестру из второго подъезда?»': ('[shouting]', '[nervous]')},
}

# Петрович внутри сегментов: реплика в кавычках — [elderly voice], авторские слова после — обратно [calm]
PETROVICH = {
 'e4_085': ['«Ну, здорово, электрик. Проходи. Чай будешь?»', '«А чего ж не видеть. Не слепой пока».'],
 'e4_086': ['«Жена, —', 'Шесть лет как нет. С тех пор и не сплю по ночам. Вот, сторожу».', '«Коллектор, —', 'Гнилое место».', '«На набережную. Там гранит, а под ним скала. Сто лет стоит и ещё сто простоит».'],
 'e4_087': ['«А сам-то ты где живёшь, сынок?»', '«И чего ж ты не дома?»'],
 'e4_098': ['«Сделаю».'],
 'e4_105': ['«Ты, сынок, давно тут ходишь, —', 'Я видел. Ты разве не понял?»'],
 'e5_113': ['«Сначала к дому своему сходи, сынок, —', 'Сначала к дому».'],
 'e5_115': ['«Народ. На набережную. Там гранит. Шевелись, кому жить охота».'],
 'e5_131': ['«Теперь сходи к своему дому, сынок».'],
}

out = []
for s in segs:
    t = s['text'].replace('\n', ' ')
    for q in PETROVICH.get(s['id'], []):
        assert q in t, (s['id'], q)
        t = t.replace(q, f'[elderly voice] {q} [calm]', 1)
    if s['voice'] == 'MALE':
        tag = PRE.get(s['id'], '[calm]')
    else:
        tag = (VOICE_PREFIX[s['voice']] + ' ' + PRE_OTHER.get(s['id'], '')).strip()
    for q, (before, after) in INLINE.get(s['id'], {}).items():
        assert q in t, (s['id'], q)
        t = t.replace(q, f'{before} {q} {after}', 1)
    say = times(f"{tag} {t}".strip())
    say = re.sub(r'([.!?…]\s+«?)([а-яё])', lambda m: m.group(1) + m.group(2).upper(), say)
    say = re.sub(r'^((?:\[[^\]]+\]\s*)+)([а-яё])', lambda m: m.group(1) + m.group(2).upper(), say).replace('[calm] [elderly voice]', '[elderly voice]')
    out.append({**s, 'say': re.sub(r'\s+', ' ', say), 'sub': s['text']})
json.dump(out, open(os.path.join(here, 'voiced.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'сегментов;', sum(len(x['say']) for x in out), 'символов к озвучке (с тегами)')
