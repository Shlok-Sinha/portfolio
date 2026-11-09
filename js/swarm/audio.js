/* audio.js — tiny Web Audio synth. Muted by default; AudioContext is created on first user toggle. */
(function () {
  window.SW = window.SW || {};

  const A = { enabled: false, ctx: null, master: null, lastType: 0, lastTick: 0 };

  A.toggle = function () {
    A.enabled = !A.enabled;
    if (A.enabled && !A.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { A.enabled = false; return false; }
      A.ctx = new Ctx();
      A.master = A.ctx.createGain();
      A.master.gain.value = 0.35;
      A.master.connect(A.ctx.destination);
    }
    if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
    return A.enabled;
  };

  function tone(freq, dur, type, vol, delay) {
    if (!A.enabled || !A.ctx) return;
    const t = A.ctx.currentTime + (delay || 0);
    const o = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(A.master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  A.tick = function () {
    const n = performance.now();
    if (n - A.lastTick < 30) return;
    A.lastTick = n;
    tone(1300 + Math.random() * 700, 0.045, 'triangle', 0.07);
  };
  A.type = function () {
    const n = performance.now();
    if (n - A.lastType < 45) return;
    A.lastType = n;
    tone(2100 + Math.random() * 900, 0.022, 'square', 0.018);
  };
  A.paint = function () { tone(480 + Math.random() * 120, 0.14, 'sine', 0.05); };
  A.chord = function () {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.55, 'sine', 0.05, i * 0.06));
  };

  SW.audio = A;
})();
