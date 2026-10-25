import { board, fmtTotals, mateEnds } from "../core/drinks.js";
import { effAction, penaltyInfo, ruleLabel } from "../core/game.js";
import { FREQ_CHOICES, RANKS, SUITS } from "../core/rules.js";
import { cur, player, S, ui } from "../core/state.js";
import { esc } from "../core/util.js";
import { SFX } from "./sound.js";

// ---------- Sheets ----------
export function viewSheet() {
  const sh = ui.sheet;
  if (!sh) return "";
  let inner = "";
  if (sh.type === "reveal") inner = sheetReveal(sh);
  if (sh.type === "challenge") inner = sheetChallenge(sh);
  if (sh.type === "menu") inner = sheetMenu(sh);
  if (sh.type === "penalty") inner = sheetPenalty(sh);
  const fresh = ui.lastSheet !== sh; ui.lastSheet = sh; // only animate when a sheet first opens
  return `<div class="scrim${fresh ? " anim" : ""}" data-act="${sh.type === "reveal" ? "" : "close"}"><div class="sheet${sh.type === "reveal" ? " rv" : ""}${sh.type === "reveal" && ["suit", "give", "pick", "mate", "makerule"].includes(effAction(sh)) ? " busy" : ""}" role="dialog" aria-modal="true">${inner}</div></div>`;
}

export function sheetReveal(sh) {
  const rule = S.rules[sh.rank], g = S.game, me = cur();
  const suit = sh.suit == null ? null : SUITS[sh.suit];
  const face = `<button class="face ${suit && suit.red ? "red" : ""}" data-act="peek" aria-label="${sh.peek ? "Hide" : "Show"} the full rule" aria-expanded="${!!sh.peek}">
    <span class="corner">${sh.rank}<br>${suit ? suit.s : ""}</span>
    <span class="pip">${suit ? suit.s : sh.rank}</span>
    <span class="corner br">${sh.rank}<br>${suit ? suit.s : ""}</span>
  </button>`;
  let action = "", primary = "Next player", canConfirm = true;
  const others = g.order.filter(p => p !== me);
  const a = effAction(sh);
  const meName = esc(player(me).name);
  const stepper = `<div class="alloc-row"><span class="name">Sips</span>
    <button class="iconbtn" data-act="nstep" data-d="-1" aria-label="One less sip" ${sh.n > 1 ? "" : "disabled"}>&minus;</button>
    <span class="n">${sh.n}</span>
    <button class="iconbtn" data-act="nstep" data-d="1" aria-label="One more sip">+</button></div>`;
  if (a === "suit") {
    action = `<span class="label">What colour was the card?</span>
      <div class="row" style="flex-wrap:nowrap">
        <button class="btn primary" style="flex:1" data-act="color" data-k="red">Red: give ${sh.n}</button>
        <button class="btn primary" style="flex:1" data-act="color" data-k="black">Black: drink ${sh.n}</button>
      </div>`;
    canConfirm = false; primary = "Pick a colour first";
  } else if (a === "self") {
    primary = `Drink ${sh.n} & next player`;
  } else if (a === "all") {
    primary = "Next player";
  } else if (a === "give") {
    const used = Object.values(sh.alloc).reduce((x, y) => x + y, 0);
    const left = sh.n - used;
    action = `<div class="row" style="justify-content:space-between"><span class="label">Hand out ${sh.n}</span><b>${left} left</b></div>
      <div class="alloc">${others.map(pid => `<div class="alloc-row"><span class="name">${esc(player(pid).name)}</span>
        <button class="iconbtn" data-act="alloc" data-id="${pid}" data-d="-1" aria-label="One less" ${sh.alloc[pid] ? "" : "disabled"}>&minus;</button>
        <span class="n">${sh.alloc[pid] || 0}</span>
        <button class="iconbtn" data-act="alloc" data-id="${pid}" data-d="1" aria-label="One more" ${left > 0 ? "" : "disabled"}>+</button></div>`).join("")}</div>`;
    canConfirm = left === 0;
    primary = canConfirm ? "Log & next player" : `Give out ${left} more`;
  } else if (a === "pick") {
    const n = Object.values(sh.picked).filter(Boolean).length;
    action = `<span class="label">Who drinks?</span>
      <div class="chips">${g.order.map(pid => `<button class="chip" data-act="pick" data-id="${pid}" aria-pressed="${!!sh.picked[pid]}">${esc(player(pid).name)}</button>`).join("")}</div>${stepper}`;
    primary = n ? `Log ${sh.n} for ${n} & next` : "Next player";
  } else if (a === "mate") {
    const had = g.mates[me];
    action = `<span class="label">${meName} picks a drinking mate</span>
      <div class="chips">${others.map(pid => `<button class="chip" data-act="mate" data-id="${pid}" aria-pressed="${sh.mate === pid}">${esc(player(pid).name)}</button>`).join("")}</div>
      ${had ? `<span class="muted" style="font-size:.88rem">Replaces ${esc(player(had).name)}.</span>` : ""}
      ${sh.mate ? mateEnds(me, sh.mate).map(x => `<span class="muted" style="font-size:.88rem">Ends ${esc(player(x).name)} & ${esc(player(g.mates[x]).name)} (max 2 mate pairs).</span>`).join("") : ""}`;
    canConfirm = !!sh.mate;
    primary = sh.mate ? `${player(sh.mate).name} it is & next` : "Pick a mate first";
  } else if (a === "role") {
    const prev = g.roles[sh.rank] && g.roles[sh.rank] !== me ? ` ${esc(player(g.roles[sh.rank]).name)} loses the title.` : "";
    action = prev ? `<div class="callout">${prev.trim()}</div>` : "";
    primary = `Next player`;
  } else if (a === "makerule") {
    action = `<label class="stack" for="houserule"><span class="label">${meName}'s rule</span>
      <input class="field" id="houserule" data-sheet="ruleText" value="${esc(sh.ruleText)}" placeholder="Optional: only drink with your left hand" maxlength="80"></label>`;
    primary = "Add rule & next player";
  } else if (a === "dictator") {
    const prev = g.dictator && g.dictator !== me ? ` ${esc(player(g.dictator).name)} loses the crown.` : "";
    action = prev ? `<div class="callout">${prev.trim()}</div>` : "";
    primary = `Crown ${player(me).name}`;
  }
  return `<div class="reveal">${face}<div class="who">${meName}</div><h2>${esc(rule.action === "suit" && sh.color ? (sh.color === "red" ? "Give " : "Drink ") + sh.n : rule.name)}</h2>${sh.peek ? `<p>${esc(rule.text)}</p>` : ""}</div>
    <div class="rv-act">${action}
    <button class="btn fire wide" data-act="reveal-ok" ${canConfirm ? "" : "disabled"}>${esc(primary)}</button>
    ${["self", "give", "pick"].includes(a) ? `<button class="btn ghost wide" data-act="reveal-skip">Skip logging, next player</button>` : ""}</div>`;
}

export function boardBody() {
  const rows = board().map((r, i) => `<div class="brow">
    <span class="pos">${i + 1}</span>
    <div style="min-width:0"><div class="nm">${esc(r.name)}</div><div class="tot">${fmtTotals(r)}</div></div>
    <div class="acts">
      <button class="btn small" data-act="add-sip" data-id="${r.pid}" aria-label="Add a sip for ${esc(r.name)}">+sip</button>
      <button class="btn small" data-act="add-shot" data-id="${r.pid}" aria-label="Add a shot for ${esc(r.name)}">+shot</button>
    </div></div>`).join("");
  const last = S.game.log[S.game.log.length - 1];
  return `<div class="board">${rows}</div>
    ${last ? `<button class="btn ghost wide" data-act="undo">Undo: ${esc(player(last.pid).name)} ${last.n} ${last.kind === "sip" ? (last.n === 1 ? "sip" : "sips") : last.kind === "shot" ? "shot" : "drink finished"} (${esc(last.reason)})</button>` : `<span class="muted">No drinks logged yet.</span>`}`;
}

export function sheetChallenge(sh) {
  const g = S.game, dict = g.dictator;
  const challengers = g.order.filter(p => p !== dict);
  const pipsFor = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const face = sh.face || 6;
  const die = `<div class="die ${sh.rolling ? "rolling" : ""} ${sh.landed ? "landed" : ""}" id="die" aria-label="Die shows ${face}">${[...Array(9)].map((_, k) => `<i class="${pipsFor[face].includes(k) ? "on" : ""}"></i>`).join("")}</div>`;
  let body = "";
  if (!sh.result) {
    body = `<span class="label">Who's challenging ${esc(player(dict).name)}?</span>
      <div class="chips">${challengers.map(pid => `<button class="chip" data-act="challenger" data-id="${pid}" aria-pressed="${sh.who === pid}">${esc(player(pid).name)}</button>`).join("")}</div>
      <div class="callout">Roll a <b>1</b> or a <b>6</b> and the crown is yours. Anything else and you take a shot or finish your drink.</div>
      ${die}
      <button class="btn fire wide" data-act="roll" ${sh.who && !sh.rolling ? "" : "disabled"}>${sh.rolling ? "Rolling..." : "Roll the die"}</button>`;
  } else if (sh.result === "win") {
    body = `${die}<div class="verdict good">Rolled a ${face}. Coup!</div>
      <p style="margin:0;text-align:center"><b>${esc(player(sh.who).name)}</b> is the new Dictator.</p>
      <button class="btn fire wide" data-act="coup">Crown ${esc(player(sh.who).name)}</button>`;
  } else {
    body = `${die}<div class="verdict bad">Rolled a ${face}. Failed!</div>
      <p style="margin:0;text-align:center"><b>${esc(player(sh.who).name)}</b> pays the price. Which one?</p>
      <div class="row" style="flex-wrap:nowrap"><button class="btn primary" style="flex:1" data-act="pay" data-k="shot">Take a shot</button><button class="btn primary" style="flex:1" data-act="pay" data-k="finish">Finish drink</button></div>`;
  }
  return `<div class="sheet-head"><h2>Challenge the Dictator</h2>${sh.result || sh.rolling ? "" : `<button class="iconbtn" data-act="close" aria-label="Close">&times;</button>`}</div>${body}`;
}

export function sheetPenalty(sh) {
  const info = penaltyInfo(sh.k), n = Object.values(sh.picked).filter(Boolean).length;
  return `<div class="sheet-head"><h2>${esc(info.title)}</h2><button class="iconbtn" data-act="close" aria-label="Close">&times;</button></div>
    <span class="muted">${esc(info.sub)}</span>
    <div class="chips">${S.game.order.map(pid => `<button class="chip" data-act="pick" data-id="${pid}" aria-pressed="${!!sh.picked[pid]}">${esc(player(pid).name)}</button>`).join("")}</div>
    <div class="alloc-row"><span class="name">Sips</span>
      <button class="iconbtn" data-act="nstep" data-d="-1" aria-label="One less sip" ${sh.n > 1 ? "" : "disabled"}>&minus;</button>
      <span class="n">${sh.n}</span>
      <button class="iconbtn" data-act="nstep" data-d="1" aria-label="One more sip">+</button></div>
    <button class="btn fire wide" data-act="penalty-ok" ${n ? "" : "disabled"}>${n ? `Log ${sh.n} for ${n}` : "Pick who drinks"}</button>`;
}

// The cogwheel: scores, rules and settings in one place.
export function sheetMenu(sh) {
  const g = S.game, tab = g && g.solo && sh.tab === "rules" ? "scores" : sh.tab || "scores";
  const solo = g && g.solo;
  const arm = (k, label, sure) => `<button class="btn ghost" data-act="${sh.armed === k ? k : "arm"}" data-k="${k}"${sh.armed === k ? ' style="border-color:var(--bad);color:var(--bad)"' : ""}>${sh.armed === k ? sure : label}</button>`;
  const tabBtn = (k, l) => `<button data-act="tab" data-k="${k}" aria-pressed="${tab === k}">${l}</button>`;
  let body;
  if (tab === "scores") body = boardBody();
  else if (tab === "rules") {
    const house = g && g.houseRules && g.houseRules.length ? `<span class="label">House rules in play</span>
      <div class="stack" style="gap:6px">${g.houseRules.map((h, i) => `<div class="callout" style="padding:8px 12px"><b>${esc(ruleLabel(i))}</b> <span class="muted">${h.text ? esc(h.text) : "No details added."}</span></div>`).join("")}</div>
      <span class="label">Card rules</span>` : "";
    body = `${house}<div class="stack" style="gap:6px">${RANKS.map(r => `<div class="callout" style="padding:8px 12px"><b>${r} · ${esc(S.rules[r].name)}</b> <span class="muted">${esc(S.rules[r].text)}</span></div>`).join("")}</div>`;
  } else body = `<button class="btn ghost sound-btn" data-act="sound" aria-pressed="${SFX.isOn()}">${SFX.isOn() ? "Sound on: tap to mute" : "Sound off: tap to unmute"}</button>
      ${solo ? "" : `<label class="stack" for="freq" style="gap:6px"><span class="label">Mini-games</span>
        <select class="field" id="freq">${FREQ_CHOICES.map(([v, l]) => `<option value="${v}" ${S.freq === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <button class="btn ghost" data-act="skip-mini">Start the mini-game now</button>`}
      <span class="label">Game</span>
      ${arm("end", "End game and see the results", "Tap again to end the game")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${arm("restart", "Restart game", "Tap again to restart")}
        ${arm("exit", "Exit game", "Tap again to exit")}
      </div>`;
  return `<div class="sheet-head"><div class="tabs" style="flex:1${solo ? ";grid-template-columns:1fr 1fr" : ""}">${tabBtn("scores", "Scores")}${solo ? "" : tabBtn("rules", "Rules")}${tabBtn("settings", "Settings")}</div><button class="iconbtn" data-act="close" aria-label="Close">&times;</button></div>
    <div class="stack">${body}</div>`;
}
