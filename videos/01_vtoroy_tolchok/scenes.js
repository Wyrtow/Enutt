// Визуальные настройки сцен «Второй толчок». Ключ — номер СЦЕНЫ из script.md.
// Координаты — холст 2400×1350 (кадр = x 240..2160, y 135..1215), земля y=1035, центр 1200.
// cast: {who:'mark'|'sonya'|'olga'|'timur'|'petrovich'|'rescuer'|'extra', x0,x1?, act, facing, turn, voice, sc, alpha, ghost}
//       {dog:1, x0,x1?, bark, wag} · {prop:'lamp'|'glow'|'bolt', ...}
// frames: кадрировки по кругу (wide/med/close/xwide), shots: явные планы, fx: snow/dust/alarm/fire/flicker/dawn/sparks/embers
const G = 1035;
const M = (x0, act = 'idle', o = {}) => ({ who: 'mark', id: 'mark', voice: 'MALE', x0, act, ...o });
const SO = (x0, act = 'idle', o = {}) => ({ who: 'sonya', id: 'sonya', voice: 'GIRL', x0, act, ...o });
const OL = (x0, act = 'idle', o = {}) => ({ who: 'olga', id: 'olga', voice: 'FEMALE', x0, act, ...o });
const EX = (seed, x0, x1, o = {}) => ({ who: 'extra', seed, id: 'ex' + seed, x0, x1, y: G - 70, ...o, sc: (o.sc || .9) * .78 });
const crowd = (n, x0, x1, dir, sd, o = {}) => Array.from({ length: n }, (_, i) => EX(sd + i, x0 + i * (x1 - x0) / n, (dir ? x0 + i * (x1 - x0) / n + dir : undefined), { sc: .82 + (i % 3) * .05, ...o }));
const night = { time: 'night', state: 'ok' }, quake = { time: 'blackout', state: 'quake' };
const SNOW = { snow: 140 };

module.exports = {
  _tail: 1.4,
  // ===== СЕРИЯ 1 =====
  '001': { loc: 'city_aerial', opt: { time: 'night', state: 'ok' }, dur: 1.6, black: { at: 0, to: 1.6, fin: 0, fout: 25 / 30 }, fx: SNOW, frames: ['xwide'] },
  '002': { loc: 'apartment', opt: { ...quake, clock: '03:17' }, shots: [
      { frame: 'wide', cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 6, flick: 1 }, M(900, 'scared')], fx: { dust: 1 } },
      { frame: 'wide', zoom: [1.1, 1.2] },
      { frame: 'med', cast: [M(1000, 'look_up')] },
      { frame: 'wide', zoom: [1.0, 1.08], cast: [SO(1100, 'scared', { turn: 0 })] },
      { frame: 'xwide', cast: [] },
      { frame: 'med', cast: [M(1200, 'protect')], fx: { dust: 1, embers: 1 } },
    ], quakes: [{ at: .6, amp: 12, len: 1.2 }, { at: 4.2, amp: 18, len: 1.8 }], flashes: [7.6], frames: ['wide'] },
  '003': { loc: 'rooftop', opt: night, cast: [M(1150, 'idle', { turn: .85, lookY: -4 })], frames: ['wide', 'med', 'close'], fx: SNOW, driftPx: 60 },
  '004': { dur: 2.8 }, // карточка серии
  '005': { loc: 'city_aerial', opt: night, frames: ['xwide', 'wide'], fx: SNOW, driftPx: 120 },
  '006': { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '23:58' }, cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 0 }, M(560, 'lie', { y: G - 230, turn: 0 })], frames: ['wide', 'med', 'close'],
           inserts: [{ type: 'phone', time: '23:58', sub: 'вторник, 12 ноября', vm: '0:14 · не прослушано', at: 18, len: 9 }] },
  '007': { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '03:17' }, cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 2, flick: 1 }, M(560, 'lie', { y: G - 230 })], frames: ['med', 'close', 'wide'], quakes: [{ at: 3.5, amp: 5, len: 2.5 }, { at: 8, amp: 9, len: 3 }], fx: { dust: 1, dustFrom: 0 } },
  '008': { loc: 'apartment', opt: { ...quake, clock: '03:17' }, cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 4, flick: 1 }, M(820, 'protect')], frames: ['wide', 'med'], quakes: [{ at: .2, amp: 24, len: 4 }, { at: 6, amp: 18, len: 3 }], fx: { dust: 1 }, black: { at: 12.5, fin: 6, fout: 2 } },
  '009': { loc: 'yard', opt: { ...quake }, cast: [...crowd(5, 300, 900, 0, 10, { act: 'idle' }), ...crowd(4, 1500, 2050, 0, 20), M(1150, 'idle', { lookX: -5, brows: .5 })], frames: ['wide', 'med', 'close'], fx: SNOW },
  '010': { loc: 'yard', opt: { ...quake }, cast: [M(1200, 'idle', { lookY: 8, brows: .3 })], frames: ['close'], inserts: [{ type: 'phone', time: '3:17', sub: 'нет сети', at: .3, len: 5 }], fx: SNOW },
  '011': { loc: 'yard', opt: { ...quake }, cast: [M(900, 'idle', { turn: .7, facing: 1 }), { dog: 1, x0: 1450, facing: -1, bark: 1 }], frames: ['wide', 'med', 'close'], focus: 'mark', fx: SNOW },
  '012': { loc: 'yard', opt: { ...quake }, shots: [
      { frame: 'wide', cast: [SO(1550, 'idle', { lookX: -6 }), M(500, 'walk', { x1: 1250 })] },
      { frame: 'med', cast: [SO(1550, 'idle', { lookX: -6, brows: .8 }), M(1300, 'idle', { turn: .7 })], focus: 'sonya' },
      { frame: 'med', cast: [SO(1450, 'holdup', { lookX: -7 }), M(1320, 'hold', { turn: .5 })], focus: 'mark' },
    ], fx: SNOW },
  '013': { loc: 'street', opt: { ...quake }, cast: [...crowd(6, 300, 2100, 300, 30, { act: 'walk' }), M(1150, 'shout'), SO(1290, 'holdup', { lookX: -6 })], frames: ['wide', 'med'], fx: SNOW },
  '014': { loc: 'arch', opt: { ...quake }, shots: [
      { frame: 'wide', cast: [OL(1500, 'idle', { facing: -1, turn: .6 }), EX(77, 1700, undefined, { act: 'sit', facing: -1 }), SO(800, 'run', { x1: 1350 }), M(700, 'walk', { x1: 1050 })] },
      { frame: 'med', cast: [OL(1450, 'protect', { facing: -1 }), SO(1360, 'scared', { turn: 0 }), M(1050, 'idle')], focus: 'olga' },
      { frame: 'med', cast: [OL(1450, 'idle', { facing: -1, lookX: -4 }), SO(1360, 'idle', { lookX: -6 }), M(1050, 'idle')], focus: 'sonya' },
    ], fx: SNOW },
  '015': { loc: 'street', opt: { ...quake, mchs: 1, crowd: 1 }, cast: [...crowd(5, 200, 2100, 500, 40, { act: 'walk' }), M(500, 'walk', { x1: 1100 }), SO(620, 'walk', { x1: 1220 }), OL(760, 'walk', { x1: 1380 })], frames: ['wide', 'med', 'wide'], fx: SNOW },
  '016': { loc: 'street', opt: { ...quake }, cast: [M(900, 'walk', { x1: 1500, lookX: -6 }), OL(780, 'walk', { x1: 1380 }), SO(660, 'walk', { x1: 1260 })], frames: ['wide', 'med'], fx: SNOW },
  '017': { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:58' }, cast: [...crowd(4, 1600, 2100, 0, 50, { act: 'sit' }), OL(1300, 'sit', { facing: -1 }), SO(1180, 'lie', { y: G - 80, sc: .9 }), M(700, 'idle', { lookY: -8, lookX: 6 })], frames: ['wide', 'med', 'close'],
           inserts: [{ type: 'clock', text: '4:58', at: 21, len: 1.4 }, { type: 'clock', text: '5:05', at: 22.6, len: 1.2 }, { type: 'clock', text: '5:10', at: 24, len: 1.3 }] },
  '018': { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '5:10' }, cast: [M(1000, 'idle', { brows: .7, lookY: 6 })], frames: ['close', 'med'], quakes: [{ at: 1, amp: 3, len: 10 }] },
  '019': { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '5:12' }, cast: [M(1000, 'idle', { brows: 1, lookY: -8 })], frames: ['close'], inserts: [{ type: 'clock', text: '5:12', at: 0, len: 1.6 }] },
  '020': { loc: 'gym', opt: { time: 'blackout', state: 'quake', clock: '5:12' }, cast: [...crowd(5, 1500, 2150, 0, 60, { act: 'sit' }), M(900, 'shout'), OL(1400, 'protect', { facing: -1 })], frames: ['wide', 'med'], quakes: [{ at: .1, amp: 26, len: 6 }], fx: { dust: 1 } },
  '021': { dur: 1.6, black: { at: 0, fin: 1, fout: 1 }, flashes: [0] },
  '022': { loc: 'bench', opt: { time: 'night', state: 'ok' }, cast: [M(1220, 'sit', { facing: -1, brows: .6 })], frames: ['med', 'close', 'wide'], fx: SNOW, black: { at: 0, to: 1.2, fin: 0, fout: 30 } },
};
