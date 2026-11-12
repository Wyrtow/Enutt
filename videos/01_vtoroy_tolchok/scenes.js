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
  '002': { minShot: 2.6, loc: 'apartment', opt: { ...quake, clock: '03:17' }, shots: [
      { frame: 'wide', cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 6, flick: 1 }, M(900, 'scared')], fx: { dust: 1 } },
      { frame: 'wide', zoom: [1.1, 1.2] },
      { frame: 'med', cast: [M(1000, 'look_up')] },
      { frame: 'wide', zoom: [1.0, 1.08], cast: [SO(1100, 'scared', { turn: 0 })] },
      { frame: 'xwide', cast: [] },
      { frame: 'med', cast: [M(1200, 'protect')], fx: { dust: 1, embers: 1 } },
    ], quakes: [{ at: .6, amp: 12, len: 1.2 }, { at: 4.2, amp: 18, len: 1.8 }], flashes: [7.6], frames: ['wide'] },
  '003': { minShot: 4.5, loc: 'rooftop', opt: night, fx: SNOW, cast: [M(1150, 'idle', { turn: .85, lookY: -4 })], shots: [
      { frame: 'med', w: 1.2 },
      { loc: 'switchroom', opt: night, frame: 'med', cast: [M(880, 'panel'), { prop: 'bolt', x0: 1000, y: 620 }], fx0: 1, fx: { sparks: [1150, 500] } },
      { loc: 'shaft', opt: { time: 'night', cabinY: 300 }, frame: 'wide', cast: [], fx0: 1, fx: {} },
      { loc: 'street', opt: night, frame: 'med', cast: [M(1000, 'reach', { lookY: -10 })], fx: { snow: 320, snowBig: 1 }, w: 1.4 },
      { frame: 'close', w: .9 },
      { loc: 'city_aerial', opt: night, frame: 'xwide', cast: [], w: 1.2 },
    ], inserts: [{ type: 'timer', text: '3:17 → 5:12', at: 16, len: 7 }] },
  '004': { dur: 2.8 },
  '005': { loc: 'city_aerial', opt: night, fx: SNOW, driftPx: 120, shots: [
      { frame: 'xwide' }, { loc: 'embankment', opt: night, frame: 'wide', cast: [] }, { loc: 'boiler_ext', opt: night, frame: 'wide', cast: [] }, { loc: 'street', opt: { ...night, moon: 1 }, frame: 'xwide', cast: [] }, { frame: 'wide', zoom: [1.0, 1.12] } ] },
  '006': { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '23:58' }, shots: [
      { loc: 'street', opt: night, frame: 'wide', cast: [M(500, 'walk', { x1: 1500, brows: .2 })], fx: SNOW, w: 1.1 },
      { frame: 'wide', cast: [{ prop: 'lamp', x0: 1200, y: 170 }, M(560, 'lie', { y: G - 190 })] },
      { frame: 'med', zoom: [1.45, 1.55], center: [760, 780] },
      { loc: 'city_aerial', opt: { time: 'dawn', state: 'ok' }, frame: 'xwide', cast: [], w: .9 },
      { frame: 'close', zoom: [1.6, 1.7], center: [700, 800] },
      { frame: 'wide', zoom: [1.05, 1.12] },
    ], inserts: [{ type: 'phone', time: '23:58', sub: 'вторник, 12 ноября', vm: '0:14 · не прослушано', at: 21, len: 8 }] },
  '007': { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '03:17' }, cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 2, flick: 1 }, M(560, 'lie', { y: G - 190 })], shots: [
      { frame: 'close', zoom: [2.1, 2.3], center: [1200, 300] }, { frame: 'close', zoom: [1.6, 1.7], center: [700, 800] }, { frame: 'wide', zoom: [1.0, 1.06] } ],
      quakes: [{ at: 3.5, amp: 5, len: 2.5 }, { at: 8, amp: 9, len: 3 }], fx: { dust: 1, dustFrom: 0 } },
  '008': { loc: 'apartment', opt: { ...quake, clock: '03:17' }, cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 4, flick: 1 }, M(820, 'protect')], shots: [
      { frame: 'wide' }, { frame: 'med' }, { loc: 'city_aerial', opt: { time: 'blackout', state: 'quake', fire: 1 }, frame: 'xwide', cast: [], fx: { dust: 1 } } ],
      quakes: [{ at: .2, amp: 24, len: 4 }, { at: 6, amp: 18, len: 3 }], fx: { dust: 1 }, black: { at: 12.5, fin: 6, fout: 2 } },
  '009': { loc: 'yard', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'med', cast: [M(1150, 'idle', { lookX: -5, brows: .5 })] },
      { frame: 'wide', cast: [...crowd(5, 300, 900, 0, 10), ...crowd(4, 1500, 2050, 0, 20), M(1150, 'idle', { lookX: -5 })] },
      { loc: 'street', opt: { ...quake, crowd: 1 }, frame: 'wide', cast: [...crowd(6, 300, 2100, 0, 25)] },
      { frame: 'close', cast: [M(1150, 'idle', { lookY: 6, brows: .3 })] } ] },
  '010': { loc: 'street', opt: { ...quake, flip: 1 }, cast: [M(1200, 'idle', { lookY: 8, brows: .3 })], frames: ['close'], inserts: [{ type: 'phone', time: '3:17', sub: 'нет сети', at: .3, len: 5 }], fx: SNOW },
  '011': { loc: 'yard', opt: { ...quake }, fx: SNOW, cast: [M(900, 'idle', { turn: .7, facing: 1 }), { dog: 1, x0: 1450, facing: -1, bark: 1 }], shots: [
      { frame: 'wide' }, { loc: 'yard', opt: { ...quake, flip: 1 }, frame: 'close', zoom: [1.9, 2.0], center: [950, 930], cast: [{ dog: 1, x0: 950, facing: 1, bark: 1 }] }, { loc: 'arch', opt: { ...quake }, frame: 'close', cast: [M(1150, 'idle', { turn: .5, brows: .4 })] } ] },
  '012': { loc: 'yard', opt: { ...quake }, fx: SNOW, shots: [
      { loc: 'street', opt: { ...quake, flip: 1 }, frame: 'wide', cast: [SO(1550, 'idle', { lookX: -6 }), M(500, 'walk', { x1: 1250 })] },
      { loc: 'yard', opt: { ...quake, flip: 1 }, frame: 'close', cast: [SO(850, 'idle', { lookX: 6, brows: .8 })] },
      { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '18:40' }, frame: 'med', cast: [{ prop: 'lamp', x0: 1200, y: 170 }, M(1500, 'reach', { facing: -1 }), SO(1150, 'holdup', { lookX: 6, bunnyHand: 'B' })], fx0: 1, fx: { dawn: 1 }, w: 1.3 },
      { frame: 'med', cast: [SO(1550, 'idle', { lookX: -6, brows: .8 }), M(1300, 'idle', { turn: .7 })], focus: 'sonya' },
      { frame: 'med', cast: [SO(1450, 'holdup', { lookX: -7 }), M(1320, 'hold', { turn: .5 })], focus: 'mark' } ] },
  '013': { loc: 'street', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(6, 300, 2100, 300, 30, { act: 'walk' }), M(1150, 'shout'), SO(1290, 'holdup', { lookX: -6 })] },
      { loc: 'yard', opt: { ...quake }, frame: 'wide', cast: [...crowd(5, 200, 2000, -300, 40, { act: 'walk' })] },
      { frame: 'close', cast: [M(1150, 'idle', { brows: .7, lookX: 6 })] } ] },
  '014': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'wide', cast: [OL(1500, 'idle', { facing: -1, turn: .6 }), EX(77, 1700, undefined, { act: 'sit', facing: -1 }), SO(800, 'run', { x1: 1350 }), M(700, 'walk', { x1: 1050 })] },
      { loc: 'arch', opt: { ...quake, flip: 1 }, frame: 'close', cast: [OL(950, 'idle', { facing: 1, brows: .6 })], focus: 'olga' },
      { frame: 'med', cast: [OL(1450, 'protect', { facing: -1 }), SO(1360, 'scared', { turn: 0 }), M(1050, 'idle')], focus: 'olga' },
      { loc: 'yard', opt: { ...quake }, frame: 'close', cast: [SO(1360, 'idle', { lookX: -6 })] },
      { loc: 'street', opt: { ...quake }, frame: 'med', cast: [OL(1300, 'idle', { facing: -1, lookX: 5 }), M(1000, 'idle', { lookX: 7, brows: .4 })], focus: 'mark' } ] },
  '015': { loc: 'street', opt: { ...quake, mchs: 1, crowd: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(5, 200, 2100, 500, 40, { act: 'walk' }), M(500, 'walk', { x1: 1100 }), SO(620, 'walk', { x1: 1220 }), OL(760, 'walk', { x1: 1380 })] },
      { frame: 'close', zoom: [1.7, 1.8], center: [1450, 800], cast: [] },
      { loc: 'school_ext', opt: { ...quake, gymLit: 1 }, frame: 'wide', cast: [...crowd(7, 300, 2100, 200, 45, { act: 'walk' })] },
      { loc: 'school_ext', opt: { ...quake, gymLit: 1 }, frame: 'med', cast: [M(900, 'walk', { x1: 1250 }), SO(1000, 'walk', { x1: 1350 }), OL(1120, 'walk', { x1: 1470 })] } ] },
  '016': { loc: 'street', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'wide', cast: [M(900, 'walk', { x1: 1500, lookX: -6 }), OL(780, 'walk', { x1: 1380 }), SO(660, 'walk', { x1: 1260 })] },
      { loc: 'highrise_hall', opt: { ...quake, floor: '9—10' }, frame: 'wide', cast: [], fx0: 1, fx: { flicker: 1 } },
      { frame: 'close', cast: [M(1200, 'idle', { lookX: -8, turn: .4 })] } ] },
  '017': { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:58' }, shots: [
      { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, frame: 'wide', cast: [], fx: SNOW },
      { frame: 'wide', cast: [...crowd(4, 1600, 2100, 0, 50, { act: 'sit' }), OL(1300, 'sit', { facing: -1 }), SO(1180, 'lie', { y: G - 80, sc: .9 }), M(700, 'idle', { lookY: -8, lookX: 6 })] },
      { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, frame: 'med', zoom: [1.5, 1.6], center: [1700, 640], cast: [], fx: SNOW },
      { frame: 'close', cast: [OL(1300, 'sit', { facing: -1 }), SO(1180, 'lie', { y: G - 80, sc: .9 })], focus: 'sonya', zoom: [1.8, 1.9], center: [1220, 900] },
      { frame: 'close', cast: [M(1000, 'idle', { lookY: -8, lookX: 6 })] } ],
    inserts: [{ type: 'clock', text: '4:58', at: 21, len: 1.4 }, { type: 'clock', text: '5:05', at: 22.6, len: 1.2 }, { type: 'clock', text: '5:10', at: 24, len: 1.3 }] },
  '018': { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '5:10' }, shots: [
      { frame: 'close', cast: [M(1000, 'idle', { brows: .7, lookY: 6 })] },
      { loc: 'switchroom', opt: night, frame: 'wide', cast: [{ prop: 'bolt', x0: 1260, y: 560 }], fx0: 1, fx: { sparks: [1300, 470], flicker: 1 } } ], quakes: [{ at: 1, amp: 3, len: 10 }] },
  '019': { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '5:12' }, cast: [M(1000, 'idle', { brows: 1, lookY: -8 })], frames: ['close'], inserts: [{ type: 'clock', text: '5:12', at: 0, len: 1.6 }] },
  '020': { loc: 'gym', opt: { time: 'blackout', state: 'quake', clock: '5:12' }, fx: { dust: 1 }, shots: [
      { frame: 'wide', cast: [...crowd(5, 1500, 2150, 0, 60, { act: 'sit' }), M(900, 'shout'), OL(1400, 'protect', { facing: -1 })] },
      { frame: 'close', cast: [M(900, 'shout')] },
      { loc: 'school_ext', opt: { time: 'blackout', state: 'ruin' }, frame: 'wide', cast: [], fx: { dust: 1, embers: 1 } } ], quakes: [{ at: .1, amp: 26, len: 6 }] },
  '021': { dur: 1.6, black: { at: 0, fin: 1, fout: 1 }, flashes: [0] },
  '022': { loc: 'bench', opt: { time: 'night', state: 'ok' }, fx: SNOW, black: { at: 0, to: 1.2, fin: 0, fout: 30 }, shots: [
      { frame: 'close', cast: [M(1220, 'sit', { facing: -1, brows: .6 })] },
      { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '03:31' }, frame: 'close', zoom: [2.0, 2.2], center: [1200, 300], cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 7 }], fx0: 1, fx: {} } ] },
};
