// Game logic never touches the screen or the speakers directly. It asks for sounds, pop-ups and redraws
// through these hooks; the UI plugs the real ones in at start-up, and the logic tests leave them as no-ops.
export const fx = {
  sound() {},    // fx.sound("boom")
  buzz() {},     // vibrate: fx.buzz(30) or fx.buzz([60, 60])
  toast() {},    // a short message at the bottom
  drinks() {},   // announce the drinks logged since log position n
  confetti() {},
  flash() {},    // white flash for the bomb
  wake() {},     // keep the screen on
  render() {}    // redraw the current screen
};
export function setEffects(hooks) { Object.assign(fx, hooks); }
