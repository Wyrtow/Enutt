#!/usr/bin/env bash
# Проверка готового ролика: длительность, громкость, яркость, контактный лист.
# Использование: qa_video.sh out/video.mp4
set -euo pipefail
V="$1"; D="$(dirname "$V")/qa"; mkdir -p "$D"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
printf 'Длительность: %d:%02d\n' "$(( ${dur%.*} / 60 ))" "$(( ${dur%.*} % 60 ))"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -of default=nw=1 "$V"
echo "--- Громкость (цель: I −14…−16 LUFS, TP ≤ −1 dBTP)"
ffmpeg -nostats -i "$V" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:|LRA:)" | tail -3
echo "--- Средняя яркость Y (цель для ночи 40–60), по кадру раз в 10 с"
ffmpeg -nostats -i "$V" -vf "fps=1/10,scale=320:-1,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$D/yavg.txt" -f null - 2>/dev/null
awk -F= '/YAVG/{s+=$2;n++; if($2<8)b++} END{printf "Y средн.: %.1f  кадров почти чёрных: %d из %d\n", s/n, b, n}' "$D/yavg.txt"
echo "--- Контактный лист (кадр каждые 20 с) → $D/contact_*.jpg"
ffmpeg -v error -i "$V" -vf "fps=1/20,scale=384:-1,tile=5x6" -q:v 3 "$D/contact_%02d.jpg"
ls "$D"/contact_*.jpg
