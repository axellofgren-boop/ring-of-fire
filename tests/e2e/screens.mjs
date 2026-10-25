// Takes a picture of every stop on the tour at the three main sizes.
//   node tests/e2e/screens.mjs [outDir]          (default: screens/)
// Compare two sets with tests/e2e/compare.mjs.
import fs from "node:fs";
import path from "node:path";
import { chromium, openGame, SIZES, ROOT } from "./driver.mjs";
import { FLOWS } from "./tour.mjs";

const out = path.resolve(process.argv[2] || path.join(ROOT, "screens"));
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const browser = await chromium.launch();
let failed = 0;
for (const [sizeName, size] of Object.entries(SIZES)) {
  fs.mkdirSync(path.join(out, sizeName), { recursive: true });
  for (const flow of FLOWS) {
    if (only ? !only.includes(flow.name) : flow.checksOnly) continue;
    const page = await openGame(browser, size, flow.state);
    let n = 0;
    try {
      await flow.run(page, async name => { n++; await page.screenshot({ path: path.join(out, sizeName, `${flow.name}-${String(n).padStart(2, "0")}-${name}.png`) }); });
    } catch (e) { failed++; console.error(`${sizeName} ${flow.name}: ${e.message}`); }
    if (page.errors.length) { failed++; console.error(`${sizeName} ${flow.name} page errors:`, page.errors); }
    await page.context().close();
  }
  console.log("done", sizeName);
}
await browser.close();
process.exit(failed ? 1 : 0);
