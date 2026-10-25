// Drives the game in a real browser for the screenshot tour and the layout checks.
// Randomness and the clock are pinned, so the same steps always draw the same cards and give the same pictures.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
export const { chromium } = require("playwright");

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
export const GAME_URL = pathToFileURL(path.resolve(ROOT, process.env.GAME_FILE || "index.html")).href;

// The three form factors the layout is designed for, plus extra sizes the layout checks also cover.
export const SIZES = {
  "phone-portrait": { width: 390, height: 844 },
  "phone-landscape": { width: 844, height: 390 },
  "desktop": { width: 1920, height: 1080 }
};
export const EXTRA_SIZES = {
  "small-portrait": { width: 360, height: 640 },
  "small-landscape": { width: 667, height: 375 },
  "tablet-landscape": { width: 1180, height: 820 },
  "laptop": { width: 1366, height: 768 },
  "wide-pc": { width: 1994, height: 1013 },
  "ultrawide": { width: 2560, height: 1080 }
};

const SEED_SCRIPT = `(() => {
  let a = 1234567;
  Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
})();`;

export const PLAYERS = ["Axel", "Emil", "Julia", "Nora"];

// Saved settings the tour starts from: four named players, default rules, mini-games every ~13 cards.
export function seedState(extra = {}) {
  return Object.assign({ screen: "setup", pick: [], minis: false, players: PLAYERS.map((name, i) => ({ id: "p" + i, name })), freq: 13, game: null }, extra);
}

export async function openGame(browser, size, state = seedState()) {
  const context = await browser.newContext({ viewport: size, reducedMotion: "reduce", deviceScaleFactor: 1 });
  context.setDefaultTimeout(4000);
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", e => page.errors.push(String(e)));
  // Service workers only run over http(s); opening the file directly is expected to skip them.
  page.on("console", m => { if (m.type() === "error" && !/ServiceWorker/.test(m.text())) page.errors.push(m.text()); });
  await page.clock.install({ time: new Date("2026-10-24T21:00:00") });
  await page.addInitScript(SEED_SCRIPT);
  await page.addInitScript(s => { try { localStorage.setItem("ringoffire.v2", s); localStorage.setItem("rof.sound", "off"); } catch (e) {} }, JSON.stringify(state));
  await page.goto(GAME_URL);
  await settle(page);
  return page;
}

// Let pending timers (toasts, pop-ups, dice) run out so screenshots are stable.
export async function settle(page, ms = 5000) {
  await page.clock.runFor(ms);
  await page.evaluate(() => document.querySelectorAll(".toast, .mate-pop, .flash, .confetti").forEach(e => e.remove()));
}

export async function act(page, sel, opts = {}) {
  await page.locator(sel).first().click(opts);
  await settle(page, opts.wait ?? 5000);
}

export const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem("ringoffire.v2")));

// Draw the next card of a given rank from the ring (or any card when rank is null).
export async function drawRank(page, rank) {
  const s = await saved(page);
  const i = s.game.deck.findIndex(c => !c.drawn && (rank == null || c.rank === rank));
  if (i < 0) throw new Error("no card " + rank);
  // Cards overlap in the ring, so click the exact card rather than a point on screen.
  await page.locator(`.rc[data-i="${i}"]`).evaluate(el => el.click());
  await settle(page);
}

// Handle the open card sheet with simple, fixed choices, then move on.
export async function resolveCard(page) {
  for (let guard = 0; guard < 12; guard++) {
    if (await page.locator('[data-act="color"]').count()) { await act(page, '[data-act="color"] >> nth=0'); continue; }
    const plus = page.locator('.sheet [data-act="alloc"][data-d="1"]:not([disabled])');
    if (await plus.count()) { await act(page, '.sheet [data-act="alloc"][data-d="1"]:not([disabled])'); continue; }
    if (await page.locator('.sheet [data-act="mate"]').count() && !(await page.locator('.sheet [data-act="mate"][aria-pressed="true"]').count())) { await act(page, '.sheet [data-act="mate"]'); continue; }
    if (await page.locator('.sheet [data-act="pick"]').count() && !(await page.locator('.sheet [data-act="pick"][aria-pressed="true"]').count())) { await act(page, '.sheet [data-act="pick"]'); continue; }
    break;
  }
  await act(page, '[data-act="reveal-ok"]');
}

// Clear whatever interrupts the ring (halftime, a mini-game) so the next card can be drawn.
export async function backToRing(page) {
  for (let guard = 0; guard < 6; guard++) {
    const s = await saved(page);
    if (s.screen === "half") { await act(page, '[data-act="half-skip"]'); continue; }
    if (s.screen === "mini") { await act(page, '[data-act="mini-done"]'); continue; }
    return;
  }
}
