import { cardNow, soloOne, unit } from "../../core/game.js";
import { player, S } from "../../core/state.js";
import { esc } from "../../core/util.js";

// ---------- Night chart ----------
// Cumulative sips per player, card by card. Shots and finished drinks are marked on each line.
// Dark-surface categorical steps, validated against --surface (all checks pass). Colour follows setup order, never rank.
export const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
let chartData = null;
export function nightChart() {
  const g = S.game;
  const N = Math.max(1, cardNow());
  let ids = g.order.slice();
  const series = ids.map((pid, i) => ({ pid, name: player(pid).name, color: SERIES[i] || null, cum: new Array(N + 1).fill(0), big: [] }));
  const byId = {}; series.forEach(sr => { byId[sr.pid] = sr; });
  g.log.forEach(e => {
    const sr = byId[e.pid]; if (!sr) return;
    const k = Math.min(N, Math.max(0, e.card == null ? N : e.card));
    if (e.kind === "sip") for (let j = k; j <= N; j++) sr.cum[j] += e.n;
    else sr.big.push({ k, kind: e.kind });
  });
  // More than eight players: keep the seven biggest drinkers, fold the rest into one "Everyone else" line.
  let shown = series;
  if (series.length > 8) {
    const ranked = series.slice().sort((a, b) => b.cum[N] - a.cum[N]);
    const keep = new Set(ranked.slice(0, 7).map(x => x.pid));
    const rest = series.filter(x => !keep.has(x.pid));
    shown = series.filter(x => keep.has(x.pid)).map((x, i) => Object.assign(x, { color: SERIES[i] }));
    shown.push({ pid: "_rest", name: "Everyone else", color: SERIES[7], cum: new Array(N + 1).fill(0).map((_, k) => rest.reduce((a, x) => a + x.cum[k], 0)), big: [] });
  }
  // Size the drawing to the screen so the text stays readable on a phone.
  const W = Math.round(Math.max(320, Math.min(720, (window.innerWidth || 640) - 56))), H = W < 480 ? 280 : 320, L = 30, R = W < 480 ? 80 : 96, T = 26, B = 26;
  const maxY = Math.max(4, ...shown.map(x => x.cum[N]));
  const step = maxY <= 8 ? 2 : maxY <= 20 ? 5 : maxY <= 50 ? 10 : maxY <= 120 ? 20 : 50;
  const top = Math.ceil(maxY / step) * step;
  const X = k => L + (k / N) * (W - L - R), Y = v => T + (1 - v / top) * (H - T - B);
  let grid = "";
  for (let v = 0; v <= top; v += step) grid += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"></line><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  let xt = "";
  const xs = N <= 13 ? [0, N] : [0, 13, 26, 39, 52].filter(k => k < N).concat([N]);
  [...new Set(xs)].forEach(k => { xt += `<text x="${X(k)}" y="${H - 6}" text-anchor="middle">${k === 0 ? "Start" : unit() + " " + k}</text>`; });
  // Mini-game breaks as faint dashed lines, labelled once at the top.
  const MG = { race: "Horse Race", bomb: "The Bomb", door: "The Door", impostor: "Impostor" };
  let mg = "";
  (g.events || []).filter(e => MG[e.type]).forEach(e => {
    const x = X(Math.min(N, e.card || 0));
    mg += `<line class="mgline" x1="${x}" x2="${x}" y1="${T - 4}" y2="${H - B}"></line><text class="mg" x="${x}" y="${T - 10}" text-anchor="middle">${MG[e.type]}</text>`;
  });
  const path = sr => sr.cum.map((v, k) => (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
  const lines = shown.map(sr => `<path d="${path(sr)}" fill="none" stroke="${sr.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>`).join("");
  const marks = shown.map(sr => sr.big.map(b => b.kind === "shot"
    ? `<circle cx="${X(b.k)}" cy="${Y(sr.cum[b.k])}" r="5" fill="${sr.color}" stroke="var(--surface)" stroke-width="2"><title>${esc(sr.name)}: shot at ${unit().toLowerCase()} ${b.k}</title></circle>`
    : `<rect x="${X(b.k) - 5}" y="${Y(sr.cum[b.k]) - 5}" width="10" height="10" rx="2" transform="rotate(45 ${X(b.k)} ${Y(sr.cum[b.k])})" fill="${sr.color}" stroke="var(--surface)" stroke-width="2"><title>${esc(sr.name)}: finished a drink at ${unit().toLowerCase()} ${b.k}</title></rect>`).join("")).join("");
  // Direct labels at the end of each line, nudged apart so they never overlap.
  const ends = shown.map(sr => ({ sr, y: Y(sr.cum[N]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
  const over = ends.length ? ends[ends.length - 1].y - (H - B) : 0;
  if (over > 0) ends.forEach(e => { e.y -= over; });
  const dls = ends.map(e => `<text class="dl" x="${W - R + 8}" y="${e.y + 4}">${esc(e.sr.name.length > 11 ? e.sr.name.slice(0, 10) + "…" : e.sr.name)} ${e.sr.cum[N]}</text>`).join("");
  chartData = { shown, N, X, W, L, R, T, B, H, Y };
  const legend = shown.length >= 2 ? `<div class="legend-row">${shown.map(sr => `<span><i style="background:${sr.color}"></i>${esc(sr.name)}</span>`).join("")}</div>` : "";
  const qs = [13, 26, 39, 52].filter(k => k < N).concat([N]);
  const table = `<details><summary>Show as a table</summary><div style="overflow-x:auto"><table><thead><tr><th>Player</th>${qs.map(k => `<th>${unit()} ${k}</th>`).join("")}<th>Shots</th><th>Finished</th></tr></thead><tbody>${shown.map(sr => `<tr><td>${esc(sr.name)}</td>${qs.map(k => `<td>${sr.cum[k]}</td>`).join("")}<td>${sr.big.filter(b => b.kind === "shot").length}</td><td>${sr.big.filter(b => b.kind !== "shot").length}</td></tr>`).join("")}</tbody></table></div></details>`;
  return `<div class="dchart" id="dchart">
    ${legend}
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sips per player over the night, card by card">
      <g class="grid">${grid}</g>${xt}${mg}${lines}${marks}${dls}
      <line class="xh" id="xh" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"></line>
      <rect id="dchart-hit" x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent"></rect>
    </svg>
    <div class="tip" id="dtip" hidden></div>
    <div class="note">Lines count sips. ● shot &nbsp; ◆ finished drink &nbsp; ${soloOne() ? "" : "Dashed lines mark the mini-games. "}Tap or hover the chart to see any ${unit().toLowerCase()}.</div>
    ${table}
  </div>`;
}
export function chartHover(e) {
  const svg = e.target.closest && e.target.closest("#dchart svg"); const tip = document.getElementById("dtip"), xh = document.getElementById("xh");
  if (!chartData || !tip || !xh) return;
  if (!svg) { tip.hidden = true; xh.setAttribute("visibility", "hidden"); return; }
  const c = chartData, box = svg.getBoundingClientRect(), sx = (e.clientX - box.left) * (c.W / box.width);
  const k = Math.max(0, Math.min(c.N, Math.round(((sx - c.L) / (c.W - c.L - c.R)) * c.N)));
  xh.setAttribute("x1", c.X(k)); xh.setAttribute("x2", c.X(k)); xh.setAttribute("visibility", "visible");
  const rows = c.shown.slice().sort((a, b) => b.cum[k] - a.cum[k]).map(sr => `<div class="r"><span><i style="background:${sr.color}"></i>${esc(sr.name)}</span><span>${sr.cum[k]}</span></div>`).join("");
  tip.innerHTML = `<b>${k === 0 ? "Start" : unit() + " " + k}</b>${rows}`;
  tip.hidden = false;
  const wrap = svg.parentElement.getBoundingClientRect(), px = box.left - wrap.left + c.X(k) * (box.width / c.W);
  const tw = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(wrap.width - tw - 8, px > wrap.width / 2 ? px - tw - 12 : px + 12)) + "px";
}
document.addEventListener("pointermove", chartHover);
document.addEventListener("pointerdown", chartHover);
