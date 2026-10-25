import { player, S } from "../core/state.js";
import { esc } from "../core/util.js";
import { buzz, reduceMotion, SFX } from "./sound.js";

export function toast(msg) {
  const old = document.querySelector(".toast"); if (old) old.remove();
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2300);
}
// Big reminder when a mate has to drink along: "Bob, drink with your mate Ann!"
export function matePop(es) {
  const old = document.querySelector(".mate-pop"); if (old) old.remove();
  if (!es.length) return;
  const amt = e => e.kind === "sip" ? "+" + e.n : e.kind === "shot" ? "shot" : "finish";
  const lines = es.slice(0, 3).map(e => `<div class="mp-line"><span><b>${esc(player(e.pid).name)}</b>, drink with your mate <b>${esc(e.reason.slice(8))}</b>!</span><span class="mp-n">${amt(e)}</span></div>`);
  if (es.length > 3) lines.push(`<div class="mp-line">+${es.length - 3} more mates drink too</div>`);
  const t = document.createElement("div"); t.className = "mate-pop"; t.setAttribute("role", "alert");
  t.innerHTML = `<span class="mp-ico" aria-hidden="true">🍻</span><div>${lines.join("")}</div>`;
  t.onclick = () => t.remove();
  document.body.appendChild(t); setTimeout(() => t.remove(), 4200);
  buzz([60, 60, 60]);
}
// Summarise drinks logged since a point in the log, e.g. "Player 2 +2 · Player 3 +1".
export function toastSince(from) {
  const g = S.game; if (!g) return;
  const m = {}; g.log.slice(from).forEach(e => { const k = e.pid; m[k] = m[k] || { sip: 0, big: [] }; if (e.kind === "sip") m[k].sip += e.n; else m[k].big.push(e.kind === "shot" ? "shot" : "finish"); });
  const parts = Object.entries(m).map(([pid, v]) => player(pid).name + " " + [v.sip ? "+" + v.sip : "", ...v.big].filter(Boolean).join(" "));
  if (!parts.length) return;
  toast(parts.length > 3 ? `Logged drinks for ${parts.length} players` : parts.join(" · "));
  matePop(g.log.slice(from).filter(e => e.reason.startsWith("Mate of ")));
  SFX.play(g.log.slice(from).some(e => e.kind !== "sip") ? "shot" : "sip");
}

export function confetti() {
  if (reduceMotion()) return;
  const cv = document.createElement("canvas"); cv.className = "confetti";
  const dpr = window.devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const c = cv.getContext("2d"); c.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const cols = ["--gold", "--flame", "--card", "--suit-red"].map(v => css.getPropertyValue(v).trim() || "#f2b33d");
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 10, r: 4 + Math.random() * 5,
    a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, col: cols[Math.floor(Math.random() * cols.length)]
  }));
  const t0 = performance.now();
  (function frame(now) {
    const el = now - t0;
    c.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach(p => {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.globalAlpha = Math.max(0, 1 - el / 1800);
      c.fillStyle = p.col; c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); c.restore();
    });
    if (el < 1800) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}

// Slide horses from where they were to where they are after each re-render.
export function flipAnimate(before) {
  if (reduceMotion() || !before) return;
  document.querySelectorAll("[data-flip]").forEach(el => {
    const old = before[el.dataset.flip]; if (!old) return;
    const now = el.getBoundingClientRect(), dx = old.left - now.left, dy = old.top - now.top;
    if (Math.abs(dx) + Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
  });
}

// White flash when the bomb goes off.
export function flash() {
  if (reduceMotion()) return;
  const f = document.createElement("div"); f.className = "flash"; document.body.appendChild(f); setTimeout(() => f.remove(), 750);
}
