// Bundles src/*.js into viewer/template.html → viewer/index.html (single file, three.js from jsDelivr)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './harness.mjs';
const order = ['voxel', 'faces', 'rig', 'characters', 'clips', 'stage'];
const code = order.map(n => fs.readFileSync(path.join(ROOT, 'src', n + '.js'), 'utf8')
  .replace(/^import .*$/gm, '').replace(/^export \{[^}]*\};?$/gm, '').replace(/^export (?=const|function|class|let)/gm, '')).join('\n');
const tpl = fs.readFileSync(path.join(ROOT, 'viewer/template.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'viewer/index.html'), tpl.replace('/*__BUNDLE__*/', () => code));
console.log('viewer/index.html', fs.statSync(path.join(ROOT, 'viewer/index.html')).size);
