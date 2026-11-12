// Character roster. Every character uses the same skeleton, so every clip works for everyone.
import { shade, mix, rng, hash3 } from './voxel.js';

// ---------- hair / headwear helpers (head grid: x 0..11, y 0..13, z 0..10, front z=10) ----------
function messyShortHair(H, c, seed, opts = {}) {
  const r = rng(seed);
  const hl = shade(c, 1.18);
  const pick = () => (r() < 0.22 ? hl : c);
  H.box(0, 14, 0, 12, 16, 11, pick);                       // top
  for (let x = 0; x < 12; x++) for (let z = 1; z < 10; z++) if (r() < 0.35) H.set(x, 16, z, pick()); // tufts
  H.box(0, 3, -1, 12, 16, 0, pick);                        // back
  for (const sx of [-1, 12]) H.box(sx, 10, -1, sx + 1, 16, 9, pick); // sides above ears
  for (const sx of [-1, 12]) H.box(sx, 7, 7, sx + 1, 10, 8, pick);  // sideburns
  H.box(0, 13, 0, 12, 14, 11, pick);                       // hairline replaces forehead top row
  for (let x = 0; x < 12; x++) {                           // fringe overhang
    H.set(x, 14, 11, pick()); H.set(x, 15, 11, pick());
    if (r() < (opts.fringe ?? 0.55)) H.set(x, 13, 11, pick());
  }
  H.set(3, 16, 11, pick()); H.set(4, 16, 11, pick()); H.set(8, 16, 11, pick()); // front spikes
}

function longHair(H, c, seed) {
  const r = rng(seed);
  const hl = shade(c, 1.15), dk = shade(c, 0.85);
  const pick = (y) => (r() < 0.2 ? hl : (y < 4 && r() < 0.4 ? dk : c));
  H.box(0, 14, 0, 12, 16, 11, (x, y) => pick(y));
  H.box(1, 16, 1, 11, 17, 10, (x, y) => pick(y));
  H.box(0, 13, 0, 12, 14, 11, (x, y) => pick(y));
  // back curtain down past the shoulders
  H.box(-1, -7, -2, 13, 16, 0, (x, y, z) => (y < -4 && (x === -1 || x === 12) ? undefined : pick(y)));
  // side curtains (cover ears)
  for (const sx of [-1, 12]) H.box(sx, -3, -1, sx + 1, 16, 9, (x, y) => pick(y));
  for (const sx of [-2, 13]) H.box(sx, -5, -1, sx + 1, 14, 6, (x, y) => pick(y));
  // fringe: swept bangs
  for (let x = 0; x < 12; x++) {
    H.set(x, 14, 11, pick(14)); H.set(x, 15, 11, pick(15));
    if (x < 8) H.set(x, 13, 11, pick(13));
  }
  H.set(0, 12, 11, pick(12)); H.set(11, 12, 11, pick(12)); H.set(11, 11, 11, pick(11)); H.set(0, 11, 11, pick(11));
  H.set(0, 12, 10, pick(12)); H.set(11, 12, 10, pick(12));
}

function plaid(base, dark, light) {
  return (x, y, z) => {
    const a = ((x + 64) % 4 === 0), b = ((y + 64) % 4 === 0);
    if (a && b) return dark;
    if (a || b) return shade(base, 0.72);
    if (((x + y + 64) % 4) === 2 && light) return light;
    return base;
  };
}

// ---------------------------------------------------------------------------------------------
export const CHARACTERS = {
  // 1. Max — the reference look: brown hair, glasses, black suit + turtleneck
  max: {
    id: 'max', name: 'Макс', role: 'офисный герой, ведущий',
    skin: '#f1c39a', hair: '#4a2b1b', lid: '#7a5440',
    glasses: { color: '#1b1b1d', style: 'rect' },
    top: (x, y, z) => {
      const jacket = '#2c2c2f', shirt = '#202023';
      if (z === 3 && x >= -2 && x < 2) return y % 2 ? shirt : shade(shirt, 1.15); // turtleneck rib
      return jacket;
    },
    sleeve: (x, y, z, side, part) => (part === 'fore' && y <= -7 ? '#d9d9dc' : '#2c2c2f'),
    pants: '#2a2a2d', shoes: '#18181a', sole: '#0e0e0f',
    build(B) {
      const H = B.head, T = B.torso, P = B.pelvis;
      messyShortHair(H, '#4a2b1b', 7);
      for (const sx of [-1, 12]) H.box(sx, 9, 6, sx + 1, 10, 11, '#1b1b1d'); // glasses temples
      // open jacket front panels + grey lapels
      T.box(-7, -3, 4, 7, 19, 5, (x, y) => {
        if (x >= -2 && x < 2) return undefined;          // open front shows turtleneck
        const w = Math.max(0, Math.floor((y - 9) / 3));    // lapel width grows upward
        const lapel = y >= 9 && ((x >= 2 && x < 3 + w) || (x < -2 && x >= -3 - w));
        return lapel ? (y >= 17 ? '#8a8a90' : '#616167') : '#2c2c2f';
      });
      T.box(-7, -3, -4, 7, 0, 4, (x, y, z) => (x >= -2 && x < 2 && z === 3 ? undefined : '#2c2c2f')); // jacket hem
      T.box(-3, 20, -3, 3, 22, 3, (x, y) => (y === 21 ? '#26262a' : '#1d1d20'));          // rolled collar
      // belt + buckle
      P.box(-6, -1, -3, 6, 0, 3, '#1a1a1c');
      P.box(-1, -1, 3, 1, 0, 4, '#9a9aa0');
      // pocket squares / buttons
      T.set(-6, 3, 5, '#5a5a60'); T.set(5, 3, 5, '#5a5a60');
    },
  },

  // 2. Anya — long ginger hair, mint hoodie, jeans, white sneakers
  anya: {
    id: 'anya', name: 'Аня', role: 'весёлая подруга, блогер',
    skin: '#f6cfb0', hair: '#b4532b', lid: '#2b1714', lip: '#d0646c', ears: false,
    top: (x, y, z) => {
      const h = '#69c3a2';
      if (z === 3 && y >= 2 && y < 7 && x >= -4 && x < 4) return shade(h, 0.88); // kangaroo pocket
      if (y < 2) return shade(h, 0.85);                                            // waistband
      return h;
    },
    sleeve: (x, y, z, side, part) => (part === 'fore' && y <= -6 ? shade('#69c3a2', 0.85) : '#69c3a2'),
    pants: (x, y, z, side, part) => (part === 'shin' && y < -6 ? '#5c7bb0' : (x + y) % 5 === 0 ? '#4a6699' : '#4f6da3'),
    shoes: (x, y, z) => (y === 0 && z === 3 ? '#e85d75' : '#f4f4f4'), sole: '#d8d8d8',
    build(B) {
      const H = B.head, T = B.torso;
      longHair(H, '#b4532b', 11);
      // freckles + blush
      H.set(2, 5, 10, mix('#f6cfb0', '#c47a5a', 0.5)); H.set(9, 5, 10, mix('#f6cfb0', '#c47a5a', 0.5));
      // hood bunched behind neck
      T.box(-5, 17, -6, 5, 21, -3, (x, y) => (y === 20 ? shade('#69c3a2', 0.85) : '#69c3a2'));
      T.box(-4, 20, -3, 4, 21, 3, shade('#69c3a2', 0.9));      // collar
      // drawstrings
      T.box(-2, 13, 4, -1, 19, 5, '#f4f4f4'); T.box(1, 13, 4, 2, 19, 5, '#f4f4f4');
    },
  },

  // 3. Boris — bearded guy, knit beanie, plaid flannel, work boots
  boris: {
    id: 'boris', name: 'Борис', role: 'добродушный мастер на все руки',
    skin: '#dca57d', hair: '#5d3b25', brow: '#3e2618', lid: '#7d5236',
    top: (x, y, z) => (z === 3 && x === 0 && y % 4 === 1 ? '#e8dfcc' : plaid('#b23a30', '#2a1614', '#c4483c')(x, y, z)),
    sleeve: (x, y, z, side, part) => (part === 'fore' && y <= -6 ? '#dca57d' : plaid('#b23a30', '#2a1614')(x, y, z)),
    pants: (x, y, z, side, part) => (part === 'shin' && y < -6 ? '#6b4728' : '#34506f'),
    shoes: (x, y, z) => (z === 3 && y >= -1 ? '#e2c28f' : '#6b4423'), sole: '#2b1d12',
    build(B) {
      const H = B.head, T = B.torso, beard = '#5d3b25', bd = '#4a2f1d';
      const pickB = (x, y, z) => (hash3(x, y, z) < 0.3 ? bd : beard);
      // beanie
      H.box(-1, 13, -1, 13, 16, 12, (x, y) => (y === 13 ? '#9c3524' : (x % 2 ? '#c8472f' : '#b8402a')));
      H.box(0, 16, 0, 12, 17, 11, (x) => (x % 2 ? '#c8472f' : '#b8402a'));
      H.box(1, 17, 1, 11, 18, 10, '#c8472f');
      H.box(5, 18, 4, 7, 20, 6, '#f0e6d6');                    // pompom
      // beard: cheeks/chin layer, mouth hole, below-chin bulk
      H.paint((x, y, z, c) => (y <= 5 && z >= 5 && x >= 0 && x <= 11 && !(z === 11) ? pickB(x, y, z) : undefined));
      H.box(0, -2, 11, 12, 6, 12, (x, y, z) => (y >= 1 && y <= 4 && x >= 3 && x <= 8 ? undefined : (x >= 5 && x <= 6 && y >= 5 ? undefined : pickB(x, y, z))));
      H.box(1, -3, 4, 11, 0, 11, pickB);
      H.box(3, 1, 10, 9, 5, 11, '#c98f6b');                    // lips area inside the beard
      for (const sx of [-1, 12]) H.box(sx, 0, 5, sx + 1, 6, 11, pickB);
      // moustache over upper lip
      H.box(2, 5, 12, 10, 6, 13, (x) => (x === 5 || x === 6 ? undefined : bd));
      H.box(5, 5, 11, 7, 6, 12, bd);
      // hair visible under beanie at back
      H.box(0, 9, -1, 12, 13, 0, '#5d3b25');
      // shirt collar + undershirt
      T.box(-4, 20, -3, 4, 21, 3, plaid('#b23a30', '#2a1614'));
      T.box(-1, 17, 4, 1, 20, 5, '#e8dfcc');
    },
  },

  // 4. Lev Arkadievich — professor: grey fringe, moustache, round gold glasses, vest + bow tie
  lev: {
    id: 'lev', name: 'Лев Аркадьевич', role: 'профессор, учёный',
    skin: '#eec4a4', hair: '#cfcfcf', brow: '#a9a9a9', lid: '#94705a',
    glasses: { color: '#c9a24a', style: 'round' },
    top: (x, y, z) => {
      const vest = '#7b5236', shirt = '#bcd3ea';
      if (z === 3) {
        const v = 19 - y; // V-neck
        if (Math.abs(x + 0.5) < v * 0.35 && y > 12) return shirt;
        if (x === 0 && y % 4 === 0 && y < 13) return '#d8c08a'; // buttons
      }
      if (y >= 17 && (x < -5 || x > 4)) return shirt; // shirt at shoulders
      return (x + y) % 2 === 0 ? vest : shade(vest, 0.93); // knit texture
    },
    sleeve: '#bcd3ea', pants: '#b9a27c', shoes: '#4a2c1b', sole: '#231409',
    build(B) {
      const H = B.head, T = B.torso, grey = '#cfcfcf', gd = '#b2b2b2';
      const pickG = (x, y, z) => (hash3(x, y, z) < 0.3 ? gd : grey);
      // bald top, grey fringe around sides & back
      H.box(0, 3, -1, 12, 12, 0, pickG);
      for (const sx of [-1, 12]) H.box(sx, 7, -1, sx + 1, 12, 4, pickG);
      for (const sx of [-1, 12]) H.box(sx, 10, 4, sx + 1, 12, 8, pickG);
      for (const sx of [-1, 12]) H.box(sx, 9, 6, sx + 1, 10, 11, '#c9a24a'); // glasses temples
      // big moustache
      H.box(1, 4, 11, 11, 6, 12, (x, y) => (y === 4 && x >= 3 && x <= 8 ? undefined : (x >= 5 && x <= 6 && y === 5 ? undefined : pickG(x, y, 11))));
      H.box(5, 5, 12, 7, 6, 13, gd);
      H.set(0, 4, 11, gd); H.set(11, 4, 11, gd);
      // wrinkles
      H.set(2, 13, 10, shade('#eec4a4', 0.9)); H.set(3, 13, 10, shade('#eec4a4', 0.9)); H.set(8, 13, 10, shade('#eec4a4', 0.9));
      // tummy
      T.box(-5, 3, 4, 5, 11, 5, (x, y) => (x === 0 && y % 4 === 0 ? '#d8c08a' : (x + y) % 2 === 0 ? '#7b5236' : shade('#7b5236', 0.93)));
      // collar + bow tie
      T.box(-3, 20, -3, 3, 21, 3, '#d2e2f2');
      T.box(-2, 18, 4, 2, 20, 5, (x) => (x === -1 || x === 0 ? '#8e1f2a' : '#b0283a'));
    },
  },

  // 5. Zara — business lady: high bun, purple blazer, white blouse, red shoes
  zara: {
    id: 'zara', name: 'Зара', role: 'начальница, деловая леди',
    skin: '#8e5a3c', hair: '#1c1513', lid: '#140d0c', brow: '#140d0c', lip: '#9b2b3a',
    top: (x, y, z) => '#5a3e9e',
    sleeve: (x, y, z, side, part) => (part === 'fore' && y <= -7 ? '#f1ede6' : '#5a3e9e'),
    pants: '#232327', shoes: '#b3263a', sole: '#5e101b',
    build(B) {
      const H = B.head, T = B.torso, P = B.pelvis, c = '#1c1513', hl = '#3a2a26';
      const pick = (x, y, z) => (hash3(x, y, z) < 0.18 ? hl : c);
      // sleek hair + high bun
      H.box(0, 13, 0, 12, 16, 11, pick);
      H.box(0, 5, -1, 12, 16, 0, pick);
      for (const sx of [-1, 12]) H.box(sx, 10, -1, sx + 1, 16, 8, pick);
      for (let x = 0; x < 12; x++) { H.set(x, 14, 11, pick(x, 14, 11)); H.set(x, 15, 11, pick(x, 15, 11)); }
      H.set(0, 13, 11, c); H.set(1, 13, 11, c); H.set(10, 13, 11, c); H.set(11, 13, 11, c);
      H.box(3, 16, 2, 9, 20, 8, pick); H.box(4, 20, 3, 8, 21, 7, pick);
      H.box(2, 16, 3, 10, 17, 7, '#c9a24a');                  // hair band
      // gold earrings
      for (const sx of [-1, 12]) { H.set(sx, 5, 5, '#e1b84f'); H.set(sx, 4, 5, '#e1b84f'); }
      // blazer: V opening with blouse, lapels, gold button
      T.box(-7, -2, 4, 7, 19, 5, (x, y) => {
        const v = Math.max(0, (y - 7) * 0.4);
        if (Math.abs(x + 0.5) < v) return undefined;
        if (Math.abs(x + 0.5) < v + 1.6 && y > 8) return '#47307f';
        return '#5a3e9e';
      });
      T.paint((x, y, z, c) => (z === 3 && Math.abs(x + 0.5) < Math.max(0, (y - 7) * 0.4) ? '#f1ede6' : undefined));
      T.box(-7, -2, -4, 7, 0, 4, (x, y, z) => (z === 3 ? '#5a3e9e' : '#5a3e9e'));
      T.set(-1, 6, 5, '#e1b84f'); T.set(0, 6, 5, '#e1b84f');
      T.box(-3, 20, -3, 3, 21, 3, '#f1ede6');
      // necklace
      T.set(-1, 16, 4, '#e1b84f'); T.set(0, 16, 4, '#e1b84f');
    },
  },

  // 6. Tim — teen gamer: blue cap, yellow tee, shorts, red sneakers
  tim: {
    id: 'tim', name: 'Тим', role: 'подросток, геймер',
    skin: '#e3ae80', hair: '#2a1d16', lid: '#6d4630',
    shortSleeves: true, shorts: true, socks: '#f4f4f4',
    top: (x, y, z) => {
      const tee = '#f3c22f';
      // star logo
      const sx = x + 0.5, sy = y - 11;
      if (z === 3 && ((Math.abs(sx) <= 1 && Math.abs(sy) <= 3) || (Math.abs(sy) <= 0.5 && Math.abs(sx) <= 3) || (Math.abs(sx) <= 2 && Math.abs(sy) <= 1))) return '#e2552f';
      if (y >= 19) return shade(tee, 0.9);
      return tee;
    },
    sleeve: (x, y) => (y <= -3 ? '#e3ae80' : '#f3c22f'),
    pants: (x, y, z, side, part) => (part === 'thigh' && y < -6 ? '#e3ae80' : '#4c6c9c'),
    shoes: (x, y, z) => (y === 0 ? '#ffffff' : '#d8323b'), sole: '#f2f2f2',
    build(B) {
      const H = B.head, T = B.torso, cap = '#2f6fd1';
      // short hair peeking out
      H.box(0, 3, -1, 12, 13, 0, '#2a1d16');
      for (const sx of [-1, 12]) H.box(sx, 10, -1, sx + 1, 13, 8, '#2a1d16');
      H.box(0, 13, 0, 12, 14, 11, '#2a1d16');
      // cap dome + brim + button
      H.box(-1, 13, -1, 13, 16, 11, (x, y) => (y === 13 ? shade(cap, 0.85) : cap));
      H.box(0, 16, 0, 12, 17, 11, cap);
      H.box(5, 17, 4, 7, 18, 6, shade(cap, 0.8));
      H.box(0, 14, 11, 12, 15, 16, (x, y, z) => (z >= 14 && (x === 0 || x === 11) ? undefined : shade(cap, 0.9)));
      H.box(2, 15, 11, 10, 16, 12, '#ffffff');                  // logo strip
      // shorts hem on thighs is via pants fn; neck rib
      T.box(-3, 19, -3, 3, 20, 4, shade('#f3c22f', 0.85));
    },
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);
