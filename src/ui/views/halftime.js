import { PUNISHMENTS } from "../../core/halftime.js";
import { player, S } from "../../core/state.js";
import { esc } from "../../core/util.js";

export function viewHalf() {
  const h = S.game.half, names = h.pids.map(pid => esc(player(pid).name));
  const who = names.length > 1 ? names.slice(0, -1).join(", ") + " & " + names[names.length - 1] : names[0];
  const judge = esc(player(h.judge).name), pun = PUNISHMENTS.find(x => x[0] === h.pick);
  const ok = !pun ? (h.self ? "Next, no penalty" : "Pick a punishment") : pun[2] ? `Log ${pun[1].toLowerCase()} & back to the ring` : "Done, back to the ring";
  const options = PUNISHMENTS.filter(x => !h.self || x[2]);
  const label = h.self ? `Dictator ${judge}, catch up or carry on? Your call` : h.byDictator ? `Dictator ${judge} picks the punishment` : `No Dictator yet, so top drinker ${judge} picks`;
  return `<div class="wrap">
    <div class="mini-hero">
      <span class="label">Halftime · card 26</span>
      <h1>Last place</h1>
      <div class="half-name">${who}</div>
      <p class="muted" style="margin:0">${h.pids.length > 1 ? "Tied for the fewest drinks" : "Fewest drinks so far"}</p>
    </div>
    <section class="panel">
      <span class="label">${label}</span>
      <div class="chips">${options.map(x => `<button class="chip" data-act="half-pick" data-k="${x[0]}" aria-pressed="${h.pick === x[0]}">${x[1]}</button>`).join("")}</div>
    </section>
    <button class="btn fire wide" data-act="${!pun && h.self ? "half-skip" : "half-ok"}" style="min-height:56px" ${pun || h.self ? "" : "disabled"}>${ok}</button>
    ${h.self ? "" : `<button class="btn ghost wide" data-act="half-skip">Skip halftime</button>`}
  </div>`;
}
