import { logDrink } from "../core/drinks.js";
import { confirmReveal, drawCard, endGame, ev, exitGame, penaltyInfo, planMinis, roleOnce, startGame } from "../core/game.js";
import { finishHalf, punishLast } from "../core/halftime.js";
import { enterMini, finishMini } from "../core/minis.js";
import { DEFAULT_RULES } from "../core/rules.js";
import { MINI_GAMES, S, save, ui } from "../core/state.js";
import { clone, shuffle, uid } from "../core/util.js";
import { bombAct } from "../minigames/bomb/logic.js";
import { doorAct } from "../minigames/door/logic.js";
import { raceAct } from "../minigames/horse-race/logic.js";
import { impostorAct } from "../minigames/impostor/logic.js";
import { confetti, toastSince } from "./effects.js";
import { $, app, render } from "./render.js";
import { buzz, reduceMotion, SFX } from "./sound.js";
import { wakeLock } from "./wakelock.js";

// ---------- Events ----------
app.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.sheet && ui.sheet) ui.sheet[t.dataset.sheet] = t.value;
  if (t.dataset.name) { const p = S.players.find(x => x.id === t.dataset.name); if (p) { p.name = t.value; save(); refreshStart(); } }
  if (t.dataset.rule) {
    const r = S.rules[t.dataset.rule];
    r[t.dataset.f] = t.dataset.f === "sips" ? Math.max(0, Math.min(20, parseInt(t.value, 10) || 0)) : t.value;
    save();
  }
});
app.addEventListener("change", e => {
  if (e.target.id === "freq") { S.freq = parseInt(e.target.value, 10); if (S.game) planMinis(S.game.turn); save(); }
});
export function refreshStart() {
  const b = $('[data-act="start"]'); if (b) b.disabled = S.players.filter(p => p.name.trim()).length < 2;
}

app.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  if (act === "" ) return;
  if (act === "close" && el.classList.contains("scrim") && e.target !== el) return; // clicks inside the sheet
  const g = S.game, sh = ui.sheet;
  const idx = S.players.findIndex(p => p.id === id);
  switch (act) {
    case "mode": S.minis = false; break;
    case "minis-open": S.minis = true; break;
    case "mini-pick": { const k = el.dataset.k; S.pick = S.pick.includes(k) ? S.pick.filter(m => m !== k) : MINI_GAMES.filter(m => m === k || S.pick.includes(m)); break; }
    case "add": S.players.push({ id: uid(), name: "" }); save(); render(); { const ins = app.querySelectorAll("[data-name]"); ins[ins.length - 1].focus(); } return;
    case "rm": if (idx > -1) S.players.splice(idx, 1); break;
    case "up": if (idx > 0) [S.players[idx - 1], S.players[idx]] = [S.players[idx], S.players[idx - 1]]; break;
    case "down": if (idx > -1 && idx < S.players.length - 1) [S.players[idx + 1], S.players[idx]] = [S.players[idx], S.players[idx + 1]]; break;
    case "shuffle": shuffle(S.players); break;
    case "rules": S.screen = "rules"; ui.resetArmed = false; break;
    case "rules-done": S.screen = "setup"; break;
    case "rules-reset":
      if (ui.resetArmed) { S.rules = clone(DEFAULT_RULES); ui.resetArmed = false; } else ui.resetArmed = true;
      break;
    case "start": startGame(S.minis && S.pick.length ? S.pick : null); return;
    case "resume": S.screen = S.game.endedAt ? "end" : S.game.solo ? "mini" : "game"; wakeLock(); break;
    case "draw": {
      if (ui.pulling) return;
      SFX.play("flip"); buzz(15);
      if (reduceMotion()) { drawCard(+id); return; }
      ui.pulling = true;
      el.classList.add("pulling");
      el.style.transform += " translateY(-14px) scale(1.18)";
      setTimeout(() => { ui.pulling = false; drawCard(+id); }, 190);
      return;
    }
    case "sound": SFX.toggle(); break;
    case "half-pick": g.half.pick = g.half.pick === el.dataset.k ? null : el.dataset.k; break;
    case "half-ok": punishLast(); return;
    case "half-skip": finishHalf(); return;
    case "random": { const left = g.deck.filter(c => !c.drawn); if (left.length) drawCard(left[Math.floor(Math.random() * left.length)].id); return; }
    case "alloc": { const d = +el.dataset.d; const used = Object.values(sh.alloc).reduce((a, b) => a + b, 0);
      const v = (sh.alloc[id] || 0) + d; if (v >= 0 && (d < 0 || used < sh.n)) sh.alloc[id] = v; if (!sh.alloc[id]) delete sh.alloc[id]; break; }
    case "pick": sh.picked[id] = !sh.picked[id]; break;
    case "nstep": sh.n = Math.max(1, Math.min(30, sh.n + (+el.dataset.d))); if (sh.alloc) { let over = Object.values(sh.alloc).reduce((x, y) => x + y, 0) - sh.n; for (const k of Object.keys(sh.alloc)) { while (over > 0 && sh.alloc[k]) { sh.alloc[k]--; over--; } if (!sh.alloc[k]) delete sh.alloc[k]; } } break;
    case "color": sh.color = el.dataset.k; break;
    case "mate": sh.mate = id; break;
    case "penalty": ui.sheet = { type: "penalty", k: el.dataset.k, picked: {}, n: penaltyInfo(el.dataset.k).sips || 1 }; break;
    case "penalty-ok": { const n0 = g.log.length; setTimeout(() => toastSince(n0), 0); const info = penaltyInfo(sh.k), arr = Object.keys(sh.picked).filter(k => sh.picked[k]);
      arr.forEach(pid => logDrink(pid, "sip", sh.n, info.reason, new Set(arr)));
      const [kind, ref] = sh.k.split(":");
      if (kind === "role" && roleOnce(ref) && g.roles[ref]) { ev("used", { pid: g.roles[ref], rank: ref }); delete g.roles[ref]; }
      ui.sheet = null; break; }
    case "reveal-ok": confirmReveal(true); return;
    case "reveal-skip": confirmReveal(false); return;
    case "board": ui.sheet = { type: "menu", tab: "scores" }; break;
    case "menu": ui.sheet = { type: "menu", tab: ui.lastTab || "scores" }; break;
    case "tab": ui.lastTab = sh.tab = el.dataset.k; sh.armed = false; break;
    case "peek": sh.peek = !sh.peek; break;
    case "arm": sh.armed = el.dataset.k; break;
    case "restart": startGame(g.solo); return;
    case "exit": exitGame(); break;
    case "end": ui.sheet = null; endGame(); break;
    case "skip-mini": ui.sheet = null; if (g.miniQueue.length) enterMini(); break;
    case "close": ui.sheet = null; break;
    case "fold": ui.fold[el.dataset.k] = !ui.fold[el.dataset.k]; break;
    case "end-tab": ui.endTab = el.dataset.k; break;
    case "add-sip": { const n0 = g.log.length; logDrink(id, "sip", 1, "Manual"); toastSince(n0); break; }
    case "add-shot": { const n0 = g.log.length; logDrink(id, "shot", 1, "Manual"); toastSince(n0); break; }
    case "undo": g.log.pop(); break;
    case "challenge": ui.sheet = { type: "challenge", who: null, face: 6 }; break;
    case "challenger": sh.who = id; break;
    case "roll": roll(); return;
    case "coup": SFX.play("crown"); confetti(); ev("crown", { pid: sh.who, from: g.dictator, via: "coup" }); g.dictator = sh.who; ui.sheet = null; break;
    case "pay": { const n0 = g.log.length; logDrink(sh.who, el.dataset.k, 1, "Failed Dictator challenge"); ui.sheet = null; toastSince(n0); break; }
    case "mini-done": finishMini(); return;
    default: if (act.startsWith("hr-")) raceAct(act, el.dataset); else if (act.startsWith("bm-")) bombAct(act, el.dataset); else if (act.startsWith("dr-")) doorAct(act, el.dataset); else if (act.startsWith("im-")) impostorAct(act, el.dataset); break;
    case "again": { startGame(g.solo); return; }
    case "setup": S.screen = "setup"; S.game = null; break;
  }
  if (act !== "rules-reset") ui.resetArmed = false;
  save(); render();
});

export function roll() {
  const sh = ui.sheet;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const final = 1 + Math.floor(Math.random() * 6);
  ev("challenge", { pid: sh.who, dictator: S.game.dictator, roll: final, win: final === 1 || final === 6 });
  SFX.play("dice"); buzz(30);
  const verdict = () => { SFX.play(final === 1 || final === 6 ? "win" : "lose"); if (final === 1 || final === 6) confetti(); buzz(final === 1 || final === 6 ? [40, 60, 40] : 120); };
  if (reduceMotion()) setTimeout(verdict, 0);
  save();
  if (reduce) { sh.face = final; sh.result = (final === 1 || final === 6) ? "win" : "lose"; render(); return; }
  sh.rolling = true; render();
  let ticks = 0;
  const timer = setInterval(() => {
    ticks++;
    sh.face = 1 + Math.floor(Math.random() * 6);
    if (ticks >= 14) {
      clearInterval(timer);
      sh.face = final; sh.rolling = false; sh.landed = true; verdict();
      sh.result = (final === 1 || final === 6) ? "win" : "lose";
    }
    if (ui.sheet === sh) { render(); sh.landed = false; }
  }, 80);
}
