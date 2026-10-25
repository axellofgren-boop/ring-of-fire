// Start-up: plug the browser's sounds, pop-ups and drawing into the game logic, then show the saved screen.
import { setEffects } from "./core/effects.js";
import { load, S } from "./core/state.js";
import "./ui/events.js";
import { confetti, flash, toast, toastSince } from "./ui/effects.js";
import { render } from "./ui/render.js";
import { buzz, SFX } from "./ui/sound.js";
import { wakeLock } from "./ui/wakelock.js";

setEffects({ sound: n => SFX.play(n), buzz, toast, drinks: toastSince, confetti, flash, wake: wakeLock, render });

export function start(data) {
  load(data);
  if (S.screen === "game" || S.screen === "mini") wakeLock();
  render();
}
window.claude?.hot?.snapshot?.(() => ({ S }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
