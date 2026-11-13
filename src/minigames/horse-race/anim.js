import { confetti } from "../../ui/effects.js";
import { buzz, reduceMotion, SFX } from "../../ui/sound.js";

// ---------- Horse Race: playing out one draw ----------
// The logic moves the horses in one go. This plays it back in order, so the table can follow it on the TV:
//   1. the top card lifts off the deck, turns over and lands face up beside it;
//   2. the matching horse gallops up a row;
//   3. if the leader reached a new side card, that card turns over and its horse drops back a row;
//   4. on the winning draw, "X wins!" and the payouts appear once the horse is over the line.
// Only transform and opacity are animated, so it stays smooth on the TV. With reduced motion the sounds still play
// but everything is shown straight away.
const HR_MS = { card: 560, horse: 420, pause: 160, side: 420, back: 380 };
let hrSeen = null; // { r, n }: the last draw already shown, so a redraw (cog, rotate) doesn't replay it

// Called after every redraw of the Horse Race screen. Returns true if it took over the horse movement.
export function playRaceDraw(r, before) {
  const n = r.draws || 0;
  const fresh = !!hrSeen && hrSeen.r === r && n > hrSeen.n;
  hrSeen = { r, n };
  if (!fresh || !r.last) return false;
  const tHorse = HR_MS.card, tSide = tHorse + HR_MS.horse + HR_MS.pause, tBack = tSide + HR_MS.side;
  const tEnd = r.lastSide ? tBack + HR_MS.back : tHorse + HR_MS.horse;
  const won = r.phase === "done";
  const later = (ms, f) => setTimeout(f, reduceMotion() ? 0 : ms);
  SFX.play("flip"); buzz(15);
  later(tHorse, () => SFX.play("gallop"));
  if (r.lastSide) later(tSide, () => { SFX.play("back"); buzz(40); });
  if (won) later(tEnd, () => { SFX.play("win"); confetti(); buzz([40, 60, 40]); });
  if (reduceMotion()) return true;

  flyCard(document.querySelector(".hr-card"), document.querySelector(".hr-deck"));
  const side = document.querySelector(".tk-side.flipnew");
  if (side) side.animate([{ transform: "rotateY(180deg)" }, { transform: "rotateY(180deg)", offset: tSide / (tSide + HR_MS.side) }, { transform: "none" }],
    { duration: tSide + HR_MS.side, easing: "ease-in-out" });

  // Horses: each one waits for its moment, so the moved one goes after the card lands, the one sent back after its side card.
  const pitch = rowPitch();
  document.querySelectorAll("[data-flip]").forEach(el => {
    const old = before[el.dataset.flip]; if (!old) return;
    const now = el.getBoundingClientRect(), dx = old.left - now.left, dy = old.top - now.top;
    const si = +el.dataset.flip.split("-")[1], up = r.last.suit === si, back = r.lastSide && r.lastSide.suit === si;
    const at = (t, x, y, lift) => ({ offset: t / tEnd, transform: `translate(${x}px, ${y}px)${lift ? " scale(1.18)" : ""}` });
    let frames;
    if (up && back) frames = [at(0, dx, dy), at(tHorse, dx, dy), at(tHorse + HR_MS.horse / 2, dx, dy - pitch / 2, true), at(tHorse + HR_MS.horse, dx, dy - pitch), at(tBack, dx, dy - pitch), at(tEnd, 0, 0)];
    else if (up) frames = [at(0, dx, dy), at(tHorse, dx, dy), at(tHorse + HR_MS.horse / 2, dx / 2, dy / 2, true), at(tHorse + HR_MS.horse, 0, 0)];
    else if (back) frames = [at(0, dx, dy), at(tBack, dx, dy), at(tEnd, 0, 0)];
    else if (Math.abs(dx) + Math.abs(dy) >= 1) frames = [at(0, dx, dy), at(Math.min(380, tEnd), 0, 0)];
    else return;
    if (frames[frames.length - 1].offset < 1) frames.push({ offset: 1, transform: "none" });
    el.animate(frames, { duration: tEnd, easing: "cubic-bezier(.3,.7,.3,1)" });
  });
  // Hold back what the draw reveals (side card note, the winner, payouts) until it happens on the track.
  document.querySelectorAll(".hr-later").forEach((el, i) => el.animate(
    [{ opacity: 0, transform: "translateY(8px) scale(.96)" }, { opacity: 1, transform: "none" }],
    { duration: 320, delay: (won ? tEnd : tSide) + i * 120, fill: "backwards", easing: "cubic-bezier(.2,.8,.2,1.2)" }));
  return true;
}

// The drawn card starts face down on top of the deck, lifts, turns over in the air and lands in its slot.
function flyCard(card, deck) {
  if (!card || !deck) return;
  const a = deck.getBoundingClientRect(), b = card.getBoundingClientRect();
  const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2), s = a.height / b.height;
  card.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotateY(180deg)` },
    { transform: `translate(${dx / 2}px, ${dy / 2 - b.height * 0.25}px) scale(${(s + 1.15) / 2}) rotateY(180deg) rotateZ(-6deg)`, offset: 0.35 },
    { transform: "translate(0, -6px) scale(1.12) rotateY(0deg) rotateZ(3deg)", offset: 0.8 },
    { transform: "none" }
  ], { duration: HR_MS.card, easing: "cubic-bezier(.25,.75,.35,1)" });
}

// Distance between two rows of the track, for the horse that goes up and straight back down.
function rowPitch() {
  const sides = document.querySelectorAll(".track .tk-side");
  return sides.length > 1 ? sides[1].getBoundingClientRect().top - sides[0].getBoundingClientRect().top : 40;
}
