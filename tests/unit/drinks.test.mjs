import { test } from "node:test";
import assert from "node:assert/strict";
import { S } from "../../src/core/state.js";
import { logDrink, mateEnds, board, totals, fmtTotals } from "../../src/core/drinks.js";
import { enterMini } from "../../src/core/minis.js";
import { newGame, drank } from "./helpers.mjs";

test("a mate drinks along, both ways", () => {
  const g = newGame();
  g.mates = { a: "b" };
  logDrink("a", "sip", 2, "test");
  logDrink("b", "shot", 1, "test");
  assert.equal(drank("b"), 2);
  assert.equal(drank("a", "shot"), 1);
});

test("mate chains follow on without looping", () => {
  const g = newGame();
  g.mates = { a: "b", b: "c" };
  logDrink("a", "sip", 1, "test");
  assert.deepEqual(["a", "b", "c", "d"].map(p => drank(p)), [1, 1, 1, 0]);
});

test("mates sit out the mini-games: no auto drink, nothing in the stats", () => {
  const g = newGame(undefined, { freq: 0 });
  g.mates = { a: "b" };
  enterMini();
  assert.equal(S.screen, "mini");
  logDrink("a", "shot", 1, "The Bomb");
  assert.equal(drank("a", "shot"), 1);
  assert.equal(drank("b", "shot"), 0);
  assert.equal(g.log.filter(e => e.reason.startsWith("Mate of")).length, 0);
});

test("only two mate pairs: a third ends the oldest", () => {
  const g = newGame();
  g.mates = { a: "b", c: "d" };
  assert.deepEqual(mateEnds("b", "c"), ["a"]);
  // Two mates picking each other again just refresh their pair.
  assert.deepEqual(mateEnds("b", "a"), []);
});

test("scoreboard ranks finished drinks over shots over sips", () => {
  newGame();
  logDrink("a", "sip", 9, "t");
  logDrink("b", "shot", 1, "t");
  logDrink("c", "finish", 1, "t");
  assert.deepEqual(board().map(r => r.pid), ["c", "a", "b", "d"]);
  assert.equal(fmtTotals(totals("b")), "0 sips · 1 shot");
});

test("zero sips logs nothing", () => {
  const g = newGame();
  logDrink("a", "sip", 0, "t");
  assert.equal(g.log.length, 0);
});
