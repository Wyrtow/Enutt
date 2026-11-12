// Pixel-art facial features drawn as thin voxel slabs on the front of the head.
// Head front grid: 12 wide (x 0..11), 14 tall (y 0..13).
//  eyes : rows y=9,8,7  (top→bottom), viewer-left eye x=1..4, viewer-right eye x=7..10
//  brows: rows y=12,11
//  mouth: rows y=4,3,2, x=3..8
// Eye / brow strings are written OUTER → INNER and mirrored automatically.
//  W white  P pupil  L lid/lash  B brow  D mouth dark  T teeth  G tongue  R lip  K blush
import { VoxelGrid, buildGeometry } from './voxel.js';

export const EYES = {
  neutral:   ['LLLL', 'WPPW', '....'],
  open:      ['LLLL', 'WPPW', 'WPPW'],
  blink:     ['....', 'LLLL', '....'],
  closed:    ['....', '....', 'LLLL'],
  happy:     ['.LL.', 'L..L', '....'],
  laugh:     ['LL..', '..LL', 'LL..'],
  surprised: ['WWWW', 'WPPW', 'WWWW'],
  sad:       ['..LL', 'LPPW', '....'],
  angry:     ['LL..', 'WPPL', '....'],
  half:      ['....', 'LLLL', 'WPPW'],
  focused:   ['LLLL', 'WPPW', 'LLLL'],
};

export const BROWS = {
  neutral: ['....', 'BBBB'],
  raised:  ['BBBB', '....'],
  angry:   ['BB..', '..BB'],
  sad:     ['..BB', 'BB..'],
  none:    ['....', '....'],
};

export const MOUTHS = {
  neutral:   ['......', '.DDDD.', '..RR..'],
  closed:    ['......', '.DDDD.', '......'],
  smile:     ['D....D', '.DDDD.', '......'],
  grin:      ['D....D', 'DTTTTD', '.DDDD.'],
  laugh:     ['DTTTTD', 'DDGGDD', '.DDDD.'],
  sad:       ['......', '.DDDD.', 'D....D'],
  angry:     ['DDDDDD', 'TTTTTT', 'DDDDDD'],
  frown:     ['.DDDD.', 'D....D', '......'],
  o:         ['..DD..', '.DGGD.', '..DD..'],
  small_o:   ['......', '..DD..', '..DD..'],
  smirk:     ['......', '.....D', '.DDDD.'],
  flat:      ['......', 'DDDDDD', '......'],
  wavy:      ['......', 'D.DD.D', '.D..D.'],
  // visemes for talking / lip-sync
  A:         ['.DDDD.', 'DDGGDD', '.DDDD.'],
  E:         ['......', 'DTTTTD', '.DDDD.'],
  O:         ['..DD..', '.DDDD.', '..DD..'],
  U:         ['......', '..DD..', '..DD..'],
  M:         ['......', '.DDDD.', '......'],
};

// Ready-made emotions (combinations). Any key can be overridden per frame.
export const EMOTIONS = {
  neutral:   { eyes: 'neutral', brows: 'neutral', mouth: 'neutral' },
  smile:     { eyes: 'neutral', brows: 'neutral', mouth: 'smile' },
  happy:     { eyes: 'happy', brows: 'raised', mouth: 'grin' },
  laugh:     { eyes: 'laugh', brows: 'raised', mouth: 'laugh' },
  sad:       { eyes: 'sad', brows: 'sad', mouth: 'sad' },
  angry:     { eyes: 'angry', brows: 'angry', mouth: 'angry' },
  surprised: { eyes: 'surprised', brows: 'raised', mouth: 'o' },
  thinking:  { eyes: 'neutral', brows: 'neutral', browR: 'raised', mouth: 'smirk', gaze: [1, 0] },
  skeptical: { eyes: 'half', brows: 'angry', browR: 'raised', mouth: 'flat' },
  wink:      { eyes: 'neutral', eyeL: 'happy', brows: 'neutral', mouth: 'smirk' },
  worried:   { eyes: 'open', brows: 'sad', mouth: 'wavy' },
  bored:     { eyes: 'half', brows: 'neutral', mouth: 'flat' },
  embarrassed: { eyes: 'happy', brows: 'sad', mouth: 'wavy', blush: true },
  determined: { eyes: 'focused', brows: 'angry', mouth: 'flat' },
};

export const VISEME_CYCLE = ['A', 'M', 'E', 'O', 'A', 'U', 'E', 'M', 'A', 'O', 'E', 'closed'];

function shiftPupils(row, gx) {
  if (!gx || !row.includes('P')) return row;
  const chars = row.split('');
  const span = chars.map((c, i) => (c === 'P' || c === 'W') ? i : -1).filter(i => i >= 0);
  const pupils = chars.map((c, i) => c === 'P' ? i : -1).filter(i => i >= 0);
  const lo = Math.min(...span), hi = Math.max(...span);
  span.forEach(i => chars[i] = 'W');
  let shift = gx;
  if (pupils[0] + shift < lo) shift = lo - pupils[0];
  if (pupils[pupils.length - 1] + shift > hi) shift = hi - pupils[pupils.length - 1];
  pupils.forEach(i => chars[i + shift] = 'P');
  return chars.join('');
}

/** Build the face overlay grid for a resolved face state. */
export function faceGrid(face, pal) {
  const g = new VoxelGrid();
  const col = ch => pal[ch];
  const gx = (face.gaze && face.gaze[0]) || 0;
  const gy = (face.gaze && face.gaze[1]) || 0;

  const drawEye = (map, x0, mirror, yTop) => {
    let rows = map.slice();
    if (gy) {
      // vertical gaze: move pupil row up/down if possible
      const pi = rows.findIndex(r => r.includes('P'));
      const ni = pi - gy;
      if (pi >= 0 && ni >= 0 && ni < rows.length && /^[W.]*$/.test(rows[ni]) && rows[ni].includes('W')) {
        const pr = rows[pi], nr = rows[ni];
        rows[ni] = pr; rows[pi] = nr;
      }
    }
    rows.forEach((row, r) => {
      // to world x order (left→right on screen)
      let s = mirror ? row.split('').reverse().join('') : row;
      s = shiftPupils(s, gx);
      for (let i = 0; i < 4; i++) {
        const ch = s[i];
        if (ch !== '.') g.set(x0 + i, yTop - r, 0, col(ch));
      }
    });
  };
  // viewer-left eye: outer is x=1 → no mirror ; viewer-right eye: outer is x=10 → mirror
  drawEye(EYES[face.eyeL || face.eyes] || EYES.neutral, 1, false, 9);
  drawEye(EYES[face.eyeR || face.eyes] || EYES.neutral, 7, true, 9);
  drawEye(BROWS[face.browL || face.brows] || BROWS.neutral, 1, false, 12);
  drawEye(BROWS[face.browR || face.brows] || BROWS.neutral, 7, true, 12);

  const m = MOUTHS[face.mouth] || MOUTHS.neutral;
  m.forEach((row, r) => {
    for (let i = 0; i < 6; i++) if (row[i] !== '.') g.set(3 + i, 4 - r, 0, col(row[i]));
  });
  if (face.blush) {
    for (const x of [0, 1, 10, 11]) g.set(x, 5, 0, pal.K);
  }
  return g;
}

const geoCache = new Map();
export function faceGeometry(face, pal, cacheKey) {
  const key = cacheKey + '|' + JSON.stringify(face);
  let geo = geoCache.get(key);
  if (!geo) {
    geo = buildGeometry(faceGrid(face, pal), { scale: [1, 1, 0.14], offset: [-6, 1, 5.5], ao: false, noise: 0 });
    geoCache.set(key, geo);
  }
  return geo;
}
