import { backTxt, soloOne } from "../../core/game.js";
import { SUITS } from "../../core/rules.js";
import { player, S } from "../../core/state.js";
import { esc } from "../../core/util.js";
import { fold } from "../../ui/components.js";
import { raceLosers, raceWinners, SUIT_NAMES } from "./logic.js";

export function suitGlyph(si) { return `<span class="${SUITS[si].red ? "red-suit" : ""}">${SUITS[si].s}</span>`; }

export function viewRace(r) {
  const g = S.game;
  if (r.phase === "bets") {
    const rows = g.order.map(pid => {
      const b = r.bets[pid];
      return `<div class="bet">
        <div class="bet-top"><b class="nm">${esc(player(pid).name)}</b>
          <div class="row" style="gap:6px;flex-wrap:nowrap">
            <button class="iconbtn" data-act="hr-n" data-id="${pid}" data-d="-1" aria-label="Bet one less" ${b.n > 1 ? "" : "disabled"}>&minus;</button>
            <span class="n">${b.n}</span>
            <button class="iconbtn" data-act="hr-n" data-id="${pid}" data-d="1" aria-label="Bet one more">+</button>
          </div></div>
        <div class="suits">${SUITS.map((s, si) => `<button class="suitbtn ${s.red ? "red-suit" : ""}" data-act="hr-suit" data-id="${pid}" data-k="${si}" aria-pressed="${b.suit === si}" aria-label="${SUIT_NAMES[si]}">${s.s}</button>`).join("")}</div>
      </div>`;
    }).join("");
    const any = g.order.some(pid => r.bets[pid].suit != null);
    return `<section class="panel">
        <div class="row" style="justify-content:space-between"><h2>Place your bets</h2><span class="label">sips</span></div>
        <span class="muted" style="font-size:.9rem">Back a horse and set your bet. Skip a suit to sit this one out.</span>
        <div class="stack">${rows}</div>
      </section>
      ${fold("race", `Race options · ${r.len} cards${r.pre ? " · half up front" : ""}`, `<section class="panel">
        <span class="label">Track length</span>
        <div class="chips">${[6, 7, 8].map(n => `<button class="chip" data-act="hr-len" data-k="${n}" aria-pressed="${r.len === n}">${n} cards</button>`).join("")}</div>
        <button class="chip" data-act="hr-pre" aria-pressed="${r.pre}" style="justify-self:start">Drink half your bet before the race</button>
      </section>`)}
      <button class="btn fire wide" data-act="hr-start" ${any ? "" : "disabled"} style="min-height:56px">${any ? "And they're off!" : "Someone has to bet"}</button>
      ${soloOne() ? "" : `<button class="btn ghost wide" data-act="mini-done">Skip the race</button>`}`;
  }
  // Track: finish line at the top, side cards down the left, one lane per Ace.
  const horse = si => `<div class="horse ${SUITS[si].red ? "red-suit" : ""} ${r.last && r.last.suit === si ? "moved" : ""}" data-flip="horse-${si}">A${SUITS[si].s}</div>`;
  let rows = `<div class="tk-side tk-finish">FIN</div>${[0, 1, 2, 3].map(si => `<div class="tk-cell tk-finish">${r.winner === si ? horse(si) : ""}</div>`).join("")}`;
  for (let k = r.len; k >= 0; k--) {
    const side = k === 0 ? `<div class="tk-side tk-start">GO</div>`
      : k <= r.sideUp ? `<div class="tk-side up ${SUITS[r.side[k - 1].suit].red ? "red-suit" : ""} ${r.lastSide && k === r.sideUp ? "flipnew" : ""}">${r.side[k - 1].rank}${SUITS[r.side[k - 1].suit].s}</div>`
      : `<div class="tk-side down"></div>`;
    rows += side + [0, 1, 2, 3].map(si => {
      const here = r.winner !== si && r.pos[si] === k;
      return `<div class="tk-cell">${here ? horse(si) : ""}</div>`;
    }).join("");
  }
  const backers = si => g.order.filter(pid => r.bets[pid].suit === si).map(pid => esc(player(pid).name)).join(", ") || "nobody";
  const legend = [0, 1, 2, 3].map(si => `<div class="lg">${suitGlyph(si)} <span>${backers(si)}</span></div>`).join("");
  const track = `<div class="track" style="grid-template-rows:repeat(${r.len + 2}, minmax(34px, 1fr))">${rows}</div><div class="legend">${legend}</div>`;
  if (r.phase === "race") {
    const msg = r.last
      ? `${r.last.rank}${suitGlyph(r.last.suit)} flipped: <b>${SUIT_NAMES[r.last.suit]}</b> moves up.` + (r.lastSide ? ` Side card ${r.lastSide.rank}${suitGlyph(r.lastSide.suit)}: <b>${SUIT_NAMES[r.lastSide.suit]}</b> falls back.` : "")
      : "Flip the first card to start the race.";
    return `${track}<div class="callout race-msg" aria-live="polite">${msg}</div>
      <button class="btn fire wide" data-act="hr-flip" style="min-height:56px">Flip a card</button>`;
  }
  // Done: payouts
  const winners = raceWinners(r), losers = raceLosers(r);
  let pay = "";
  if (r.payIdx < winners.length) {
    const w = winners[r.payIdx], total = r.bets[w].n * 2;
    const left = total - Object.values(r.alloc).reduce((x, y) => x + y, 0);
    pay = `<section class="panel"><div class="row" style="justify-content:space-between"><h2>${esc(player(w).name)} hands out ${total}</h2><b>${left} left</b></div>
      <div class="alloc">${g.order.filter(p => p !== w).map(pid => `<div class="alloc-row"><span class="name">${esc(player(pid).name)}</span>
        <button class="iconbtn" data-act="hr-alloc" data-id="${pid}" data-d="-1" aria-label="One less" ${r.alloc[pid] ? "" : "disabled"}>&minus;</button>
        <span class="n">${r.alloc[pid] || 0}</span>
        <button class="iconbtn" data-act="hr-alloc" data-id="${pid}" data-d="1" aria-label="One more" ${left > 0 ? "" : "disabled"}>+</button></div>`).join("")}</div>
      <button class="btn primary wide" data-act="hr-pay" ${left === 0 ? "" : "disabled"}>${left === 0 ? "Log winnings" : `Hand out ${left} more`}</button></section>`;
  } else if (winners.length) {
    pay = `<div class="callout">Winnings handed out.</div>`;
  } else {
    pay = `<div class="callout">Nobody backed ${SUIT_NAMES[r.winner]}. No winnings to hand out.</div>`;
  }
  const loseList = losers.length
    ? `<section class="panel"><h2>Losers drink their bet</h2>
        <div class="stack" style="gap:6px">${losers.map(pid => `<div class="row" style="justify-content:space-between"><span>${esc(player(pid).name)} ${suitGlyph(r.bets[pid].suit)}</span><b>${r.bets[pid].n} ${r.bets[pid].n === 1 ? "sip" : "sips"}</b></div>`).join("")}</div>
        <button class="btn primary wide" data-act="hr-losers" ${r.losersLogged ? "disabled" : ""}>${r.losersLogged ? "Logged" : "Log losers' sips"}</button></section>`
    : "";
  return `<div class="verdict good" style="font-size:1.5rem">${SUIT_NAMES[r.winner]} wins! ${suitGlyph(r.winner)}</div>
    ${track}${pay}${loseList}
    <button class="btn fire wide" data-act="mini-done" style="min-height:56px">${backTxt()}</button>`;
}
