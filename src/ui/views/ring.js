import { cardsLeft, roleOnce, ruleLabel } from "../../core/game.js";
import { RANKS } from "../../core/rules.js";
import { cur, player, S } from "../../core/state.js";
import { esc } from "../../core/util.js";
import { fold } from "../components.js";
import { $, LAYOUT } from "../render.js";

export function viewGame() {
  const g = S.game;
  const n = g.order.length;
  const round = Math.floor(g.turn / n) + 1;
  const me = player(cur()).name;
  const nextUp = player(g.order[(g.cur + 1) % n]).name;
  const cardNo = 52 - cardsLeft();
  const bar = (label, who, btn) => `<div class="dictator-bar"><div class="who"><span class="label">${label}</span><b>${who}</b></div>${btn}</div>`;
  const powers = [];
  if (g.dictator) powers.push(bar("Dictator", esc(player(g.dictator).name), `<button class="btn small primary" data-act="challenge">Challenge</button>`));
  RANKS.filter(r => g.roles && g.roles[r] && S.rules[r].action === "role").forEach(r =>
    powers.push(bar(esc(S.rules[r].name), esc(player(g.roles[r]).name), `<button class="btn small" data-act="penalty" data-k="role:${r}">${roleOnce(r) ? "Use it" : "Log a loser"}</button>`)));
  (g.houseRules || []).forEach((h, i) =>
    powers.push(bar("House rule", esc(ruleLabel(i)), `<button class="btn small" data-act="penalty" data-k="rule:${i}">Broke it</button>`)));
  const mates = Object.entries(g.mates || {});
  if (mates.length) powers.push(`<div class="mates-line"><span class="label">Mates</span> ${mates.map(([a, b]) => `${esc(player(a).name)} &amp; ${esc(player(b).name)}`).join(" &middot; ")}</div>`);
  const dict = !powers.length ? "" : LAYOUT === "c" && powers.length > 2
    ? `<div class="powers">${powers[0]}${fold("powers", `More roles &amp; rules (${powers.length - 1})`, powers.slice(1).join(""))}</div>`
    : `<div class="powers">${powers.join("")}</div>`;
  let middle;
  const cards = g.deck.map((c, i) => `<button class="rc ${c.drawn ? "drawn" : ""}" data-act="draw" data-id="${c.id}" data-i="${i}" aria-label="Draw card ${i + 1}" ${c.drawn ? "tabindex='-1'" : ""}></button>`).join("");
  middle = `<div class="ring" id="ring">${cards}
    <button class="cup" data-act="random" aria-label="Draw a random card for me"><span class="kings">${cardsLeft()}</span><small>tap to draw</small></button>
  </div>`;
  return `<div class="wrap game lay-${LAYOUT}">
    <div class="g-side">
    <div class="topbar">
      <div class="stats">
        <div class="stat"><span class="label">Round</span><b>${round}</b></div>
        <div class="stat"><span class="label">Card</span><b>${cardNo}/52</b></div>
      </div>
      <div class="row" style="gap:6px;flex-wrap:nowrap">
        <button class="iconbtn cog" data-act="menu" aria-label="Scores, rules and settings">&#9881;&#65038;</button>
      </div>
    </div>
    <div class="turn"><span class="label">Your turn</span><div class="now">${esc(me)}</div><div class="next">Next up: ${esc(nextUp)}</div></div>
    </div>
    <div class="g-main">${middle}</div>
    <div class="g-extra">${dict}</div>
  </div>`;
}

export function layoutRing() {
  const ring = $("#ring");
  if (!ring) return;
  if (ringObs && ringSeen !== ring) { ringObs.disconnect(); ringObs.observe(ring); ringSeen = ring; }
  const size = ring.clientWidth;
  const R = size * 0.38, w = Math.max(18, size * 0.085), h = size * 0.19;
  ring.querySelectorAll(".rc").forEach(el => {
    const i = +el.dataset.i, c = S.game.deck[i];
    const a = i * (360 / 52) + c.jit;
    el.style.width = w + "px"; el.style.height = h + "px";
    el.style.transform = `translate(-50%,-50%) rotate(${a}deg) translateY(${-R}px)`;
  });
}
window.addEventListener("resize", () => { if (S.screen === "game") layoutRing(); });
// iOS reports the size before a rotation has settled, so also watch the ring's own box.
let ringSeen = null;
export const ringObs = "ResizeObserver" in window ? new ResizeObserver(() => { if (S.screen === "game") layoutRing(); }) : null;
window.addEventListener("orientationchange", () => setTimeout(() => { if (S.screen === "game") layoutRing(); }, 350));
