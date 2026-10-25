import { test } from "node:test";
import assert from "node:assert/strict";
import { S, load } from "../../src/core/state.js";
import { logDrink } from "../../src/core/drinks.js";
import { computeAwards } from "../../src/core/awards.js";
import { newGame } from "./helpers.mjs";

test("game over hands out exactly one award per player", () => {
  for (const names of [["A", "B"], ["A", "B", "C", "D"], ["A", "B", "C", "D", "E", "F", "G", "H", "I"]]) {
    const g = newGame(names);
    g.order.forEach((pid, i) => logDrink(pid, "sip", i + 1, "t"));
    logDrink(g.order[0], "shot", 1, "t");
    const awards = computeAwards();
    assert.equal(awards.length, names.length);
    assert.equal(new Set(awards.map(a => a.who[0])).size, names.length);
    assert.equal(awards[0].title, "Thirstiest");
  }
});

test("saved games load back, and an old physical-deck game is dropped", () => {
  newGame();
  const saved = JSON.parse(JSON.stringify(S));
  saved.game.mode = "physical";
  load({ S: saved });
  assert.equal(S.game, null);
  assert.equal(S.screen, "setup");
  assert.equal(S.players.length, 4);
});
