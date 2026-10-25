import { test } from "node:test";
import assert from "node:assert/strict";
import { S } from "../../src/core/state.js";
import { clearBomb } from "../../src/core/minis.js";
import { raceAct, raceWinners } from "../../src/minigames/horse-race/logic.js";
import { bombAct, explode, BOMB_MIN, BOMB_MAX } from "../../src/minigames/bomb/logic.js";
import { doorAct, newDoor } from "../../src/minigames/door/logic.js";
import { impostorAct, newImpostor } from "../../src/minigames/impostor/logic.js";
import { newGame, drank } from "./helpers.mjs";

test("Horse Race: first horse past the last card wins; winners hand out double, losers drink their bet", () => {
  const g = newGame(undefined, { solo: ["Horse Race"] });
  const r = g.race;
  raceAct("hr-suit", { id: "a", k: "0" });
  raceAct("hr-suit", { id: "b", k: "1" });
  raceAct("hr-suit", { id: "c", k: "2" });
  raceAct("hr-suit", { id: "d", k: "3" });
  raceAct("hr-start", {});
  assert.equal(r.side.length, r.len);
  for (let i = 0; i < 200 && r.phase === "race"; i++) raceAct("hr-flip", {});
  assert.equal(r.phase, "done");
  assert.ok(r.pos[r.winner] > r.len);
  const [w] = raceWinners(r);
  const other = ["a", "b", "c", "d"].find(p => p !== w);
  for (let i = 0; i < r.bets[w].n * 2; i++) raceAct("hr-alloc", { id: other, d: "1" });
  raceAct("hr-pay", {});
  raceAct("hr-losers", {});
  assert.equal(drank(other), r.bets[w].n * 2 + r.bets[other].n);
  assert.equal(drank(w), 0);
});

test("The Bomb: hidden timer between 30 seconds and 3 minutes, the holder takes a shot", () => {
  const g = newGame(undefined, { solo: ["The Bomb"] });
  bombAct("bm-light", {});
  const b = g.bomb;
  assert.equal(b.phase, "live");
  assert.ok(b.secs >= BOMB_MIN && b.secs <= BOMB_MAX);
  explode();
  clearBomb();
  bombAct("bm-victim", { id: "c" });
  bombAct("bm-log", {});
  assert.equal(drank("c", "shot"), 1);
  bombAct("bm-log", {});
  assert.equal(drank("c", "shot"), 1, "logs only once");
});

test("The Door: every round has at least one safe door and one trap", () => {
  newGame(undefined, { solo: ["The Door"] });
  for (let i = 0; i < 200; i++) {
    const d = newDoor();
    assert.ok(d.safe.length >= 2 && d.safe.length <= 5);
    assert.ok(d.safe.some(Boolean) && d.safe.some(x => !x));
  }
});

test("The Door: trap pickers are out, the last one standing makes someone finish their drink", () => {
  const g = newGame(undefined, { solo: ["The Door"] });
  const d = g.door;
  for (let round = 0; round < 50 && !d.winner; round++) {
    const safe = d.safe.indexOf(true), trap = d.safe.indexOf(false);
    // The first player still in always picks safe, everyone else picks the trap.
    d.alive.forEach((pid, i) => doorAct("dr-door", { k: String(i === 0 ? safe : trap) }));
    if (!d.winner) doorAct("dr-next", {});
  }
  assert.equal(d.winner, "a");
  doorAct("dr-win", {});
  doorAct("dr-victim", { id: "b" });
  assert.equal(drank("b", "finish"), 1);
});

test("The Impostor: a civilian clues first and words don't repeat in a night", () => {
  newGame(undefined, { solo: ["The Impostor"] });
  const words = new Set();
  for (let i = 0; i < 40; i++) {
    const m = newImpostor();
    assert.notEqual(S.game.order[m.first], m.imp);
    assert.ok(!words.has(m.word)); words.add(m.word);
  }
});

const playImpostor = accuse => {
  const g = S.game, m = g.imp, n = g.order.length;
  impostorAct("im-start", {});
  for (let i = 0; i < n; i++) { impostorAct("im-show", {}); impostorAct("im-hide", {}); }
  impostorAct("im-vote", {});
  impostorAct("im-accuse", { id: accuse(m) });
  impostorAct("im-reveal", {});
  return m;
};

test("The Impostor: caught and missed the word = a shot", () => {
  newGame(undefined, { solo: ["The Impostor"] });
  const m = playImpostor(m => m.imp);
  assert.equal(m.phase, "guess");
  impostorAct("im-guess", { k: "0" });
  assert.equal(drank(m.imp, "shot"), 1);
});

test("The Impostor: gets away = everyone else drinks 3, and the innocent voted out takes a shot", () => {
  newGame(undefined, { solo: ["The Impostor"] });
  let innocent;
  const m = playImpostor(m => (innocent = S.game.order.find(p => p !== m.imp)));
  assert.equal(m.win, true);
  S.game.order.filter(p => p !== m.imp).forEach(p => assert.equal(drank(p), 3));
  assert.equal(drank(innocent, "shot"), 1);
  assert.equal(drank(m.imp), 0);
});

test("The Impostor: a tied vote costs nobody a shot", () => {
  newGame(undefined, { solo: ["The Impostor"] });
  const m = playImpostor(() => "none");
  assert.equal(m.win, true);
  S.game.order.forEach(p => assert.equal(drank(p, "shot"), 0));
});
