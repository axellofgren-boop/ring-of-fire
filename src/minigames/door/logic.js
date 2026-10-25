import { logDrink } from "../../core/drinks.js";
import { fx } from "../../core/effects.js";
import { ev } from "../../core/game.js";
import { player, S, ui } from "../../core/state.js";
import { shuffle } from "../../core/util.js";

// ---------- The Door ----------
// Each round shows 2-5 doors with at least one safe and at least one trap. Everyone still in picks a door; trap doors knock you out.
// The last one standing chooses who finishes their drink.
export function newDoor() {
  const d = { phase: "pick", round: 0, alive: S.game.order.slice(), trap: 0, winner: null, victim: null };
  doorRound(d);
  return d;
}
export function doorRound(d) {
  d.round += 1;
  const n = 2 + Math.floor(Math.random() * 4), safe = 1 + Math.floor(Math.random() * (n - 1));
  d.safe = shuffle(Array.from({ length: n }, (_, i) => i < safe));
  d.picks = {}; d.out = []; d.wipe = false; d.phase = "pick";
}
// Players pick in the order they were set up; the doors open as soon as the last one has picked.
export const doorPicker = d => d.alive.find(pid => d.picks[pid] == null) || null;

export function doorAct(act, data) {
  const d = S.game.door, id = data.id, logFrom = S.game.log.length;
  if (!d) return;
  if (act === "dr-door" && d.phase === "pick") { const p = doorPicker(d); if (p) { d.picks[p] = +data.k; fx.sound("tap"); } }
  if (act === "dr-door" && d.phase === "pick" && !doorPicker(d)) {
    d.out = d.alive.filter(pid => !d.safe[d.picks[pid]]);
    // If every door someone chose was a trap, nobody is out and the round replays.
    d.wipe = d.out.length === d.alive.length;
    if (!d.wipe) d.alive = d.alive.filter(pid => !d.out.includes(pid));
    if (d.trap) { setTimeout(() => fx.drinks(logFrom), 1200); d.out.forEach(pid => logDrink(pid, "sip", d.trap, "The Door: trap door")); }
    if (d.alive.length === 1) d.winner = d.alive[0];
    d.phase = "reveal"; ui.doorAnim = true;
    fx.sound("creak");
    if (d.out.length) fx.sound("trapdoor");
    setTimeout(() => fx.sound(d.winner ? "win" : d.out.length ? "lose" : "sip"), 1100);
    if (d.winner) setTimeout(fx.confetti, 1200);
  }
  if (act === "dr-next" && d.phase === "reveal" && !d.winner) { fx.sound("whistle"); doorRound(d); }
  if (act === "dr-win" && d.winner) d.phase = "winner";
  if (act === "dr-victim" && d.phase === "winner") {
    setTimeout(() => fx.drinks(logFrom), 0);
    d.victim = id; d.phase = "done";
    ev("door", { pid: d.winner, victim: id });
    logDrink(id, "finish", 1, "The Door: " + player(d.winner).name + "'s pick");
    setTimeout(fx.confetti, 200);
  }
}
