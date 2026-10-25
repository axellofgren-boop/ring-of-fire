import { logDrink, mateEnds } from "./drinks.js";
import { fx } from "./effects.js";
import { enterHalf } from "./halftime.js";
import { clearBomb, enterMini } from "./minis.js";
import { DEFAULT_RULES, RANKS, SUITS } from "./rules.js";
import { cur, player, S, save, ui } from "./state.js";
import { shuffle } from "./util.js";

// ---------- Game flow ----------
// solo: the mini-games to play on their own, round after round in a shuffled rotation, instead of the ring.
export function startGame(solo) {
  const names = S.players.filter(p => p.name.trim());
  S.players = names;
  const deck = [];
  RANKS.forEach(r => SUITS.forEach((s, si) => deck.push({ rank: r, suit: si })));
  shuffle(deck);
  deck.forEach((c, i) => { c.id = i; c.drawn = false; c.jit = (Math.random() - 0.5) * 6; });
  S.game = {
    solo: solo && solo.length ? solo.slice() : null,
    round: 1,
    order: names.map(p => p.id),
    deck,
    turn: 0,
    cur: 0,
    dictator: null,
    roles: {},
    mates: {},
    houseRules: [],
    events: [],
    log: [],
    miniQueue: shuffle((solo && solo.length ? solo : S.miniGames).slice()),
    miniIdx: 0,
    startedAt: Date.now()
  };
  clearBomb();
  ui.sheet = null;
  if (solo) { S.game.miniAt = []; enterMini(); }
  else { planMinis(0); S.screen = "game"; }
  fx.wake();
  save(); fx.render();
}
export function cardsLeft() { return S.game.deck.filter(c => !c.drawn).length; }
// Where the night is: cards drawn in the ring, or the round number when playing one mini-game on its own.
export function cardNow() { const g = S.game; return g.solo ? g.round : 52 - cardsLeft(); }
export function unit() { return S.game && S.game.solo ? "Round" : "Card"; }
export function miniTag() { return S.game.solo ? `Round ${S.game.round}` : `Mini-game · after card ${cardNow()}`; }
export function soloOne() { return !!S.game.solo && S.game.solo.length === 1; }
export function backTxt() { return S.game.solo ? "Next round" : "Back to the ring"; }
export function exitGame() { clearBomb(); S.game = null; S.screen = "setup"; ui.sheet = null; }
// Mini-games land on a random card near each slot (every S.freq cards, give or take a quarter of the gap), so nobody can count down to them.
export function planMinis(from) {
  const g = S.game, F = S.freq, spread = Math.max(1, Math.round(F / 4)), at = [];
  if (F > 0) for (let c = F; c < 52; c += F) {
    if (c + spread <= from) continue;
    const t = Math.max(c + Math.round((Math.random() * 2 - 1) * spread), from + 1, at.length ? at[at.length - 1].t + 2 : 1);
    if (t < 52) at.push({ c, t });
  }
  g.miniAt = at;
}

export function drawCard(id) {
  const c = S.game.deck.find(x => x.id === id);
  if (!c || c.drawn) return;
  c.drawn = true;
  openReveal(c.rank, c.suit);
  save(); fx.render();
}
export function openReveal(rank, suit) {
  const rule = S.rules[rank];
  const color = suit == null ? null : (SUITS[suit].red ? "red" : "black");
  ui.sheet = { type: "reveal", rank, suit, color, alloc: {}, picked: {}, n: rule.sips, mate: null, ruleText: "" };
}
// 2 to 5: red suit gives the sips out, black suit drinks them.
export function effAction(sh) {
  const a = S.rules[sh.rank].action;
  if (a !== "suit") return a;
  return sh.color === "red" ? "give" : sh.color === "black" ? "self" : "suit";
}

export function confirmReveal(logIt) {
  const g = S.game, sh = ui.sheet, rule = S.rules[sh.rank], me = cur();
  const reason = sh.rank + " " + rule.name;
  const a = effAction(sh);
  const logFrom = g.log.length;
  ev("card", { pid: me, rank: sh.rank, suit: sh.suit, color: sh.color });
  // Roles and mates take effect even if nobody logs drinks.
  if (a === "dictator") { ev("crown", { pid: me, from: g.dictator, via: "card" }); g.dictator = me; }
  if (a === "role") { ev("role", { pid: me, rank: sh.rank, from: g.roles[sh.rank] || null }); g.roles[sh.rank] = me; }
  if (a === "mate" && sh.mate) {
    ev("mate", { pid: me, mate: sh.mate });
    const ends = mateEnds(me, sh.mate), gone = ends.map(x => `${player(x).name} & ${player(g.mates[x]).name}`);
    g.mates = Object.fromEntries([...Object.entries(g.mates).filter(([x, y]) => x !== me && !(x === sh.mate && y === me) && !ends.includes(x)), [me, sh.mate]]);
    if (gone.length) setTimeout(() => fx.toast(gone.join(", ") + " are" + " no longer mates"), 0);
  }
  if (a === "makerule") { g.houseRules.push({ text: sh.ruleText.trim(), by: me, rank: sh.rank }); ev("rule", { pid: me, text: sh.ruleText.trim() }); }
  if (logIt && a === "give") ev("give", { pid: me, n: Object.values(sh.alloc).reduce((x, y) => x + y, 0) });
  if (logIt) {
    if (a === "self") logDrink(me, "sip", sh.n, reason);
    if (a === "give") Object.entries(sh.alloc).forEach(([pid, n]) => logDrink(pid, "sip", n, reason));
    if (a === "pick") Object.keys(sh.picked).filter(k => sh.picked[k]).forEach((pid, _, arr) => logDrink(pid, "sip", sh.n, reason, new Set(arr)));
  }
  if (a === "dictator") fx.sound("crown");
  else if (a === "role" || a === "makerule") fx.sound("whistle");
  ui.sheet = null;
  fx.drinks(logFrom);
  nextTurn();
}

// The story of the night, for awards and the timeline.
export function ev(type, data) {
  const g = S.game;
  if (!g.events) g.events = [];
  g.events.push(Object.assign({ type, card: cardNow(), t: Date.now() }, data));
}
export function endGame() {
  ui.endTab = "awards";
  if (!S.game.endedAt) { S.game.endedAt = Date.now(); fx.sound("win"); setTimeout(fx.confetti, 200); }
  S.screen = "end";
}

export function nextTurn() {
  const g = S.game;
  g.turn += 1;
  g.cur = (g.cur + 1) % g.order.length;
  if (cardsLeft() === 0) { endGame(); save(); fx.render(); return; }
  const remaining = cardsLeft();
  if (!g.miniAt) planMinis(g.turn);
  const miniDue = remaining > 0 && g.miniQueue.length > 0 && g.miniAt.some(m => m.t === g.turn);
  if (g.turn === 26 && !g.halfDone && remaining > 0) enterHalf(miniDue);
  else if (miniDue) enterMini();
  save(); fx.render();
}
export function penaltyInfo(k) {
  const g = S.game, [kind, ref] = k.split(":");
  if (kind === "role") return { title: S.rules[ref].name + " got someone", sub: player(g.roles[ref]).name + " caught who?", reason: S.rules[ref].name, sips: S.rules[ref].sips };
  const h = g.houseRules[+ref], label = ruleLabel(+ref);
  return { title: label + " broken", sub: h.text, reason: "Broke " + label + (h.text ? ": " + h.text : ""), sips: (S.rules[h.rank] || S.rules.J).sips };
}
// "Axel's rule", or "Axel's rule 2" once someone has made more than one.
export function ruleLabel(i) {
  const rules = S.game.houseRules, h = rules[i], name = player(h.by).name;
  const mine = rules.filter(x => x.by === h.by);
  return mine.length > 1 ? `${name}'s rule ${mine.indexOf(h) + 1}` : `${name}'s rule`;
}
// One-use roles (Thumb Master) end as soon as a loser is logged.
export function roleOnce(r) { const x = S.rules[r]; return x.once !== undefined ? !!x.once : !!(DEFAULT_RULES[r] && DEFAULT_RULES[r].once); }
