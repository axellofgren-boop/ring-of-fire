import { board, logDrink } from "./drinks.js";
import { fx } from "./effects.js";
import { ev } from "./game.js";
import { enterMini } from "./minis.js";
import { S, save } from "./state.js";

// ---------- Halftime ----------
// Whoever has drunk the least is Last. The Dictator picks their punishment, or the top drinker if nobody holds the crown.
export const PUNISHMENTS = [["sip3", "3 sips", "sip", 3], ["sip5", "5 sips", "sip", 5], ["shot", "A shot", "shot", 1], ["finish", "Finish your drink", "finish", 1], ["custom", "Something else", null, 0]];
export function enterHalf(thenMini) {
  const g = S.game, b = board(), score = r => r.finish * 10 + r.shot * 5 + r.sip;
  const low = Math.min(...b.map(score));
  g.halfDone = true;
  const pids = b.filter(r => score(r) === low).map(r => r.pid);
  // A Dictator who is Last decides for themselves whether to catch up.
  const self = !!g.dictator && pids.includes(g.dictator);
  g.half = { pids, judge: g.dictator || b[0].pid, byDictator: !!g.dictator, self, pick: null, thenMini };
  S.screen = "half";
  fx.sound("whistle");
}
export function finishHalf() {
  const g = S.game, thenMini = g.half && g.half.thenMini;
  g.half = null;
  if (thenMini) enterMini(); else S.screen = "game";
  save(); fx.render();
}
export function punishLast() {
  const g = S.game, h = g.half, pun = PUNISHMENTS.find(x => x[0] === h.pick);
  const n0 = g.log.length;
  if (pun[2]) h.pids.forEach(pid => logDrink(pid, pun[2], pun[3], "Halftime: last place"));
  ev("half", { pids: h.pids, judge: h.judge, self: h.self, what: pun[2] ? pun[1].toLowerCase() : "a punishment of their choice" });
  fx.sound(pun[2] === "shot" || pun[2] === "finish" ? "shot" : "crown");
  fx.drinks(n0);
  finishHalf();
}
