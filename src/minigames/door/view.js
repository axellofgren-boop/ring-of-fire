import { backTxt, soloOne } from "../../core/game.js";
import { player, S, ui } from "../../core/state.js";
import { esc } from "../../core/util.js";
import { doorPicker } from "./logic.js";

export function viewDoor(d) {
  const nm = pid => esc(player(pid).name);
  const list = a => a.map(nm).join(", ");
  if (d.phase === "winner" || d.phase === "done") {
    if (d.phase === "done") return `<div class="verdict bad" style="font-size:1.6rem">${nm(d.victim)} finishes their drink!</div>
      <div class="callout" style="text-align:center">${nm(d.winner)} walked through the last door and chose ${nm(d.victim)}. Bottoms up.</div>
      <button class="btn fire wide" data-act="mini-done" style="min-height:56px">${backTxt()}</button>`;
    return `<div class="verdict good" style="font-size:1.5rem">${nm(d.winner)} is the last one standing!</div>
      <section class="panel"><h2>Who finishes their drink?</h2>
        <span class="muted" style="font-size:.9rem">${nm(d.winner)}, pick your victim.</span>
        <div class="victims">${S.game.order.filter(pid => pid !== d.winner).map(pid => `<button class="btn" data-act="dr-victim" data-id="${pid}">${nm(pid)}</button>`).join("")}</div>
      </section>`;
  }
  const reveal = d.phase === "reveal", anim = reveal && ui.doorAnim, picker = reveal ? null : doorPicker(d);
  ui.doorAnim = false;
  const doors = d.safe.map((safe, i) => {
    const who = Object.keys(d.picks).filter(pid => d.picks[pid] === i);
    const tags = !reveal ? "" : who.map(pid => `<span class="door-tag ${reveal ? (safe ? "in" : "out") : ""}">${nm(pid)}</span>`).join("");
    return `<button class="door-slot" data-act="dr-door" data-k="${i}" ${reveal ? "disabled" : ""} aria-label="Door ${i + 1}">
      <div class="door-frame ${reveal ? (safe ? "safe" : "trap") : ""} ${anim && !safe ? "anim" : ""}" ${anim && !safe ? `style="animation-delay:${1 + i * 0.2}s"` : ""}>
        <div class="door-behind">${reveal ? (safe ? "<b>✓</b><span>SAFE</span>" : "<b>☠</b><span>TRAP</span>") : ""}</div>
        <div class="door-leaf ${reveal ? "open" : ""} ${anim ? "anim" : ""}" ${anim ? `style="animation-delay:${i * 0.2}s"` : ""}><span class="door-num">${i + 1}</span><i class="knob"></i></div>
      </div>
      ${reveal ? `<div class="door-tags">${tags}</div>` : ""}
    </button>`;
  }).join("");
  const head = `<div class="row" style="justify-content:space-between"><span class="label">Round ${d.round} · ${d.safe.length} doors</span><span class="label">${d.alive.length} still in</span></div>
    <div class="door-row" style="--n:${d.safe.length}">${doors}</div>`;
  if (!reveal) {
    const done = d.alive.filter(pid => d.picks[pid] != null).length;
    return `<div class="door-turn" aria-live="polite"><span class="label">Pick ${done + 1} of ${d.alive.length}</span><b>${nm(picker)}</b><span class="muted">tap a door</span></div>
      <section class="panel">${head}</section>
      ${d.round === 1 && !done ? `${soloOne() ? "" : `<button class="btn ghost wide" data-act="mini-done">Skip The Door</button>`}` : ""}`;
  }
  const sips = d.trap && d.out.length ? ` ${d.trap === 1 ? "A sip" : d.trap + " sips"} each for falling in.` : "";
  const msg = d.wipe ? `Every door you picked was a trap! Nobody is out.${sips} Fresh doors.`
    : d.out.length ? `Out: <b>${list(d.out)}</b>.${sips}`
    : "Everyone made it through!";
  const next = d.winner
    ? `<button class="btn fire wide" data-act="dr-win" style="min-height:56px">${nm(d.winner)} decides who finishes their drink</button>`
    : `<button class="btn fire wide" data-act="dr-next" style="min-height:56px">Next round: ${d.alive.length} left</button>`;
  return `<section class="panel">${head}
      <div class="callout race-msg" aria-live="polite">${msg}${d.winner ? ` <b>${nm(d.winner)}</b> is the last one standing!` : ""}</div>
    </section>${next}`;
}
