import { computeAwards } from "../../core/awards.js";
import { board, fmtTotals } from "../../core/drinks.js";
import { cardsLeft, unit } from "../../core/game.js";
import { player, S, ui } from "../../core/state.js";
import { esc } from "../../core/util.js";
import { SUIT_NAMES } from "../../minigames/horse-race/logic.js";
import { nightChart } from "./chart.js";

export function timeline() {
  const g = S.game, evs = (g.events || []).slice();
  // Shots and finished drinks are highlights too.
  g.log.filter(e => e.kind !== "sip" && !e.reason.startsWith("Mate of") && !e.reason.startsWith("The Door:") && !e.reason.startsWith("The Impostor:") && e.reason !== "The Bomb").forEach(e => evs.push({ type: "big", pid: e.pid, kind: e.kind, reason: e.reason, t: e.t, card: e.card }));
  evs.sort((x, y) => x.t - y.t);
  const nm = id => `<b>${esc(player(id).name)}</b>`;
  const clock = t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const lines = [];
  evs.forEach(e => {
    let txt = null, tag = "";
    if (e.type === "crown") { txt = e.via === "coup" ? `${nm(e.pid)} overthrew ${nm(e.from)} and took the crown` : `${nm(e.pid)} drew a King and became Dictator` + (e.from && e.from !== e.pid ? `, dethroning ${nm(e.from)}` : ""); tag = "Dictator"; }
    if (e.type === "challenge" && !e.win) { txt = `${nm(e.pid)} challenged ${nm(e.dictator)}, rolled a ${e.roll} and failed`; tag = "Challenge"; }
    if (e.type === "challenge" && e.win) { txt = `${nm(e.pid)} challenged ${nm(e.dictator)} and rolled a ${e.roll}`; tag = "Challenge"; }
    if (e.type === "role") { txt = `${nm(e.pid)} became ${esc(S.rules[e.rank].name)}`; tag = S.rules[e.rank].name; }
    if (e.type === "used") { txt = `${nm(e.pid)} used their ${esc(S.rules[e.rank].name)} power`; tag = S.rules[e.rank].name; }
    if (e.type === "mate") { txt = `${nm(e.pid)} picked ${nm(e.mate)} as their drinking mate`; tag = "Mate"; }
    if (e.type === "rule") { txt = e.text ? `${nm(e.pid)} made a rule: “${esc(e.text)}”` : `${nm(e.pid)} made a rule`; tag = "Rule"; }
    if (e.type === "bomb") { txt = `The Bomb blew up on ${nm(e.pid)}` + (e.secs ? ` after ${e.secs} seconds` : (e.passes ? ` after ${e.passes} passes` : "")); tag = "The Bomb"; }
    if (e.type === "race") { txt = `${SUIT_NAMES[e.suit]} won the Horse Race` + (e.winners.length ? `. Winners: ${e.winners.map(nm).join(", ")}` : ". Nobody backed it"); tag = "Horse Race"; }
    if (e.type === "half") { txt = e.self ? `Halftime: Dictator ${nm(e.judge)} came last and caught up with ${esc(e.what)}` : `Halftime: ${e.pids.map(nm).join(" & ")} came last and ${nm(e.judge)} handed out ${esc(e.what)}`; tag = "Halftime"; }
    if (e.type === "door") { txt = `${nm(e.pid)} survived The Door and made ${nm(e.victim)} finish their drink`; tag = "The Door"; }
    if (e.type === "impostor") { txt = !e.caught ? `${nm(e.pid)} was The Impostor and got away with it (word: “${esc(e.word)}”)` + (e.accused && e.accused !== "none" ? `. ${nm(e.accused)} was wrongly accused and took a shot` : "") : e.guessed ? `${nm(e.pid)} was caught as The Impostor but guessed “${esc(e.word)}”` : `${nm(e.pid)} was caught as The Impostor (word: “${esc(e.word)}”)`; tag = "The Impostor"; }
    if (e.type === "big") { txt = `${nm(e.pid)} ${e.kind === "shot" ? "took a shot" : "finished a drink"}` + (e.reason !== "Manual" ? ` (${esc(e.reason)})` : ""); tag = e.kind === "shot" ? "Shot" : "Finished"; }
    if (txt) lines.push(`<li><span class="tl-time">${e.card ? unit() + " " + e.card : clock(e.t)}</span><div><span class="tl-tag">${esc(tag)}</span><p>${txt}</p></div></li>`);
  });
  return lines;
}
// Game over is split into tabs so it fits on one screen.
export const END_TABS = [["awards", "Awards"], ["chart", "Chart"], ["scores", "Scores"], ["night", "Timeline"]];
export function viewEnd() {
  const g = S.game, b = board();
  const rows = b.map((r, i) => `<div class="brow"><span class="pos">${i + 1}</span><div style="min-width:0"><div class="nm">${esc(r.name)}</div><div class="tot">${fmtTotals(r)}</div></div><span></span></div>`).join("");
  const mins = Math.max(1, Math.round(((g.endedAt || Date.now()) - g.startedAt) / 60000));
  const tot = b.reduce((a, r) => ({ sip: a.sip + r.sip, big: a.big + r.shot + r.finish }), { sip: 0, big: 0 });
  const cards = g.solo ? g.events.filter(e => ["race", "bomb", "door", "impostor"].includes(e.type)).length : 52 - cardsLeft();
  const dur = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  const awards = computeAwards().map(a => `<article class="award">
      <span class="label">${esc(a.title)}</span>
      <div class="aw-who">${a.who.map(id => esc(player(id).name)).join(" & ")}</div>
      <div class="aw-stat">${esc(a.stat)}</div>
      <div class="aw-blurb">${esc(a.blurb)}</div>
    </article>`).join("");
  const tl = timeline();
  const tab = END_TABS.some(t => t[0] === ui.endTab) ? ui.endTab : "awards";
  return `<div class="wrap">
    <div class="mini-hero" style="padding-top:12px">
      <span class="label">${!g.solo ? "The ring is out" : g.solo.length === 1 ? esc(g.solo[0]) + " is over" : "The mini-games are over"}</span>
      <h1>Game over</h1>
    </div>
    <div class="night-stats">
      <div><b>${dur}</b><span class="label">played</span></div>
      <div><b>${cards}</b><span class="label">${g.solo ? (cards === 1 ? "round" : "rounds") : "cards"}</span></div>
      <div><b>${tot.sip}</b><span class="label">sips</span></div>
      <div><b>${tot.big}</b><span class="label">shots & downs</span></div>
    </div>
    <div class="tabs end-tabs">${END_TABS.map(([k, l]) => `<button data-act="end-tab" data-k="${k}" aria-pressed="${tab === k}">${l}</button>`).join("")}</div>
    ${tab === "chart" ? `<section class="stack">${nightChart()}</section>`
      : tab === "scores" ? `<section class="stack"><div class="board">${rows}</div></section>`
      : tab === "night" ? `<section class="stack">${tl.length ? `<ol class="timeline">${tl.join("")}</ol>` : `<p class="muted" style="margin:0">A quiet night. No crowns, mates, rules or shots to report.</p>`}</section>`
      : `<section class="stack"><div class="awards ${computeAwards().length % 2 ? "odd" : ""}">${awards}</div></section>`}
    <button class="btn fire wide" data-act="again">Play again, same crew</button>
    <button class="btn ghost wide" data-act="setup">Back to setup</button>
  </div>`;
}
