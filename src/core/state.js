import { DEFAULT_RULES } from "./rules.js";
import { clone, uid } from "./util.js";

export const KEY = "ringoffire.v2";
export const OLD_KEY = "ringoffire.v1";
// ---------- State ----------
export const MINI_GAMES = ["Horse Race", "The Bomb", "The Door", "The Impostor"];
export const S = {
  screen: "setup",
  pick: [], // mini-games ticked to play on their own
  minis: false, // the start screen's mini-games-only panel is open
  players: [{ id: uid(), name: "Player 1" }, { id: uid(), name: "Player 2" }, { id: uid(), name: "Player 3" }, { id: uid(), name: "Player 4" }],
  rules: clone(DEFAULT_RULES),
  freq: 13,
  miniGames: MINI_GAMES.slice(),
  game: null
};
export const ui = { sheet: null, fold: {}, endTab: "awards" }; // transient sheet state, not persisted
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function load(data) {
  let d = data && data.S ? data.S : null;
  if (!d) { try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { d = null; } }
  if (!d) {
    // Carry players and settings over from the first version, but not its old rules or game.
    try { const o = JSON.parse(localStorage.getItem(OLD_KEY) || "null"); if (o && o.players) d = { players: o.players, mode: o.mode, freq: o.freq }; } catch (e) {}
  }
  if (d && d.players) {
    Object.assign(S, d);
    S.rules = Object.assign(clone(DEFAULT_RULES), d.rules || {});
    S.miniGames = MINI_GAMES.slice();
    if (MINI_GAMES.includes(S.mode)) S.pick = [S.mode];
    delete S.mode;
    S.pick = (S.pick || []).filter(m => MINI_GAMES.includes(m));
    if (S.pick.length) S.minis = true;
    if (S.game && typeof S.game.solo === "string") S.game.solo = [S.game.solo];
    if (S.game && S.game.mode === "physical") { S.game = null; S.screen = "setup"; } // the physical deck is gone
    if (S.game && S.game.miniQueue) MINI_GAMES.forEach(m => { if (!S.game.miniQueue.includes(m)) S.game.miniQueue.push(m); });
  }
}
export function player(id) { return S.players.find(p => p.id === id) || { name: "?" }; }
export function cur() { const g = S.game; return g.order[g.cur]; }
