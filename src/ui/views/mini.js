import { backTxt, miniTag } from "../../core/game.js";
import { currentMini } from "../../core/minis.js";
import { S } from "../../core/state.js";
import { esc } from "../../core/util.js";
import { viewBomb } from "../../minigames/bomb/view.js";
import { viewDoor } from "../../minigames/door/view.js";
import { viewRace } from "../../minigames/horse-race/view.js";
import { viewImpostor } from "../../minigames/impostor/view.js";

export function viewMini() {
  const name = currentMini();
  if (name === "The Door" && S.game.door) return `<div class="wrap">
    <div class="mini-hero" style="padding-top:8px;gap:4px">
      <span class="label">${miniTag()}</span>
      <h1>The Door</h1>
    </div>
    ${viewDoor(S.game.door)}
  </div>`;
  if (name === "The Impostor" && S.game.imp) return viewImpostor(S.game.imp);
  const r = S.game.race;
  if (name === "The Bomb" && S.game.bomb) return viewBomb(S.game.bomb);
  if (name === "Horse Race" && r) return `<div class="wrap">
    <div class="mini-hero" style="padding-top:8px;gap:4px">
      <span class="label">${miniTag()}</span>
      <h1>Horse Race</h1>
    </div>
    ${viewRace(r)}
  </div>`;
  return `<div class="wrap">
    <div class="mini-hero">
      <span class="label">${miniTag()}</span>
      <h1>${esc(name)}</h1>
      <p class="muted" style="margin:0;max-width:34ch">The ring pauses. Everyone plays.</p>
    </div>
    <div class="placeholder">
      <span class="label">Rules coming soon</span>
      <p style="margin:0">${esc(name)} is a placeholder for now. Play it your way, then log the damage on the scoreboard before heading back to the ring.</p>
    </div>
    <button class="btn fire wide" data-act="mini-done" style="min-height:56px">${backTxt()}</button>
  </div>`;
}
