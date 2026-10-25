import { cardNow } from "./game.js";
import { player, S } from "./state.js";

// ---------- Drinks ----------
// Mates go both ways: when either one drinks, the other drinks too (chains follow on, without looping).
// Mates sit out the mini-games: a drink logged there counts for the drinker only.
export function matesOf(pid) {
  const m = S.game.mates || {};
  return [...new Set([m[pid], ...Object.keys(m).filter(a => m[a] === pid)].filter(Boolean))];
}
// Only 2 mate pairs at a time: picking a 3rd ends the oldest. Returns the keys of the pairs a new pick ends
// (your own old pair is replaced, and two mates picking each other again just refresh their pair).
export function mateEnds(me, mate) {
  const m = S.game.mates || {};
  const kept = Object.keys(m).filter(x => x !== me && !(x === mate && m[x] === me));
  return kept.slice(0, Math.max(0, kept.length - 1));
}
export function logDrink(pid, kind, n, reason, seen) {
  if (!n) return;
  const g = S.game;
  g.log.push({ pid, kind, n, reason, t: Date.now(), card: cardNow() });
  if (S.screen === "mini") return;
  seen = seen || new Set([pid]);
  matesOf(pid).forEach(mate => { if (!seen.has(mate)) { seen.add(mate); logDrink(mate, kind, n, "Mate of " + player(pid).name, seen); } });
}
export function totals(pid) {
  const t = { sip: 0, shot: 0, finish: 0 };
  for (const e of S.game.log) if (e.pid === pid) t[e.kind] += e.n;
  return t;
}
export function board() {
  return S.game.order.map(pid => ({ pid, name: player(pid).name, ...totals(pid) }))
    .sort((a, b) => (b.finish * 10 + b.shot * 5 + b.sip) - (a.finish * 10 + a.shot * 5 + a.sip));
}
export function fmtTotals(t) {
  const parts = [t.sip + (t.sip === 1 ? " sip" : " sips")];
  if (t.shot) parts.push(t.shot + (t.shot === 1 ? " shot" : " shots"));
  if (t.finish) parts.push(t.finish + (t.finish === 1 ? " drink finished" : " drinks finished"));
  return parts.join(" · ");
}
