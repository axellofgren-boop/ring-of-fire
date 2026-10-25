// Compares two screenshot sets taken with screens.mjs and lists every picture that changed, with the share of pixels that differ.
//   node tests/e2e/compare.mjs <before dir> <after dir>
// Used to prove a clean-up changed nothing on screen, and to show exactly which screens a layout change touched.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "./driver.mjs";

const [a, b] = process.argv.slice(2).map(p => path.resolve(p));
const files = dir => fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith(".png")).sort();
const fa = files(a), fb = new Set(files(b));
const browser = await chromium.launch();
const page = await browser.newPage();
let changed = 0;
for (const f of fa) {
  if (!fb.has(f)) { console.log("missing  ", f); changed++; continue; }
  const x = fs.readFileSync(path.join(a, f)), y = fs.readFileSync(path.join(b, f));
  if (x.equals(y)) continue;
  const diff = await page.evaluate(async ([p, q]) => {
    const load = async s => { const i = new Image(); i.src = "data:image/png;base64," + s; await i.decode(); return i; };
    const [i1, i2] = [await load(p), await load(q)];
    if (i1.width !== i2.width || i1.height !== i2.height) return 1;
    const c = new OffscreenCanvas(i1.width, i1.height).getContext("2d");
    c.drawImage(i1, 0, 0); const d1 = c.getImageData(0, 0, i1.width, i1.height).data;
    c.clearRect(0, 0, i1.width, i1.height); c.drawImage(i2, 0, 0); const d2 = c.getImageData(0, 0, i1.width, i1.height).data;
    let n = 0; for (let k = 0; k < d1.length; k += 4) if (Math.abs(d1[k] - d2[k]) + Math.abs(d1[k + 1] - d2[k + 1]) + Math.abs(d1[k + 2] - d2[k + 2]) > 24) n++;
    return n / (d1.length / 4);
  }, [x.toString("base64"), y.toString("base64")]);
  if (diff > 0) { changed++; console.log(`changed   ${f}  ${(diff * 100).toFixed(2)}% of pixels`); }
}
for (const f of fb) if (!fa.includes(f)) { console.log("new      ", f); changed++; }
console.log(changed ? `${changed} of ${fa.length} pictures differ` : `all ${fa.length} pictures identical`);
await browser.close();
