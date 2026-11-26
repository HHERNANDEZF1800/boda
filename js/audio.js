/* ==========================================================================
   Sonido: música de fondo + efectos de interfaz (Web Audio API)
   - Si BODA.musica tiene un archivo, se reproduce en loop.
   - Si no, se genera una melodía ambiental tipo "caja musical".
   ========================================================================== */
(function () {
  const Audio = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    enabled: true,
    started: false,
    el: null,
    timer: null,
  };

  function init() {
    if (Audio.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (Audio.ctx = new AC());
    Audio.master = ctx.createGain();
    Audio.master.gain.value = 0;
    Audio.master.connect(ctx.destination);

    // Reverb sintético (impulso de ruido con caída exponencial)
    const rev = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    rev.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    rev.connect(wet).connect(Audio.master);
    Audio.reverb = rev;

    Audio.musicGain = ctx.createGain();
    Audio.musicGain.gain.value = 0.5;
    Audio.musicGain.connect(Audio.master);
    Audio.musicGain.connect(rev);

    Audio.sfxGain = ctx.createGain();
    Audio.sfxGain.gain.value = 0.35;
    Audio.sfxGain.connect(Audio.master);
    Audio.sfxGain.connect(rev);
  }

  /* ---------------- Música ---------------- */
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  // Progresión: Fmaj7 – Am7 – Dm9 – Bbmaj7/C  (cálida, romántica)
  const CHORDS = [
    [53, 57, 60, 64],
    [57, 60, 64, 67],
    [50, 57, 60, 64],
    [46, 53, 57, 60],
  ];
  const BAR = 4.2; // segundos por acorde

  function pad(freq, t, dur) {
    const ctx = Audio.ctx;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 1.4);
    g.gain.linearRampToValueAtTime(0.04, t + dur - 0.8);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.6);
    [-6, 6].forEach((det) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = freq;
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.8);
    });
    f.connect(g).connect(Audio.musicGain);
  }

  function bell(freq, t, vol = 0.09, out) {
    const ctx = Audio.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = "sine";
    o2.type = "sine";
    o1.frequency.value = freq;
    o2.frequency.value = freq * 2.01;
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o1.connect(g);
    o2.connect(g2).connect(g);
    g.connect(out || Audio.musicGain);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 2.5);
    o2.stop(t + 2.5);
  }

  let bar = 0;
  let nextTime = 0;
  function scheduleGenerative() {
    const ctx = Audio.ctx;
    while (nextTime < ctx.currentTime + BAR * 1.5) {
      const chord = CHORDS[bar % CHORDS.length];
      chord.forEach((n) => pad(midi(n), nextTime, BAR));
      // arpegio de caja musical, con variación suave
      const notes = chord.map((n) => n + 12).concat([chord[1] + 24, chord[2] + 24]);
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        if (Math.random() < 0.28) continue;
        const n = notes[(i * 3 + bar) % notes.length];
        bell(midi(n), nextTime + (i * BAR) / steps + Math.random() * 0.03, 0.05 + Math.random() * 0.04);
      }
      nextTime += BAR;
      bar++;
    }
  }

  function startMusic() {
    if (Audio.started) return;
    Audio.started = true;
    const src = (window.BODA && window.BODA.musica) || "";
    if (src) {
      const el = (Audio.el = new window.Audio(src));
      el.loop = true;
      el.crossOrigin = "anonymous";
      try {
        const node = Audio.ctx.createMediaElementSource(el);
        node.connect(Audio.musicGain);
      } catch (e) { /* si falla, suena directo */ }
      el.play().catch(() => {});
    } else {
      nextTime = Audio.ctx.currentTime + 0.1;
      scheduleGenerative();
      Audio.timer = setInterval(scheduleGenerative, 1000);
    }
  }

  function fadeTo(v, s = 1.2) {
    if (!Audio.ctx) return;
    const g = Audio.master.gain;
    const now = Audio.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(v, now + s);
  }

  /* ---------------- API pública ---------------- */
  window.SFX = {
    start() {
      init();
      if (!Audio.ctx) return;
      Audio.ctx.resume();
      startMusic();
      if (Audio.enabled) fadeTo(0.9, 2.5);
    },
    setEnabled(on) {
      Audio.enabled = on;
      if (!Audio.ctx) return;
      if (on) {
        Audio.ctx.resume();
        if (Audio.el) Audio.el.play().catch(() => {});
        fadeTo(0.9, 0.8);
      } else {
        fadeTo(0, 0.5);
        if (Audio.el) setTimeout(() => !Audio.enabled && Audio.el.pause(), 600);
      }
    },
    get enabled() { return Audio.enabled; },

    // Efectos
    chime() {
      if (!Audio.ctx || !Audio.enabled) return;
      const t = Audio.ctx.currentTime;
      [76, 81, 88].forEach((n, i) => bell(midi(n), t + i * 0.09, 0.12, Audio.sfxGain));
    },
    tick() {
      if (!Audio.ctx || !Audio.enabled) return;
      bell(midi(88 + Math.floor(Math.random() * 3) * 2), Audio.ctx.currentTime, 0.05, Audio.sfxGain);
    },
    whoosh() {
      if (!Audio.ctx || !Audio.enabled) return;
      const ctx = Audio.ctx;
      const t = ctx.currentTime;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 1.4, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(2200, t + 0.7);
      f.frequency.exponentialRampToValueAtTime(400, t + 1.3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.35, t + 0.5);
      g.gain.linearRampToValueAtTime(0, t + 1.35);
      src.connect(f).connect(g).connect(Audio.sfxGain);
      src.start(t);
    },
  };

  // Pausar cuando la pestaña no está visible
  document.addEventListener("visibilitychange", () => {
    if (!Audio.ctx) return;
    if (document.hidden) Audio.ctx.suspend();
    else if (Audio.enabled) Audio.ctx.resume();
  });
})();
