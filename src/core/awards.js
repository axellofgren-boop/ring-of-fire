import { board, fmtTotals } from "./drinks.js";
import { cardNow, unit } from "./game.js";
import { S } from "./state.js";

export function computeAwards() {
  const g = S.game, evs = g.events || [], order = g.order;
  const count = (type, key, filter) => { const m = {}; evs.filter(e => e.type === type && (!filter || filter(e))).forEach(e => { const k = e[key || "pid"]; m[k] = (m[k] || 0) + 1; }); return m; };
  const sumBy = (type, filter) => { const m = {}; evs.filter(e => e.type === type && (!filter || filter(e))).forEach(e => { m[e.pid] = (m[e.pid] || 0) + e.n; }); return m; };
  const tops = (m, low) => {
    const ent = order.map(pid => [pid, m[pid] || 0]);
    const best = low ? Math.min(...ent.map(x => x[1])) : Math.max(...ent.map(x => x[1]));
    if (!low && best <= 0) return null;
    return { who: ent.filter(x => x[1] === best).map(x => x[0]), v: best };
  };
  const score = {}; board().forEach(r => { score[r.pid] = r.finish * 10 + r.shot * 5 + r.sip; });
  const sips = {}; board().forEach(r => { sips[r.pid] = r.sip; });
  const hard = {}; board().forEach(r => { hard[r.pid] = r.shot + r.finish; });
  // Dictator reigns, measured in cards played while holding the crown.
  const reign = {}; const crowns = evs.filter(e => e.type === "crown");
  const lastCard = cardNow();
  crowns.forEach((c, i) => { const until = i + 1 < crowns.length ? crowns[i + 1].card : lastCard; reign[c.pid] = Math.max(reign[c.pid] || 0, until - c.card); });
  const wins = {}; evs.filter(e => e.type === "race").forEach(e => e.winners.forEach(pid => { wins[pid] = (wins[pid] || 0) + 1; }));
  const pl = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  // Every candidate award: a per-player value, and whether lowest wins.
  const C = (title, blurb, m, unit, low) => ({ title, blurb, m, unit, low: !!low });
  const cands = [
    C("Hard Liquor", "Most shots and finished drinks", hard, v => pl(v, "big one")),
    C("Sip Dealer", "Handed out the most sips", sumBy("give"), v => pl(v, "sip") + " given"),
    C("Best Dictator", "Longest reign as Dictator", reign, v => pl(v, "card") + " on the throne"),
    C("Revolutionary", "Won the most Dictator challenges", count("challenge", "pid", e => e.win), v => pl(v, "coup")),
    C("Failed Rebel", "Lost the most Dictator challenges", count("challenge", "pid", e => !e.win), v => pl(v, "failed coup")),
    C("Most Wanted Mate", "Picked as a drinking mate the most", count("mate", "mate"), v => pl(v, "time")),
    C("Lawmaker", "Made the most rules", count("rule"), v => pl(v, "rule")),
    C("Bomb Magnet", "Blew up holding The Bomb the most", count("bomb"), v => pl(v, "explosion")),
    C("Door Master", "Last one standing at The Door", count("door"), v => pl(v, "win")),
    C("Shown the Door", "Picked to finish their drink at The Door", count("door", "victim"), v => pl(v, "time")),
    C("Master of Disguise", "Won the most rounds as The Impostor", count("impostor", "pid", e => e.win), v => pl(v, "win")),
    C("Busted", "Caught the most as The Impostor", count("impostor", "pid", e => !e.win), v => pl(v, "time")),
    C("Wrongly Accused", "Voted out as The Impostor while innocent", count("impostor", "accused", e => !e.caught && e.accused !== "none"), v => pl(v, "time")),
    C("Lucky Punter", "Backed the most winning horses", wins, v => pl(v, "win")),
    C("Waterfall Starter", "Drew the most Aces", count("card", "pid", e => e.rank === "A"), v => pl(v, "Ace")),
    C("Designated Driver", "Got away with the fewest sips", sips, v => pl(v, "sip"), true)
  ];
  // One award per player. Thirstiest goes first; then each remaining award goes to its real winner,
  // rarest feats first (the bigger the winner's share of that stat, the sooner it is handed out).
  const out = [], got = new Set(), used = new Set();
  const give = (title, blurb, pid, stat) => { out.push({ title, blurb, who: [pid], stat }); got.add(pid); used.add(title); };
  const thirst = tops(score);
  if (thirst) { const pid = thirst.who[0]; give("Thirstiest", "Drank the most tonight", pid, fmtTotals(board().find(x => x.pid === pid))); }
  while (got.size < order.length) {
    let best = null;
    cands.forEach((c, ci) => {
      if (used.has(c.title)) return;
      if (c.low && order.length < 3) return;
      const vals = order.map(pid => c.m[pid] || 0);
      const target = c.low ? Math.min(...vals) : Math.max(...vals);
      if (!c.low && target <= 0) return;
      const winners = order.filter(pid => (c.m[pid] || 0) === target);
      if (c.low && winners.length === order.length) return;
      const free = winners.filter(pid => !got.has(pid));
      if (!free.length) return;
      const total = vals.reduce((x, y) => x + y, 0);
      const share = c.low ? 0.3 : target / Math.max(1, total);
      if (!best || share > best.share + 1e-9) best = { c, pid: free[0], v: target, tied: winners.length > 1, share };
    });
    if (!best) break;
    give(best.c.title, best.c.blurb + (best.tied ? " (shared)" : ""), best.pid, best.c.unit(best.v));
  }
  // Anyone still without an award gets a personal highlight instead of a made-up superlative.
  const perCard = pid => { const m = {}; g.log.filter(e => e.pid === pid && e.kind === "sip").forEach(e => { m[e.card || 0] = (m[e.card || 0] || 0) + e.n; }); return m; };
  const half = Math.ceil(lastCard / 2);
  order.filter(pid => !got.has(pid)).forEach(pid => {
    const pc = perCard(pid), cards = Object.keys(pc);
    const worst = cards.sort((x, y) => pc[y] - pc[x])[0];
    const late = g.log.filter(e => e.pid === pid && e.kind === "sip" && (e.card || 0) > half).reduce((x, e) => x + e.n, 0);
    const opts = [
      worst && pc[worst] >= 3 ? ["Rough Patch", "Their heaviest single card", `${pl(pc[worst], "sip")} at ${unit().toLowerCase()} ${worst}`] : null,
      sips[pid] && late / sips[pid] >= 0.6 ? ["Late Bloomer", "Did most of their drinking in the second half", `${late} of ${pl(sips[pid], "sip")} after halftime`] : null,
      sips[pid] && late / sips[pid] <= 0.4 ? ["Fast Starter", "Did most of their drinking in the first half", `${sips[pid] - late} of ${pl(sips[pid], "sip")} before halftime`] : null,
      ["Steady Sipper", "Kept the glass moving all night", pl(sips[pid] || 0, "sip")]
    ].filter(o => o && !used.has(o[0]));
    const o = opts[0] || ["Along for the Ride", "Here for the company", pl(sips[pid] || 0, "sip")];
    give(o[0], o[1], pid, o[2]);
  });
  return out;
}
