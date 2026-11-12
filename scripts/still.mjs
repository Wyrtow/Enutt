// Quick test stills: node scripts/still.mjs out.png '[{"id":"max","clip":"idle","t":0}]' [w h]
import { openHarness } from './harness.mjs';
const [out, json, w = 1024, h = 1024, bg] = process.argv.slice(2);
const H = await openHarness();
await H.setup({ width: +w, height: +h, background: bg || null });
await H.frame(JSON.parse(json), out);
await H.close();
