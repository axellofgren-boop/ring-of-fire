// ---------- Sound & effects ----------
// Every sound is synthesised with Web Audio, so nothing needs downloading and it works offline.
export const SFX = (() => {
  let ctx = null;
  const isOn = () => { try { return localStorage.getItem("rof.sound") !== "off"; } catch (e) { return true; } };
  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, o) {
    o = o || {}; const c = ac(); if (!c) return;
    const t = c.currentTime + (o.at || 0), osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || "sine"; osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + o.slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination); osc.start(t); osc.stop(t + dur + 0.02);
  }
  function noise(dur, o) {
    o = o || {}; const c = ac(); if (!c) return;
    const t = c.currentTime + (o.at || 0), len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = "bandpass"; f.frequency.value = o.freq || 2500; f.Q.value = o.q || 1; g.gain.value = o.vol || 0.25;
    src.connect(f).connect(g).connect(c.destination); src.start(t);
  }
  const sounds = {
    flip() { noise(0.12, { freq: 3200, q: 0.8, vol: 0.35 }); tone(520, 0.08, { type: "triangle", vol: 0.08, at: 0.05 }); },
    tap() { tone(660, 0.05, { type: "triangle", vol: 0.08 }); },
    sip() { tone(880, 0.09, { vol: 0.12 }); tone(1320, 0.12, { vol: 0.08, at: 0.06 }); },
    shot() { tone(220, 0.25, { type: "sawtooth", vol: 0.1, slide: -120 }); noise(0.15, { freq: 600, vol: 0.2 }); },
    dice() { for (let i = 0; i < 9; i++) noise(0.03, { freq: 1800 + Math.random() * 1500, vol: 0.3, at: i * 0.11 + Math.random() * 0.03 }); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: "triangle", vol: 0.14, at: i * 0.11 })); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.28, { type: "sawtooth", vol: 0.07, at: i * 0.16 })); },
    crown() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.3, { type: "square", vol: 0.06, at: i * 0.09 })); },
    creak() { tone(150, 0.7, { type: "sawtooth", vol: 0.035, slide: 90 }); tone(230, 0.5, { type: "sawtooth", vol: 0.025, slide: -60, at: 0.25 }); },
    trapdoor() { tone(110, 0.45, { type: "square", vol: 0.09, slide: -70, at: 0.5 }); noise(0.3, { freq: 280, vol: 0.4, at: 0.55 }); },
    gallop() { [0, 0.09, 0.22, 0.31].forEach(a => noise(0.04, { freq: 900, q: 2, vol: 0.45, at: a })); },
    back() { tone(300, 0.22, { type: "triangle", vol: 0.12, slide: -150, at: 0.25 }); },
    tick() { tone(1250, 0.035, { type: "square", vol: 0.07 }); tone(950, 0.035, { type: "square", vol: 0.06, at: 0.13 }); },
    fuse() { noise(0.7, { freq: 5200, q: 0.5, vol: 0.14 }); },
    boom() { noise(1.4, { freq: 160, q: 0.4, vol: 1 }); noise(0.5, { freq: 900, q: 0.6, vol: 0.5 }); tone(110, 1, { type: "sawtooth", vol: 0.22, slide: -80 }); },
    whistle() { tone(1800, 0.35, { vol: 0.1, slide: 400 }); }
  };
  return {
    play(n) { if (!isOn()) return; try { if (sounds[n]) sounds[n](); } catch (e) {} },
    isOn,
    toggle() { const v = !isOn(); try { localStorage.setItem("rof.sound", v ? "on" : "off"); } catch (e) {} if (v) sounds.tap(); return v; }
  };
})();
export function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
export const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
