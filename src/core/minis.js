import { newBomb } from "../minigames/bomb/logic.js";
import { newDoor } from "../minigames/door/logic.js";
import { newRace } from "../minigames/horse-race/logic.js";
import { newImpostor } from "../minigames/impostor/logic.js";
import { fx } from "./effects.js";
import { S, save, ui } from "./state.js";
import { shuffle } from "./util.js";

export function currentMini() {
  const g = S.game;
  return g.miniQueue[g.miniIdx % g.miniQueue.length];
}
export function finishMini() {
  const g = S.game;
  g.miniIdx += 1;
  if (g.miniIdx % g.miniQueue.length === 0) {
    const last = g.miniQueue[g.miniQueue.length - 1];
    do g.miniQueue = shuffle(g.miniQueue); while (g.miniQueue.length > 1 && g.miniQueue[0] === last);
  }
  g.race = null;
  g.door = null;
  g.imp = null;
  clearBomb();
  g.bomb = null;
  if (g.solo) { g.round += 1; enterMini(); } else S.screen = "game";
  save(); fx.render();
}
export function clearBomb() { clearTimeout(ui.bombTimer); clearInterval(ui.bombTick); ui.bombTimer = ui.bombTick = null; }
export function enterMini() {
  fx.sound("whistle");
  ui.fold.howto = ui.fold.race = false;
  S.screen = "mini";
  S.game.race = currentMini() === "Horse Race" ? newRace() : null;
  S.game.door = currentMini() === "The Door" ? newDoor() : null;
  S.game.bomb = currentMini() === "The Bomb" ? newBomb() : null;
  S.game.imp = currentMini() === "The Impostor" ? newImpostor() : null;
}
