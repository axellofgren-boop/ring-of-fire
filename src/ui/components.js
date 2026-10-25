import { ui } from "../core/state.js";

// A button that folds a section away until someone taps it open.
export function fold(k, label, body) {
  const open = !!(ui.fold && ui.fold[k]);
  return `<button class="btn ghost fold" data-act="fold" data-k="${k}" aria-expanded="${open}"><span>${label}</span><span class="caret">&#9662;</span></button>${open ? body : ""}`;
}
