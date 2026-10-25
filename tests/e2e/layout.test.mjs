// Walks the whole tour at every screen size and checks the things that keep breaking:
// nothing sticks out sideways, the ring screen fits without scrolling, the ring is a true circle that fits, and no script errors.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, openGame, SIZES, EXTRA_SIZES } from "./driver.mjs";
import { FLOWS } from "./tour.mjs";

const QUICK = ["setup", "ring-short", "horse-race", "bomb", "door", "impostor"];

// Runs in the page: returns a list of problems with what is on screen right now.
function problems() {
  const out = [], W = innerWidth, H = innerHeight, doc = document.scrollingElement;
  const screen = JSON.parse(localStorage.getItem("ringoffire.v2") || "{}").screen;
  if (doc.scrollWidth > W + 1) out.push(`page scrolls sideways (${doc.scrollWidth}px wide in a ${W}px window)`);
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.opacity !== "0"; };
  document.querySelectorAll("button, input, select, h1, h2, .holder, .now").forEach(el => {
    if (!visible(el) || el.closest(".ring")) return;
    const r = el.getBoundingClientRect();
    if (r.left < -1 || r.right > W + 1) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" is cut off at the side`);
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow === "visible") out.push(`text spills out of ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"`);
  });
  const sheet = document.querySelector(".sheet");
  if (sheet) { const r = sheet.getBoundingClientRect(); if (r.top < -1 || r.bottom > H + 1 || r.left < -1 || r.right > W + 1) out.push("the pop-up card does not fit the screen"); }
  if (screen === "game") {
    if (doc.scrollHeight > H + 1) out.push(`ring screen scrolls (${doc.scrollHeight}px tall in a ${H}px window)`);
    const ring = document.querySelector("#ring");
    const r = ring.getBoundingClientRect();
    if (Math.abs(r.width - r.height) > 1) out.push(`ring is not round (${Math.round(r.width)}x${Math.round(r.height)})`);
    if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) out.push("ring sticks out of the screen");
    const short = Math.min(W, H);
    if (r.width < short * 0.5) out.push(`ring is small (${Math.round(r.width)}px on a ${W}x${H} screen)`);
    ring.querySelectorAll(".rc:not(.drawn)").forEach(c => {
      const b = c.getBoundingClientRect();
      if (b.left < r.left - 2 || b.right > r.right + 2 || b.top < r.top - 2 || b.bottom > r.bottom + 2) out.push(`card ${c.dataset.i} pokes out of the ring`);
    });
    // Nothing on the side panel may overlap the ring.
    document.querySelectorAll(".g-side, .g-extra").forEach(p => {
      const b = p.getBoundingClientRect();
      if (b.width && b.height && b.left < r.right - 2 && b.right > r.left + 2 && b.top < r.bottom - 2 && b.bottom > r.top + 2) out.push(`${p.className} overlaps the ring`);
    });
  }
  return [...new Set(out)];
}

const browser = await chromium.launch();
test.after(() => browser.close());

for (const [sizeName, size] of Object.entries({ ...SIZES, ...EXTRA_SIZES })) {
  const flows = sizeName in SIZES ? FLOWS.filter(f => !f.checksOnly) : FLOWS.filter(f => QUICK.includes(f.name));
  test(`${sizeName} ${size.width}x${size.height}`, async t => {
    for (const flow of flows) {
      await t.test(flow.name, async () => {
        const page = await openGame(browser, size, flow.state);
        const found = [];
        try {
          await flow.run(page, async stop => { (await page.evaluate(problems)).forEach(p => found.push(`${stop}: ${p}`)); });
        } finally { await page.context().close(); }
        assert.deepEqual(page.errors, [], "script errors");
        assert.deepEqual(found, []);
      });
    }
  });
}
