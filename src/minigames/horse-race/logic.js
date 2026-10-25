import { logDrink } from "../../core/drinks.js";
import { fx } from "../../core/effects.js";
import { ev } from "../../core/game.js";
import { RANKS, SUITS } from "../../core/rules.js";
import { player, S } from "../../core/state.js";
import { shuffle } from "../../core/util.js";

// ---------- Horse Race ----------
// The four Aces are the horses. The rest of the deck deals the side cards and the cards flipped during the race.
export const SUIT_NAMES = ["Spades", "Hearts", "Diamonds", "Clubs"];
export function newRace() {
  const bets = {};
  S.game.order.forEach(pid => { bets[pid] = { suit: null, n: 2 }; });
  return { phase: "bets", len: 7, pre: false, bets, pos: [0, 0, 0, 0], side: [], sideUp: 0, deck: [], last: null, lastSide: null, winner: null, payIdx: 0, alloc: {}, losersLogged: false };
}
export function raceDeck() {
  const d = [];
  RANKS.filter(r => r !== "A").forEach(r => SUITS.forEach((_, si) => d.push({ rank: r, suit: si })));
  return shuffle(d);
}
export function raceWinners(r) { return S.game.order.filter(pid => r.bets[pid].suit === r.winner); }
export function raceLosers(r) { return S.game.order.filter(pid => r.bets[pid].suit != null && r.bets[pid].suit !== r.winner); }

export function raceAct(act, data) {
  const r = S.game.race, id = data.id, d = +data.d, logFrom = S.game.log.length;
  if (!r) return;
  if (act === "hr-suit") { const b = r.bets[id]; b.suit = b.suit === +data.k ? null : +data.k; }
  if (act === "hr-n") { const b = r.bets[id]; b.n = Math.max(1, Math.min(20, b.n + d)); }
  if (act === "hr-len") r.len = +data.k;
  if (act === "hr-pre") r.pre = !r.pre;
  if (act === "hr-start") {
    fx.sound("whistle");
    r.deck = raceDeck();
    r.side = r.deck.splice(0, r.len);
    r.phase = "race";
    if (r.pre) S.game.order.forEach(pid => { const b = r.bets[pid]; if (b.suit != null) logDrink(pid, "sip", Math.ceil(b.n / 2), "Horse Race: half the bet up front"); });
  }
  if (act === "hr-flip" && r.phase === "race") {
    if (!r.deck.length) r.deck = raceDeck();
    const c = r.deck.pop();
    r.last = c; r.lastSide = null;
    r.pos[c.suit] += 1;
    fx.sound("gallop");
    if (r.pos[c.suit] > r.len) { fx.sound("win"); setTimeout(fx.confetti, 300); r.winner = c.suit; r.phase = "done"; ev("race", { suit: c.suit, winners: raceWinners(r), losers: raceLosers(r) }); return; }
    // When the leading horse reaches the next side card, flip it: that suit steps back.
    const lead = Math.max(...r.pos);
    if (r.sideUp < lead && r.sideUp < r.len) {
      const s = r.side[r.sideUp];
      r.sideUp += 1;
      r.pos[s.suit] = Math.max(0, r.pos[s.suit] - 1);
      r.lastSide = s;
      fx.sound("back");
    }
  }
  if (act === "hr-alloc") {
    const w = raceWinners(r)[r.payIdx], total = r.bets[w].n * 2;
    const used = Object.values(r.alloc).reduce((x, y) => x + y, 0);
    const v = (r.alloc[id] || 0) + d;
    if (v >= 0 && (d < 0 || used < total)) r.alloc[id] = v;
    if (!r.alloc[id]) delete r.alloc[id];
  }
  if (act === "hr-pay") {
    setTimeout(() => fx.drinks(logFrom), 0);
    const w = raceWinners(r)[r.payIdx];
    ev("give", { pid: w, n: Object.values(r.alloc).reduce((x, y) => x + y, 0), src: "race" });
    Object.entries(r.alloc).forEach(([pid, n]) => logDrink(pid, "sip", n, "Horse Race: " + player(w).name + "'s winnings"));
    r.alloc = {}; r.payIdx += 1;
  }
  if (act === "hr-losers" && !r.losersLogged) {
    setTimeout(() => fx.drinks(logFrom), 0);
    const losers = raceLosers(r);
    losers.forEach(pid => logDrink(pid, "sip", r.bets[pid].n, "Horse Race: lost the bet", new Set(losers)));
    r.losersLogged = true;
  }
}
