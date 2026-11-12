// Brute-force arm angles so the right hand reaches a target point: node scripts/ik_solve.mjs x y z [headRx] [spineRx]
import * as THREE from 'three';
import { Character, REST } from '../src/rig.js';
import { CHARACTERS } from '../src/characters.js';
const ch = new Character(CHARACTERS.max);
const [tx,ty,tz, hx=0, sx=0] = process.argv.slice(2).map(Number);
const hand = new THREE.Vector3(); let best=[1e9];
for (let rx=-140; rx<=0; rx+=5) for (let rz=-20; rz<=90; rz+=5) for (let ex=-150; ex<=-60; ex+=5) for (let ey=-60; ey<=20; ey+=10) {
  ch.applyPose({ ...REST, head:[hx,0,0], spine:[sx,0,0], armR:[rx,0,rz], elbowR:[ex,ey,0] });
  ch.root.updateMatrixWorld(true);
  hand.set(0,-10,0).applyMatrix4(ch.joints.elbowR.matrixWorld);
  // elbow should stay outside/below; penalize elbow entering torso
  const el = new THREE.Vector3().setFromMatrixPosition(ch.joints.elbowR.matrixWorld);
  const pen = (el.z < 7 && Math.abs(el.x) < 8 && el.y > 18) ? 50 : 0;
  const d = hand.distanceTo(new THREE.Vector3(tx,ty,tz)) + pen;
  if (d < best[0]) best=[d, rx, rz, ex, ey, hand.toArray().map(v=>v.toFixed(1)).join(','), el.toArray().map(v=>v.toFixed(1)).join(',')];
}
console.log(best);
