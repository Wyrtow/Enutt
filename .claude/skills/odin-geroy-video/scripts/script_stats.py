#!/usr/bin/env python3
"""Метрики сценария канала «Один герой» против норм STYLE_BIBLE.md.
Использование: python3 script_stats.py path/to/script.md [--wpm 140]
"""
import re, sys, statistics as st

args = sys.argv[1:]
if not args:
    sys.exit(__doc__)
path = args[0]
wpm = float(args[args.index('--wpm') + 1]) if '--wpm' in args else 140.0

lines = open(path, encoding='utf-8').read().splitlines()
voice, chapters, cur = [], [], None
pauses = 0.0
for ln in lines:
    s = ln.strip()
    if s.startswith('## '):
        cur = {'title': s[3:], 'words': 0, 'start_words': sum(len(v.split()) for v in voice), 'pauses_before': pauses}
        chapters.append(cur)
        continue
    if not s or s.startswith(('#', '>', '---')):
        continue
    m = re.match(r'\[ПАУЗА\s*([\d.]+)\]', s)
    if m:
        pauses += float(m.group(1)); continue
    if s.startswith('[ВЫБОР'):
        pauses += 2.5; continue
    voice.append(s)
    if cur: cur['words'] += len(s.split())

text = ' '.join(voice)
words = text.split()
n = len(words)
dur = n / wpm * 60 + pauses
sents = [x.strip() for x in re.split(r'(?<=[.!?…])\s+', text) if x.strip()]
slen = [len(x.split()) for x in sents] or [0]
short = sum(1 for l in slen if l < 5) / len(slen)
longp = sum(1 for l in slen if l >= 20) / len(slen)
q = sum(1 for x in sents if x.endswith('?')) / len(sents)
ex = sum(1 for x in sents if x.endswith('!')) / len(sents)
quotes = text.count('«')
nums = len(re.findall(r'\d+', text))
fmt = lambda sec: f"{int(sec // 60)}:{int(sec % 60):02d}"

def check(ok, msg): print(('  OK   ' if ok else '  !!   ') + msg)

print(f"\nСценарий: {path}")
print(f"Слов: {n}   оценка длительности: {fmt(dur)} (при {wpm:.0f} сл/мин + паузы {pauses:.0f} с)")
check(20 * 60 <= dur <= 40 * 60, "длительность 20–40 мин")
check(5 <= st.median(slen) <= 7, f"медиана фразы {st.median(slen)} слов (норма 5–7)")
check(0.25 <= short <= 0.42, f"фраз короче 5 слов: {short:.0%} (норма 25–40 %)")
check(longp < 0.03, f"фраз ≥ 20 слов: {longp:.1%} (норма < 3 %)")
check(q <= 0.02, f"вопросов: {q:.1%} (≤ 2 %)")
check(ex <= 0.02, f"восклицаний: {ex:.1%} (≤ 2 %)")
check(30 <= quotes <= 60 or dur < 20 * 60, f"реплик в «ёлочках»: {quotes} (30–60)")
check(nums / max(dur / 60, 1) >= 0.8, f"чисел в минуту: {nums / max(dur / 60, 1):.1f} (≈ 1–1,5)")
low = text.lower()
check('меня зовут марк' in ' '.join(voice[:12]).lower(), "Марк представлен в начале")
check('я закрыл глаза' in low[-1500:], "фирменное аутро «Я закрыл глаза…» в конце")
check(not re.search(r'правило (первое|\d+)', low), "нет «правил» в стиле чужого формата")

print("\nГлавы (тайм-код старта по оценке):")
gl = [c for c in chapters if c['title'].upper().startswith('ГЛАВА')]
for c in chapters:
    t = c['start_words'] / wpm * 60 + c['pauses_before']
    print(f"  {fmt(t):>6}  {c['title']}  — {c['words']} слов ≈ {c['words'] / wpm:.1f} мин")
check(5 <= len(gl) <= 8, f"глав: {len(gl)} (норма 5–8)")
for c in gl:
    m = c['words'] / wpm
    if not (2.5 <= m <= 6.5):
        check(False, f"длина главы «{c['title']}» {m:.1f} мин (норма 3–6)")
