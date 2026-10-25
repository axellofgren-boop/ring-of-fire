import { S } from "../core/state.js";

// ---------- Wake lock ----------
let lock = null;
export async function wakeLock() {
  try { if ("wakeLock" in navigator && !lock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } } catch (e) {}
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.screen !== "setup") wakeLock(); });
