import { S } from "../core/state.js";
import { flipAnimate } from "./effects.js";
import { viewSheet } from "./sheets.js";
import { viewEnd } from "./views/end.js";
import { viewHalf } from "./views/halftime.js";
import { viewMini } from "./views/mini.js";
import { layoutRing, viewGame } from "./views/ring.js";
import { viewRules, viewSetup } from "./views/setup.js";

export function $(sel, root) { return (root || document).querySelector(sel); }
// ---------- Rendering ----------
export const app = $("#app");
export function render() {
  const scr = S.screen;
  let html = "";
  if (scr === "setup") html = viewSetup();
  else if (scr === "rules") html = viewRules();
  else if (scr === "game") html = viewGame();
  else if (scr === "mini") html = viewMini();
  else if (scr === "half") html = viewHalf();
  else if (scr === "end") html = viewEnd();
  const before = {};
  document.querySelectorAll("[data-flip]").forEach(el => { before[el.dataset.flip] = el.getBoundingClientRect(); });
  if (scr === "mini") html += `<button class="iconbtn cog solo-cog" data-act="menu" aria-label="Scores and settings">&#9881;&#65038;</button>`;
  app.innerHTML = html + viewSheet();
  if (scr === "game") layoutRing();
  flipAnimate(before);
}
