import { backTxt, miniTag, soloOne } from "../../core/game.js";
import { player, S, ui } from "../../core/state.js";
import { esc } from "../../core/util.js";
import { fold } from "../../ui/components.js";
import { armBomb } from "./logic.js";

export function bombSvg(live) {
  return `<svg class="bomb-svg${live ? " live" : ""}" viewBox="0 0 140 140" aria-hidden="true">
    <circle cx="62" cy="84" r="46" fill="#151012" stroke="#f6dfb0" stroke-width="3"/>
    <ellipse cx="45" cy="66" rx="13" ry="8" fill="#fff" opacity=".22" transform="rotate(-35 45 66)"/>
    <rect x="81" y="36" width="22" height="16" rx="3" fill="#3a3033" stroke="#f6dfb0" stroke-width="3" transform="rotate(45 92 44)"/>
    <path d="M98 38 q6 -20 24 -20" fill="none" stroke="#c9a46a" stroke-width="4" stroke-linecap="round"/>
    <g class="spark"><path d="M122 4 L125 14 L136 12 L127 19 L134 28 L123 23 L118 33 L117 22 L106 22 L115 16 Z" fill="#ff6a2b"/><circle cx="122" cy="18" r="6" fill="#f2b33d"/><circle cx="122" cy="18" r="3" fill="#fff"/></g>
  </svg>`;
}
export function boomSvg(pop) {
  const pts = [];
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = i % 2 ? 48 : 68; pts.push((70 + Math.cos(a) * r).toFixed(1) + "," + (70 + Math.sin(a) * r).toFixed(1)); }
  const inner = pts.map(p => p.split(",").map(v => (70 + (v - 70) * 0.72).toFixed(1)).join(",")).join(" ");
  return `<svg class="boom-svg${pop ? " pop" : ""}" viewBox="0 0 140 140" aria-hidden="true">
    <polygon points="${pts.join(" ")}" fill="#ff6a2b" stroke="#fbf3e4" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="${inner}" fill="#f2b33d"/>
    <text x="70" y="77" text-anchor="middle" textLength="84" lengthAdjust="spacingAndGlyphs" font-family="Bungee, Impact, sans-serif" font-size="18" fill="#1d1416">BOOOOM!</text>
  </svg>`;
}

export function viewBomb(b) {
  const g = S.game, nm = id => esc(player(id).name);
  const after = `<span class="label">${miniTag()}</span>`;
  let body = "";
  if (b.phase === "setup") {
    body = `<div class="mini-hero" style="padding-top:8px;gap:4px">${after}<h1>The Bomb</h1></div>
      <div class="bomb-stage">${bombSvg(false)}</div>
      <div class="bomb-starter"><span class="label">Starts with the bomb</span><div class="holder">${nm(b.starter)}</div></div>
      ${fold("howto", "How to play", `<div class="callout">Grab something to be the bomb and pass it around the table. A <b>hidden timer</b> is running, somewhere between 20 seconds and a minute and a half. Whoever is holding it when it goes <b>BOOM</b> takes a shot.</div>`)}
      <button class="btn fire wide" data-act="bm-light" style="min-height:56px">Light the fuse</button>
      ${soloOne() ? "" : `<button class="btn ghost wide" data-act="mini-done">Skip The Bomb</button>`}`;
  } else if (b.phase === "live") {
    if (!ui.bombTimer) armBomb();
    body = `<div class="mini-hero" style="padding-top:8px;gap:4px">${after}<h1>Pass it!</h1></div>
      <div class="bomb-stage">${bombSvg(true)}</div>
      <div class="callout" style="text-align:center">The fuse is lit. Keep it moving, nobody knows when it blows.</div>`;
  } else {
    const victims = g.order.map(pid => `<button class="chip" data-act="bm-victim" data-id="${pid}" aria-pressed="${b.victim === pid}" ${b.logged ? "disabled" : ""}>${nm(pid)}</button>`).join("");
    body = `<div class="boom-layout"><div class="bomb-stage">${boomSvg(ui.bombShake)}</div><div class="boom-side">
      ${b.logged
        ? `<div class="bomb-stage"><div class="holder">${nm(b.victim)}</div><div class="verdict bad">takes a shot!</div></div>
           <div class="callout">The fuse was ${b.secs} seconds. The shot is on the scoreboard.</div>
           <button class="btn ${soloOne() ? "fire" : "primary"} wide" data-act="bm-again" ${soloOne() ? 'style="min-height:56px"' : ""}>Light another bomb</button>
           ${soloOne() ? "" : `<button class="btn fire wide" data-act="mini-done" style="min-height:56px">${backTxt()}</button>`}`
        : `<section class="panel"><h2>Who got blown up?</h2><div class="chips">${victims}</div>
           <button class="btn fire wide" data-act="bm-log" ${b.victim ? "" : "disabled"} style="min-height:56px">${b.victim ? `${nm(b.victim)} takes a shot` : "Tap who was holding it"}</button></section>`}</div></div>`;
  }
  const shake = ui.bombShake && b.phase === "boom" ? " shake" : "";
  ui.bombShake = false;
  return `<div class="wrap${shake}">${body}
  </div>`;
}
