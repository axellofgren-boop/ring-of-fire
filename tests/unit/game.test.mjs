import { test } from "node:test";
import assert from "node:assert/strict";
import { S, ui } from "../../src/core/state.js";
import { cardsLeft, confirmReveal, drawCard, effAction, nextTurn, planMinis, roleOnce } from "../../src/core/game.js";
import { finishMini, currentMini } from "../../src/core/minis.js";
import { punishLast } from "../../src/core/halftime.js";
import { newGame, drank } from "./helpers.mjs";

const draw = rank => { const c = S.game.deck.find(x => !x.drawn && x.rank === rank); drawCard(c.id); return c; };

test("a new game deals a full, shuffled deck of 52 different cards", () => {
  const g = newGame();
  assert.equal(g.deck.length, 52);
  assert.equal(new Set(g.deck.map(c => c.rank + c.suit)).size, 52);
  assert.equal(cardsLeft(), 52);
  assert.equal(S.screen, "game");
});

test("drawing a card opens it, confirming moves to the next player", () => {
  const g = newGame(undefined, { freq: 0 });
  draw("7");
  assert.equal(ui.sheet.type, "reveal");
  ui.sheet.picked = { c: true };
  confirmReveal(true);
  assert.equal(drank("c"), S.rules["7"].sips);
  assert.equal(g.cur, 1);
  assert.equal(cardsLeft(), 51);
});

test("2 to 5: a red card gives the sips out, a black card drinks them", () => {
  newGame(undefined, { freq: 0 });
  const red = S.game.deck.find(c => c.rank === "3" && (c.suit === 1 || c.suit === 2));
  drawCard(red.id);
  assert.equal(effAction(ui.sheet), "give");
  ui.sheet.alloc = { b: 2, c: 1 };
  confirmReveal(true);
  assert.deepEqual([drank("a"), drank("b"), drank("c")], [0, 2, 1]);
  const black = S.game.deck.find(c => c.rank === "3" && (c.suit === 0 || c.suit === 3));
  drawCard(black.id);
  assert.equal(effAction(ui.sheet), "self");
  confirmReveal(true);
  assert.equal(drank("b"), 2 + 3);
});

test("a King crowns the drawer as Dictator", () => {
  const g = newGame(undefined, { freq: 0 });
  draw("K"); confirmReveal(true);
  assert.equal(g.dictator, "a");
});

test("Thumb Master is a one-use power", () => {
  newGame();
  assert.equal(roleOnce("6"), true);
  assert.equal(roleOnce("Q"), false);
});

test("a mate pick makes a pair; a third pair ends the oldest", () => {
  const g = newGame(["A", "B", "C", "D", "E", "F"], { freq: 0 });
  const pickMate = mate => { draw("8"); ui.sheet.mate = mate; confirmReveal(true); };
  pickMate("b");       // a + b
  pickMate("c");       // b + c replaces b's old pair
  g.cur = 3; pickMate("e");   // d + e
  g.cur = 5; pickMate("a");   // f + a ends the oldest other pair
  assert.equal(Object.keys(g.mates).length, 2);
  assert.equal(g.mates.f, "a");
});

test("mini-games land near every quarter of the deck, never on top of each other", () => {
  for (let s = 0; s < 30; s++) {
    newGame(undefined, { freq: 13 });
    planMinis(0);
    const at = S.game.miniAt.map(m => m.t);
    assert.equal(at.length, 3);
    at.forEach((t, i) => { assert.ok(Math.abs(t - 13 * (i + 1)) <= 3, `slot ${i} at card ${t}`); if (i) assert.ok(t - at[i - 1] >= 2); });
  }
});

test("halftime at card 26 names whoever drank least, and the Dictator's pick is logged", () => {
  const g = newGame(undefined, { freq: 0 });
  g.turn = 25;
  g.log.push({ pid: "a", kind: "sip", n: 5, reason: "t", card: 1 }, { pid: "b", kind: "sip", n: 3, reason: "t", card: 1 }, { pid: "c", kind: "sip", n: 4, reason: "t", card: 1 });
  g.deck.slice(0, 25).forEach(c => { c.drawn = true; });
  nextTurn();
  assert.equal(S.screen, "half");
  assert.deepEqual(g.half.pids, ["d"]);
  g.half.pick = "shot";
  punishLast();
  assert.equal(drank("d", "shot"), 1);
  assert.equal(S.screen, "game");
});

test("the last card ends the game", () => {
  const g = newGame(undefined, { freq: 0 });
  g.deck.forEach(c => { c.drawn = true; });
  nextTurn();
  assert.equal(S.screen, "end");
  assert.ok(g.endedAt);
});

test("mini-games-only mode rotates through the picks without playing one twice in a row", () => {
  const g = newGame(undefined, { solo: ["Horse Race", "The Bomb", "The Door"] });
  assert.equal(S.screen, "mini");
  const played = [currentMini()];
  for (let i = 0; i < 20; i++) { finishMini(); played.push(currentMini()); }
  for (let i = 1; i < played.length; i++) assert.notEqual(played[i], played[i - 1]);
  assert.equal(g.round, 21);
});
