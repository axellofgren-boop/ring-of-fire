// Builds the one-file game (index.html) from the small source files in src/, and stamps sw.js so phones pick up the new version.
//   node tools/build.mjs           write index.html and sw.js
//   node tools/build.mjs --check   fail if the committed index.html or sw.js are out of date
//
// The source is plain ES modules (the logic tests import them straight into Node). GitHub Pages, the Artifact and
// double-clicking index.html all need one self-contained file, so this joins them: modules in import order inside one
// function scope, with the import and export keywords removed. That only works if every top-level name is unique across
// the whole app and every import names something its file really exports, so both are checked here.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "src");

// Stylesheets in cascade order: shared look first, then each screen and mini-game, then the three layouts.
export const STYLES = [
  "styles/fonts.css",
  "styles/base.css",
  "styles/setup.css",
  "styles/rules-editor.css",
  "styles/ring.css",
  "styles/sheets.css",
  "styles/dice.css",
  "styles/end.css",
  "styles/chart.css",
  "styles/effects.css",
  "minigames/horse-race/style.css",
  "minigames/bomb/style.css",
  "minigames/door/style.css",
  "minigames/impostor/style.css",
  // One file per form factor. Each wraps its rules in a single media query, so a change for one never leaks into another.
  "styles/layout/phone-portrait.css",
  "styles/layout/landscape.css",
  "styles/layout/phone-landscape.css",
  "styles/layout/desktop.css",
  "styles/motion.css"
];

const IMPORT = /^import\s+(?:\{([^}]*)\}\s+from\s+)?"([^"]+)";\s*$/;
const DECL = /^(export\s+)?(?:async\s+)?(?:function\*?|const|let|class)\s+([\w$]+)/;

function readModule(file) {
  const text = fs.readFileSync(file, "utf8");
  const imports = [], body = [], exports = new Set(), names = [];
  text.split("\n").forEach((line, i) => {
    if (line.startsWith("import")) {
      const m = line.match(IMPORT);
      if (!m) throw new Error(`${rel(file)}:${i + 1}: write imports on one line as import { a, b } from "./x.js";`);
      imports.push({ names: m[1] ? m[1].split(",").map(s => s.trim()).filter(Boolean) : [], from: path.resolve(path.dirname(file), m[2]), line: i + 1 });
      return;
    }
    if (/^export\s+(default|\{|\*)/.test(line)) throw new Error(`${rel(file)}:${i + 1}: only "export function/const/let" is supported`);
    const d = line.match(DECL);
    if (d) { names.push(d[2]); if (d[1]) exports.add(d[2]); }
    body.push(line.replace(/^export\s+/, ""));
  });
  return { file, imports, exports, names, body: body.join("\n").trim() };
}
const rel = f => path.relative(ROOT, f);

export function bundleJs(entry = path.join(SRC, "main.js")) {
  const mods = new Map(), order = [];
  const visit = (file, from) => {
    if (mods.has(file)) return;
    if (!fs.existsSync(file)) throw new Error(`${from ? rel(from) : "build"}: imports missing file ${rel(file)}`);
    const m = readModule(file);
    mods.set(file, m);
    m.imports.forEach(im => visit(im.from, file));
    order.push(m);
  };
  visit(entry);
  for (const m of order) for (const im of m.imports) {
    const target = mods.get(im.from);
    for (const n of im.names) {
      if (n.includes(" as ")) throw new Error(`${rel(m.file)}:${im.line}: renaming imports ("as") is not supported`);
      if (!target.exports.has(n)) throw new Error(`${rel(m.file)}:${im.line}: ${rel(im.from)} does not export ${n}`);
    }
  }
  const seen = new Map();
  for (const m of order) for (const n of m.names) {
    if (seen.has(n)) throw new Error(`top-level name "${n}" is declared in both ${rel(seen.get(n))} and ${rel(m.file)}`);
    seen.set(n, m.file);
  }
  return `(function () {\n"use strict";\n${order.map(m => `// ===== ${path.relative(SRC, m.file)} =====\n${m.body}`).join("\n\n")}\n})();`;
}

export function bundleCss() {
  const onDisk = [...walk(SRC)].filter(f => f.endsWith(".css")).map(f => path.relative(SRC, f)).sort();
  const missing = onDisk.filter(f => !STYLES.includes(f));
  if (missing.length) throw new Error(`stylesheets not listed in tools/build.mjs STYLES: ${missing.join(", ")}`);
  return STYLES.map(f => fs.readFileSync(path.join(SRC, f), "utf8").trim()).join("\n");
}
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

export function build() {
  const page = fs.readFileSync(path.join(SRC, "index.html"), "utf8")
    .replace("<!-- @styles -->", () => `<style>\n${bundleCss()}\n</style>`)
    .replace("<!-- @script -->", () => `<script>\n${bundleJs()}\n</script>`);
  const version = crypto.createHash("sha1").update(page).digest("hex").slice(0, 10);
  const sw = fs.readFileSync(path.join(ROOT, "tools/sw.template.js"), "utf8").replace("__VERSION__", version);
  return { "index.html": page, "sw.js": sw, version };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const out = build();
    if (process.argv.includes("--check")) {
      const stale = ["index.html", "sw.js"].filter(f => !fs.existsSync(path.join(ROOT, f)) || fs.readFileSync(path.join(ROOT, f), "utf8") !== out[f]);
      if (stale.length) { console.error(`Out of date: ${stale.join(", ")}. Run npm run build and commit the result.`); process.exit(1); }
      console.log("index.html and sw.js are up to date");
    } else {
      for (const f of ["index.html", "sw.js"]) fs.writeFileSync(path.join(ROOT, f), out[f]);
      console.log(`built ${out.version}: index.html ${Math.round(out["index.html"].length / 1024)} KB`);
    }
  } catch (e) { console.error("Build failed: " + e.message); process.exit(1); }
}
