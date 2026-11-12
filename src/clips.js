// Animation clips. Key poses use "carry" semantics: joints not mentioned keep the previous key's value.
// `rest: true` resets everything to REST before applying the key's pose. Angles in degrees.
// Arms (order XZY): rx<0 swings forward/up, armL rz>0 / armR rz<0 raises sideways. elbow rx<0 bends.
// Legs: rx<0 forward, knee rx>0 bends. pos = hips offset in voxels.
import { REST } from './rig.js';

const S = Math.sin, PI2 = Math.PI * 2;
const crouch = (a) => ({ legL: [-a, 0, 0], legR: [-a, 0, 0], kneeL: [2 * a, 0, 0], kneeR: [2 * a, 0, 0], pos: [0, -(20 - 20 * Math.cos(a * Math.PI / 180)), 0] });

export const CLIPS = {
  idle: {
    name: 'Ожидание (дыхание)', duration: 4, loop: true,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 2, pose: { spine: [1, 0, 1], head: [-2, 4, -2], hips: [0, 0, -1] } },
      { t: 4, rest: true },
    ],
  },

  talk: {
    name: 'Говорит с жестами', duration: 4, loop: true,
    keys: [
      { t: 0, rest: true, face: { emotion: 'smile', mouth: 'talk' } },
      { t: 0.6, pose: { armR: [-30, 0, -8], elbowR: [-75, 0, 10], head: [4, -6, 2], spine: [3, -4, 0] } },
      { t: 1.4, pose: { armR: [-10, 0, -6], elbowR: [-30, 0, 0], armL: [-35, 0, 10], elbowL: [-70, 0, -10], head: [-3, 6, -2], spine: [2, 4, 0] }, face: { brows: 'raised' } },
      { t: 2.3, pose: { armR: [-30, 0, -25], elbowR: [-70, 0, 0], armL: [-30, 0, 25], elbowL: [-70, 0, 0], head: [5, 0, 0], spine: [4, 0, 0] }, face: { brows: 'neutral' } },
      { t: 3.2, pose: { armR: [-15, 0, -6], elbowR: [-40, 0, 0], armL: [-8, 0, 6], elbowL: [-25, 0, 0], head: [0, -3, 2], spine: [1, -2, 0] } },
      { t: 4, rest: true },
    ],
    fn(t, pose) { pose.head[0] += 2.5 * S(t * PI2 * 1.7); },
  },

  wave: {
    name: 'Машет рукой (привет)', duration: 3, loop: false,
    keys: [
      { t: 0, rest: true, face: 'smile' },
      { t: 0.45, pose: { armR: [-10, 0, -150], elbowR: [-5, 0, 25], spine: [0, 0, 4], head: [0, 0, -5] }, ease: 'back', face: 'happy' },
      { t: 0.75, pose: { elbowR: [-5, 0, -25] } },
      { t: 1.05, pose: { elbowR: [-5, 0, 25] } },
      { t: 1.35, pose: { elbowR: [-5, 0, -25] } },
      { t: 1.65, pose: { elbowR: [-5, 0, 25] } },
      { t: 1.95, pose: { elbowR: [-5, 0, -15] } },
      { t: 2.5, rest: true, face: 'smile' },
      { t: 3, rest: true },
    ],
  },

  walk: {
    name: 'Ходьба (цикл)', duration: 1.1, loop: true,
    keys: [{ t: 0, rest: true, face: 'neutral' }, { t: 1.1, rest: true }],
    fn(t, pose) {
      const p = (t / 1.1) * PI2;
      const sw = 28;
      const L = sw * S(p), R = -sw * S(p);
      pose.legL = [L, 0, 0]; pose.legR = [R, 0, 0];
      pose.kneeL = [6 + 42 * Math.max(0, -Math.cos(p)) ** 1.5, 0, 0];
      pose.kneeR = [6 + 42 * Math.max(0, Math.cos(p)) ** 1.5, 0, 0];
      pose.plant = 0.55;
      pose.armL = [-0.9 * L, 0, 5]; pose.armR = [-0.9 * R, 0, -5];
      pose.elbowL = [-18 - 12 * Math.max(0, S(p)), 0, 0]; pose.elbowR = [-18 - 12 * Math.max(0, -S(p)), 0, 0];
      pose.hips = [0, 6 * S(p), 0];
      pose.spine = [3, -9 * S(p), 0];
      pose.head = [-2, 3 * S(p), 0];
      pose.pos = [0, -0.9 * Math.abs(S(p)) + 0.2, 0];
    },
  },

  celebrate: {
    name: 'Радость, прыжок', duration: 2.6, loop: false,
    keys: [
      { t: 0, rest: true, face: 'smile' },
      { t: 0.35, pose: { ...crouch(32), spine: [18, 0, 0], head: [-10, 0, 0], armL: [30, 0, 10], armR: [30, 0, -10], elbowL: [-30, 0, 0], elbowR: [-30, 0, 0] }, face: 'happy' },
      { t: 0.62, pose: { legL: [-8, 0, 0], legR: [-8, 0, 0], kneeL: [12, 0, 0], kneeR: [12, 0, 0], pos: [0, 9, 0], spine: [-6, 0, 0], head: [-8, 0, 0], armL: [0, 0, 165], armR: [0, 0, -165], elbowL: [0, 0, -10], elbowR: [0, 0, 10], plant: 0.3 }, ease: 'out', face: 'laugh' },
      { t: 0.85, pose: { ...crouch(20), pos: [0, 11, 0], kneeL: [55, 0, 0], kneeR: [55, 0, 0], plant: 0.2 }, ease: 'out' },
      { t: 1.12, pose: { ...crouch(28), spine: [10, 0, 0], plant: 1 }, ease: 'in' },
      { t: 1.4, pose: { ...crouch(6), spine: [0, 0, 0], head: [-6, 0, 0], armL: [-20, 0, 150], armR: [-20, 0, -150], elbowL: [-40, 0, 0], elbowR: [-40, 0, 0] } },
      { t: 1.65, pose: { armL: [-20, 0, 120], armR: [-20, 0, -120], elbowL: [-70, 0, 0], elbowR: [-70, 0, 0], ...crouch(0) } },
      { t: 1.9, pose: { armL: [-20, 0, 150], armR: [-20, 0, -150], elbowL: [-40, 0, 0], elbowR: [-40, 0, 0] } },
      { t: 2.6, rest: true, face: 'happy' },
    ],
  },

  laugh: {
    name: 'Смеётся', duration: 3, loop: false,
    keys: [
      { t: 0, rest: true, face: 'smile' },
      { t: 0.4, pose: { spine: [-12, 0, 0], head: [-14, 0, 3], armL: [-25, 0, -8], armR: [-25, 0, 8], elbowL: [-85, 0, 0], elbowR: [-85, 0, 0] }, face: 'laugh' },
      { t: 1.4, pose: { spine: [14, 0, 0], head: [8, 0, -3] } },
      { t: 2.2, pose: { spine: [-6, 0, 0], head: [-8, 0, 2] } },
      { t: 3, rest: true, face: 'happy' },
    ],
    fn(t, pose) {
      if (t > 0.3 && t < 2.5) {
        const k = Math.sin(Math.PI * (t - 0.3) / 2.2);
        pose.spine[0] += 2.5 * k * S(t * PI2 * 6);
        pose.pos = [0, 0.5 * k * Math.abs(S(t * PI2 * 3)), 0];
        pose.head[0] += 2 * k * S(t * PI2 * 6 + 1);
      }
    },
  },

  sad: {
    name: 'Грустит, вздыхает', duration: 3.6, loop: false,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 0.5, face: 'sad' },
      { t: 1.1, pose: { head: [24, 0, 4], spine: [12, 0, 0], armL: [6, 0, 2], armR: [6, 0, -2], elbowL: [-2, 0, 0], elbowR: [-2, 0, 0], pos: [0, -0.4, 0] } },
      { t: 1.8, pose: { head: [14, 0, 2], spine: [4, 0, 0], pos: [0, 0.2, 0] }, face: { emotion: 'sad', eyes: 'closed' } },
      { t: 2.5, pose: { head: [26, 0, 5], spine: [13, 0, 0], pos: [0, -0.5, 0] }, face: 'sad' },
      { t: 3.6, rest: true },
    ],
  },

  angry: {
    name: 'Злится, топает', duration: 3, loop: false,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 0.3, face: 'angry' },
      { t: 0.5, pose: { armL: [-15, 0, 22], armR: [-15, 0, -22], elbowL: [-95, 0, 0], elbowR: [-95, 0, 0], spine: [10, 0, 0], head: [-6, 0, 0] } },
      { t: 0.85, pose: { legR: [-35, 0, 0], kneeR: [55, 0, 0], plant: 0.4, spine: [6, 0, 0] }, ease: 'out' },
      { t: 1.05, pose: { legR: [0, 0, 0], kneeR: [0, 0, 0], plant: 1, spine: [14, 0, 0], pos: [0, -0.8, 0] }, ease: 'in' },
      { t: 1.3, pose: { pos: [0, 0, 0], spine: [10, 0, 0] } },
      { t: 2.4, pose: { spine: [9, -6, 0], head: [-4, 8, 0] } },
      { t: 3, rest: true },
    ],
    fn(t, pose) {
      if (t > 1.05 && t < 2.5) {
        const k = 1 - (t - 1.05) / 1.45;
        pose.armL[2] += 4 * k * S(t * PI2 * 9);
        pose.armR[2] -= 4 * k * S(t * PI2 * 9);
        pose.head[2] = (pose.head[2] || 0) + 2 * k * S(t * PI2 * 11);
      }
    },
  },

  surprised: {
    name: 'Удивление', duration: 2.6, loop: false,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 0.2, face: 'surprised' },
      { t: 0.32, pose: { spine: [-12, 0, 0], head: [-12, 0, 0], armL: [-40, 0, 35], armR: [-40, 0, -35], elbowL: [-85, 0, 0], elbowR: [-85, 0, 0], pos: [0, 1.4, -1], plant: 0.6 }, ease: 'out' },
      { t: 0.55, pose: { spine: [-8, 0, 0], head: [-8, 0, 0], pos: [0, 0, -1.5], plant: 1 }, ease: 'in' },
      { t: 1.9, pose: { spine: [-6, 0, 0], head: [-6, 0, 3], armL: [-35, 0, 30], armR: [-35, 0, -30] } },
      { t: 2.6, rest: true, face: 'neutral' },
    ],
  },

  think: {
    name: 'Думает (рука у подбородка)', duration: 4.2, loop: false,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 0.7, pose: { armR: [-50, 0, 48], elbowR: [-88, -58, 0], armL: [-30, 0, -40], elbowL: [-95, 0, 0], head: [-6, 12, 6], spine: [0, 4, 0] }, face: 'thinking' },
      { t: 2.0, pose: { head: [-10, 16, 8] }, face: { emotion: 'thinking', gaze: [1, 1] } },
      { t: 3.0, pose: { head: [-4, 6, 4] }, face: { emotion: 'thinking', gaze: [-1, 0] } },
      { t: 3.5, face: 'smile' },
      { t: 4.2, rest: true },
    ],
  },

  point: {
    name: 'Указывает вперёд', duration: 2.6, loop: false,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 0.45, pose: { armR: [-88, 0, -22], elbowR: [-6, 0, 0], spine: [0, -12, 0], head: [-2, -6, 0], armL: [-10, 0, 8] }, ease: 'back', face: 'wink' },
      { t: 1.9, pose: { armR: [-82, 0, -20] }, face: { emotion: 'smile' } },
      { t: 2.6, rest: true },
    ],
  },

  facepalm: {
    name: 'Фейспалм', duration: 3.2, loop: false,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 0.3, face: 'bored' },
      { t: 0.75, pose: { armR: [-80, 0, 60], elbowR: [-85, -50, 0], head: [22, 0, 0], spine: [10, 0, 0] }, face: { emotion: 'sad', eyes: 'closed' } },
      { t: 2.3, pose: { head: [26, 6, 0], armR: [-82, 0, 60] } },
      { t: 2.6, face: 'bored' },
      { t: 3.2, rest: true },
    ],
    fn(t, pose) { if (t > 0.8 && t < 2.3) pose.head[1] += 6 * S((t - 0.8) * PI2 * 1.3); },
  },

  shrug: {
    name: 'Пожимает плечами', duration: 2.4, loop: false,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 0.45, pose: { armL: [-25, 0, 35], armR: [-25, 0, -35], elbowL: [-75, 0, 35], elbowR: [-75, 0, -35], head: [0, 0, 10], spine: [0, 0, -2], pos: [0, 0.6, 0] }, ease: 'back', face: { emotion: 'skeptical', mouth: 'wavy' } },
      { t: 1.6, pose: { head: [0, 0, 8] } },
      { t: 2.4, rest: true, face: 'neutral' },
    ],
  },

  yes: {
    name: 'Кивает «да»', duration: 1.8, loop: false,
    keys: [
      { t: 0, rest: true, face: 'smile' },
      { t: 0.3, pose: { head: [16, 0, 0] } }, { t: 0.6, pose: { head: [-6, 0, 0] } },
      { t: 0.9, pose: { head: [16, 0, 0] } }, { t: 1.2, pose: { head: [-4, 0, 0] }, face: 'happy' },
      { t: 1.8, rest: true },
    ],
  },

  no: {
    name: 'Мотает головой «нет»', duration: 1.8, loop: false,
    keys: [
      { t: 0, rest: true, face: 'neutral' },
      { t: 0.25, pose: { head: [4, 25, 0] }, face: 'skeptical' }, { t: 0.55, pose: { head: [4, -25, 0] } },
      { t: 0.85, pose: { head: [4, 22, 0] } }, { t: 1.15, pose: { head: [4, -15, 0] } },
      { t: 1.8, rest: true },
    ],
  },
};

export const CLIP_IDS = Object.keys(CLIPS);
export { REST };
