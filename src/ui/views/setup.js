import { ACTIONS, FREQ_CHOICES, RANKS } from "../../core/rules.js";
import { MINI_GAMES, S, ui } from "../../core/state.js";
import { esc } from "../../core/util.js";
import { fold } from "../components.js";

export function viewSetup() {
  const rows = S.players.map((p, i) => `
    <div class="player-row">
      <span class="num">${i + 1}</span>
      <input class="field" id="pn-${p.id}" data-name="${p.id}" value="${esc(p.name)}" placeholder="Name" maxlength="24" aria-label="Player ${i + 1} name">
      <button class="iconbtn" data-act="up" data-id="${p.id}" aria-label="Move up" ${i === 0 ? "disabled" : ""}>&uarr;</button>
      <button class="iconbtn" data-act="down" data-id="${p.id}" aria-label="Move down" ${i === S.players.length - 1 ? "disabled" : ""}>&darr;</button>
      <button class="iconbtn" data-act="rm" data-id="${p.id}" aria-label="Remove player">&times;</button>
    </div>`).join("");
  const solo = !!S.minis, pick = solo ? S.pick : [];
  const need = pick.includes("The Impostor") ? 3 : 2;
  const enough = S.players.filter(p => p.name.trim()).length >= need;
  const can = enough && (!solo || pick.length > 0);
  const blurb = { "Horse Race": "Bet sips on a suit and race the Aces.", "The Bomb": "Pass it round until it blows.", "The Door": "Pick a door. Dodge the trap.", "The Impostor": "Find who doesn't know the word. 3+ players." };
  const soloBtns = MINI_GAMES.map(m => `<button class="mode" data-act="mini-pick" data-k="${esc(m)}" aria-pressed="${pick.includes(m)}"><b>${esc(m)}</b><span>${blurb[m] || ""}</span></button>`).join("");
  const freqOpts = FREQ_CHOICES
    .map(([v, l]) => `<option value="${v}" ${S.freq === v ? "selected" : ""}>${l}</option>`).join("");
  return `<div class="wrap">
    <header class="hero">
      <span class="label">52 cards · 1 cup · no mercy</span>
      <h1>Ring of<br>Fire</h1>
      <p>Set the crew, pick your game, and the app keeps score of every sip.</p>
    </header>
    ${S.game && !S.game.over && S.game.log ? `<div class="banner"><span>A game is in progress.</span><button class="btn small primary" data-act="resume">Resume game</button></div>` : ""}
    <section class="panel">
      <div class="row" style="justify-content:space-between"><h2>Players</h2><button class="btn small ghost" data-act="shuffle">Shuffle order</button></div>
      <span class="muted" style="font-size:.9rem">Turns go top to bottom. Use the arrows to change the order.</span>
      <div class="stack">${rows}</div>
      <button class="btn ghost" data-act="add">+ Add player</button>
    </section>
    ${solo ? `<section class="panel">
      <h2>Mini-games only</h2>
      <span class="muted" style="font-size:.9rem">No cards, just mini-games. Tick one or more and they take turns in a random order.</span>
      <div class="modes">${soloBtns}</div>
      <button class="btn ghost" data-act="mode">Back to Ring of Fire</button>
    </section>` : fold("house", "House rules &amp; mini-games", `<section class="panel">
      <label class="stack" for="freq"><span class="label">Mini-game</span>
        <select class="field" id="freq">${freqOpts}</select>
      </label>
      <span class="muted" style="font-size:.9rem">Mini-games in the mix: ${S.miniGames.map(esc).join(", ")}. More coming.</span>
      <button class="btn ghost" data-act="rules">Edit card rules</button>
    </section>`)}
    <button class="btn fire wide" data-act="start" ${can ? "" : "disabled"} style="font-size:1.1rem;min-height:56px">${!solo ? "Start the fire" : !pick.length ? "Tick a mini-game" : pick.length === 1 ? "Play " + esc(pick[0]) : `Play ${pick.length} mini-games`}</button>
    ${enough ? "" : `<span class="muted" style="text-align:center">${need === 3 ? "The Impostor needs at least 3 players." : "Add at least 2 players."}</span>`}
    ${solo ? "" : `<button class="btn ghost wide" data-act="minis-open">Just play mini-games</button>`}
  </div>`;
}

export function viewRules() {
  const items = RANKS.map(r => {
    const x = S.rules[r];
    const opts = Object.entries(ACTIONS).map(([k, l]) => `<option value="${k}" ${x.action === k ? "selected" : ""}>${l}</option>`).join("");
    return `<div class="rule-ed">
      <div class="top"><span class="badge">${r}</span><input class="field" id="rn-${r}" data-rule="${r}" data-f="name" value="${esc(x.name)}" aria-label="${r} name"></div>
      <textarea class="field" id="rt-${r}" data-rule="${r}" data-f="text" aria-label="${r} description">${esc(x.text)}</textarea>
      <div class="opts">
        <select class="field" id="ra-${r}" data-rule="${r}" data-f="action" aria-label="${r} drink tracking">${opts}</select>
        <input class="field" id="rs-${r}" type="number" min="0" max="20" inputmode="numeric" data-rule="${r}" data-f="sips" value="${x.sips}" aria-label="${r} sips">
      </div>
    </div>`;
  }).join("");
  return `<div class="wrap">
    <div class="topbar"><h2>Card rules</h2><button class="btn small primary" data-act="rules-done">Done</button></div>
    <p class="muted" style="margin:0">These are placeholder rules. Rename, rewrite and set how many sips each card is worth. The number box is sips per person.</p>
    ${items}
    <button class="btn ghost" data-act="rules-reset">${ui.resetArmed ? "Tap again to reset all cards" : "Reset to default rules"}</button>
    <button class="btn primary wide" data-act="rules-done">Done</button>
  </div>`;
}
