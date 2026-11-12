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

// ---- особые прохожие (свой облик) ----
const LK = {
  pink: { top: 'coat', topC: ['#f08bb8', '#d06a98', '#a04c74'], pants: '#3a2a3a', shoe: '#e0d0e0', skin: ['#f2c9a6', '#d4a27d'], hair: 'bun', hairC: '#6a3a20', female: true, size: .95 },
  cat: { top: 'quilted', topC: ['#5a6b7a', '#46545f', '#2f3a42'], pants: '#232533', shoe: '#2a2624', skin: ['#f2c9a6', '#d4a27d'], hair: 'short', hairC: '#2a1d17', size: 1 },
  granny: { top: 'coat', topC: ['#6a4a6a', '#553a55', '#3a283a'], pants: '#2a2630', shoe: '#2a2624', skin: ['#f0c8a8', '#d0a080'], hair: 'grey', hairC: '#c9c6c0', female: true, elder: true, size: .9 },
  shorts: { top: 'hoodie', topC: ['#3b6b9b', '#2d5476', '#1f3a52'], pants: '#c99a76', shoe: '#e8e8e8', skin: ['#f2c9a6', '#d4a27d'], hair: 'short', hairC: '#4a2e1f', size: 1.02 },
  guard: { top: 'quilted', topC: ['#2a2a32', '#222228', '#16161a'], pants: '#1a1a20', shoe: '#111', skin: ['#efc7a4', '#cf9d78'], hair: 'short', hairC: '#3a3a3a', size: 1.03 },
  oldman: { top: 'quilted', topC: ['#6b6b72', '#55555c', '#3c3c42'], pants: '#2b2b2f', shoe: '#1c1a19', skin: ['#efc7a4', '#cf9d78'], hair: 'grey', hairC: '#d0ccc6', elder: true, size: .95 },
};
const P = (id, lk, x0, act = 'idle', o = {}) => ({ who: 'custom', id, look: LK[lk], x0, act, y: G - 40, sc: .92, ...o });
const PE = (x0, act = 'idle', o = {}) => ({ who: 'petrovich', id: 'petrovich', voice: 'PETR', x0, act, ...o });
const TI = (x0, act = 'idle', o = {}) => ({ who: 'timur', id: 'timur', voice: 'BOY', x0, act, ...o });
let RSn = 0; const RS = (x0, act = 'idle', o = {}) => ({ who: 'rescuer', id: 'rs' + (++RSn), voice: 'MALE_RS', x0, act, ...o });
const CAR = (x0, c, o = {}) => ({ prop: 'car', x0, c, y: G - 10, sc: 1.1, ...o });
const sitM = (x0, o = {}) => M(x0, 'idle', { sitting: 1, seatY: 70, turn: .85, facing: -1, ...o });

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
  // ===== СЕРИЯ 2 · ДЕЖАВЮ =====
  '023': { dur: 2.8 },
  '024': { loc: 'bench', opt: night, fx: { snow: 260 }, black: { at: 0, to: .8, fin: 0, fout: 24 }, shots: [
      { frame: 'med', cast: [sitM(1220, { acts: [[0, 'look_hands'], ['люстра', 'look_up']] })] },
      { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '03:31' }, frame: 'close', zoom: [2.0, 2.15], center: [1200, 300], cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 8 }], fx0: 1, fx: {} },
      { frame: 'wide', cast: [sitM(1220, { acts: [[0, 'look_hands']], brows: .6 })], w: .9 } ] },
  '025': { loc: 'bench', opt: night, fx: SNOW, shots: [
      { frame: 'med', cast: [sitM(1220, { acts: [[0, 'facepalm'], ['сплю+0.6', 'shake_head']] })], w: .8 },
      { frame: 'wide', cast: [sitM(1220, { acts: [[0, 'look_back']] }), P('pink', 'pink', 500, 'run', { x1: 2050, walk: ['пробежала', 'выругалась+1.2'], flail: 1 }),
          { prop: 'fall', item: 'keys', x0: 1300, y0: G - 330, at: 'уронила', vx: 120, sc: 1.4 }], w: 1.4 },
      { frame: 'close', zoom: [1.9, 2.0], center: [1420, 900], cast: [{ prop: 'fall', item: 'keys', x0: 1300, y0: G - 330, at: 'уронила', vx: 120, sc: 1.4 }, sitM(1220, { acts: [[0, 'look_back']] })], w: .9 } ] },
  '026': { loc: 'yard', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [CAR(800, '#e8e8ea', { at: 'завыла' }), CAR(1650, '#2f4f9a', { at: 'присоединился' }), M(1220, 'idle', { turn: .5, lookX: -6, acts: [['завыла', 'look_back'], ['присоединился', 'idle']] })], w: 1.2 },
      { frame: 'med', center: [1650, 820], zoom: [1.5, 1.6], cast: [CAR(1650, '#2f4f9a', { at: 'присоединился' })], w: .8 },
      { loc: 'yard', opt: { ...night, flip: 1 }, frame: 'wide', cast: [{ dog: 1, x0: 2050, x1: 1500, facing: -1, bark: 1 }, M(1050, 'idle', { acts: [[0, 'idle'], ['залаял', 'shrug']] })], focus: 'mark', w: 1 },
      { loc: 'bench', opt: night, frame: 'close', cast: [M(1200, 'look_up', { brows: .6 })], fx: { snow: 300, snowBig: 1 }, w: .8 } ] },
  '027': { loc: 'bench', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [M(900, 'walk', { x1: 1220, walk: [0, 'скамейку+0.4'], facing: 1, acts: [['скамейку+0.5', 'idle']] })], w: .7 },
      { frame: 'med', cast: [sitM(1220, { acts: [[0, 'scratch'], ['перебери', 'talk'], ['первый', 'shake_head']] })], w: 1.1 },
      { frame: 'close', cast: [sitM(1220, { acts: [[0, 'facepalm'], ['сотрясения', 'shake_head']] })], w: .9 },
      { loc: 'ruins', opt: { time: 'blackout', state: 'ruin' }, frame: 'med', center: [1150, 900], cast: [M(1100, 'lie', { y: G - 110 }), { prop: 'debris', x0: 800, x1: 1500, y0: 300, n: 6, always: 1 }], fx0: 1, fx: { dust: 1 }, w: 1 },
      { frame: 'close', cast: [sitM(1220, { acts: [[0, 'shake_head'], ['одно', 'look_hands']], brows: .7 })], w: .7 },
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '5:12' }, frame: 'wide', cast: [...crowd(6, 400, 1900, 0, 70, { act: 'sit', mood: 'chatter' }), { prop: 'debris', x0: 300, x1: 2100, y0: 150, n: 18, always: 1, at: 'падает' }], fx0: 1, fx: { dust: 1 }, w: 1 },
      { frame: 'med', cast: [M(1220, 'idle', { turn: .4, brows: .8, lookX: -4, acts: [['попробовать', 'nod']] })], w: .8 } ],
    quakes: [{ at: 'падает', amp: 8, len: 1.6 }] },
  '028': { loc: 'bench', opt: night, fx: SNOW, cast: [sitM(1220, { acts: [[0, 'phone_look'], ['набрал+0.5', 'phone'], ['молчал+0.4', 'phone_look'], ['ничего', 'shake_head']] })],
    frames: ['med', 'close'], inserts: [{ type: 'phone', time: '3:17', sub: 'нет сети', at: 'экране', len: 4 }] },
  '029': { loc: 'yard', opt: { ...night, flip: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [SO(1450, 'idle', { lookX: -6, facing: -1 }), M(600, 'walk', { x1: 1180, walk: [0, 3.2] })], focus: 'sonya', w: 1 },
      { frame: 'med', center: [1320, 760], cast: [SO(1450, 'idle', { facing: -1, lookX: -6 }), M(1180, 'idle', { turn: .5, acts: [['знаю', 'talk'], ['пошли', 'point']] })], w: 1.2 },
      { frame: 'close', cast: [SO(1450, 'idle', { facing: -1, brows: .8, lookX: -6, acts: [['откуда', 'talk']] })], focus: 'sonya', w: .9 },
      { frame: 'med', cast: [M(1180, 'idle', { turn: .5, acts: [['электрик', 'shrug'], ['неправда', 'idle'], ['правда', 'nod'], ['секретная', 'point_up'], ['хихикнула', 'idle']] }), SO(1450, 'idle', { facing: -1, acts: [['неправда', 'shake_head'], ['хихикнула', 'shrug']] })], focus: 'mark', w: 1.4 },
      { frame: 'close', cast: [SO(1450, 'idle', { facing: -1, lookX: -6, brows: .2, acts: [['хихикнула', 'shrug']] })], focus: 'sonya', w: .7 } ] },
  '030': { loc: 'street', opt: { ...night, crowd: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(7, 200, 1800, 700, 80, { act: 'walk', mood: 'chatter' }), M(1450, 'idle', { facing: -1, turn: .3, acts: [['кричать', 'wave_both'], ['слышите', 'shout']] }), SO(1620, 'idle', { facing: -1 })], focus: 'mark', w: 1.2 },
      { frame: 'med', cast: [M(1300, 'shout', { facing: -1 }), P('cat', 'cat', 500, 'walk', { x1: 2100, walk: ['мужчина', 'бабушка'], hold: 'bag' }), P('granny', 'granny', 400, 'walk', { x1: 1900, walk: ['бабушка', 'парень+1'], hold: 'icon' })], focus: 'mark', w: 1.2 },
      { frame: 'close', cast: [P('shorts', 'shorts', 700, 'walk', { x1: 1900, walk: ['парень', 'головы+1.5'] }), M(1350, 'idle', { facing: -1, acts: [[0, 'beckon'], ['головы', 'grab_head']] })], focus: 'mark', w: 1 } ] },
  '031': { loc: 'street', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [CAR(1500, '#e8e8ee', { stripe: '#d8323a', driver: 1, sc: 1.5 }), M(600, 'run', { x1: 1880, walk: [0, 'заколотил'], acts: [['заколотил', 'knock']], facing: 1 })], focus: 'mark', w: 1 },
      { frame: 'med', center: [1700, 760], cast: [CAR(1500, '#e8e8ee', { stripe: '#d8323a', driver: 1, sc: 1.5 }), M(1880, 'knock', { facing: -1, turn: .85, acts: [['сильнее', 'knock'], ['понял', 'look_hands']] })], w: 1.2 },
      { frame: 'close', cast: [M(1880, 'look_hands', { facing: -1, turn: .85, brows: .9 })], w: .8 } ] },
  '031а': { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(6, 300, 1500, 600, 90, { act: 'walk', mood: 'chatter' }), M(1700, 'wave_both', { facing: -1, acts: [['раскинув', 'wave_both']] })], focus: 'mark', w: 1 },
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:31' }, frame: 'wide', cast: [{ prop: 'doors', x0: 1200, at: 0, w: 150, h: 330, y: G - 20 }, ...crowd(5, 600, 1100, 500, 95, { act: 'walk' }), M(1200, 'protect', { acts: [[0, 'wave_both'], ['задевая', 'protect']] })], focus: 'mark', w: 1.1 },
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:31' }, frame: 'med', cast: [P('guard', 'guard', 1350, 'idle', { hold: 'clipboard', facing: -1, lookY: 7 }), M(1180, 'shout', { acts: [[0, 'idle'], ['заорал', 'shout'], ['почесал', 'idle']] })], focus: 'mark', w: 1.1 },
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:31' }, frame: 'close', cast: [P('guard', 'guard', 1250, 'idle', { facing: -1, lookY: 7, acts: [['почесал', 'scratch'], ['перевернул', 'idle']], hold: 'clipboard' })], focus: 'guard', w: .8 },
      { loc: 'street', opt: night, frame: 'wide', cast: [P('walker', 'cat', 2050, 'walk', { x1: 700, walk: ['вышел', 'сугроб+1'] }), M(1200, 'wave_both', { facing: 1, acts: [['шёл', 'idle'], ['отступить', 'dodge'], ['сказал', 'shrug']] })], focus: 'mark', w: 1.3 },
      { frame: 'close', loc: 'street', opt: night, cast: [M(1200, 'idle', { turn: .4, acts: [['шок', 'scratch'], ['читал', 'shrug']] })], w: 1 } ] },
  '033': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'wide', cast: [P('oldman', 'oldman', 1650, 'sit', { facing: -1, sitting: 1, turn: .85 }), OL(1500, 'bandage', { facing: 1, turn: .85, acts: [['мама', 'protect']] }), SO(700, 'run', { x1: 1380, walk: ['мама', 'схватила'], flail: 0 }), M(650, 'walk', { x1: 1050, walk: [0, 'схватила'] })], focus: 'olga', w: 1.2 },
      { frame: 'close', center: [1380, 960], zoom: [1.9, 2.0], cast: [{ prop: 'fall', item: 'bunny', x0: 1380, y0: G - 260, at: 'упал', sc: 1.1, until: 'подняла' }, M(1050, 'reach', { acts: [[0, 'idle'], ['потянулся', 'reach']], facing: 1 }), SO(1380, 'scared', { turn: 0, acts: [['подняла', 'holdup']], noBunny: 1 })], w: 1 } ] },
  '034': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'med', cast: [M(1150, 'idle', { turn: .5, acts: [[0, 'shake_head'], ['значит', 'idle']] }), SO(1380, 'idle', { facing: -1 })], focus: 'mark', w: .9 },
      { frame: 'med', cast: [M(1200, 'talk', { kneeling: 1, turn: .85, acts: [['сонь', 'talk'], ['стадион', 'point']] }), SO(1420, 'idle', { facing: -1, lookX: -6 })], center: [1320, 800], w: 1.2 },
      { frame: 'med', cast: [OL(1500, 'bandage', { facing: -1, turn: .85, acts: [['какой', 'idle']] }), SO(1330, 'idle', { facing: 1, acts: [['дёрнула', 'reach'], ['мам', 'talk']] })], focus: 'olga', w: 1.2 },
      { frame: 'close', cast: [SO(1330, 'idle', { facing: 1, brows: .3 })], focus: 'sonya', w: .7 } ] },
  '035': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'wide', cast: [{ prop: 'beam', x0: 1530, y0: 560, ang: 180, sweep: 35, spd: .8, len: 1100, w: 14 }, OL(1530, 'idle', { facing: -1, acts: [[0, 'shake_head']] }), M(950, 'idle', { turn: .4, brows: .5 })], focus: 'mark', w: 1.2 },
      { frame: 'close', cast: [M(950, 'idle', { turn: .4, acts: [['темно', 'shrug']], brows: .4 })], w: .8 },
      { frame: 'med', cast: [OL(1500, 'idle', { facing: -1, acts: [['ладно', 'talk']] }), SO(1350, 'holdup', {})], focus: 'olga', w: 1 } ] },
  '036': { loc: 'stadium', opt: night, fx: { snow: 260, snowBig: 1 }, shots: [
      { frame: 'xwide', cast: [...crowd(4, 700, 1100, 0, 100, { mood: 'cold' }), ...crowd(3, 1500, 1800, 0, 110, { mood: 'cold' })], w: 1.1 },
      { frame: 'med', cast: [OL(1100, 'shiver', { facing: 1 }), SO(1240, 'shiver', {}), M(1450, 'idle', { facing: -1, turn: .5, lookX: 6 })], focus: 'mark', w: 1 },
      { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, frame: 'wide', cast: [], w: 1 },
      { frame: 'close', cast: [M(1450, 'idle', { facing: 1, turn: .85, brows: .7, lookX: 4 })], w: .9 } ] },
  '037': { dur: 2.2, loc: 'stadium', opt: night, fx: SNOW, frames: ['med'], center: [1200, 420], zoom: [1.6, 1.8], cast: [], inserts: [{ type: 'clock', text: '5:12', at: 0, len: 2 }] },
  '038': { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, fx: { snow: 160 }, shots: [
      { frame: 'wide', cast: [], w: .5 },
      { loc: 'school_ext', opt: { time: 'blackout', state: 'ruin' }, frame: 'wide', zoom: [1.0, 1.25], cast: [{ prop: 'debris', x0: 1500, x1: 2100, y0: 300, n: 10, always: 1 }], fx0: 1, fx: { dust: 1, snow: 120 }, w: 1 } ],
    quakes: [{ at: 0.1, amp: 22, len: 2 }], flashes: ['погас'] },
  '039': { loc: 'stadium', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(5, 500, 1200, 0, 120, { mood: 'panic' }), OL(1500, 'protect', { facing: -1 }), SO(1400, 'scared', {})], focus: 'olga', w: 1 },
      { frame: 'close', cast: [OL(1500, 'protect', { facing: -1, brows: 1 }), SO(1400, 'idle', { lookX: 6, brows: .9 })], focus: 'sonya', w: 1 },
      { frame: 'close', cast: [M(1150, 'idle', { turn: .3, brows: 1, lookX: 6 })], w: .8 } ] },
  // ===== СЕРИЯ 2 · ДЕЖАВЮ =====
  '023': { dur: 2.8 },
  '024': { loc: 'bench', opt: night, fx: { snow: 260 }, black: { at: 0, to: .8, fin: 0, fout: 24 }, shots: [
      { frame: 'med', cast: [sitM(1220, { acts: [[0, 'look_hands'], ['люстра', 'look_up']] })] },
      { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '03:31' }, frame: 'close', zoom: [2.0, 2.15], center: [1200, 300], cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 8 }], fx0: 1, fx: {} },
      { frame: 'wide', cast: [sitM(1220, { acts: [[0, 'look_hands']], brows: .6 })], w: .9 } ] },
  '025': { loc: 'bench', opt: night, fx: SNOW, shots: [
      { frame: 'med', cast: [sitM(1220, { acts: [[0, 'facepalm'], ['сплю+0.6', 'shake_head']] })], w: .8 },
      { frame: 'wide', cast: [sitM(1220, { acts: [[0, 'look_back']] }), P('pink', 'pink', 500, 'run', { x1: 2050, walk: ['пробежала', 'выругалась+1.2'], flail: 1 }),
          { prop: 'fall', item: 'keys', x0: 1300, y0: G - 330, at: 'уронила', vx: 120, sc: 1.4 }], w: 1.4 },
      { frame: 'close', zoom: [1.9, 2.0], center: [1420, 900], cast: [{ prop: 'fall', item: 'keys', x0: 1300, y0: G - 330, at: 'уронила', vx: 120, sc: 1.4 }, sitM(1220, { acts: [[0, 'look_back']] })], w: .9 } ] },
  '026': { loc: 'yard', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [CAR(800, '#e8e8ea', { at: 'завыла' }), CAR(1650, '#2f4f9a', { at: 'присоединился' }), M(1220, 'idle', { turn: .5, lookX: -6, acts: [['завыла', 'look_back'], ['присоединился', 'idle']] })], w: 1.2 },
      { frame: 'med', center: [1650, 820], zoom: [1.5, 1.6], cast: [CAR(1650, '#2f4f9a', { at: 'присоединился' })], w: .8 },
      { loc: 'yard', opt: { ...night, flip: 1 }, frame: 'wide', cast: [{ dog: 1, x0: 2050, x1: 1500, facing: -1, bark: 1 }, M(1050, 'idle', { acts: [[0, 'idle'], ['залаял', 'shrug']] })], focus: 'mark', w: 1 },
      { loc: 'bench', opt: night, frame: 'close', cast: [M(1200, 'look_up', { brows: .6 })], fx: { snow: 300, snowBig: 1 }, w: .8 } ] },
  '027': { loc: 'bench', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [M(900, 'walk', { x1: 1220, walk: [0, 'скамейку+0.4'], facing: 1, acts: [['скамейку+0.5', 'idle']] })], w: .7 },
      { frame: 'med', cast: [sitM(1220, { acts: [[0, 'scratch'], ['перебери', 'talk'], ['первый', 'shake_head']] })], w: 1.1 },
      { frame: 'close', cast: [sitM(1220, { acts: [[0, 'facepalm'], ['сотрясения', 'shake_head']] })], w: .9 },
      { loc: 'ruins', opt: { time: 'blackout', state: 'ruin' }, frame: 'med', center: [1150, 900], cast: [M(1100, 'lie', { y: G - 110 }), { prop: 'debris', x0: 800, x1: 1500, y0: 300, n: 6, always: 1 }], fx0: 1, fx: { dust: 1 }, w: 1 },
      { frame: 'close', cast: [sitM(1220, { acts: [[0, 'shake_head'], ['одно', 'look_hands']], brows: .7 })], w: .7 },
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '5:12' }, frame: 'wide', cast: [...crowd(6, 400, 1900, 0, 70, { act: 'sit', mood: 'chatter' }), { prop: 'debris', x0: 300, x1: 2100, y0: 150, n: 18, always: 1, at: 'падает' }], fx0: 1, fx: { dust: 1 }, w: 1 },
      { frame: 'med', cast: [M(1220, 'idle', { turn: .4, brows: .8, lookX: -4, acts: [['попробовать', 'nod']] })], w: .8 } ],
    quakes: [{ at: 'падает', amp: 8, len: 1.6 }] },
  '028': { loc: 'bench', opt: night, fx: SNOW, cast: [sitM(1220, { acts: [[0, 'phone_look'], ['набрал+0.5', 'phone'], ['молчал+0.4', 'phone_look'], ['ничего', 'shake_head']] })],
    frames: ['med', 'close'], inserts: [{ type: 'phone', time: '3:17', sub: 'нет сети', at: 'экране', len: 4 }] },
  '029': { loc: 'yard', opt: { ...night, flip: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [SO(1450, 'idle', { lookX: -6, facing: -1 }), M(600, 'walk', { x1: 1180, walk: [0, 3.2] })], focus: 'sonya', w: 1 },
      { frame: 'med', center: [1320, 760], cast: [SO(1450, 'idle', { facing: -1, lookX: -6 }), M(1180, 'idle', { turn: .5, acts: [['знаю', 'talk'], ['пошли', 'point']] })], w: 1.2 },
      { frame: 'close', cast: [SO(1450, 'idle', { facing: -1, brows: .8, lookX: -6, acts: [['откуда', 'talk']] })], focus: 'sonya', w: .9 },
      { frame: 'med', cast: [M(1180, 'idle', { turn: .5, acts: [['электрик', 'shrug'], ['неправда', 'idle'], ['правда', 'nod'], ['секретная', 'point_up'], ['хихикнула', 'idle']] }), SO(1450, 'idle', { facing: -1, acts: [['неправда', 'shake_head'], ['хихикнула', 'shrug']] })], focus: 'mark', w: 1.4 },
      { frame: 'close', cast: [SO(1450, 'idle', { facing: -1, lookX: -6, brows: .2, acts: [['хихикнула', 'shrug']] })], focus: 'sonya', w: .7 } ] },
  '030': { loc: 'street', opt: { ...night, crowd: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(7, 200, 1800, 700, 80, { act: 'walk', mood: 'chatter' }), M(1450, 'idle', { facing: -1, turn: .3, acts: [['кричать', 'wave_both'], ['слышите', 'shout']] }), SO(1620, 'idle', { facing: -1 })], focus: 'mark', w: 1.2 },
      { frame: 'med', cast: [M(1300, 'shout', { facing: -1 }), P('cat', 'cat', 500, 'walk', { x1: 2100, walk: ['мужчина', 'бабушка'], hold: 'bag' }), P('granny', 'granny', 400, 'walk', { x1: 1900, walk: ['бабушка', 'парень+1'], hold: 'icon' })], focus: 'mark', w: 1.2 },
      { frame: 'close', cast: [P('shorts', 'shorts', 700, 'walk', { x1: 1900, walk: ['парень', 'головы+1.5'] }), M(1350, 'idle', { facing: -1, acts: [[0, 'beckon'], ['головы', 'grab_head']] })], focus: 'mark', w: 1 } ] },
  '031': { loc: 'street', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [CAR(1500, '#e8e8ee', { stripe: '#d8323a', driver: 1, sc: 1.5 }), M(600, 'run', { x1: 1880, walk: [0, 'заколотил'], acts: [['заколотил', 'knock']], facing: 1 })], focus: 'mark', w: 1 },
      { frame: 'med', center: [1700, 760], cast: [CAR(1500, '#e8e8ee', { stripe: '#d8323a', driver: 1, sc: 1.5 }), M(1880, 'knock', { facing: -1, turn: .85, acts: [['сильнее', 'knock'], ['понял', 'look_hands']] })], w: 1.2 },
      { frame: 'close', cast: [M(1880, 'look_hands', { facing: -1, turn: .85, brows: .9 })], w: .8 } ] },
  '031а': { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(6, 300, 1500, 600, 90, { act: 'walk', mood: 'chatter' }), M(1700, 'wave_both', { facing: -1, acts: [['раскинув', 'wave_both']] })], focus: 'mark', w: 1 },
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:31' }, frame: 'wide', cast: [{ prop: 'doors', x0: 1200, at: 0, w: 150, h: 330, y: G - 20 }, ...crowd(5, 600, 1100, 500, 95, { act: 'walk' }), M(1200, 'protect', { acts: [[0, 'wave_both'], ['задевая', 'protect']] })], focus: 'mark', w: 1.1 },
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:31' }, frame: 'med', cast: [P('guard', 'guard', 1350, 'idle', { hold: 'clipboard', facing: -1, lookY: 7 }), M(1180, 'shout', { acts: [[0, 'idle'], ['заорал', 'shout'], ['почесал', 'idle']] })], focus: 'mark', w: 1.1 },
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:31' }, frame: 'close', cast: [P('guard', 'guard', 1250, 'idle', { facing: -1, lookY: 7, acts: [['почесал', 'scratch'], ['перевернул', 'idle']], hold: 'clipboard' })], focus: 'guard', w: .8 },
      { loc: 'street', opt: night, frame: 'wide', cast: [P('walker', 'cat', 2050, 'walk', { x1: 700, walk: ['вышел', 'сугроб+1'] }), M(1200, 'wave_both', { facing: 1, acts: [['шёл', 'idle'], ['отступить', 'dodge'], ['сказал', 'shrug']] })], focus: 'mark', w: 1.3 },
      { frame: 'close', loc: 'street', opt: night, cast: [M(1200, 'idle', { turn: .4, acts: [['шок', 'scratch'], ['читал', 'shrug']] })], w: 1 } ] },
  '033': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'wide', cast: [P('oldman', 'oldman', 1650, 'sit', { facing: -1, sitting: 1, turn: .85 }), OL(1500, 'bandage', { facing: 1, turn: .85, acts: [['мама', 'protect']] }), SO(700, 'run', { x1: 1380, walk: ['мама', 'схватила'], flail: 0 }), M(650, 'walk', { x1: 1050, walk: [0, 'схватила'] })], focus: 'olga', w: 1.2 },
      { frame: 'close', center: [1380, 960], zoom: [1.9, 2.0], cast: [{ prop: 'fall', item: 'bunny', x0: 1380, y0: G - 260, at: 'упал', sc: 1.1, until: 'подняла' }, M(1050, 'reach', { acts: [[0, 'idle'], ['потянулся', 'reach']], facing: 1 }), SO(1380, 'scared', { turn: 0, acts: [['подняла', 'holdup']], noBunny: 1 })], w: 1 } ] },
  '034': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'med', cast: [M(1150, 'idle', { turn: .5, acts: [[0, 'shake_head'], ['значит', 'idle']] }), SO(1380, 'idle', { facing: -1 })], focus: 'mark', w: .9 },
      { frame: 'med', cast: [M(1200, 'talk', { kneeling: 1, turn: .85, acts: [['сонь', 'talk'], ['стадион', 'point']] }), SO(1420, 'idle', { facing: -1, lookX: -6 })], center: [1320, 800], w: 1.2 },
      { frame: 'med', cast: [OL(1500, 'bandage', { facing: -1, turn: .85, acts: [['какой', 'idle']] }), SO(1330, 'idle', { facing: 1, acts: [['дёрнула', 'reach'], ['мам', 'talk']] })], focus: 'olga', w: 1.2 },
      { frame: 'close', cast: [SO(1330, 'idle', { facing: 1, brows: .3 })], focus: 'sonya', w: .7 } ] },
  '035': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'wide', cast: [{ prop: 'beam', x0: 1530, y0: 560, ang: 180, sweep: 35, spd: .8, len: 1100, w: 14 }, OL(1530, 'idle', { facing: -1, acts: [[0, 'shake_head']] }), M(950, 'idle', { turn: .4, brows: .5 })], focus: 'mark', w: 1.2 },
      { frame: 'close', cast: [M(950, 'idle', { turn: .4, acts: [['темно', 'shrug']], brows: .4 })], w: .8 },
      { frame: 'med', cast: [OL(1500, 'idle', { facing: -1, acts: [['ладно', 'talk']] }), SO(1350, 'holdup', {})], focus: 'olga', w: 1 } ] },
  '036': { loc: 'stadium', opt: night, fx: { snow: 260, snowBig: 1 }, shots: [
      { frame: 'xwide', cast: [...crowd(4, 700, 1100, 0, 100, { mood: 'cold' }), ...crowd(3, 1500, 1800, 0, 110, { mood: 'cold' })], w: 1.1 },
      { frame: 'med', cast: [OL(1100, 'shiver', { facing: 1 }), SO(1240, 'shiver', {}), M(1450, 'idle', { facing: -1, turn: .5, lookX: 6 })], focus: 'mark', w: 1 },
      { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, frame: 'wide', cast: [], w: 1 },
      { frame: 'close', cast: [M(1450, 'idle', { facing: 1, turn: .85, brows: .7, lookX: 4 })], w: .9 } ] },
  '037': { dur: 2.2, loc: 'stadium', opt: night, fx: SNOW, frames: ['med'], center: [1200, 420], zoom: [1.6, 1.8], cast: [], inserts: [{ type: 'clock', text: '5:12', at: 0, len: 2 }] },
  '038': { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, fx: { snow: 160 }, shots: [
      { frame: 'wide', cast: [], w: .5 },
      { loc: 'school_ext', opt: { time: 'blackout', state: 'ruin' }, frame: 'wide', zoom: [1.0, 1.25], cast: [{ prop: 'debris', x0: 1500, x1: 2100, y0: 300, n: 10, always: 1 }], fx0: 1, fx: { dust: 1, snow: 120 }, w: 1 } ],
    quakes: [{ at: 0.1, amp: 22, len: 2 }], flashes: ['погас'] },
  '039': { loc: 'stadium', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(5, 500, 1200, 0, 120, { mood: 'panic' }), OL(1500, 'protect', { facing: -1 }), SO(1400, 'scared', {})], focus: 'olga', w: 1 },
      { frame: 'close', cast: [OL(1500, 'protect', { facing: -1, brows: 1 }), SO(1400, 'idle', { lookX: 6, brows: .9 })], focus: 'sonya', w: 1 },
      { frame: 'close', cast: [M(1150, 'idle', { turn: .3, brows: 1, lookX: 6 })], w: .8 } ] },

  // ===== СЕРИЯ 3 · ЭЛЕКТРИК =====
  '040': { dur: 2.8 },
  '041': { loc: 'yard', opt: night, fx: SNOW, black: { at: 0, to: .8, fin: 0, fout: 24 }, shots: [
      { frame: 'wide', cast: [{ prop: 'walllamp', x0: 1500, y0: 520, burst: 'электричество' }, M(1200, 'idle', { turn: .6, facing: 1, acts: [['электричество', 'reach']] })], w: 1 },
      { loc: 'school_ext', opt: { time: 'blackout', state: 'ruin' }, frame: 'wide', cast: [{ prop: 'debris', x0: 1500, x1: 2100, y0: 300, n: 8, always: 1 }], fx0: 1, fx: { dust: 1 }, w: .8 } ] },
  '042': { loc: 'bench', opt: night, fx: { snow: 320, snowBig: 1 }, shots: [
      { frame: 'med', cast: [sitM(1220, { acts: [[0, 'idle'], ['показывали', 'look_back'], ['21', 'scratch'], ['позже', 'facepalm']] })], w: 1.2 },
      { loc: 'boiler_ext', opt: night, frame: 'med', zoom: [1.6, 1.7], center: [1200, 520], cast: [], w: .6 },
      { frame: 'close', cast: [sitM(1220, { acts: [[0, 'look_hands'], ['значит', 'shake_head'], ['тает', 'look_hands']], brows: .8 })], fx: { snow: 300, snowBig: 1 }, w: 1.1 } ],
    inserts: [{ type: 'clock', text: '3:52', at: 'показывали#2', len: 2.2 }] },
  '043': { loc: 'yard', opt: { ...night, flip: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [{ prop: 'walllamp', x0: 1500, y0: 520, blinks: ['пошёл+0.5', 'мигнул', 'шаг', 'мигнул#2'], burst: 'вспыхнула' }, M(500, 'walk', { x1: 1250, walk: ['быстро', 'остановился'], acts: [['остановился', 'look_up']] })], focus: 'mark', w: 1 },
      { frame: 'med', cast: [{ prop: 'walllamp', x0: 1500, y0: 520, blinks: ['шаг', 'мигнул#2'], burst: 'вспыхнула' }, M(1150, 'walk', { x1: 1300, walk: ['шаг', 'ещё+0.5'], acts: [['поднял', 'reach']] })], focus: 'mark', w: 1.2 },
      { frame: 'close', center: [1900, 950], zoom: [1.9, 2.0], cast: [{ prop: 'walllamp', x0: 1500, y0: 520, burst: 'вспыхнула' }, { dog: 1, x0: 1900, facing: -1, wag: 1 }], w: .7 } ] },
  '044': { loc: 'yard', opt: { ...night, flip: 1 }, fx: { ...SNOW, sparks: [1500, 560] }, shots: [
      { frame: 'close', center: [1460, 560], zoom: [2.0, 2.1], cast: [{ prop: 'walllamp', x0: 1500, y0: 520, burst: 0 }, { prop: 'bolt', x0: 1480, y: 560 }, M(1300, 'reach', { lookY: -10 })], w: 1 },
      { frame: 'med', cast: [{ prop: 'walllamp', x0: 1500, y0: 520, burst: 0 }, M(1300, 'idle', { turn: .5, acts: [[0, 'shake_head'], ['лет', 'look_hands'], ['решил', 'idle'], ['использовать', 'nod']], brows: .6 })], focus: 'mark', w: 1.2 },
      { frame: 'close', cast: [M(1300, 'idle', { turn: .3, brows: .9, lookX: 5 })], w: .7 } ] },
  '045': { loc: 'yard', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [CAR(800, '#e8e8ea', { at: 'взвыла' }), CAR(1300, '#2f4f9a', { at: 'седан' }), CAR(1800, '#4a5a3a', { at: 'джип' }), M(600, 'walk', { x1: 2000, walk: ['провёл', 'гирлянда'], acts: [['провёл', 'reach']] })], focus: 'mark', w: 1.4 },
      { loc: 'street', opt: { ...night, flip: 1 }, frame: 'wide', zoom: [1.0, 1.08], cast: [
          { prop: 'streetlamp', x0: 700, at: 'побежал+0.3' }, { prop: 'streetlamp', x0: 1150, at: 'побежал+1.0' }, { prop: 'streetlamp', x0: 1600, at: 'побежал+1.7' }, { prop: 'streetlamp', x0: 2050, at: 'побежал+2.4' },
          M(300, 'run', { x1: 2300, walk: ['побежал', 'засмеялся+2'] })], w: 1.3 },
      { loc: 'street', opt: { ...night, flip: 1 }, frame: 'med', cast: [{ prop: 'streetlamp', x0: 1350, at: 0 }, M(1200, 'idle', { turn: .3, acts: [[0, 'talk'], ['бессилен', 'look_hands']], brows: .2 })], focus: 'mark', w: 1 } ] },
  '046': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'wide', cast: [SO(1400, 'idle', { facing: -1 }), M(700, 'run', { x1: 1200, walk: [0, 'минуту+0.6'] })], focus: 'mark', w: 1 },
      { frame: 'med', cast: [OL(1500, 'idle', { facing: -1, turn: .6, acts: [['спорить', 'nod'], ['пошла', 'walk']] }), SO(1330, 'idle', { acts: [['мам', 'talk']] }), M(1100, 'idle', { turn: .5 })], focus: 'olga', w: 1.2 },
      { loc: 'street', opt: night, frame: 'wide', cast: [M(500, 'run', { x1: 2100, walk: ['побежал', 'побежал+3.5'] })], w: .8 } ] },
  '047': { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [{ prop: 'alarmbox', x0: 1300, y0: 640, at: 'сирена' }, M(700, 'walk', { x1: 1180, walk: [0, 'висит+1'], acts: [['школах', 'point']] })], focus: 'mark', w: .9 },
      { frame: 'close', center: [1280, 640], zoom: [2.0, 2.15], cast: [{ prop: 'alarmbox', x0: 1300, y0: 640, at: 'сирена' }, M(1180, 'panel', { turn: .85 })], fx: { sparks: [1300, 640] }, w: 1.3 },
      { frame: 'med', cast: [{ prop: 'alarmbox', x0: 1300, y0: 640, at: 'сирена' }, M(1180, 'panel', { turn: .85, brows: .9 })], focus: 'mark', fx: { ...SNOW, alarm: 1 }, w: .9 } ] },
  '048': { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, fx: { ...SNOW, alarm: 1 }, shots: [
      { loc: 'gym', opt: { time: 'night', state: 'ok', clock: '4:52' }, frame: 'wide', cast: [{ prop: 'doors', x0: 1700, at: 0, w: 150, h: 330, y: G - 20 },
          P('mchs', 'guard', 1200, 'beckon', { look: { ...LK.guard, topC: ['#e2622a', '#c24d1c', '#8f3712'] } }),
          ...crowd(6, 500, 1100, 700, 130, { act: 'run', flail: 1 })], fx: { alarm: 1 }, w: 1.1 },
      { frame: 'wide', cast: [...crowd(4, 1500, 1900, -1300, 140, { act: 'walk', hold: 'mat' }), ...crowd(3, 1650, 2100, -1200, 150, { act: 'walk', hold: 'kettle' }), { prop: 'alarmbox', x0: 1300, y0: 640, at: 0 }, M(1180, 'panel', { turn: .85 })], focus: 'mark', w: 1.2 },
      { frame: 'med', cast: [{ prop: 'alarmbox', x0: 1300, y0: 640, at: 0 }, M(1180, 'panel', { turn: .85, acts: [['засмеялся', 'shrug']] })], focus: 'mark', w: .9 } ] },
  '049': { loc: 'stadium', opt: night, fx: { snow: 220 }, shots: [
      { frame: 'xwide', cast: [...crowd(8, 400, 2000, 0, 160, { mood: 'cold' }), ...crowd(6, 600, 1800, 0, 180, { mood: 'chatter', y: G - 110, sc: .75 })], w: 1 } ] },
  '049а': { loc: 'stadium', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(5, 300, 900, 0, 190, { mood: 'chatter' }), SO(700, 'walk', { x1: 1350, walk: [0, 'толпу+0.8'] }), M(1550, 'idle', { facing: -1, turn: .5 })], focus: 'mark', w: 1 },
      { frame: 'med', center: [1450, 760], cast: [SO(1350, 'idle', { acts: [['сделал', 'reach'], ['почему', 'talk']] }), M(1550, 'idle', { facing: -1, turn: .5, acts: [['я', 'nod'], ['никому', 'point_up'], ['потому', 'talk'], ['уволят', 'shrug']] })], w: 1.4 },
      { frame: 'close', cast: [SO(1350, 'idle', { lookX: 6, brows: .5, acts: [['волшебник', 'talk']] })], focus: 'sonya', w: .8 },
      { frame: 'med', cast: [M(1550, 'idle', { facing: -1, turn: .5, acts: [['лучше', 'talk'], ['группы', 'nod']] }), SO(1350, 'idle', { brows: .1 })], focus: 'mark', w: 1 },
      { frame: 'wide', cast: [...crowd(6, 300, 1300, 0, 200, { mood: 'cold' }), M(1700, 'idle', { facing: -1, turn: .5, acts: [['считал', 'point'], ['помахал', 'wave']] }), SO(1150, 'holdup', { acts: [['помахала', 'wave']] })], focus: 'mark', w: 1.2 } ] },
  '050': { loc: 'stadium', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [{ prop: 'grate', x0: 1600 }, M(1100, 'idle', { turn: .7, facing: 1, acts: [['увидел', 'point']] })], focus: 'mark', w: 1 },
      { frame: 'close', center: [1600, 960], zoom: [2.0, 2.15], cast: [{ prop: 'grate', x0: 1600 }], w: 1 },
      { loc: 'shaft', opt: { time: 'night', cabinY: 1400 }, frame: 'wide', cast: [], fx0: 1, fx: { dust: 1 }, w: .8 },
      { frame: 'close', cast: [M(1100, 'idle', { turn: .5, brows: .9, acts: [['грузовик', 'grab_head']] })], w: .9 } ] },
  '051': { loc: 'stadium', opt: night, fx: SNOW, shots: [
      { frame: 'med', center: [1200, 420], zoom: [1.6, 1.75], cast: [], w: .7 },
      { frame: 'wide', cast: [...crowd(6, 300, 1100, 0, 210, { mood: 'cold' }), SO(1500, 'idle', { facing: -1 }), OL(1650, 'idle', { facing: -1 }), M(400, 'run', { x1: 1350, walk: ['побежал', 'мог+0.5'], acts: [['уводи', 'beckon']] })], focus: 'mark', w: 1.2 },
      { frame: 'med', cast: [SO(1400, 'run', { x1: 2100, walk: ['схватила', 'собой+1'] }), OL(1550, 'run', { x1: 2250, walk: ['схватила+0.3', 'собой+1.3'] }), M(1300, 'idle', { facing: 1, turn: .6 })], focus: 'mark', w: 1 },
      { frame: 'close', cast: [M(1300, 'idle', { turn: .4, brows: 1, acts: [['остальные', 'grab_head']] })], w: .7 } ],
    inserts: [{ type: 'clock', text: '5:09', at: 0, len: 2.4 }] },
  '052': { loc: 'stadium', opt: { time: 'blackout', state: 'quake' }, fx: { snow: 200, dust: 1 }, shots: [
      { frame: 'xwide', cast: [{ prop: 'pit', x0: 1200, at: 'просел', w: 520, len: 2.6, y: G + 90 }, { prop: 'mast', x0: 1700, at: 'наклонился', dir: -1 }, ...crowd(5, 250, 650, 0, 220, { mood: 'panic' }), ...crowd(4, 1750, 2150, 0, 230, { mood: 'panic' })], w: 1.3 },
      { frame: 'close', cast: [M(1150, 'idle', { turn: .3, brows: 1, acts: [[0, 'grab_head'], ['спас', 'look_hands']] })], w: 1 } ],
    quakes: [{ at: 0.1, amp: 20, len: 2.5 }, { at: 'просел', amp: 14, len: 3 }] },
  '053': { loc: 'shopwindow', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [M(1200, 'idle', { turn: .9, facing: -1, alpha: 1 })], w: 1 },
      { frame: 'med', zoom: [1.3, 1.45], center: [1200, 640], cast: [OL(1050, 'idle', { alpha: .45 }), SO(1180, 'holdup', { alpha: .45 }), { prop: 'glow', x0: 600, y: 300, r: 40, c: '#ffffff' }], w: 1.2 },
      { frame: 'close', cast: [M(1200, 'idle', { turn: .2, brows: .8, acts: [['показалось', 'shake_head']] })], w: .9 } ] },

  // ===== СЕРИЯ 4 · ТОТ, КТО НЕ СПИТ =====
  '054': { dur: 2.8 },
  '055': { loc: 'boiler_ext', opt: night, fx: SNOW, black: { at: 0, to: .8, fin: 0, fout: 24 }, shots: [
      { frame: 'med', center: [1150, 720], cast: [PE(1380, 'lantern_up', { facing: -1, turn: .7 }), M(980, 'idle', { turn: .7, brows: .6 })], w: 1.2 },
      { loc: 'gym', opt: { time: 'blackout', state: 'quake', clock: '5:12' }, frame: 'wide', cast: [...crowd(5, 500, 1900, 0, 240, { mood: 'panic' }), { prop: 'debris', x0: 400, x1: 2000, y0: 150, n: 14, always: 1 }], fx0: 1, fx: { dust: 1 }, w: 1 } ] },
  '056': { loc: 'bench', opt: night, fx: { snow: 260, snowBig: 1 }, shots: [
      { frame: 'med', cast: [sitM(1220, { acts: [[0, 'look_back'], ['ещё', 'look_hands']], brows: .7 })] } ],
    inserts: [{ type: 'clock', text: '4:14', at: 'показывали', len: 2.2 }, { type: 'timer', text: '58 МИН', at: 'оставалось', len: 3 }] },
  '057': { loc: 'yard', opt: { ...night, flip: 1 }, fx: SNOW, shots: [
      { frame: 'med', center: [1330, 760], cast: [SO(1450, 'idle', { facing: -1, brows: .8, lookX: -6, acts: [['прозрачный', 'talk'], ['бледный', 'shake_head']] }), M(1180, 'idle', { turn: .5, alpha: .82, acts: [['мороз', 'shrug'], ['спорить', 'look_hands']] })], w: 1.4 },
      { frame: 'close', cast: [SO(1450, 'idle', { facing: -1, brows: .9, lookX: -6, lookY: -4 })], focus: 'sonya', w: .7 },
      { frame: 'close', cast: [M(1180, 'look_hands', { turn: .5, alpha: .78, brows: .9 })], w: .9 } ] },
  '058': { loc: 'street', opt: { ...quake, flip: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [M(400, 'walk', { x1: 1700, walk: [0, 'найти'], alpha: .82, acts: [['найти', 'scratch']] })], w: 1.1 },
      { loc: 'ruins', opt: { time: 'blackout', state: 'ruin' }, frame: 'med', center: [1150, 900], cast: [M(1100, 'lie', { y: G - 110 }), { prop: 'beam', x0: 1700, y0: 500, ang: 150, sweep: 20, len: 900, w: 12 }], fx0: 1, fx: { dust: 1 }, w: .9 },
      { frame: 'med', cast: [M(1300, 'walk', { x1: 1600, alpha: .82, acts: [['нравилась', 'nod'], ['люди', 'idle']] })], focus: 'mark', w: 1 } ] },
  '059': { loc: 'boiler_ext', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [M(400, 'walk', { x1: 900, walk: [0, 'место+1'], alpha: .82 })], w: .9 },
      { loc: 'boiler_ext', opt: night, frame: 'xwide', zoom: [.95, 1.05], cast: [], fx: { snow: 120 }, w: .7 },
      { frame: 'wide', cast: [PE(1230, 'idle', { facing: -1, turn: .6, acts: [['поднял', 'lantern_up'], ['ну', 'talk']] }), M(880, 'idle', { turn: .7, alpha: .85 })], focus: 'petrovich', w: 1.1 },
      { frame: 'close', cast: [PE(1230, 'lantern_up', { facing: -1, turn: .6, acts: [['ну', 'talk'], ['чего', 'shrug']] })], focus: 'petrovich', w: 1 },
      { frame: 'close', cast: [M(1050, 'idle', { turn: .7, alpha: .85, brows: 1, acts: [['сел', 'scared'], ['видите', 'talk']] })], w: .8 } ] },
  '060': { loc: 'boiler_int', opt: { time: 'night' }, fx: { embers: 1 }, shots: [
      { frame: 'wide', cast: [PE(900, 'drink', { facing: 1, turn: .7, noProp: 1 }), M(1250, 'idle', { facing: -1, turn: .6, lookY: -4, lookX: -6 })], focus: 'mark', w: 1 },
      { frame: 'med', center: [600, 520], zoom: [1.7, 1.8], cast: [], w: .6 },
      { frame: 'med', cast: [PE(900, 'talk', { facing: 1, turn: .7, noProp: 1, acts: [['рассказал', 'drink'], ['коллектор', 'nod'], ['набережную', 'talk']] }), M(1250, 'talk', { facing: -1, turn: .6, acts: [['слушал', 'idle'], ['куда', 'talk']] })], focus: 'petrovich', w: 1.6 },
      { frame: 'close', cast: [PE(900, 'talk', { facing: 1, turn: .7, noProp: 1 })], focus: 'petrovich', w: .8 } ] },
  '061': { loc: 'boiler_int', opt: { time: 'night' }, fx: { embers: 1 }, shots: [
      { frame: 'close', cast: [PE(900, 'put_cup', { facing: 1, turn: .7, noProp: 1, acts: [['живёшь', 'talk'], ['дома', 'talk'], ['посмотрел', 'idle']], brows: .4 })], focus: 'petrovich', w: 1 },
      { frame: 'med', cast: [M(1250, 'talk', { facing: -1, turn: .6, alpha: .8, acts: [['садовой', 'talk'], ['некого', 'shrug'], ['посмотрел', 'look_hands']] }), PE(900, 'idle', { facing: 1, turn: .7, noProp: 1, brows: .7 })], focus: 'mark', w: 1 },
      { frame: 'close', cast: [PE(900, 'idle', { facing: 1, turn: .7, noProp: 1, brows: .8, lookY: 2 })], focus: 'petrovich', w: .8 } ] },
  '062': { loc: 'highrise_hall', opt: { ...quake, floor: '9—10' }, fx: { flicker: 1 }, shots: [
      { loc: 'street', opt: { ...quake }, frame: 'wide', cast: [M(500, 'walk', { x1: 1300, walk: [0, 'углу+1'], alpha: .82, acts: [['стук', 'look_back']] }), PE(350, 'walk', { x1: 1100, walk: [0, 'углу+1'] })], focus: 'mark', w: .9 },
      { frame: 'wide', cast: [M(800, 'idle', { turn: .7, alpha: .82, acts: [['доносился', 'look_up'], ['крикнул', 'beckon']] }), PE(600, 'idle', { turn: .7, facing: 1 })], focus: 'mark', w: 1.3 },
      { loc: 'cabin', opt: { time: 'night' }, frame: 'med', cast: [TI(1200, 'idle', { sitting: 1, sitDY: 250, turn: .85, acts: [['эй', 'talk'], ['сохраниться', 'shrug'], ['тимур', 'talk']] })], focus: 'timur', w: 1.2 },
      { frame: 'close', cast: [M(800, 'idle', { turn: .7, alpha: .82, brows: .8, acts: [['слышал', 'nod'], ['понимать', 'scratch']] })], w: 1.2 } ] },
  '063': { loc: 'shaft', opt: { time: 'night', cabinY: 300 }, shots: [
      { frame: 'wide', cast: [], w: .8 },
      { loc: 'cabin', opt: { time: 'night' }, frame: 'med', cast: [TI(1200, 'idle', { sitting: 1, sitDY: 250, turn: .85, acts: [['трогать', 'shrug'], ['худший', 'facepalm']] })], focus: 'timur', w: 1 },
      { loc: 'highrise_hall', opt: { ...quake, floor: '9—10' }, frame: 'close', cast: [M(800, 'idle', { turn: .7, alpha: .8, brows: .9 })], w: .8 } ] },
  '064': { loc: 'gas_station', opt: { time: 'blackout', state: 'quake', leak: 1 }, shots: [
      { frame: 'wide', cast: [{ prop: 'haze', x0: 900, x1: 1900, h: 380 }], w: 1 },
      { frame: 'close', center: [840, 860], zoom: [2.0, 2.1], cast: [{ prop: 'haze', x0: 600, x1: 1100, h: 300 }], w: 1 },
      { frame: 'med', cast: [{ prop: 'haze', x0: 900, x1: 1900, h: 380 }, M(1500, 'idle', { facing: -1, turn: .6, alpha: .8, acts: [[0, 'facepalm'], ['водитель', 'point']] })], focus: 'mark', w: 1 } ] },
  '065': { loc: 'street', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'close', cast: [M(1200, 'idle', { turn: .3, alpha: .8, acts: [[0, 'scratch'], ['лифт', 'talk'], ['оставалось', 'grab_head']] })], w: 1 } ],
    inserts: [{ type: 'plan', items: ['ЛИФТ · 20 МИН', 'ГАЗ · 20 МИН', 'ДО 5:12 · 26 МИН'], step: 110, at: 'лифт', len: 11 },
      { type: 'choice', opts: ['МАЛЬЧИК В ЛИФТЕ', 'ГАЗ НА ЗАПРАВКЕ'], at: 'одно', len: 3.5 }] },
  '066': { loc: 'street', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'med', center: [1180, 760], cast: [M(1100, 'idle', { turn: .6, alpha: .8, acts: [['петрович', 'talk'], ['пошёл#2', 'idle']] }), PE(1300, 'idle', { facing: -1, turn: .6, acts: [['сделаю', 'nod']] })], w: 1.1 },
      { frame: 'wide', cast: [PE(1300, 'walk', { x1: 2050, walk: ['пошёл#2', 'сердце+2'], acts: [['сердце', 'heart']] }), M(1050, 'idle', { turn: .7, alpha: .8 })], focus: 'petrovich', w: 1 } ] },
  '067': { loc: 'switchroom', opt: night, fx: { sparks: [1300, 470] }, shots: [
      { frame: 'wide', cast: [{ prop: 'bolt', x0: 1260, y: 560 }, M(1150, 'panel', { turn: .85, alpha: .8 })], w: 1 },
      { loc: 'shaft', opt: { time: 'night', cabinY: 420 }, frame: 'wide', cast: [], fx0: 1, fx: {}, w: .8 },
      { loc: 'cabin', opt: { time: 'night' }, frame: 'med', cast: [TI(1200, 'idle', { acts: [['едет', 'wave_both']] })], focus: 'timur', w: .8 } ],
    quakes: [{ at: 'дёрнулась', amp: 4, len: 1 }] },
  '068': { loc: 'highrise_hall', opt: { ...quake, floor: '9' }, shots: [
      { frame: 'wide', cast: [{ prop: 'doors', x0: 1200, at: 'открылись', w: 200, h: 740, y: G + 10, c: '#8a8e9a' }, TI(1200, 'run', { x1: 1500, walk: ['выскочил', 'шее'], facing: 1 }), M(1750, 'idle', { facing: -1, turn: .6, alpha: .78 })], focus: 'mark', w: 1.1 },
      { frame: 'med', center: [1620, 800], cast: [TI(1500, 'idle', { facing: 1, turn: .4, lookX: 6, acts: [['спасибо', 'wave'], ['бледный', 'talk']] }), M(1750, 'idle', { facing: -1, turn: .6, alpha: .75, brows: .7 })], w: 1 } ] },
  '069': { loc: 'city_aerial', opt: { time: 'blackout', state: 'quake', fire: 1 }, fx: { dust: 1, embers: 1 }, shots: [
      { frame: 'xwide', cast: [{ prop: 'boom', x0: 1500, y0: 760, at: 'вспыхнула', r: 460, len: 3.5 }], w: 1 },
      { loc: 'highrise_hall', opt: { time: 'blackout', state: 'quake', floor: '9' }, frame: 'wide', cast: [{ prop: 'fall', item: 'glass', x0: 1200, y0: 300, n: 14, dx: 120, gap: .06, at: 'стёкла', sc: 1.6 }], fx0: 1, fx: { fire: 1 }, w: 1 } ],
    quakes: [{ at: 0.1, amp: 22, len: 3 }], flashes: ['вспыхнула'] },
  '070': { loc: 'street', opt: { time: 'blackout', state: 'quake', fire: 1 }, fx: { snow: 120, fire: 1 }, shots: [
      { frame: 'wide', cast: [{ prop: 'glow', x0: 1450, y: G - 30, r: 30, c: '#ffd27a' }, PE(1250, 'lie', { y: G - 175, noProp: 1 }), M(700, 'run', { x1: 1050, walk: [0, 'лежал'], alpha: .8, acts: [['сел', 'idle']], kneeling: 0 })], focus: 'petrovich', w: 1 },
      { frame: 'med', center: [1200, 880], cast: [{ prop: 'glow', x0: 1450, y: G - 30, r: 30, c: '#ffd27a' }, PE(1250, 'lie', { y: G - 175, noProp: 1, awake: 1 }), M(1050, 'idle', { kneeling: 1, turn: .85, alpha: .78, brows: .9 })], w: 1.3 },
      { frame: 'close', cast: [M(1050, 'idle', { kneeling: 1, turn: .85, alpha: .75, brows: 1, acts: [['понял#2', 'talk']] })], w: .8 } ] },

  // ===== СЕРИЯ 5 · ПЯТЬ ДВЕНАДЦАТЬ =====
  '071': { dur: 2.8 },
  '072': { loc: 'bench', opt: night, fx: { snow: 200, snowBig: 1 }, black: { at: 0, to: .8, fin: 0, fout: 24 }, shots: [
      { frame: 'close', cast: [sitM(1220, { alpha: .7, acts: [[0, 'look_hands'], ['последняя', 'idle'], ['чувствовал', 'look_hands']], brows: .7 })] } ] },
  '073': { loc: 'bench', opt: night, fx: { snow: 220, snowBig: 1 }, shots: [
      { frame: 'med', cast: [sitM(1220, { alpha: .68, acts: [[0, 'look_back'], ['снежинки', 'look_hands']] })], w: 1 },
      { frame: 'close', zoom: [2.2, 2.35], center: [1130, 860], cast: [sitM(1220, { alpha: .62, acts: [[0, 'look_hands']] })], fx: { snow: 260, snowBig: 1 }, w: 1.1 } ],
    inserts: [{ type: 'clock', text: '4:33', at: 'глаза', len: 2 }, { type: 'timer', text: '39 МИН', at: 'оставалось', len: 3 }] },
  '074': { loc: 'city_aerial', opt: night, fx: SNOW, frames: ['xwide'], cast: [],
    inserts: [{ type: 'plan', items: ['1 · СЕРДЦЕ ПЕТРОВИЧА', '2 · ШКОЛА', '3 · НАБЕРЕЖНАЯ', '4 · ГАЗ', '5 · ЛИФТ'], step: 32, at: 0.3, len: 7.5 }] },
  '075': { loc: 'arch', opt: { ...quake }, fx: SNOW, shots: [
      { frame: 'med', center: [1300, 780], cast: [SO(1420, 'idle', { facing: -1, brows: .8, lookX: -6 }), M(1180, 'idle', { kneeling: 1, turn: .85, alpha: .6, acts: [['потом', 'talk'], ['нитроглицерин', 'point']] })], w: 1.4 },
      { frame: 'med', cast: [OL(1500, 'idle', { facing: -1, turn: .6, acts: [['соня', 'talk'], ['бежим', 'beckon']] }), SO(1330, 'idle', { acts: [['медсестра', 'talk']] })], focus: 'olga', w: 1 },
      { loc: 'street', opt: { ...quake }, frame: 'wide', cast: [OL(600, 'run', { x1: 2000, walk: ['бежим', 'бежим+3.5'] }), SO(450, 'run', { x1: 1850, walk: ['бежим', 'бежим+3.5'] })], w: .6 } ] },
  '076': { loc: 'boiler_ext', opt: night, fx: SNOW, shots: [
      { frame: 'med', center: [1250, 800], cast: [PE(1350, 'heart', { sitting: 1, seatY: 40, turn: .85, facing: -1, noProp: 1 }), OL(1150, 'bandage', { facing: 1, turn: .85, acts: [['минуту', 'idle']] }), M(800, 'idle', { turn: .7, alpha: .58 })], w: 1.1 },
      { frame: 'close', cast: [PE(1350, 'idle', { sitting: 1, seatY: 40, turn: .85, facing: -1, noProp: 1, lookX: -6, brows: .6, acts: [['вздохнул', 'nod']] })], focus: 'petrovich', w: 1.1 },
      { frame: 'close', cast: [M(800, 'idle', { turn: .7, alpha: .58, acts: [['люди', 'talk']], brows: .4 })], w: .8 } ] },
  '077': { loc: 'school_ext', opt: { time: 'blackout', state: 'quake', gymLit: 1 }, fx: { ...SNOW, alarm: 1 }, shots: [
      { frame: 'med', cast: [{ prop: 'alarmbox', x0: 1300, y0: 640, at: 'сирена' }, M(1180, 'panel', { turn: .85, alpha: .58, brows: 1 })], focus: 'mark', fx: { sparks: [1300, 640] }, w: 1.2 },
      { frame: 'wide', cast: [{ prop: 'alarmbox', x0: 1300, y0: 640, at: 0 }, M(1180, 'panel', { turn: .85, alpha: .55 }), ...crowd(6, 1500, 2100, -1500, 250, { act: 'walk', hold: 'mat' })], focus: 'mark', w: 1 } ] },
  '078': { loc: 'street', opt: { ...quake, crowd: 1 }, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(8, 300, 1700, -1200, 260, { act: 'walk' }), PE(1750, 'lantern_up', { facing: -1, turn: .4, acts: [['народ', 'beckon']] })], focus: 'petrovich', w: 1.1 },
      { frame: 'close', cast: [PE(1450, 'lantern_up', { facing: -1, turn: .4, acts: [['народ', 'talk']] })], focus: 'petrovich', w: 1 } ] },
  '079': { loc: 'gas_station', opt: { time: 'blackout', state: 'quake' }, shots: [
      { frame: 'med', center: [1450, 760], cast: [{ prop: 'haze', x0: 900, x1: 1900, h: 380, until: 'щелчком' }, M(1420, 'panel', { kneeling: 1, turn: .85, alpha: .55, brows: 1 }), { prop: 'alarmbox', x0: 1600, y0: G - 230 }], fx: { sparks: [1600, 760] }, w: 1.2 },
      { frame: 'close', center: [840, 860], zoom: [2.0, 2.1], cast: [], w: 1 } ],
    quakes: [{ at: 'щелчком', amp: 6, len: .5 }] },
  '080': { loc: 'cabin', opt: { time: 'night' }, shots: [
      { loc: 'shaft', opt: { time: 'night', cabinY: 500 }, frame: 'wide', cast: [], w: .8 },
      { frame: 'med', cast: [TI(1200, 'idle', { acts: [[0, 'wave_both'], ['призрак', 'talk'], ['одно', 'shrug']] })], focus: 'timur', w: 1.2 },
      { loc: 'switchroom', opt: night, frame: 'close', cast: [M(1150, 'panel', { turn: .85, alpha: .52, acts: [['электрик', 'talk']] })], fx: { sparks: [1300, 470] }, w: .9 } ] },
  '081': { loc: 'embankment', opt: night, fx: SNOW, shots: [
      { frame: 'xwide', cast: [...crowd(7, 300, 2100, 0, 270, { mood: 'chatter' })], w: 1 },
      { frame: 'wide', cast: [P('pink', 'pink', 700, 'talk'), P('cat', 'cat', 950, 'idle', { hold: 'bag' }), P('shorts', 'shorts', 1250, 'shiver', { look: { ...LK.shorts, pants: '#2f2a26' } }), M(1900, 'idle', { facing: -1, alpha: .5 })], focus: 'cat', w: 1.1 },
      { frame: 'med', center: [1250, 820], cast: [TI(1150, 'talk', { turn: .5, acts: [['соня', 'talk'], ['тишку', 'idle'], ['крутой', 'nod']] }), SO(1350, 'idle', { facing: -1, acts: [['показывала', 'holdup'], ['нормальный', 'shrug']] })], w: 1.3 } ] },
  '081а': { loc: 'embankment', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [...crowd(5, 300, 900, 0, 280, { mood: 'chatter' }), { prop: 'block', x0: 1000, x1: 1750, h: 90 }, SO(1300, 'idle', { sitting: 1, sitDY: 100, turn: .85, facing: -1 }), M(1700, 'walk', { x1: 1450, walk: ['сел', 'гранит'], alpha: .5, acts: [['гранит', 'idle']] })], focus: 'sonya', w: 1 },
      { frame: 'med', center: [1380, 840], cast: [{ prop: 'block', x0: 1000, x1: 1750, h: 90 }, SO(1300, 'idle', { sitting: 1, sitDY: 100, turn: .85, facing: 1, acts: [['грустный', 'talk'], ['о', 'talk']] }), M(1460, 'idle', { sitting: 1, seatY: 104, turn: .85, facing: -1, alpha: .48, acts: [['думаю', 'look_hands'], ['сестре', 'look_hands']] })], w: 1.5 },
      { frame: 'close', cast: [{ prop: 'block', x0: 1000, x1: 1750, h: 90 }, SO(1300, 'idle', { sitting: 1, sitDY: 100, turn: .85, facing: 1, acts: [['подумала', 'scratch'], ['тогда', 'talk']] })], focus: 'sonya', w: 1 },
      { frame: 'close', cast: [{ prop: 'block', x0: 1000, x1: 1750, h: 90 }, M(1460, 'idle', { sitting: 1, seatY: 104, turn: .85, facing: -1, alpha: .46, acts: [['договорились', 'nod']] })], w: .8 } ] },
  '081б': { loc: 'embankment', opt: night, fx: SNOW, shots: [
      { frame: 'wide', cast: [{ prop: 'streetlamp', x0: 1700 }, M(1300, 'walk', { x1: 1680, walk: ['встал', 'фонарю+0.5'], alpha: .32 })], focus: 'mark', w: 1 } ],
    inserts: [{ type: 'clock', text: '5:11', at: 0, len: 1.8 }] },
  '082': { loc: 'embankment', opt: night, fx: SNOW, shots: [
      { frame: 'xwide', cast: [{ prop: 'crack', x0: 200, x1: 2200, y: 880, at: 'треснул', len: 1.6, glow: 1, c: '#f2f6ff', w: 5, amp: 30 }, ...crowd(7, 300, 2100, 0, 290, { mood: 'cold', acts: [['вскрикнул', 'scared'], ['тишина', 'idle']] })], w: 1.2 },
      { frame: 'med', cast: [SO(1300, 'scared', { acts: [['тишина', 'idle']] }), OL(1450, 'protect', { facing: -1, acts: [['тишина', 'idle']] })], focus: 'sonya', w: .9 },
      { frame: 'wide', cast: [{ prop: 'crack', x0: 200, x1: 2200, y: 880, at: 0, len: .1, glow: 1, c: '#f2f6ff', w: 5, amp: 30 }, ...crowd(7, 300, 2100, 0, 290, { mood: 'cheer' })], w: 1 } ],
    quakes: [{ at: 'вздрогнула', amp: 16, len: 2 }] },
  '083': { loc: 'embankment', opt: night, fx: SNOW, shots: [
      { frame: 'close', cast: [M(1300, 'look_hands', { alpha: .32, brows: .8 })], w: 1.2 },
      { frame: 'med', center: [1400, 760], cast: [M(1300, 'idle', { alpha: .3, turn: .5 }), PE(1550, 'walk', { x1: 1500, facing: -1, acts: [['теперь', 'talk']], lookX: 4 })], w: 1 } ] },
  '084': { loc: 'ruins', opt: { time: 'predawn', state: 'ruin' }, fx: { snow: 100 }, shots: [
      { frame: 'xwide', cast: [{ prop: 'beam', x0: 400, y0: 400, ang: 30, sweep: 15, len: 1400, w: 14 }, { prop: 'beam', x0: 2000, y0: 380, ang: 150, sweep: 18, spd: .7, len: 1400, w: 14 }], w: 1.1 },
      { frame: 'wide', cast: [RS(700, 'beckon', { facing: 1 }), RS(1700, 'idle', { facing: -1, acts: [['тихо', 'point_up']] }), { dog: 1, x0: 1300, facing: 1 }], focus: 'rs1', w: 1.2 },
      { frame: 'close', center: [1300, 930], zoom: [1.9, 2.0], cast: [{ dog: 1, x0: 1300, facing: 1 }], w: .9 },
      { frame: 'wide', cast: [{ dog: 1, x0: 1300, facing: 1 }, M(500, 'walk', { x1: 1050, walk: ['подошёл', 'увидел'], alpha: .3 })], focus: 'mark', w: .9 } ] },
  '085': { loc: 'ruins', opt: { time: 'predawn', state: 'ruin', scarf: 1 }, fx: { snow: 80 }, shots: [
      { frame: 'close', center: [1150, 960], zoom: [2.2, 2.4], cast: [], w: 1 } ], black: { at: 'космоса+1.2', fin: 30, fout: 2 } },

  // ===== СЕРИЯ 6 · ТИХИЙ ЗВОН =====
  '086': { dur: 2.8 },
  '087': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin' }, fx: { snow: 60 }, black: { at: 0, to: .8, fin: 0, fout: 24 }, shots: [
      { frame: 'xwide', zoom: [.95, 1.08], cast: [], w: 1 } ] },
  '088': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin' }, fx: { snow: 60 }, shots: [
      { frame: 'wide', cast: [{ prop: 'stretcher', x0: 900, x1: 1500, at: 'достали', len: 14, scarf: 1, hand: 0 }, RS(700, 'walk', { x1: 1300, walk: ['достали', 'достали+14'], hold: 'none', act: 'carry' }), RS(1100, 'walk', { x1: 1700, walk: ['достали', 'достали+14'], hold: 'none', act: 'carry' }), M(1900, 'idle', { facing: -1, alpha: .5, brows: .8 })], focus: 'mark', w: 1.4 },
      { frame: 'close', center: [1180, 760], zoom: [2.0, 2.1], cast: [{ prop: 'stretcher', x0: 1200, scarf: 1 }], w: .8 },
      { frame: 'med', cast: [RS(1200, 'phone_look', { facing: 1, turn: .6, hold: 'clipboard' }), M(1450, 'idle', { facing: -1, turn: .6, alpha: .5, lookY: 6 })], focus: 'rs1', w: 1 } ],
    inserts: [{ type: 'tablet', text: 'Время смерти — ориентировочно 3:17', at: 'время', len: 4.5 }] },
  '089': { minShot: 2.2, loc: 'street', opt: { ...quake }, fx: SNOW, shots: [
      { loc: 'bench', opt: night, frame: 'close', cast: [sitM(1220, { act: 'phone_look', alpha: .7 })], w: 1 },
      { frame: 'wide', cast: [P('walker2', 'cat', 2050, 'walk', { x1: 500 }), M(1250, 'idle', { alpha: .6, turn: .3 })], focus: 'mark', w: 1 },
      { frame: 'med', center: [1700, 760], cast: [CAR(1500, '#e8e8ee', { stripe: '#d8323a', driver: 1, sc: 1.5 }), M(1880, 'knock', { facing: -1, turn: .85, alpha: .6 })], w: 1 },
      { loc: 'yard', opt: { ...night, flip: 1 }, frame: 'wide', cast: [{ dog: 1, x0: 1500, facing: -1, bark: 1 }], w: 1 },
      { loc: 'shopwindow', opt: night, frame: 'wide', cast: [OL(1050, 'idle', { alpha: .45 }), SO(1180, 'holdup', { alpha: .45 })], w: 1 },
      { loc: 'bench', opt: night, frame: 'close', zoom: [2.2, 2.35], center: [1130, 860], cast: [sitM(1220, { act: 'look_hands', alpha: .6 })], fx: { snow: 260, snowBig: 1 }, w: 1 },
      { loc: 'arch', opt: { ...quake }, frame: 'wide', cast: [{ prop: 'beam', x0: 1530, y0: 560, ang: 180, sweep: 35, spd: .8, len: 1100, w: 14 }, M(950, 'idle', { turn: .4, alpha: .6 })], focus: 'mark', w: 1.1 } ] },
  '090': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin' }, fx: { snow: 40 }, shots: [
      { frame: 'med', cast: [M(1200, 'idle', { turn: .3, alpha: .5, acts: [['не', 'shake_head'], ['умер', 'look_hands'], ['потом', 'idle']], brows: .8 })], w: 1.2 },
      { loc: 'apartment', opt: { time: 'night', state: 'ok', clock: '03:17' }, frame: 'wide', cast: [{ prop: 'lamp', x0: 1200, y: 170, swing: 3 }, M(560, 'lie', { y: G - 190 })], fx0: 1, fx: {}, w: .8 },
      { frame: 'close', cast: [M(1200, 'idle', { turn: .3, alpha: .5, brows: .4, acts: [['чиню', 'nod']] })], w: 1 } ] },
  '091': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin', tape: 1 }, fx: { snow: 30, dawn: 1 }, shots: [
      { frame: 'wide', cast: [SO(1250, 'holdup', { facing: 1, lookX: 6 }), M(1400, 'hold', { facing: -1, turn: .5, alpha: .5 })], focus: 'sonya', w: 1.1 },
      { frame: 'med', center: [1180, 820], cast: [OL(1050, 'idle', { kneeling: 1, turn: .85, facing: 1, acts: [['солнышко', 'talk'], ['посмотрела', 'look_back'], ['передай', 'talk']] }), SO(1250, 'holdup', { facing: -1, acts: [['марком', 'talk']] })], w: 1.4 },
      { frame: 'close', cast: [OL(1050, 'idle', { kneeling: 1, turn: .85, facing: 1, brows: .9, lookY: 3, acts: [['передай', 'talk']] })], focus: 'olga', w: 1 } ] },
  '092': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin', tape: 1 }, fx: { snow: 30, dawn: 1 }, shots: [
      { frame: 'close', cast: [SO(1250, 'holdup', { lookX: 6, lookY: -6, brows: .7, acts: [['знал', 'talk'], ['потом', 'talk']] })], focus: 'sonya', w: 1 },
      { frame: 'close', cast: [M(1400, 'idle', { facing: -1, turn: .5, alpha: .5, lookY: 6, acts: [['подумал', 'scratch'], ['знаю', 'talk'], ['наверное', 'shrug']] })], w: 1.1 } ] },
  '093': { loc: 'tent_camp', opt: { time: 'dawn', state: 'ok' }, fx: { dawn: 1 }, shots: [
      { frame: 'wide', cast: [PE(800, 'lantern_up', { facing: 1, turn: .5, acts: [['кивнул', 'nod']] }), M(1600, 'idle', { facing: -1, alpha: .45 })], focus: 'petrovich', w: .9 },
      { frame: 'med', center: [1250, 780], cast: [TI(1150, 'wave_both', { acts: [['рассказывал', 'talk'], ['светится', 'wave_both'], ['верили', 'shrug'], ['рассказывал#2', 'talk']] }), RS(1400, 'idle', { facing: -1, acts: [['верили', 'shake_head']] }), RS(1580, 'idle', { facing: -1, acts: [['верили', 'shrug']] })], w: 1.3 },
      { frame: 'med', cast: [P('driver', 'guard', 1700, 'drink', { facing: -1, turn: .6, look: { ...LK.guard, topC: ['#3b5b7b', '#2d4660', '#1f3044'] }, acts: [['ругался', 'shake_head']] })], focus: 'driver', w: 1 } ] },
  '093а': { minShot: 4, loc: 'school_ext', opt: { time: 'dawn', state: 'ruin' }, fx: { dawn: 1 }, shots: [
      { loc: 'city_aerial', opt: { time: 'dawn', state: 'quake' }, frame: 'xwide', cast: [], w: 1 },
      { frame: 'wide', cast: [{ prop: 'tape', x0: 500, x1: 1900, y: G - 120 }], w: 1 },
      { loc: 'stadium', opt: { time: 'dawn', state: 'ok' }, frame: 'wide', cast: [{ prop: 'pit', x0: 1200, at: 0, len: .1, w: 520, y: G + 90 }, { prop: 'tape', x0: 600, x1: 1800, y: G - 110 }], w: 1 },
      { loc: 'gas_station', opt: { time: 'dawn', state: 'ok' }, frame: 'wide', cast: [P('gas1', 'guard', 1450, 'scratch', { facing: -1, turn: .6, look: { ...LK.guard, topC: ['#d9a12a', '#b5841f', '#7e5c15'] } }), P('gas2', 'cat', 1650, 'scratch', { facing: -1, turn: .6, look: { ...LK.cat, topC: ['#d9a12a', '#b5841f', '#7e5c15'] } })], focus: 'gas1', w: 1.2 },
      { loc: 'tent_camp', opt: { time: 'dawn', state: 'ok' }, frame: 'med', center: [1250, 840], cast: [PE(1200, 'idle', { sitting: 1, seatY: 40, turn: .85, facing: 1 }), { dog: 1, x0: 1350, facing: -1, sleep: 1, y: G }], w: 1 },
      { loc: 'city_aerial', opt: { time: 'dawn', state: 'quake' }, frame: 'xwide', cast: [], w: 1.1 },
      { loc: 'ruins', opt: { time: 'dawn', state: 'ruin' }, frame: 'close', cast: [M(1200, 'idle', { alpha: .45, brows: .5 })], w: .7 } ] },
  '094': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin' }, fx: { dawn: 1 }, shots: [
      { frame: 'med', cast: [M(1200, 'phone_look', { turn: .3, alpha: .5, acts: [['нажал', 'phone']] })], w: 1 },
      { frame: 'close', cast: [M(1200, 'phone', { turn: .3, alpha: .5, brows: .8, lookY: 3 })], w: 1.3 } ],
    inserts: [{ type: 'phone', time: '6:40', sub: 'среда, 13 ноября', vm: 'Вика · голосовое · 0:14', at: 'экран', len: 7 }] },
  '095': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin' }, fx: { dawn: 1 }, shots: [
      { frame: 'close', cast: [M(1200, 'phone_look', { turn: .3, alpha: .45, hold: 'phone', acts: [['проснулся', 'idle'], ['люблю', 'look_up']], brows: .5 })], w: 1 } ] },
  '096': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin', tape: 1 }, fx: { dawn: 1, snow: 30 }, shots: [
      { frame: 'med', center: [1320, 800], cast: [SO(1250, 'holdup', { facing: 1, acts: [['отпустила', 'idle'], ['иди', 'wave']] }), M(1400, 'hold', { facing: -1, turn: .5, alpha: .45, acts: [['отпустила', 'idle']] })], w: 1 },
      { frame: 'wide', zoom: [1.1, .95], cast: [SO(900, 'wave', { facing: 1 }), M(1150, 'walk', { x1: 2200, walk: ['пошёл', 'было+1'], alpha: .45, turn: .85 })], focus: 'sonya', w: 1.3 } ] },
  '097': { loc: 'ruins', opt: { time: 'dawn', state: 'ruin' }, fx: { dawn: 1 }, frames: ['xwide'], cast: [], flashes: [0.2], black: { at: 'открыл', fin: 20, fout: 10 } },
  '098': { inserts: [{ type: 'logo', at: 0 }] },

};
