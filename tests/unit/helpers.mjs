// Shared set-up for the game-logic tests: a fresh crew, default rules and repeatable dice.
import { S, ui } from "../../src/core/state.js";
import { DEFAULT_RULES } from "../../src/core/rules.js";
import { clone } from "../../src/core/util.js";
import { startGame } from "../../src/core/game.js";

export function seed(n = 42) {
  let a = n;
  Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Starts a fresh game for the given names (ids are a, b, c, ...). Pass mini-game names to play only those.
export function newGame(names = ["Axel", "Emil", "Julia", "Nora"], { solo = null, freq = 13, rules = {} } = {}) {
  seed();
  Object.assign(S, { screen: "setup", pick: [], minis: false, freq, game: null });
  S.players = names.map((name, i) => ({ id: String.fromCharCode(97 + i), name }));
  S.rules = Object.assign(clone(DEFAULT_RULES), rules);
  Object.keys(ui).forEach(k => delete ui[k]);
  Object.assign(ui, { sheet: null, fold: {}, endTab: "awards" });
  startGame(solo);
  return S.game;
}

export const drank = (pid, kind = "sip") => S.game.log.filter(e => e.pid === pid && e.kind === kind).reduce((a, e) => a + e.n, 0);
