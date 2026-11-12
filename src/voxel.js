// Voxel grid + mesher (face culling, per-vertex ambient occlusion, subtle per-voxel colour noise)
import * as THREE from 'three';

const FACES = [
  { dir: [-1, 0, 0], axis: 0, corners: [[0, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 1]] },
  { dir: [1, 0, 0], axis: 0, corners: [[1, 1, 1], [1, 0, 1], [1, 1, 0], [1, 0, 0]] },
  { dir: [0, -1, 0], axis: 1, corners: [[1, 0, 1], [0, 0, 1], [1, 0, 0], [0, 0, 0]] },
  { dir: [0, 1, 0], axis: 1, corners: [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]] },
  { dir: [0, 0, -1], axis: 2, corners: [[1, 0, 0], [0, 0, 0], [1, 1, 0], [0, 1, 0]] },
  { dir: [0, 0, 1], axis: 2, corners: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]] },
];
const AO = [0.58, 0.74, 0.88, 1.0];

export function hash3(x, y, z) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Multiply an sRGB hex colour by f (f<1 darker, f>1 lighter). */
export function shade(hex, f) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl, THREE.SRGBColorSpace);
  hsl.l = Math.min(1, Math.max(0, hsl.l * f));
  c.setHSL(hsl.h, hsl.s, hsl.l, THREE.SRGBColorSpace);
  return '#' + c.getHexString();
}
export function mix(a, b, t) {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), t);
  return '#' + c.getHexString();
}

export class VoxelGrid {
  constructor() { this.m = new Map(); }
  static k(x, y, z) { return x + ',' + y + ',' + z; }
  set(x, y, z, c) {
    const k = VoxelGrid.k(x, y, z);
    if (c === null || c === undefined || c === false) this.m.delete(k);
    else this.m.set(k, { x, y, z, c });
  }
  get(x, y, z) { const v = this.m.get(VoxelGrid.k(x, y, z)); return v ? v.c : undefined; }
  has(x, y, z) { return this.m.has(VoxelGrid.k(x, y, z)); }
  /** Fill [x0,x1)×[y0,y1)×[z0,z1). c = colour, or fn(x,y,z,existing) -> colour | undefined(skip) | null(delete) */
  box(x0, y0, z0, x1, y1, z1, c) {
    for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) {
      const col = typeof c === 'function' ? c(x, y, z, this.get(x, y, z)) : c;
      if (col !== undefined) this.set(x, y, z, col);
    }
    return this;
  }
  /** Recolour existing voxels: fn(x,y,z,c) -> new colour | undefined(keep) | null(delete) */
  paint(fn) {
    for (const v of [...this.m.values()]) {
      const r = fn(v.x, v.y, v.z, v.c);
      if (r !== undefined) this.set(v.x, v.y, v.z, r);
    }
    return this;
  }
  get size() { return this.m.size; }
}

const colorCache = new Map();
function colorOf(hex) {
  let c = colorCache.get(hex);
  if (!c) { c = new THREE.Color(hex); colorCache.set(hex, c); }
  return c;
}

export function buildGeometry(grid, opts = {}) {
  const { scale = [1, 1, 1], offset = [0, 0, 0], ao = true, noise = 0.035 } = opts;
  const pos = [], nor = [], col = [], idx = [];
  for (const { x, y, z, c } of grid.m.values()) {
    const base = colorOf(c);
    const n = noise ? 1 + (hash3(x, y, z) - 0.5) * 2 * noise : 1;
    for (const f of FACES) {
      const [dx, dy, dz] = f.dir;
      if (grid.has(x + dx, y + dy, z + dz)) continue;
      const ndx = pos.length / 3;
      const t = f.axis === 0 ? [1, 2] : f.axis === 1 ? [0, 2] : [0, 1];
      for (const cr of f.corners) {
        pos.push((x + cr[0]) * scale[0] + offset[0], (y + cr[1]) * scale[1] + offset[1], (z + cr[2]) * scale[2] + offset[2]);
        nor.push(dx, dy, dz);
        let a = 1;
        if (ao) {
          const o1 = [0, 0, 0], o2 = [0, 0, 0];
          o1[t[0]] = cr[t[0]] * 2 - 1; o2[t[1]] = cr[t[1]] * 2 - 1;
          const bx = x + dx, by = y + dy, bz = z + dz;
          const s1 = grid.has(bx + o1[0], by + o1[1], bz + o1[2]) ? 1 : 0;
          const s2 = grid.has(bx + o2[0], by + o2[1], bz + o2[2]) ? 1 : 0;
          const cc = grid.has(bx + o1[0] + o2[0], by + o1[1] + o2[1], bz + o1[2] + o2[2]) ? 1 : 0;
          a = AO[s1 && s2 ? 0 : 3 - (s1 + s2 + cc)];
        }
        col.push(base.r * n * a, base.g * n * a, base.b * n * a);
      }
      idx.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
