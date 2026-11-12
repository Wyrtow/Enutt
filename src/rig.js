// Character rig: builds voxel body parts from a spec, joints hierarchy, pose + face application.
import * as THREE from 'three';
import { VoxelGrid, buildGeometry, shade, mix } from './voxel.js';
import { faceGeometry, EMOTIONS, VISEME_CYCLE } from './faces.js';

export const JOINTS = ['hips', 'spine', 'head', 'armL', 'elbowL', 'armR', 'elbowR', 'legL', 'kneeL', 'ankleL', 'legR', 'kneeR', 'ankleR'];

export const REST = {
  pos: [0, 0, 0],
  hips: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0],
  armL: [0, 0, 4], elbowL: [-6, 0, 0],
  armR: [0, 0, -4], elbowR: [-6, 0, 0],
  legL: [0, 0, 0], kneeL: [0, 0, 0],
  legR: [0, 0, 0], kneeR: [0, 0, 0],
};

const PARTS = ['head', 'torso', 'pelvis', 'upperArmL', 'upperArmR', 'forearmL', 'forearmR', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR'];

const fn = (c) => (typeof c === 'function' ? c : () => c);

/** Default body. spec colours may be strings or functions (x,y,z,side) -> colour */
export function buildParts(spec) {
  const B = {};
  PARTS.forEach(p => (B[p] = new VoxelGrid()));
  const S = spec.skin;
  const top = fn(spec.top), sleeve = fn(spec.sleeve || spec.top), pants = fn(spec.pants);
  const shoes = fn(spec.shoes), sole = spec.sole || shade(typeof spec.shoes === 'string' ? spec.shoes : '#333', 0.6);

  // ---- head (x 0..11, y 0..13, z 0..10), front = z 10
  B.head.box(0, 0, 0, 12, 14, 11, S);
  if (spec.ears !== false) {
    for (const ex of [-1, 12]) {
      B.head.box(ex, 6, 4, ex + 1, 10, 7, S);
      B.head.set(ex, 7, 5, shade(S, 0.8));
      B.head.set(ex, 8, 5, shade(S, 0.8));
    }
  }
  // nose
  B.head.box(5, 5, 11, 7, 8, 12, S);
  B.head.set(5, 5, 11, shade(S, 0.86)); B.head.set(6, 5, 11, shade(S, 0.86));
  // jaw shading under chin
  B.head.paint((x, y, z, c) => (y === 0 && c === S ? shade(S, 0.93) : undefined));
  // neck
  B.head.box(4, -2, 3, 8, 0, 8, shade(S, 0.92));

  // ---- torso (x -7..6, y 0..19, z -4..3), front = z 3
  B.torso.box(-7, 0, -4, 7, 20, 4, (x, y, z) => top(x, y, z));
  // ---- pelvis
  B.pelvis.box(-6, -4, -3, 6, 0, 3, (x, y, z) => pants(x, y, z, 'P'));

  for (const side of ['L', 'R']) {
    const up = B['upperArm' + side], fore = B['forearm' + side];
    up.box(-2, -9, -2, 2, 2, 2, (x, y, z) => (spec.shortSleeves && y < -3 ? S : sleeve(x, y, z, side, 'upper')));
    fore.box(-2, -8, -2, 2, 1, 2, (x, y, z) => (spec.shortSleeves ? S : sleeve(x, y, z, side, 'fore')));
    // hand: 4x4x4 + thumb + knuckle line
    fore.box(-2, -12, -2, 2, -8, 2, S);
    const inner = side === 'L' ? -2 : 1;
    fore.set(inner, -9, 2, S); fore.set(inner, -10, 2, S);
    fore.paint((x, y, z, c) => (c === S && y === -12 ? shade(S, 0.92) : undefined));

    const th = B['thigh' + side], sh = B['shin' + side], ft = B['foot' + side];
    th.box(-3, -10, -3, 3, 2, 3, (x, y, z) => pants(x, y, z, side, 'thigh'));
    sh.box(-3, -8, -3, 3, 0, 3, (x, y, z) => (spec.shorts ? (spec.socks && y < -5 ? spec.socks : S) : pants(x, y, z, side, 'shin')));
    ft.box(-3, -2, -3, 3, 1, 4, (x, y, z) => (y === -2 ? sole : shoes(x, y, z, side)));
  }
  if (spec.build) spec.build(B, spec);
  return B;
}

let sharedMat = null;
export function material() {
  if (!sharedMat) sharedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.0 });
  return sharedMat;
}

function glassesGrid(spec) {
  // half-voxel resolution grid (cell = 0.5) so the frame is thin like real glasses
  const g = new VoxelGrid();
  const c = spec.glasses.color;
  const round = spec.glasses.style === 'round';
  for (const x0 of [1, 13]) {            // half-cell x of frame outer-left (eye spans 1..5 / 7..11)
    const x1 = x0 + 9, y0 = 13, y1 = 20;  // frame outer box in half cells
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const border = x === x0 || x === x1 || y === y0 || y === y1;
      if (!border) continue;
      if (round && (x === x0 || x === x1) && (y === y0 || y === y1)) continue;
      if (x >= 10 && x <= 13 && y <= 16) continue; // nose
      g.set(x, y, 0, c);
    }
    if (round) { g.set(x0 + 1, y0 + 1, 0, c); g.set(x1 - 1, y0 + 1, 0, c); g.set(x0 + 1, y1 - 1, 0, c); g.set(x1 - 1, y1 - 1, 0, c); }
  }
  g.set(11, 19, 0, c); g.set(12, 19, 0, c); // bridge
  for (const x of [0, 23]) for (const y of [18, 19]) g.set(x, y, 0, c); // hinges
  return g;
}

export class Character {
  constructor(spec) {
    this.spec = spec;
    this.id = spec.id;
    const B = buildParts(spec);
    const mat = material();
    const root = (this.root = new THREE.Group());
    root.name = spec.id;
    const J = (this.joints = {});
    const mk = (name, parent, p) => {
      const g = new THREE.Group();
      g.name = name; g.position.set(...p); g.userData.base = p.slice();
      parent.add(g); J[name] = g; return g;
    };
    mk('hips', root, [0, 22, 0]);
    mk('spine', J.hips, [0, 0, 0]);
    mk('head', J.spine, [0, 20, 0]);
    mk('armL', J.spine, [9, 18, 0]); mk('elbowL', J.armL, [0, -9, 0]);
    mk('armR', J.spine, [-9, 18, 0]); mk('elbowR', J.armR, [0, -9, 0]);
    mk('legL', J.hips, [3.5, -2, 0]); mk('kneeL', J.legL, [0, -10, 0]); mk('ankleL', J.kneeL, [0, -8, 0]);
    mk('legR', J.hips, [-3.5, -2, 0]); mk('kneeR', J.legR, [0, -10, 0]); mk('ankleR', J.kneeR, [0, -8, 0]);

    const add = (grid, parent, opts) => {
      if (!grid || !grid.size) return null;
      const m = new THREE.Mesh(buildGeometry(grid, opts), mat);
      m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    };
    add(B.head, J.head, { offset: [-6, 1, -5.5] });
    add(B.torso, J.spine);
    add(B.pelvis, J.hips);
    for (const s of ['L', 'R']) {
      add(B['upperArm' + s], J['arm' + s]);
      add(B['forearm' + s], J['elbow' + s]);
      add(B['thigh' + s], J['leg' + s]);
      add(B['shin' + s], J['knee' + s]);
      add(B['foot' + s], J['ankle' + s]);
    }
    if (spec.glasses) add(glassesGrid(spec), J.head, { scale: [0.5, 0.5, 0.6], offset: [-6, 1, 5.66], ao: false, noise: 0 });

    const S = spec.skin;
    this.palette = {
      W: spec.eyeWhite || '#f3f1ec', P: spec.pupil || '#1c1a20', L: spec.lid || shade(S, 0.55),
      B: spec.brow || shade(spec.hair || '#3a2a20', 0.75), D: '#3d1b1d', T: '#f5f2ea', G: '#c24f5a',
      R: spec.lip || mix(shade(S, 0.8), '#9a4a4a', 0.18), K: spec.blushColor || mix(S, '#ff6b7a', 0.45),
    };
    this.faceMesh = new THREE.Mesh(faceGeometry(EMOTIONS.neutral, this.palette, this.id), mat);
    this.faceMesh.castShadow = false; this.faceMesh.receiveShadow = true;
    J.head.add(this.faceMesh);
    this.faceState = null;
    this.blinkSeed = (spec.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 97 / 97;
  }

  /** pose: joint -> [rx,ry,rz] degrees, pos -> [x,y,z] offset of hips. ankles auto-plant unless given. */
  applyPose(pose) {
    const D = Math.PI / 180;
    const J = this.joints;
    for (const name of JOINTS) {
      const r = pose[name] || REST[name] || [0, 0, 0];
      J[name].rotation.set(r[0] * D, r[1] * D, r[2] * D, name.startsWith('arm') ? 'XZY' : 'XYZ');
    }
    const plant = pose.plant ?? 1;
    for (const s of ['L', 'R']) {
      if (!pose['ankle' + s]) {
        const l = pose['leg' + s] || [0, 0, 0], k = pose['knee' + s] || [0, 0, 0], h = pose.hips || [0, 0, 0];
        J['ankle' + s].rotation.set(-(l[0] + k[0] + h[0]) * plant * D, 0, 0);
      }
    }
    const p = pose.pos || [0, 0, 0];
    J.hips.position.set(p[0], 22 + p[1], p[2]);
  }

  /** face: emotion name or object {eyes, eyeL, eyeR, brows, browL, browR, mouth, gaze:[x,y], blush} */
  setFace(face) {
    const f = typeof face === 'string' ? EMOTIONS[face] : face;
    const key = JSON.stringify(f);
    if (key === this.faceState) return;
    this.faceState = key;
    this.faceMesh.geometry = faceGeometry(f, this.palette, this.id);
  }

  /** Evaluate clip at time t (seconds) and apply. opts: {blink:true, breathe:true} */
  update(clip, t, opts = {}) {
    const { pose, face } = sampleClip(clip, t);
    // breathing layer
    if (opts.breathe !== false) {
      const b = Math.sin((t / 3.6) * Math.PI * 2);
      pose.spine = add3(pose.spine, [b * 0.8, 0, 0]);
      pose.head = add3(pose.head, [-b * 0.6, 0, 0]);
      pose.armL = add3(pose.armL, [0, 0, b * 0.8]);
      pose.armR = add3(pose.armR, [0, 0, -b * 0.8]);
    }
    const f = resolveFace(face);
    // talking: cycle visemes
    if (f.mouth === 'talk') f.mouth = VISEME_CYCLE[Math.floor(t * 9 + this.blinkSeed * 5) % VISEME_CYCLE.length];
    if (opts.mouth) f.mouth = opts.mouth; // external lip-sync override
    // auto blink
    if (opts.blink !== false && ['neutral', 'open', 'sad', 'angry', 'focused'].includes(f.eyes) && !f.eyeL && !f.eyeR) {
      const period = 3.3, ph = ((t + this.blinkSeed * period) % period);
      if (ph < 0.12) f.eyes = 'blink';
    }
    this.applyPose(pose);
    this.setFace(f);
  }
}

function add3(a, b) { a = a || [0, 0, 0]; return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }

export function resolveFace(face) {
  if (!face) return { ...EMOTIONS.neutral };
  const base = face.emotion ? EMOTIONS[face.emotion] : {};
  const { emotion, ...rest } = face;
  return { ...EMOTIONS.neutral, ...base, ...rest };
}

// ---------- clip sampling ----------
export const EASE = {
  linear: u => u,
  inout: u => 0.5 - 0.5 * Math.cos(Math.PI * u),
  in: u => u * u,
  out: u => 1 - (1 - u) * (1 - u),
  back: u => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
};

function prepare(clip) {
  if (clip._prepared) return clip._prepared;
  let prev = { ...REST };
  let prevFace = {};
  const keys = clip.keys.map(k => {
    const base = k.rest ? { ...REST } : prev;
    const full = { ...base, ...(k.pose || {}) };
    const face = k.face ? (typeof k.face === 'string' ? { emotion: k.face } : (k.face.emotion || !prevFace ? k.face : { ...prevFace, ...k.face })) : prevFace;
    prev = full; prevFace = face;
    return { t: k.t, ease: k.ease || 'inout', full, face };
  });
  clip._prepared = keys;
  return keys;
}

export function sampleClip(clip, t) {
  const keys = prepare(clip);
  if (clip.loop) t = ((t % clip.duration) + clip.duration) % clip.duration;
  else t = Math.min(Math.max(t, 0), clip.duration);
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const u = b.t > a.t ? EASE[b.ease]((t - a.t) / (b.t - a.t)) : 0;
  const pose = {};
  const names = new Set([...Object.keys(a.full), ...Object.keys(b.full)]);
  for (const n of names) {
    const va = a.full[n], vb = b.full[n];
    if (typeof va === 'number' || typeof vb === 'number') { pose[n] = (va ?? 1) + ((vb ?? 1) - (va ?? 1)) * u; continue; }
    const A = va || REST[n] || [0, 0, 0], Bv = vb || REST[n] || [0, 0, 0];
    pose[n] = [A[0] + (Bv[0] - A[0]) * u, A[1] + (Bv[1] - A[1]) * u, A[2] + (Bv[2] - A[2]) * u];
  }
  const face = { ...(a.face || {}) };
  if (clip.fn) clip.fn(t, pose, face);
  return { pose, face };
}
