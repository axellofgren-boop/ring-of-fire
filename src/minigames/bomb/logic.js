import { logDrink } from "../../core/drinks.js";
import { fx } from "../../core/effects.js";
import { ev } from "../../core/game.js";
import { S, save, ui } from "../../core/state.js";

// ---------- The Bomb ----------
// Played off screen: a random player starts, the bomb goes round the table by hand, and a hidden timer (20s to 90s) decides when it blows.
export const BOMB_MIN = 20;
export const BOMB_MAX = 90;
export function newBomb() {
  const o = S.game.order;
  return { phase: "setup", starter: o[Math.floor(Math.random() * o.length)], deadline: 0, secs: 0, victim: null, logged: false };
}
export function armBomb() {
  const b = S.game.bomb;
  clearTimeout(ui.bombTimer); clearInterval(ui.bombTick); ui.bombTimer = ui.bombTick = null;
  if (!b || b.phase !== "live") return;
  ui.bombTick = setInterval(() => { if (S.screen === "mini" && S.game && S.game.bomb === b && b.phase === "live") fx.sound("tick"); else clearInterval(ui.bombTick); }, 1000);
  ui.bombTimer = setTimeout(() => {
    ui.bombTimer = null;
    if (S.screen === "mini" && S.game && S.game.bomb === b && b.phase === "live") { explode(); save(); fx.render(); }
  }, Math.max(0, b.deadline - Date.now()));
}
export function explode() {
  const b = S.game.bomb;
  clearTimeout(ui.bombTimer); clearInterval(ui.bombTick); ui.bombTimer = ui.bombTick = null;
  b.phase = "boom";
  fx.sound("boom"); fx.buzz([120, 50, 300, 50, 120]);
  ui.bombShake = true;
  fx.flash();
}
export function bombAct(act, data) {
  const g = S.game, b = g.bomb;
  if (!b) return;
  if (act === "bm-light" && b.phase === "setup") {
    b.secs = BOMB_MIN + Math.floor(Math.random() * (BOMB_MAX - BOMB_MIN + 1));
    b.deadline = Date.now() + b.secs * 1000;
    b.phase = "live";
    fx.sound("fuse"); fx.buzz(20);
    armBomb();
  }
  if (act === "bm-victim" && b.phase === "boom" && !b.logged) b.victim = data.id;
  if (act === "bm-log" && b.phase === "boom" && b.victim && !b.logged) {
    const logFrom = g.log.length;
    ev("bomb", { pid: b.victim, secs: b.secs });
    logDrink(b.victim, "shot", 1, "The Bomb");
    b.logged = true;
    setTimeout(() => fx.drinks(logFrom), 0);
  }
  if (act === "bm-again" && b.phase === "boom") { g.bomb = newBomb(); if (g.solo) g.round += 1; }
}
