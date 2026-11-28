// ===== ACHROMA audio: soft, modern synthesized SFX + generative ambient score (no chiptune squares) =====
'use strict';
const AU = {
  ctx: null, master: null, sfx: null, mus: null, rev: null, noiseBuf: null, last: {}, on: true, musicStep: 0, nextT: 0, mode: 'calm',
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const c = this.ctx = new A();
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = .003; comp.release.value = .2;
    this.master = c.createGain(); this.master.gain.value = .8; this.master.connect(comp); comp.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = .9; this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.gain.value = .55; this.mus.connect(this.master);
    // generated reverb impulse
    const len = c.sampleRate * 2.4, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .5; this.rev.connect(rg); rg.connect(this.master);
    const nl = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, nl, c.sampleRate); const nd = this.noiseBuf.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    this.nextT = c.currentTime + .1;
    this.applyVolumes(); this.loadSamples();
    setInterval(() => this.schedule(), 30);
  },
  // recorded sounds: carried in js/sfxdata.js as base64 (fetch cannot read files when the game is opened straight from disk), decoded
  // once the context exists; the synthesized ones stand in until (or unless) they are ready
  smp: {}, smpBusy: false,
  loadSamples() { if (this.smpBusy || !this.ctx || typeof SFX_DATA === 'undefined') return; this.smpBusy = true;
    for (const [k, b64] of Object.entries(SFX_DATA)) { let buf; try { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); buf = u.buffer; } catch (e) { continue; }
      try { const p = this.ctx.decodeAudioData(buf, b => { this.smp[k] = b; }, () => { }); if (p && p.catch) p.catch(() => { }); } catch (e) { } } },
  hasSample(k) { return !!this.smp[k]; },
  // one recording: returns its source, filter and gain so the caller can shape it over time (null when not loaded)
  sample(k, o = {}) { const b = this.smp[k]; if (!this.ctx || !b || !this.on) return null; const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; s.loop = !!o.loop; s.playbackRate.value = o.rate || 1; f.type = 'lowpass'; f.frequency.value = o.lp || 20000; g.gain.value = o.vol === undefined ? 1 : o.vol;
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start(c.currentTime + (o.delay || 0)); return { s, f, g, c }; },
  applyVolumes() { if (!this.ctx) return; this.master.gain.value = this.on ? SET.master : 0; this.sfx.gain.value = SET.sfx; this.mus.gain.value = SET.music * .9; },
  // --- primitives ---
  tone(o) {
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + (o.glide || o.dur));
    if (o.detune) osc.detune.value = o.detune;
    const a = o.atk || .003, v = o.vol || .2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + o.dur);
    let node = osc;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || .7; node.connect(f); node = f; }
    node.connect(g); g.connect(o.dest || this.sfx);
    if (o.rev) { const s = c.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(this.rev); }
    if (o.pan !== undefined && c.createStereoPanner) { /* panning kept simple */ }
    osc.start(t); osc.stop(t + a + o.dur + .05);
  },
  noise(o) {
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.playbackRate.value = o.rate || 1;
    const f = c.createBiquadFilter(); f.type = o.ft || 'lowpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f0 || 2000, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    const g = c.createGain(), a = o.atk || .002, v = o.vol || .2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + o.dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfx);
    if (o.rev) { const s = c.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(this.rev); }
    src.start(t, Math.random() * 1.5); src.stop(t + a + o.dur + .05);
  },
  // --- sound library ---
  play(name, p = 1, vol = 1) {
    if (!this.ctx || !this.on) return;
    const now = this.ctx.currentTime, gap = { hit: .035, ebullet: .06, shoot: .03, burn: .12, shock: .06, kill: .03, pellet: .05, beam: .07, tick: .05, step: .1, flame: .05, minigun: .03, needle: .04, pop: .05, venom: .15, static: .05, drone: .05, stick: .03, zap: .04, spawnIn: .08, spawnHit: .05 }[name] || .015;
    if (this.last[name] && now - this.last[name] < gap) return; this.last[name] = now;
    const r = 1 + rand(-.06, .06), v = vol;
    const N = o => this.noise(o), Tn = o => this.tone(o);
    if (GRIM_SFX[name]) { const g = GRIM_GAIN[name] || 1, N2 = g === 1 ? N : o => N(Object.assign({}, o, { vol: (o.vol || .2) * g })), T2 = g === 1 ? Tn : o => Tn(Object.assign({}, o, { vol: (o.vol || .2) * g })); GRIM_SFX[name](p, v, r, N2, T2); return; }
    switch (name) {
      case 'shoot': Tn({ f0: 190 * p * r, f1: 55, dur: .07, vol: .22 * v }); N({ ft: 'bandpass', f0: 2600 * p, f1: 700, dur: .05, vol: .12 * v, q: 1.2 }); break;
      case 'smg': Tn({ f0: 240 * r, f1: 80, dur: .045, vol: .14 * v }); N({ ft: 'bandpass', f0: 3200, f1: 1200, dur: .03, vol: .08 * v }); break;
      case 'pellet': Tn({ f0: 130 * r, f1: 38, dur: .16, vol: .4 * v }); N({ f0: 3500, f1: 300, dur: .2, vol: .32 * v }); break;
      case 'rail': Tn({ f0: 95, f1: 30, dur: .3, vol: .5 * v }); N({ ft: 'highpass', f0: 5000, f1: 1500, dur: .25, vol: .14 * v }); Tn({ f0: 1320 * r, dur: .5, vol: .05 * v, rev: .8, type: 'triangle' }); break;
      case 'slash': N({ ft: 'bandpass', f0: 500 * p, f1: 3400 * p, dur: .11, vol: .3 * v, q: 2 }); Tn({ f0: 140 * r, f1: 70, dur: .06, vol: .12 * v }); break;
      case 'rocket': N({ ft: 'bandpass', f0: 300, f1: 1800, dur: .2, vol: .2 * v, q: 1 }); Tn({ f0: 110, f1: 60, dur: .1, vol: .25 * v }); break;
      case 'bow': Tn({ f0: 300 * r, f1: 900, dur: .08, vol: .1 * v, type: 'triangle' }); N({ ft: 'bandpass', f0: 1500, f1: 4000, dur: .09, vol: .2 * v, q: 3 }); break;
      case 'charged': Tn({ f0: 1046, dur: .25, vol: .06, rev: .6, type: 'triangle' }); Tn({ f0: 1568, dur: .3, vol: .04, rev: .6, delay: .05 }); break;
      case 'chakram': N({ ft: 'bandpass', f0: 900, f1: 1800, dur: .14, vol: .14 * v, q: 4 }); break;
      case 'beam': N({ ft: 'bandpass', f0: 1800 * r, dur: .07, vol: .05 * v, q: 6 }); Tn({ f0: 70, dur: .07, vol: .08 * v }); break;
      case 'hit': Tn({ f0: 230 * p * r, f1: 80, dur: .06, vol: .2 * v }); N({ ft: 'highpass', f0: 3000, dur: .02, vol: .1 * v }); break;
      case 'crit': Tn({ f0: 160, f1: 50, dur: .12, vol: .35 * v }); Tn({ f0: 2093 * r, dur: .35, vol: .05, rev: .7, type: 'triangle' }); N({ ft: 'highpass', f0: 4000, dur: .04, vol: .12 }); break;
      case 'kill': {
        // crisp: transient click + punchy body + glassy tink (pitch climbs with the combo)
        N({ ft: 'highpass', f0: 6000, dur: .012, vol: .28 * v });
        Tn({ f0: 240 * r, f1: 52, dur: .085, vol: .5 * v, glide: .07 });
        N({ ft: 'bandpass', f0: 3200, f1: 1100, dur: .05, vol: .1 * v, q: 2 });
        Tn({ f0: 1568 * p, dur: .11, vol: .075 * v, type: 'triangle' });
        Tn({ f0: 2349 * p, dur: .07, vol: .045 * v, type: 'triangle', delay: .018 });
        break; }
      case 'explode': N({ f0: 1400, f1: 70, dur: .7, vol: .55 * v }); Tn({ f0: 85 * r, f1: 24, dur: .55, vol: .6 * v }); N({ ft: 'bandpass', f0: 600, dur: .4, vol: .1, rev: .6 }); break;
      case 'dash': N({ ft: 'bandpass', f0: 350, f1: 2000, dur: .16, vol: .2, q: 1.5 }); break;
      case 'hurt': Tn({ f0: 330, f1: 70, dur: .35, vol: .4, type: 'triangle', lp: 900 }); N({ f0: 900, f1: 100, dur: .25, vol: .3 }); Tn({ f0: 55, dur: .4, vol: .4 }); break;
      case 'armor': Tn({ f0: 900, f1: 300, dur: .12, vol: .12, type: 'triangle' }); N({ ft: 'highpass', f0: 2500, dur: .08, vol: .15 }); break;
      case 'pickup': [784, 988, 1175].forEach((f, i) => Tn({ f0: f * p, dur: .18, vol: .07, rev: .5, delay: i * .045, type: 'triangle' })); break;
      case 'ink': Tn({ f0: 1400 * p * r, dur: .06, vol: .035, type: 'triangle', rev: .3 }); break;
      case 'card': [523, 659, 784, 1047].forEach((f, i) => Tn({ f0: f, dur: .6, vol: .06, rev: .8, delay: i * .06, type: 'triangle' })); Tn({ f0: 130, dur: .8, vol: .15 }); break;
      case 'select': [784, 1175, 1568].forEach((f, i) => Tn({ f0: f * p, dur: .5, vol: .07, rev: .9, delay: i * .05, type: 'triangle' })); Tn({ f0: 98, f1: 49, dur: .4, vol: .4 }); N({ ft: 'bandpass', f0: 800, f1: 4000, dur: .3, vol: .1 }); break;
      case 'ui': Tn({ f0: 880 * p, dur: .04, vol: .05, type: 'triangle' }); break;
      case 'shock': N({ ft: 'bandpass', f0: 4200, f1: 1600, dur: .08, vol: .12, q: 4 }); Tn({ f0: 2600 * r, f1: 1200, dur: .06, vol: .03, type: 'triangle' }); break;
      case 'burn': N({ f0: 600, f1: 2200, dur: .15, vol: .1, atk: .03 }); break;
      case 'freeze': [2637, 3136, 3951].forEach((f, i) => Tn({ f0: f * r, dur: .2, vol: .025, delay: i * .025, rev: .6 })); break;
      case 'deflect': Tn({ f0: 2100 * r, dur: .15, vol: .06, type: 'triangle' }); Tn({ f0: 3170 * r, dur: .12, vol: .04 }); N({ ft: 'highpass', f0: 3000, dur: .04, vol: .1 }); break;
      case 'door': Tn({ f0: 70, f1: 35, dur: .35, vol: .45 }); N({ f0: 500, f1: 80, dur: .3, vol: .25 }); break;
      case 'spawn': N({ ft: 'bandpass', f0: 200, f1: 2500, dur: .35, vol: .1, atk: .25, q: 2 }); break;
      case 'ebullet': N({ f0: 900 * r, f1: 300, dur: .06, vol: .07 }); Tn({ f0: 300 * r, f1: 150, dur: .05, vol: .04, type: 'triangle' }); break;
      case 'telegraph': Tn({ f0: 440 * p, f1: 880 * p, dur: .3, vol: .05, type: 'triangle', rev: .4 }); break;
      case 'laser': N({ ft: 'bandpass', f0: 700, dur: .6, vol: .25, q: 3 }); Tn({ f0: 55, dur: .6, vol: .35, type: 'triangle', lp: 300 }); break;
      case 'slam': Tn({ f0: 70, f1: 22, dur: .7, vol: .8 }); N({ f0: 900, f1: 60, dur: .7, vol: .5 }); break;
      case 'roar': Tn({ f0: 48, f1: 36, dur: 1.8, vol: .6, atk: .3 }); Tn({ f0: 73, f1: 52, dur: 1.6, vol: .3, atk: .3, type: 'triangle', lp: 400 }); N({ f0: 200, f1: 1600, dur: 1.4, vol: .25, atk: .6, rev: .8 }); break;
      case 'phase': Tn({ f0: 60, f1: 30, dur: 1, vol: .7 }); [392, 494, 587, 784].forEach((f, i) => Tn({ f0: f, dur: 1.2, vol: .05, rev: 1, delay: i * .08, type: 'triangle' })); N({ f0: 3000, f1: 100, dur: .9, vol: .35 }); break;
      case 'clear': [[1047, 0], [1319, .06], [1568, .12], [2093, .2]].forEach(([f, d]) => { Tn({ f0: f, dur: .35, vol: .07, delay: d, type: 'triangle', rev: .5 }); Tn({ f0: f * 2, dur: .12, vol: .02, delay: d }); }); N({ ft: 'bandpass', f0: 1500, f1: 7000, dur: .35, vol: .08, atk: .05 }); Tn({ f0: 130, f1: 65, dur: .2, vol: .3 }); break;
      case 'floorClear': [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => Tn({ f0: f, dur: .5, vol: .06, delay: i * .07, type: 'triangle', rev: .7 })); [1047, 1319, 1568, 1976].forEach(f => Tn({ f0: f, dur: 1.6, vol: .045, delay: .55, type: 'triangle', rev: 1 })); Tn({ f0: 98, f1: 40, dur: .9, vol: .5, delay: .5 }); N({ f0: 8000, f1: 1500, dur: 1.2, vol: .1, delay: .5, ft: 'highpass' }); break;
      case 'fusionCharge': Tn({ f0: 180, f1: 1400, dur: 1.15, vol: .07, type: 'triangle', glide: 1.1, atk: .2 }); Tn({ f0: 182, f1: 1420, dur: 1.15, vol: .05, glide: 1.1, atk: .2 }); N({ ft: 'bandpass', f0: 300, f1: 6000, dur: 1.1, vol: .12, atk: .9, q: 3 }); break;
      case 'fusionHit': Tn({ f0: 70, f1: 28, dur: .8, vol: .7 }); N({ f0: 6000, f1: 300, dur: .5, vol: .35 }); N({ ft: 'highpass', f0: 7000, dur: .03, vol: .3 });
        [523, 659, 784, 988, 1175, 1568].forEach((f, i) => Tn({ f0: f * p, dur: 1.6, vol: .055, rev: 1, delay: .02 + i * .025, type: 'triangle' })); [2637, 3136, 3951].forEach((f, i) => Tn({ f0: f * p, dur: .5, vol: .025, delay: .1 + i * .06, rev: 1 })); break;
      case 'key': [2093, 2637, 3136, 4186].forEach((f, i) => Tn({ f0: f, dur: .4, vol: .05, delay: i * .05, rev: .8, type: 'triangle' })); Tn({ f0: 1047, dur: .6, vol: .06, rev: .8 }); break;
      case 'unlock': N({ ft: 'bandpass', f0: 2500, dur: .05, vol: .3, q: 5 }); Tn({ f0: 180, f1: 60, dur: .25, vol: .45 }); [392, 523, 659, 784].forEach((f, i) => Tn({ f0: f, dur: .8, vol: .05, delay: .1 + i * .04, rev: 1, type: 'triangle' })); break;
      case 'locked': Tn({ f0: 220, f1: 180, dur: .1, vol: .1, type: 'triangle' }); Tn({ f0: 165, dur: .12, vol: .08, type: 'triangle', delay: .1 }); break;
      case 'cast': Tn({ f0: 330 * p, f1: 660 * p, dur: .5, vol: .05, type: 'triangle', glide: .45, rev: .5 }); N({ ft: 'bandpass', f0: 600, f1: 2400, dur: .45, vol: .05, q: 4, atk: .2 }); break;
      case 'resolve': Tn({ f0: 90, f1: 35, dur: .45, vol: .55 }); N({ f0: 3000, f1: 150, dur: .45, vol: .3 }); N({ ft: 'highpass', f0: 5000, dur: .03, vol: .15 }); break;
      case 'soak': [1319, 1760].forEach((f, i) => Tn({ f0: f, dur: .3, vol: .06, delay: i * .05, type: 'triangle', rev: .5 })); break;
      case 'gaze': Tn({ f0: 440, f1: 415, dur: .8, vol: .06, type: 'triangle', rev: .8 }); Tn({ f0: 466, f1: 440, dur: .8, vol: .05, rev: .8 }); break;
      case 'knock': N({ ft: 'bandpass', f0: 200, f1: 1800, dur: .4, vol: .3, q: 1 }); Tn({ f0: 70, f1: 40, dur: .4, vol: .5 }); break;
      case 'synergyOld': [440, 554, 659, 880, 1109, 1319].forEach((f, i) => Tn({ f0: f, dur: 1.4, vol: .06, rev: 1, delay: i * .05, type: 'triangle' })); Tn({ f0: 55, f1: 110, dur: 1, vol: .4 }); N({ ft: 'bandpass', f0: 300, f1: 6000, dur: .8, vol: .15, q: 1 }); break;
      case 'death': Tn({ f0: 220, f1: 27, dur: 2.2, vol: .5, type: 'triangle', lp: 700 }); N({ f0: 1500, f1: 40, dur: 1.8, vol: .4, rev: .8 }); break;
      case 'win': [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => Tn({ f0: f, dur: 2, vol: .06, rev: 1, delay: i * .12, type: 'triangle' })); break;
      case 'step': N({ f0: 400, dur: .03, vol: .025 }); break;
      case 'tick': Tn({ f0: 1200, dur: .02, vol: .03 }); break;
      case 'crate': N({ f0: 1800, f1: 200, dur: .15, vol: .25 }); Tn({ f0: 180, f1: 90, dur: .08, vol: .2, type: 'triangle' }); break;
      case 'heal': [659, 880, 1319].forEach((f, i) => Tn({ f0: f, dur: .4, vol: .07, rev: .7, delay: i * .07 })); break;
      case 'flame': N({ f0: 900 * r, f1: 2600, dur: .09, vol: .07 * v, atk: .01 }); N({ ft: 'highpass', f0: 3000, dur: .04, vol: .03 * v }); break;
      case 'whip': N({ ft: 'highpass', f0: 4500, dur: .02, vol: .3 }); N({ ft: 'bandpass', f0: 800, f1: 3500, dur: .1, vol: .15, q: 2 }); Tn({ f0: 2200 * r, f1: 900, dur: .04, vol: .05, type: 'triangle' }); break;
      case 'hammer': Tn({ f0: 120 * r, f1: 35, dur: .3, vol: .7 }); N({ f0: 1800, f1: 120, dur: .35, vol: .45 }); N({ ft: 'highpass', f0: 3000, dur: .04, vol: .2 }); break;
      case 'reloadStart': N({ ft: 'bandpass', f0: 1800 * p, dur: .03, vol: .14 * v, q: 6 }); Tn({ f0: 420 * p, f1: 300, dur: .05, vol: .06 * v, type: 'triangle' }); N({ ft: 'bandpass', f0: 500, f1: 2600, dur: .25, vol: .05 * v, q: 2, atk: .15, delay: .05 }); break;
      case 'reloadDone': N({ ft: 'bandpass', f0: 2600, dur: .025, vol: .22, q: 8 }); Tn({ f0: 180, f1: 90, dur: .06, vol: .25 }); [1319, 1976].forEach((f, i) => Tn({ f0: f, dur: .18, vol: .045, delay: .03 + i * .04, type: 'triangle', rev: .4 })); break;
      case 'reloadBg': [1568, 2093].forEach((f, i) => Tn({ f0: f, dur: .12, vol: .025, delay: i * .04, type: 'triangle' })); break;
      case 'dry': N({ ft: 'bandpass', f0: 3000, dur: .02, vol: .12, q: 10 }); break;
      case 'orbOpen': N({ ft: 'bandpass', f0: 400, f1: 5000, dur: .3, vol: .12, q: 2, atk: .2 }); [784, 988, 1175, 1568].forEach((f, i) => Tn({ f0: f, dur: .5, vol: .04, delay: i * .05, rev: .8, type: 'triangle' })); break;
      case 'orbBurst': N({ ft: 'highpass', f0: 4000, dur: .05, vol: .25 }); Tn({ f0: 110, f1: 50, dur: .25, vol: .4 }); [1568, 2093, 2637, 3136].forEach((f, i) => Tn({ f0: f, dur: .6, vol: .04, delay: .02 + i * .03, rev: 1 })); break;
      case 'limitOn': Tn({ f0: 900, f1: 55, dur: .8, vol: .18, type: 'triangle', glide: .7, rev: .8 }); N({ ft: 'bandpass', f0: 4000, f1: 200, dur: .7, vol: .2, q: 2 }); Tn({ f0: 60, f1: 30, dur: .9, vol: .5 }); [523, 622, 784].forEach((f, i) => Tn({ f0: f / 2, dur: 1.4, vol: .04, rev: 1, delay: .2 + i * .05, type: 'triangle' })); break;
      case 'limitOff': Tn({ f0: 70, f1: 900, dur: .5, vol: .16, type: 'triangle', glide: .45 }); N({ ft: 'bandpass', f0: 300, f1: 5000, dur: .45, vol: .2, q: 2 }); N({ ft: 'highpass', f0: 6000, dur: .03, vol: .2, delay: .45 }); break;
      case 'limitBeat': Tn({ f0: 70, f1: 40, dur: .18, vol: .3 }); Tn({ f0: 2600, dur: .03, vol: .02, type: 'triangle', delay: .45 }); break;
      case 'dashOn': [523, 659, 784, 1047, 1319].forEach((f, i) => Tn({ f0: f, dur: .3, vol: .05, delay: i * .035, type: 'triangle', rev: .5 })); N({ ft: 'bandpass', f0: 300, f1: 4000, dur: .35, vol: .2, q: 1.5 }); Tn({ f0: 110, f1: 220, dur: .2, vol: .3 }); break;
      case 'dashOff': Tn({ f0: 90, f1: 30, dur: .6, vol: .7 }); N({ f0: 5000, f1: 200, dur: .5, vol: .4 }); [1568, 2093, 2637, 3136].forEach((f, i) => Tn({ f0: f, dur: .6, vol: .035, delay: .03 + i * .03, rev: 1 })); break;
      case 'shieldPop': N({ ft: 'highpass', f0: 3500, dur: .06, vol: .25 }); Tn({ f0: 2000 * r, f1: 900, dur: .14, vol: .07, type: 'triangle' }); Tn({ f0: 140, f1: 70, dur: .1, vol: .25 }); break;
      case 'riskOn': [196, 233, 277].forEach((f, i) => Tn({ f0: f, dur: 1.2, vol: .06, rev: 1, delay: i * .05, type: 'triangle', lp: 900 })); Tn({ f0: 55, f1: 40, dur: .9, vol: .5 }); N({ f0: 600, f1: 80, dur: .8, vol: .25 }); break;
      case 'riskBeat': Tn({ f0: 80, f1: 45, dur: .12, vol: .45 * v }); Tn({ f0: 70, f1: 40, dur: .12, vol: .35 * v, delay: .14 }); break;
      case 'riskLock': Tn({ f0: 1200, f1: 800, dur: .3, vol: .08, type: 'triangle', rev: .6 }); N({ ft: 'bandpass', f0: 2500, dur: .08, vol: .25, q: 6 }); Tn({ f0: 90, f1: 50, dur: .25, vol: .5 }); break;
      case 'riskOff': [392, 523, 659, 784].forEach((f, i) => Tn({ f0: f, dur: .8, vol: .05, delay: i * .08, rev: 1, type: 'triangle' })); N({ ft: 'bandpass', f0: 400, f1: 1500, dur: .9, vol: .06, atk: .4 }); break;
      case 'skillReady': [1568, 2349].forEach((f, i) => Tn({ f0: f, dur: .25, vol: .045, delay: i * .07, type: 'triangle', rev: .5 })); break;
      case 'chipGet': [880, 1175, 1568, 2349].forEach((f, i) => Tn({ f0: f, dur: .12, vol: .05, delay: i * .04, type: 'triangle' })); N({ ft: 'bandpass', f0: 3000, f1: 6000, dur: .2, vol: .08, q: 4 }); Tn({ f0: 220, f1: 110, dur: .15, vol: .2 }); break;
      case 'chestOpen': N({ ft: 'bandpass', f0: 300, f1: 900, dur: .3, vol: .2, q: 3 }); [784, 988, 1319, 1568].forEach((f, i) => Tn({ f0: f, dur: .5, vol: .05, delay: .2 + i * .06, rev: .8, type: 'triangle' })); break;
      case 'tpOn': N({ ft: 'bandpass', f0: 6000, f1: 300, dur: .35, vol: .2, q: 3 }); Tn({ f0: 1760, f1: 220, dur: .4, vol: .07, type: 'triangle', glide: .3, rev: .8 }); Tn({ f0: 55, dur: .6, vol: .3 }); [659, 831, 988].forEach((f, i) => Tn({ f0: f, dur: 1, vol: .035, delay: .15 + i * .04, rev: 1, type: 'triangle' })); break;
      case 'tpGo': N({ ft: 'bandpass', f0: 400, f1: 7000, dur: .12, vol: .3, q: 2 }); Tn({ f0: 2637, dur: .3, vol: .06, type: 'triangle', rev: .7, delay: .08 }); Tn({ f0: 120, f1: 60, dur: .2, vol: .35, delay: .08 }); break;
      case 'tpOff': Tn({ f0: 220, f1: 880, dur: .3, vol: .07, type: 'triangle', glide: .25 }); N({ ft: 'bandpass', f0: 300, f1: 3000, dur: .3, vol: .12, q: 2 }); break;
      case 'fall': Tn({ f0: 600, f1: 60, dur: .5, vol: .2, type: 'triangle' }); break;
      case 'zap': N({ ft: 'bandpass', f0: 5200 * r, f1: 1800, dur: .09, vol: .16, q: 5 }); Tn({ f0: 1800 * r, f1: 600, dur: .07, vol: .05, type: 'triangle' }); Tn({ f0: 120, f1: 60, dur: .06, vol: .15 }); break;
      case 'minigun': Tn({ f0: 260 * r, f1: 90, dur: .035, vol: .12 * v }); N({ ft: 'bandpass', f0: 3800, f1: 1500, dur: .025, vol: .07 * v }); break;
      case 'lob': Tn({ f0: 160, f1: 260, dur: .1, vol: .2, type: 'triangle' }); N({ ft: 'bandpass', f0: 600, f1: 1200, dur: .1, vol: .08 }); break;
      case 'thrust': N({ ft: 'bandpass', f0: 1200, f1: 4200, dur: .08, vol: .28, q: 3 }); Tn({ f0: 200 * r, f1: 90, dur: .07, vol: .2 }); break;
      case 'whirl': N({ ft: 'bandpass', f0: 400, f1: 2600, dur: .22, vol: .26, q: 2, atk: .03 }); Tn({ f0: 110, f1: 70, dur: .15, vol: .15 }); break;
      case 'stick': Tn({ f0: 2400 * r, dur: .025, vol: .05, type: 'triangle' }); break;
      case 'needle': N({ ft: 'highpass', f0: 4500, dur: .04, vol: .1 * v }); Tn({ f0: 900 * r, f1: 500, dur: .04, vol: .06 * v, type: 'triangle' }); break;
      case 'pop': N({ f0: 2200, f1: 200, dur: .12, vol: .2 * v }); Tn({ f0: 140 * r, f1: 50, dur: .1, vol: .25 * v }); break;
      case 'venom': N({ ft: 'bandpass', f0: 700 * r, f1: 300, dur: .12, vol: .1, q: 6 }); Tn({ f0: 330 * r, f1: 520, dur: .08, vol: .03, type: 'triangle' }); break;
      case 'vortex': Tn({ f0: 70, f1: 140, dur: .5, vol: .25, atk: .1 }); N({ ft: 'bandpass', f0: 2000, f1: 300, dur: .5, vol: .1, q: 2, rev: .5 }); break;
      case 'static': N({ ft: 'highpass', f0: 6000, dur: .05, vol: .08 }); Tn({ f0: 3000 * r, f1: 1500, dur: .05, vol: .02, type: 'triangle' }); break;
      case 'drone': Tn({ f0: 1500 * r, f1: 900, dur: .04, vol: .03, type: 'triangle' }); break;
      case 'menu': Tn({ f0: 660 * p, dur: .05, vol: .05, type: 'triangle', rev: .3 }); break;
      case 'menuOk': [523, 784, 1047].forEach((f, i) => Tn({ f0: f, dur: .3, vol: .06, rev: .6, delay: i * .04, type: 'triangle' })); break;
      case 'spawnIn': N({ ft: 'bandpass', f0: 300, f1: 3200, dur: .5, vol: .06, atk: .35, q: 3 }); [1568, 2093].forEach((f, i) => Tn({ f0: f * r, dur: .3, vol: .015, delay: .3 + i * .05, rev: .8, type: 'triangle' })); break;
      case 'spawnHit': Tn({ f0: 180 * r, f1: 50, dur: .15, vol: .2 }); N({ ft: 'highpass', f0: 2500, dur: .05, vol: .06 }); break;
      case 'shop': [1319, 1568, 2093].forEach((f, i) => Tn({ f0: f, dur: .25, vol: .05, delay: i * .05, rev: .5 })); N({ ft: 'highpass', f0: 5000, dur: .1, vol: .05 }); break;
      case 'dread': Tn({ f0: 62 * p, f1: 31, dur: 2.6, vol: .7 * v, atk: .4, glide: 2.4 }); Tn({ f0: 65.4 * p, f1: 33, dur: 2.6, vol: .45 * v, atk: .5, type: 'triangle', lp: 260, glide: 2.4 });
        [155.6, 164.8, 233.1].forEach((f, i) => Tn({ f0: f * p, f1: f * p * .94, dur: 2.2, vol: .045 * v, rev: 1, atk: .6, delay: .15 + i * .12, type: 'triangle', lp: 900 }));
        N({ f0: 300, f1: 60, dur: 2.4, vol: .3 * v, atk: .8, rev: .8 }); N({ ft: 'bandpass', f0: 1800, f1: 400, dur: .5, vol: .12 * v, q: 6, delay: .05 });
        for (let i = 0; i < 4; i++) { Tn({ f0: 55, f1: 38, dur: .14, vol: .5 * v, delay: .5 + i * .62 }); Tn({ f0: 52, f1: 36, dur: .14, vol: .38 * v, delay: .66 + i * .62 }); } break;
      case 'cursePick': Tn({ f0: 48, f1: 22, dur: 1.4, vol: .9 }); N({ f0: 1200, f1: 50, dur: 1.2, vol: .5 }); N({ ft: 'highpass', f0: 6000, dur: .04, vol: .3 });
        [138.6, 146.8, 207.7, 220].forEach((f, i) => Tn({ f0: f, dur: 1.8, vol: .05, rev: 1, delay: .05 + i * .03, type: 'triangle', lp: 1200 })); break;
      case 'curse': Tn({ f0: 98, f1: 49, dur: 1.2, vol: .4, type: 'triangle', lp: 600 }); [233, 277, 311].forEach((f, i) => Tn({ f0: f, dur: 1, vol: .04, rev: 1, delay: i * .1, type: 'triangle' })); break;
      case 'forge': Tn({ f0: 1760 * r, dur: .5, vol: .06, rev: .8, type: 'triangle' }); Tn({ f0: 2637, dur: .4, vol: .03, rev: .8 }); N({ ft: 'bandpass', f0: 3000, dur: .1, vol: .2, q: 4 }); Tn({ f0: 90, f1: 40, dur: .2, vol: .4 }); break;
      case 'revive': [262, 392, 523, 784, 1047].forEach((f, i) => Tn({ f0: f, dur: 1.2, vol: .07, rev: 1, delay: i * .08, type: 'triangle' })); N({ f0: 300, f1: 5000, dur: 1, vol: .2, atk: .3 }); break;
    }
  },
  // ===== music: one theme per floor and one per boss (soft synth pads, plucked arps, sine leads, gentle drums) =====
  // patterns are 16 sixteenth-steps per bar; digits/letters are scale degrees ('.' = rest, a=10 ... e=14)
  // floors play pad + sparse arp + lead while exploring, and add bass + drums once a fight starts; boss themes always play in full
  musicOn: false, cur: null,
  startDrone() { this.musicOn = true; },
  setRoot(mult) { this.rootMul = mult; },
  setMode(m) { this.mode = m; },
  // the title screen draws one of five themes each time it is entered (never the same one twice in a row)
  // the title screen: one of the heavy scores (h0-h2), never the same twice in a row (the old light themes m0-m4 are kept but unused)
  menuSong: 'h0', pickMenuSong() { let i, n = 0; do i = Math.floor(Math.random() * 3); while (i === this.lastMenu && ++n < 9); this.lastMenu = i; this.menuSong = 'h' + i; },
  trackId() {
    if (typeof G === 'undefined' || !G || !G.p || G.state === 'menu' || G.state === 'launch' || G.state === 'intro') return this.menuSong || 'm0';
    if (this.mode === 'boss' && G.boss && !G.boss.dead) return G.boss.def.song || (G.boss.def.base && G.boss.def.base.song) || 'b' + (G.boss.def.form === 2 ? 5 : G.floor);
    return 'f' + G.floor;
  },
  schedule() {
    const c = this.ctx; if (!c || !this.musicOn) return;
    const id = this.trackId(); if (id !== this.cur) { this.cur = id; this.musicStep = 0; this.nextT = Math.max(this.nextT, c.currentTime + .05); }
    const S = SONGS[id], pc = ch => { if (!ch || ch === '.') return null; const v = parseInt(ch, 16); return isNaN(v) ? null : v; };
    if (S.heavy) { this.heavy(S); return; }
    if (S.grim) { this.grim(S); return; }
    const sp = 60 / S.bpm / 4;
    if (this.nextT < c.currentTime - .25) this.nextT = c.currentTime + .05;
    while (this.nextT < c.currentTime + .15) {
      const t = this.nextT, s = this.musicStep++, d = t - c.currentTime, st = s % 16, bar = (s >> 4) % 4, full = !!S.boss || !!S.soft || this.mode !== 'calm';
      const deg = S.prog[bar % S.prog.length], n = S.sc.length, nf = g => S.root * Math.pow(2, (S.sc[((g % n) + n) % n] + 12 * Math.floor(g / n)) / 12);
      // pad: a soft triad held for the whole bar
      if (st === 0) for (const k of [0, 2, 4]) this.tone({ f0: nf(deg + k), dur: sp * 15, atk: .4, vol: S.pv || .016, type: 'triangle', lp: S.plp || 1100, dest: this.mus, rev: .6, delay: d });
      // arpeggio (only on the beat while exploring)
      const a = pc(S.arp[st]); if (a !== null && (full || st % 4 === 0)) this.tone({ f0: nf(deg + a) * 2, dur: S.ad || .22, vol: full ? (S.av || .026) : .02, type: S.at || 'triangle', lp: S.alp || 2600, dest: this.mus, rev: .45, delay: d, atk: .004 });
      // lead melody across the 4-bar phrase
      const l = pc(S.lead[bar * 16 + st]); if (l !== null) this.tone({ f0: nf(l) * 2, dur: sp * (S.ld || 6), vol: full ? (S.lv || .038) : .028, type: S.lt || 'sine', lp: 3200, dest: this.mus, rev: .75, delay: d, atk: S.la || .02 });
      if (full) {
        const b = pc(S.bass[st]); if (b !== null) this.tone({ f0: nf(deg + b) / 2, dur: sp * (S.bd || 1.6), vol: S.bv || .09, type: 'triangle', lp: S.blp || 420, dest: this.mus, delay: d, atk: .006 });
        if (S.k[st] === 'x') this.tone({ f0: 150, f1: 48, glide: .07, dur: .12, vol: S.kv || .17, dest: this.mus, delay: d });
        if (S.h[st] === 'x') this.noise({ ft: 'highpass', f0: S.hf || 7500, dur: .035, vol: S.hv || .024, dest: this.mus, delay: d });
        if (S.s[st] === 'x') { this.noise({ ft: 'bandpass', f0: 1900, f1: 800, dur: .13, vol: S.sv || .055, q: .9, dest: this.mus, delay: d, rev: .25 }); this.tone({ f0: 190, f1: 120, dur: .05, vol: .04, type: 'triangle', dest: this.mus, delay: d }); }
      }
      this.nextT += sp;
    }
  }
};
// ---- the heavy title scores: no beat, no melody to hum; a low drone that never resolves, a slow heartbeat, a few low piano notes
// left to ring in a large room, strings swelling in minor, wind, metal scraping somewhere far away, a bell tolling every so often ----
AU.heavy = function (S) {
  const c = this.ctx, sp = 60 / S.bpm / 4, n = S.sc.length, nf = g => S.root * Math.pow(2, (S.sc[((g % n) + n) % n] + 12 * Math.floor(g / n)) / 12);
  if (this.nextT < c.currentTime - .25) this.nextT = c.currentTime + .05;
  while (this.nextT < c.currentTime + .15) {
    const t = this.nextT, s = this.musicStep++, d = t - c.currentTime, st = s % 16, bar = s >> 4, M = this.mus;
    if (st === 0 && bar % 2 === 0) { const deg = S.prog[(bar >> 1) % S.prog.length], f = nf(deg) / 2; // the drone: two detuned saws and a fifth, low-passed hard
      for (const [mul, det] of [[1, -7], [1, 6], [1.5, 0]]) this.tone({ f0: f * mul, dur: sp * 32, atk: 2.4, vol: mul === 1 ? .03 : .016, type: 'sawtooth', lp: S.dlp || 240, q: 1.4, detune: det, dest: M, rev: .5, delay: d });
      if (S.sub) this.tone({ f0: f / 2, dur: sp * 32, atk: 3, vol: .05, type: 'sine', dest: M, delay: d }); }
    if (st === 0 && bar % 4 === 1) { const deg = S.prog[(bar >> 1) % S.prog.length]; for (const k of [0, 2, 4]) this.tone({ f0: nf(deg + k), dur: sp * 56, atk: 3.6, vol: .012, type: 'triangle', lp: 760, dest: M, rev: .9, delay: d }); } // strings, minor
    if (st === 0 || st === 3) this.tone({ f0: st ? 50 : 58, f1: 36, glide: .2, dur: .42, vol: st ? .09 : .15, dest: M, delay: d, atk: .01 }); // the heartbeat
    if ((st === 0 || st === 6 || st === 10) && Math.random() < S.pp) { const g = S.notes[Math.floor(Math.random() * S.notes.length)], f = nf(g);  // a piano note, left to ring
      this.tone({ f0: f, dur: 3.4, atk: .004, vol: .05, type: 'sine', dest: M, rev: 1, delay: d }); this.tone({ f0: f * 2, dur: 1.6, atk: .004, vol: .014, type: 'triangle', lp: 1800, dest: M, rev: 1, delay: d }); this.tone({ f0: f * 3.01, dur: .5, atk: .002, vol: .006, type: 'sine', dest: M, rev: 1, delay: d }); }
    if (st === 8 && bar % 8 === 5) this.noise({ ft: 'bandpass', f0: 1500, f1: 520, q: 14, dur: 2.6, atk: .5, vol: .05, dest: M, rev: 1, delay: d }); // metal, far away
    if (st === 0) this.noise({ ft: 'lowpass', f0: 220 + Math.random() * 200, f1: 520 + Math.random() * 400, q: .8, dur: sp * 15, atk: 1.2, vol: .022, dest: M, rev: .4, delay: d, rate: .5 }); // wind
    if (st === 0 && bar % 8 === 0) { const f = nf(0) * 2; this.tone({ f0: f, dur: 5, atk: .003, vol: .035, type: 'sine', dest: M, rev: 1, delay: d }); this.tone({ f0: f * 2.76, dur: 2.4, atk: .003, vol: .012, type: 'sine', dest: M, rev: 1, delay: d }); this.tone({ f0: f * 5.4, dur: 1, atk: .002, vol: .005, type: 'sine', dest: M, rev: 1, delay: d }); } // the bell
    this.nextT += sp;
  }
};
const SC = { aeo: [0, 2, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], phr: [0, 1, 3, 5, 7, 8, 10], hmin: [0, 2, 3, 5, 7, 8, 11], lyd: [0, 2, 4, 6, 7, 9, 11], loc: [0, 1, 3, 5, 6, 8, 10] };
const SONGS = {
  // ---- the title screen: three heavy scores ----
  // I. ASHFALL: D phrygian, the drone sinks a half step
  h0: { heavy: 1, bpm: 46, root: 146.8, sc: [0, 1, 3, 5, 7, 8, 10], prog: [0, 0, 1, 0, 5, 4], notes: [0, 1, 3, 4, -2, 7, 8], pp: .3, sub: 1, dlp: 230 },
  // II. THE LAST LIGHT: C minor, a little warmer, the piano speaks more
  h1: { heavy: 1, bpm: 50, root: 130.8, sc: [0, 2, 3, 5, 7, 8, 11], prog: [0, 5, 3, 4], notes: [0, 2, 4, 7, 9, -3, 6], pp: .42, sub: 1, dlp: 280 },
  // III. CONTAINMENT: B locrian, almost nothing moves
  h2: { heavy: 1, bpm: 40, root: 123.5, sc: [0, 1, 3, 5, 6, 8, 10], prog: [0, 4, 0, 1], notes: [0, 1, 4, 7, 8], pp: .22, sub: 1, dlp: 200 },
  // ---- title screen: five themes, one picked at random on every visit ----
  // I. DRIFT: a slow, open lydian drift
  m0: { bpm: 70, root: 220, sc: SC.lyd, prog: [0, 4, 5, 1], pv: .014,
    arp: '0...4...7...4...', lead: '................7.......9.......b...........9...........7.......', bass: '................', k: '................', h: '................', s: '................' },
  // II. MUSIC BOX: a sine-bell lullaby in G dorian
  m1: { bpm: 64, root: 196, sc: SC.dor, prog: [0, 3, 0, 4], at: 'sine', ad: .35, av: .03, pv: .012,
    arp: '0...4...7...9...', lead: '9.......7.......5...4...........4.......5.......7...........0...', bass: '................', k: '................', h: '................', s: '................' },
  // III. PRISM: a gentle heartbeat under a bright F lydian figure
  m2: { soft: 1, bpm: 84, root: 174.6, sc: SC.lyd, prog: [0, 4, 3, 4], pv: .012, av: .018, lv: .03, bv: .05, kv: .07, hv: .008, sv: .02,
    arp: '0.4.7.4.0.4.7.4.', lead: '7.......9...7...4.......2.......4...7...9...b...9.......7.......', bass: '0.......4.......', k: 'x.......x.......', h: '....x.......x...', s: '................' },
  // IV. GRAY RAIN: a sparse, long-breathed E minor
  m3: { bpm: 58, root: 164.8, sc: SC.aeo, prog: [0, 5, 3, 4], plp: 900, ld: 12, la: .08, pv: .015,
    arp: '0.......4.......', lead: '4...............3.......2.......0...............2.......4.......', bass: '................', k: '................', h: '................', s: '................' },
  // V. AFTERGLOW: a soft walking pulse in D dorian
  m4: { soft: 1, bpm: 92, root: 146.8, sc: SC.dor, prog: [0, 6, 5, 3], at: 'sine', ad: .16, av: .016, bv: .055, kv: .06, hv: .007, sv: .018, lv: .028,
    arp: '0.2.4.7.4.2.0.2.', lead: '................7...9...a...9...7.......4.......5...4...2.......', bass: '0...0.......4...', k: 'x.......x.......', h: '..x...x...x...x.', s: '................' },
  // 1 ASH: grey, wistful A minor
  f0: { bpm: 78, root: 220, sc: SC.aeo, prog: [0, 5, 2, 6],
    bass: '0.......4.......', arp: '0.2.4.2.0.2.4.7.', lead: '4...3...2...........0...........2...4...5...4...2...1...........',
    k: 'x.......x.......', h: '....x.......x...', s: '................' },
  // 2 STATIC: busy, syncopated D dorian
  f1: { bpm: 100, root: 146.8, sc: SC.dor, prog: [0, 3, 0, 4], at: 'sine', ad: .14,
    bass: '0..0..0...0.3...', arp: '0.4.7.4.2.4.7.9.', lead: '7.6.4...........4.6.7.9.7.......7.6.4...2.......0...............',
    k: 'x...x...x...x...', h: '..x...x...x...xx', s: '....x.......x...' },
  // 3 HOLLOW: sparse, echoing E phrygian
  f2: { bpm: 72, root: 164.8, sc: SC.phr, prog: [0, 1, 0, 6], ld: 10, la: .06,
    bass: '0.......0...1...', arp: '0...4...7...4...', lead: '7.......8.......7...4...........7.......8...9...8...7...........',
    k: 'x.........x.....', h: '........x.......', s: '................' },
  // 4 VEIL: veiled C# harmonic minor
  f3: { bpm: 86, root: 138.6, sc: SC.hmin, prog: [0, 3, 4, 0], lt: 'triangle', lv: .03,
    bass: '0...0.4.0...0.4.', arp: '0.2.4.6.4.2.0.2.', lead: '4...5...6...4...7.......6.......4...5...4...3...2...........0...',
    k: 'x.......x...x...', h: '..x...x...x...x.', s: '....x.......x...' },
  // 5 CORE: rising, luminous F lydian
  f4: { bpm: 104, root: 174.6, sc: SC.lyd, prog: [0, 1, 5, 4],
    bass: '0.0...0.0...0.4.', arp: '0.4.7.b.7.4.0.4.', lead: '7.8.9...b.......9.8.7...........7.8.9...b...c...b.9.............',
    k: 'x...x...x...x...', h: '.x.x.x.x.x.x.x.x', s: '....x.......x...', hv: .018 },
  // boss 1 MONOLITH: heavy, pounding D minor
  b0: { boss: 1, bpm: 112, root: 146.8, sc: SC.aeo, prog: [0, 0, 5, 6], bv: .11, kv: .2,
    bass: '0.0.0.0.0.0.3.4.', arp: '7...7...7...6...', lead: '7.......6...5...4...............7.......8...9...8...............',
    k: 'x.......x.x.....', h: '..x...x...x...x.', s: '....x.......x...' },
  // boss 2 HOLLOW CROWN: regal, galloping G harmonic minor
  b1: { boss: 1, bpm: 134, root: 196, sc: SC.hmin, prog: [0, 5, 3, 4], ad: .12, av: .022,
    bass: '0.0.4.0.0.0.4.6.', arp: '0247424702474247', lead: '7...9...a...b...a.......9.......7...6...4...6...7...............',
    k: 'x...x...x...x...', h: '.xx..xx..xx..xx.', s: '....x.......x..x' },
  // boss 3 ERASER: staccato, glitchy Bb phrygian
  b2: { boss: 1, bpm: 122, root: 116.5, sc: SC.phr, prog: [0, 1, 0, 5], at: 'sine', ad: .1, hf: 9000,
    bass: '0..0..0.0..0..1.', arp: '7.....7...7.....', lead: '7.8.7.......4...5.4.3.......0...7.8.9.......8...7...............',
    k: 'x..x..x...x..x..', h: 'x.x.x.x.x.x.x.x.', s: '....x.......x...' },
  // boss 4 ARBITER: a measured march in C minor
  b3: { boss: 1, bpm: 118, root: 130.8, sc: SC.aeo, prog: [0, 3, 4, 0], lt: 'triangle',
    bass: '0...0...4...4...', arp: '0.0.4.4.7.7.4.4.', lead: '7.......7...9...a.......9.......7...6...5...4...4...............',
    k: 'x.......x.......', h: '..x...x...x...x.', s: '....x.x.....x.xx' },
  // boss 5 ABSENCE: dark, restless F# locrian
  b4: { boss: 1, bpm: 140, root: 185, sc: SC.loc, prog: [0, 4, 1, 0], plp: 800,
    bass: '0.0.0.00.0.0.1.1', arp: '0.3.6.3.0.3.6.9.', lead: '7...8...........a.......8.......7...8...a...b...a.......7.......',
    k: 'x...x...x...x...', h: '.x.x.x.x.x.x.x.x', s: '....x.......x...' },
  // alt boss 1 THE KILN: a slow, smouldering A phrygian stomp
  b6: { boss: 1, bpm: 104, root: 110, sc: SC.phr, prog: [0, 1, 0, 6], bv: .1, kv: .19, lt: 'triangle',
    bass: '0.0...0.1...0.0.', arp: '0...1...4...1...', lead: '4.......5...4...1...........0...4...5...7...5...4...............',
    k: 'x.....x.x.......', h: '....x.......x...', s: '....x.......x...' },
  // alt boss 2 THE DYNAMO: a buzzing, driving C# dorian pulse
  b7: { boss: 1, bpm: 138, root: 138.6, sc: SC.dor, prog: [0, 3, 5, 4], at: 'sine', ad: .08, av: .02, hf: 9500,
    bass: '0000000000000003', arp: '0707070709090909', lead: '7.9.a.9.7.......5.7.9.7.5.......4.5.7.5.4.......7.9.a.c.a.9.....',
    k: 'x...x...x...x...', h: 'xxxxxxxxxxxxxxxx', s: '....x.......x..x', hv: .014 },
  // alt boss 3 THE CHASM: a hollow, echoing B locrian
  b8: { boss: 1, bpm: 96, root: 123.5, sc: SC.loc, prog: [0, 1, 4, 0], plp: 700, ld: 9, la: .05,
    bass: '0.......0.0.....', arp: '0...3...6...3...', lead: '7...........6...4...........3...7...8.......7...6...............',
    k: 'x.......x.x.....', h: '..x.....x.......', s: '........x.......' },
  // alt boss 4 THE CODEX: a stern, clockwork G minor march
  b9: { boss: 1, bpm: 124, root: 98, sc: SC.hmin, prog: [0, 4, 5, 4], lt: 'triangle', ad: .1,
    bass: '0.0.4.4.0.0.4.6.', arp: '0.4.0.4.0.4.0.4.', lead: '7...7...6...4...6.......4.......2...4...6...7...6...4...........',
    k: 'x...x...x...x...', h: '..x...x...x...x.', s: '....x.x.....x.x.' },
  // alt boss 5 THE PALE: a cold, sparse and wide D aeolian
  b10: { boss: 1, bpm: 132, root: 146.8, sc: SC.aeo, prog: [0, 5, 6, 4], plp: 900, av: .018, lv: .034,
    bass: '0...0...0...0.6.', arp: '0.7.4.7.0.7.4.9.', lead: '................b.......9.......7...9...b...c...b.......9.......',
    k: 'x.......x...x...', h: '.x.x.x.x.x.x.x.x', s: '....x.......x...' },
  // final form RECOMPOSED: bright, prismatic and fast E dorian
  b5: { boss: 1, bpm: 152, root: 164.8, sc: SC.dor, prog: [0, 6, 5, 6], ad: .1, av: .022, hv: .016,
    bass: '0.0.0.0.0.0.0.4.', arp: '0479479b0479479b', lead: '7.9.b.9.c.b.9...b.9.7.......4...7.9.b.9.c.b.c.e.c...............',
    k: 'x...x...x...x...', h: 'xxxxxxxxxxxxxxxx', s: '....x.......x...' },
};
AU.pickMenuSong();

// ===== the run's score: dread while exploring, industrial weight once a fight starts; bosses play it all, faster, with a siren =====
AU.distBus = function () {
  if (this.dbus) return this.dbus; const c = this.ctx, ws = c.createWaveShaper(), n = 1024, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; cv[i] = Math.tanh(x * 4) * .9; } ws.curve = cv; ws.oversample = '2x';
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const g = c.createGain(); g.gain.value = .55; ws.connect(lp); lp.connect(g); g.connect(this.mus); return this.dbus = ws;
};
AU.grim = function (S) {
  const c = this.ctx, sp = 60 / S.bpm / 4, n = S.sc.length, nf = g => S.root * Math.pow(2, (S.sc[((g % n) + n) % n] + 12 * Math.floor(g / n)) / 12), M = this.mus, D = this.distBus();
  if (this.nextT < c.currentTime - .25) this.nextT = c.currentTime + .05;
  while (this.nextT < c.currentTime + .15) {
    const t = this.nextT, s = this.musicStep++, d = t - c.currentTime, st = s % 16, bar = s >> 4, deg = S.prog[bar % S.prog.length], full = !!S.boss || this.mode !== 'calm', on = p => !!p && p[st] === 'x';
    // always: a low drone, wind, the odd crackle of a counter, metal somewhere far away
    if (st === 0 && bar % 2 === 0) { const f = nf(deg) / 2; for (const [mul, det] of [[1, -6], [1, 7], [1.5, 0]]) this.tone({ f0: f * mul, dur: sp * 32, atk: 1.6, vol: (mul === 1 ? .026 : .013) * (full ? .7 : 1), type: 'sawtooth', lp: S.dlp || 260, q: 1.2, detune: det, dest: M, rev: .5, delay: d }); }
    if (st === 0) this.noise({ ft: 'lowpass', f0: 200 + Math.random() * 200, f1: 500 + Math.random() * 300, q: .8, dur: sp * 15, atk: 1, vol: .016, dest: M, rev: .4, delay: d, rate: .5 });
    if (Math.random() < (S.geiger || .04)) this.noise({ ft: 'highpass', f0: 5000, dur: .006, vol: .05, dest: M, delay: d });
    if (st === 8 && bar % 4 === 3) this.noise({ ft: 'bandpass', f0: 1400 + Math.random() * 600, f1: 500, q: 14, dur: 2, atk: .4, vol: .035, dest: M, rev: 1, delay: d });
    if (S.hum && st % 4 === 0) this.tone({ f0: 50, dur: sp * 4, atk: .01, vol: .012, type: 'sawtooth', lp: 180, dest: M, delay: d });
    if (S.drip && Math.random() < .04) this.tone({ f0: 900 + Math.random() * 700, f1: 300, dur: .08, vol: .02, type: 'sine', dest: M, rev: .9, delay: d });
    if (!full) { // exploring: a note and its minor second now and then, a distant thump
      if ((st === 0 || st === 8) && Math.random() < .25) { const g = S.notes[(Math.random() * S.notes.length) | 0], f = nf(deg + g); this.tone({ f0: f, dur: 3, atk: .004, vol: .035, type: 'sine', dest: M, rev: 1, delay: d }); this.tone({ f0: f * 1.059, dur: 2, atk: .004, vol: .012, type: 'sine', dest: M, rev: 1, delay: d + .02 }); }
      if (st === 0 && bar % 2 === 1) this.tone({ f0: 70, f1: 38, glide: .3, dur: .7, vol: .09, dest: M, rev: .8, delay: d });
    } else { // fighting: distorted kick, a clank for a snare, scraping hats, a saw ostinato, dissonant stabs
      if (on(S.k)) { this.tone({ f0: 130, f1: 38, glide: .09, dur: .16, vol: S.kv || .2, dest: M, delay: d }); if (st === 0) this.tone({ f0: 70, f1: 30, glide: .12, dur: .2, vol: .1, dest: D, delay: d }); }
      if (on(S.s)) { this.noise({ ft: 'bandpass', f0: 1800, f1: 900, dur: .14, vol: S.sv || .07, q: 2.5, dest: M, delay: d, rev: .3 }); this.tone({ f0: 333, dur: .07, vol: .03, type: 'square', lp: 2400, dest: D, delay: d }); this.tone({ f0: 471, dur: .05, vol: .02, type: 'square', lp: 2400, dest: D, delay: d }); }
      if (on(S.h)) this.noise({ ft: 'highpass', f0: S.hf || 6000, dur: .03, vol: S.hv || .02, dest: M, delay: d });
      const r = S.riff ? S.riff[st] : '.'; if (r && r !== '.') this.tone({ f0: nf(deg + parseInt(r, 16)) / 2, dur: sp * 1.4, atk: .004, vol: S.bv || .05, type: 'sawtooth', lp: S.blp || 700, q: 2, dest: D, delay: d });
      if (on(S.stab)) for (const k2 of [0, 1, 6]) this.tone({ f0: nf(deg) * Math.pow(2, k2 / 12), dur: sp * 2, atk: .01, vol: .016, type: 'sawtooth', lp: 1400, dest: D, delay: d, rev: .3 });
      if (S.boss && st === 0 && bar % 4 === 0) this.tone({ f0: 440, f1: 660, glide: sp * 16, dur: sp * 16, atk: .3, vol: .012, type: 'triangle', dest: M, rev: .8, delay: d }); // a siren
      if (S.boss && bar % 4 === 3 && st >= 12) this.tone({ f0: 160 - (st - 12) * 22, f1: 60, glide: .1, dur: .18, vol: .14, dest: M, delay: d }); // a tom fill
    }
    this.nextT += sp;
  }
};
const GM = o => Object.assign({ grim: 1, notes: [0, 1, 3, 4, 7] }, o), GB = o => GM(Object.assign({ boss: 1, kv: .22, bv: .055 }, o));
Object.assign(SONGS, {
  // the five floors: RUINS (ash), BLACKOUT (a hum in the walls), CULTURE LEVEL (dripping), QUARANTINE FOG (thin), CORE LAB (the counter never stops)
  f0: GM({ bpm: 84, root: 110, sc: SC.phr, prog: [0, 0, 1, 0], riff: '0..0..0.0..1..0.', k: 'x.....x...x.....', s: '....x.......x...', h: '..x...x...x...x.' }),
  f1: GM({ bpm: 96, root: 98, sc: SC.loc, prog: [0, 1, 0, 4], riff: '0.0.3.0.0.0.1.0.', k: 'x..x..x...x..x..', s: '....x..x....x...', h: 'x.x.x.x.x.x.x.x.', hum: 1, geiger: .03 }),
  f2: GM({ bpm: 70, root: 92.5, sc: SC.phr, prog: [0, 1, 4, 1], riff: '0...0...1...0.4.', k: 'x.......x..x....', s: '........x.......', h: '..x...x...x...x.', drip: 1 }),
  f3: GM({ bpm: 76, root: 82.4, sc: SC.hmin, prog: [0, 4, 5, 4], riff: '0..0..4..0..5...', k: 'x...x...x...x...', s: '....x.......x..x', dlp: 200 }),
  f4: GM({ bpm: 104, root: 103.8, sc: SC.loc, prog: [0, 1, 6, 4], riff: '0.0.0.1.0.0.6.4.', k: 'x.x...x.x.x...x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', stab: 'x.........x.....', geiger: .09 }),
  // the bosses
  b0: GB({ bpm: 120, root: 82.4, sc: SC.phr, prog: [0, 0, 1, 0], riff: '00.0.00.0.1.0.0.', k: 'x.x...x.x.x...x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', stab: 'x.......x.......' }),
  b1: GB({ bpm: 132, root: 98, sc: SC.hmin, prog: [0, 5, 3, 4], riff: '0.0.4.0.0.3.0.1.', k: 'x..x..x..x..x...', s: '....x.......x.x.', h: 'x.x.x.x.x.x.x.x.', stab: 'x.....x.........' }),
  b2: GB({ bpm: 112, root: 73.4, sc: SC.loc, prog: [0, 1, 0, 4], riff: '0...0.1.0...4.1.', k: 'x.....x...x.....', s: '....x.......x...', h: '..x...x...x...x.', stab: 'x...........x...', geiger: .1 }),
  b3: GB({ bpm: 128, root: 87.3, sc: SC.aeo, prog: [0, 3, 4, 0], riff: '0.0.0.3.0.0.4.3.', k: 'x.x.x.x.x.x.x.x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', stab: 'x.......x...x...' }),
  b4: GB({ bpm: 140, root: 92.5, sc: SC.loc, prog: [0, 4, 1, 0], riff: '00.00.10.00.40.1', k: 'x.xx..x.x.xx..x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', stab: 'x...x.......x...' }),
  b5: GB({ bpm: 152, root: 82.4, sc: SC.loc, prog: [0, 6, 5, 6], riff: '0.00.0.10.00.6.5', k: 'xxx.x.x.xxx.x.x.', s: '....x.......x.x.', h: 'xxxxxxxxxxxxxxxx', stab: 'x..x....x..x....', geiger: .12 }),
  b6: GB({ bpm: 116, root: 73.4, sc: SC.phr, prog: [0, 1, 0, 6], riff: '0.0..0.1.0..6.0.', k: 'x...x.x...x.x...', s: '....x.......x...', h: '..x...x...x...x.', stab: 'x.......x.......' }),
  b7: GB({ bpm: 138, root: 92.5, sc: SC.loc, prog: [0, 3, 5, 4], riff: '0.0.0.0.3.3.5.4.', k: 'x.x.x.x.x.x.x.x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', stab: 'x.....x.....x...', hum: 1 }),
  b8: GB({ bpm: 104, root: 61.7, sc: SC.loc, prog: [0, 1, 4, 0], riff: '0.......0...1.4.', k: 'x.......x.x.....', s: '........x.......', h: '..x...x...x...x.', stab: 'x...............', drip: 1 }),
  b9: GB({ bpm: 124, root: 98, sc: SC.hmin, prog: [0, 4, 5, 4], riff: '0.4.0.4.0.5.0.4.', k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', stab: '..x...x...x...x.' }),
  b10: GB({ bpm: 132, root: 73.4, sc: SC.aeo, prog: [0, 5, 6, 4], riff: '0.0.5.0.0.6.0.4.', k: 'x.x...x.x.x...x.', s: '....x.......x.x.', h: 'xxxxxxxxxxxxxxxx', stab: 'x.......x.......', geiger: .12 }),
});
// ===== the sounds of the run, grim: metal, glass, wet flesh and a heartbeat instead of chimes =====
const GRIM_SFX = {
  ui: (p, v, r, N, T) => { T({ f0: 420 * p, dur: .03, vol: .04, type: 'square', lp: 1200 }); N({ ft: 'highpass', f0: 4000, dur: .008, vol: .04 }); },
  menu: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 1800 * p, dur: .02, vol: .07, q: 6 }); T({ f0: 180 * p, f1: 120, dur: .05, vol: .06, type: 'triangle' }); },
  menuOk: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 2600, dur: .03, vol: .18, q: 8 }); T({ f0: 140, f1: 60, dur: .15, vol: .3 }); T({ f0: 110, dur: .5, vol: .03, type: 'triangle', rev: .6, lp: 600 }); },
  pickup: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 1200, f1: 3000, dur: .06, vol: .2, q: 4 }); N({ ft: 'bandpass', f0: 2400, dur: .03, vol: .2, q: 8, delay: .08 }); T({ f0: 110, f1: 55, dur: .1, vol: .3, delay: .08 }); },
  ink: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 4000 * p * r, dur: .015, vol: .05, q: 10 }); T({ f0: 1200 * p * r, dur: .02, vol: .012, type: 'square', lp: 3000 }); },
  card: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 700, f1: 260, dur: .45, vol: .07, q: 5 }); T({ f0: 58, f1: 36, glide: .2, dur: .3, vol: .35 }); T({ f0: 52, f1: 34, glide: .2, dur: .3, vol: .25, delay: .22 }); N({ ft: 'highpass', f0: 6000, dur: .04, vol: .06 }); T({ f0: 1760, dur: .5, vol: .015, rev: .9 }); },
  select: (p, v, r, N, T) => { N({ ft: 'highpass', f0: 3000, f1: 8000, dur: .25, vol: .12, atk: .05 }); T({ f0: 90, f1: 40, dur: .4, vol: .45 }); [196, 207.6].forEach(f => T({ f0: f * p, dur: 1, vol: .04, type: 'triangle', rev: 1, lp: 900 })); },
  clear: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 600, f1: 200, dur: .4, vol: .15, q: 2 }); T({ f0: 82, f1: 55, dur: .8, vol: .25, type: 'triangle', lp: 400 }); T({ f0: 98, dur: 1.2, vol: .03, type: 'triangle', rev: 1 }); },
  floorClear: (p, v, r, N, T) => { T({ f0: 55, f1: 52, dur: 2.2, atk: .3, vol: .35, type: 'sawtooth', lp: 300 }); T({ f0: 82.4, dur: 2, atk: .4, vol: .16, type: 'sawtooth', lp: 400, detune: 8 }); N({ ft: 'lowpass', f0: 300, f1: 80, dur: 2, vol: .2, rev: .8 }); },
  key: (p, v, r, N, T) => { [3500, 4200, 3800].forEach((f, i) => N({ ft: 'bandpass', f0: f, dur: .04, vol: .1, q: 12, delay: i * .055 })); T({ f0: 1318, dur: .3, vol: .02, rev: .6 }); },
  unlock: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 1500, dur: .05, vol: .3, q: 6 }); T({ f0: 160, f1: 50, dur: .3, vol: .5 }); N({ ft: 'lowpass', f0: 800, f1: 100, dur: .6, vol: .25, delay: .05 }); },
  heal: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 900, dur: .15, vol: .1, q: 3 }); T({ f0: 196, dur: .6, vol: .05, type: 'triangle', rev: .6 }); T({ f0: 233, dur: .6, vol: .03, type: 'triangle', rev: .6, delay: .1 }); },
  shop: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 2200, dur: .06, vol: .2, q: 5 }); N({ ft: 'bandpass', f0: 3100, dur: .04, vol: .12, q: 7, delay: .07 }); T({ f0: 220, f1: 110, dur: .08, vol: .15 }); },
  win: (p, v, r, N, T) => { [98, 147, 196, 233].forEach((f, i) => T({ f0: f, dur: 3, vol: .05, type: 'triangle', rev: 1, lp: 1200, atk: .4, delay: i * .1 })); T({ f0: 392, dur: 4, vol: .05, rev: 1, delay: .6 }); T({ f0: 392 * 2.76, dur: 2, vol: .015, rev: 1, delay: .6 }); },
  revive: (p, v, r, N, T) => { for (let i = 0; i < 3; i++) { T({ f0: 58, f1: 36, glide: .2, dur: .3, vol: .4, delay: i * .5 }); T({ f0: 52, f1: 34, glide: .2, dur: .3, vol: .3, delay: i * .5 + .18 }); } N({ ft: 'highpass', f0: 3000, f1: 8000, dur: .6, vol: .1, atk: .3, delay: 1.2 }); },
  fusionCharge: (p, v, r, N, T) => { T({ f0: 60, f1: 240, glide: 1.05, dur: 1.1, vol: .06, type: 'sawtooth', lp: 500 }); N({ ft: 'bandpass', f0: 200, f1: 1200, dur: 1.1, vol: .1, atk: .8, q: 6 }); [0, .35, .6, .8, .95].forEach(dl => T({ f0: 58, f1: 36, glide: .15, dur: .2, vol: .3, delay: dl })); },
  fusionHit: (p, v, r, N, T) => { T({ f0: 70, f1: 25, dur: .8, vol: .7 }); N({ ft: 'lowpass', f0: 3000, f1: 200, dur: .6, vol: .45 }); N({ ft: 'bandpass', f0: 400, dur: .3, vol: .2, q: 2 }); [146.8, 155.6, 207.7].forEach((f, i) => T({ f0: f * p, dur: 1.6, vol: .04, type: 'triangle', rev: 1, lp: 900, delay: i * .03 })); },
  orbOpen: (p, v, r, N, T) => { N({ ft: 'highpass', f0: 5000, dur: .05, vol: .3 }); N({ ft: 'bandpass', f0: 3000, f1: 1500, dur: .15, vol: .12, q: 10, delay: .03 }); T({ f0: 70, f1: 40, dur: .3, vol: .35 }); N({ ft: 'lowpass', f0: 800, f1: 150, dur: .4, vol: .2, delay: .05 }); },
  orbBurst: (p, v, r, N, T) => { N({ ft: 'lowpass', f0: 1500, f1: 120, dur: .35, vol: .3 }); T({ f0: 90, f1: 40, dur: .25, vol: .4 }); N({ ft: 'bandpass', f0: 500, dur: .2, vol: .15, q: 2, delay: .05 }); },
  chestOpen: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 300, f1: 700, dur: .4, vol: .15, q: 12 }); T({ f0: 120, f1: 60, dur: .2, vol: .3, delay: .35 }); },
  forge: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 2800, dur: .25, vol: .2, q: 12 }); T({ f0: 1200 * r, dur: .6, vol: .04, rev: .7 }); T({ f0: 1650 * r, dur: .4, vol: .025, rev: .7 }); T({ f0: 90, f1: 40, dur: .2, vol: .4 }); },
  kill: (p, v, r, N, T) => { N({ ft: 'lowpass', f0: 1200, f1: 150, dur: .09, vol: .35 * v }); T({ f0: 140 * r, f1: 45, dur: .09, vol: .45 * v, glide: .08 }); N({ ft: 'bandpass', f0: 900 * p, dur: .05, vol: .15 * v, q: 2 }); },
  hit: (p, v, r, N, T) => { T({ f0: 160 * p * r, f1: 60, dur: .05, vol: .18 * v }); N({ ft: 'bandpass', f0: 1100, dur: .03, vol: .12 * v, q: 1.5 }); },
  crit: (p, v, r, N, T) => { T({ f0: 120, f1: 40, dur: .12, vol: .4 * v }); N({ ft: 'bandpass', f0: 2000, dur: .05, vol: .2, q: 3 }); N({ ft: 'highpass', f0: 5000, dur: .02, vol: .12 }); },
  death: (p, v, r, N, T) => { T({ f0: 220, f1: 27, dur: 2.2, vol: .45, type: 'triangle', lp: 500 }); N({ ft: 'lowpass', f0: 1200, f1: 40, dur: 1.8, vol: .35, rev: .8 }); T({ f0: 880, dur: 2, vol: .025, delay: .5 }); },
  spawnIn: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 200, f1: 800, dur: .5, vol: .1, atk: .3, q: 8 }); T({ f0: 70 * r, f1: 110, dur: .4, vol: .08, type: 'sawtooth', lp: 300 }); },
  spawn: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 150, f1: 600, dur: .35, vol: .1, atk: .2, q: 6 }); },
  charged: (p, v, r, N, T) => { T({ f0: 220, dur: .25, vol: .06, type: 'sawtooth', lp: 900 }); N({ ft: 'highpass', f0: 4000, dur: .05, vol: .06 }); },
  skillReady: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 2400, dur: .04, vol: .12, q: 9 }); T({ f0: 440, dur: .2, vol: .03, type: 'triangle', lp: 1500 }); },
  chipGet: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 3000, dur: .04, vol: .12, q: 8 }); T({ f0: 330, f1: 165, dur: .12, vol: .1, type: 'square', lp: 1200 }); T({ f0: 110, f1: 55, dur: .15, vol: .2 }); },
  reloadDone: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 2600, dur: .025, vol: .22, q: 8 }); T({ f0: 180, f1: 90, dur: .06, vol: .25 }); N({ ft: 'bandpass', f0: 1800, dur: .02, vol: .15, q: 6, delay: .05 }); },
  reloadBg: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 2200, dur: .02, vol: .06, q: 8 }); },
  tpOn: (p, v, r, N, T) => { T({ f0: 55, dur: .6, vol: .3 }); N({ ft: 'bandpass', f0: 2000, f1: 300, dur: .4, vol: .15, q: 3 }); T({ f0: 110, f1: 55, dur: .4, vol: .05, type: 'sawtooth', lp: 400 }); },
  tpGo: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 400, f1: 3000, dur: .12, vol: .25, q: 2 }); T({ f0: 120, f1: 60, dur: .2, vol: .35 }); },
  dashOn: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 300, f1: 3000, dur: .3, vol: .2, q: 1.5 }); T({ f0: 110, f1: 55, dur: .3, vol: .3 }); },
  riskOff: (p, v, r, N, T) => { [98, 104].forEach(f => T({ f0: f, dur: .9, vol: .05, type: 'triangle', rev: 1 })); },
  soak: (p, v, r, N, T) => { T({ f0: 220, f1: 180, dur: .3, vol: .05, type: 'triangle' }); },
  inject: (p, v, r, N, T) => { N({ ft: 'highpass', f0: 6000, dur: .015, vol: .25 }); N({ ft: 'lowpass', f0: 900, f1: 200, dur: .1, vol: .22 }); T({ f0: 110, f1: 60, dur: .08, vol: .25 });
    N({ ft: 'bandpass', f0: 2800, f1: 1400, dur: .45, vol: .1, q: 3, atk: .08, delay: .14 }); N({ ft: 'lowpass', f0: 500, f1: 180, dur: .4, vol: .08, atk: .1, delay: .16 }); N({ ft: 'bandpass', f0: 2400, dur: .025, vol: .22, q: 8, delay: .6 }); T({ f0: 160, f1: 90, dur: .05, vol: .18, delay: .6 }); },
  deflect: (p, v, r, N, T) => { T({ f0: 1300 * r, dur: .15, vol: .06, type: 'triangle' }); T({ f0: 1840 * r, dur: .1, vol: .03 }); N({ ft: 'highpass', f0: 3000, dur: .03, vol: .1 }); },
};

// the last of the old bright sounds, made grim; and a few that were too quiet are lifted (GRIM_GAIN)
Object.assign(GRIM_SFX, {
  phase: (p, v, r, N, T) => { T({ f0: 55, f1: 30, dur: 1.2, vol: .7 }); N({ ft: 'lowpass', f0: 600, f1: 60, dur: 1.2, vol: .45 }); T({ f0: 70, f1: 55, dur: 1.4, vol: .18, type: 'sawtooth', lp: 300, atk: .1 }); N({ ft: 'bandpass', f0: 1800, f1: 900, dur: .9, vol: .08, q: 12, delay: .1, rev: .8 }); },
  limitOn: (p, v, r, N, T) => { T({ f0: 60, f1: 30, dur: .9, vol: .5 }); N({ ft: 'bandpass', f0: 3000, f1: 300, dur: .7, vol: .18, q: 2 }); T({ f0: 110, f1: 104, dur: 1.4, vol: .05, type: 'sawtooth', lp: 500, rev: 1, delay: .1 }); [0, .3, .5].forEach(d => T({ f0: 58, f1: 36, glide: .15, dur: .2, vol: .3, delay: d })); },
  limitOff: (p, v, r, N, T) => { T({ f0: 70, f1: 140, dur: .4, vol: .15, type: 'sawtooth', lp: 600 }); N({ ft: 'bandpass', f0: 300, f1: 2400, dur: .4, vol: .16, q: 2 }); N({ ft: 'highpass', f0: 5000, dur: .03, vol: .15, delay: .4 }); },
  limitBeat: (p, v, r, N, T) => { T({ f0: 58, f1: 36, glide: .15, dur: .2, vol: .3 }); },
  dashOff: (p, v, r, N, T) => { T({ f0: 90, f1: 30, dur: .6, vol: .7 }); N({ ft: 'lowpass', f0: 4000, f1: 200, dur: .5, vol: .4 }); N({ ft: 'bandpass', f0: 1500, f1: 600, dur: .5, vol: .08, q: 10, delay: .05 }); },
  riskOn: (p, v, r, N, T) => { [98, 104, 139].forEach((f, i) => T({ f0: f, dur: 1.2, vol: .05, rev: 1, delay: i * .05, type: 'sawtooth', lp: 500 })); T({ f0: 55, f1: 40, dur: .9, vol: .5 }); N({ ft: 'lowpass', f0: 600, f1: 80, dur: .8, vol: .25 }); },
  riskLock: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 2500, dur: .08, vol: .25, q: 6 }); T({ f0: 90, f1: 50, dur: .25, vol: .5 }); T({ f0: 600, f1: 420, dur: .25, vol: .04, type: 'square', lp: 1500 }); },
  cast: (p, v, r, N, T) => { T({ f0: 110 * p, f1: 160 * p, dur: .5, vol: .06, type: 'sawtooth', lp: 500, glide: .45 }); N({ ft: 'bandpass', f0: 400, f1: 1400, dur: .45, vol: .06, q: 5, atk: .2 }); },
  telegraph: (p, v, r, N, T) => { T({ f0: 120 * p, f1: 95 * p, dur: .3, vol: .12, type: 'triangle' }); N({ ft: 'bandpass', f0: 700, dur: .2, vol: .06, q: 4 }); },
  freeze: (p, v, r, N, T) => { N({ ft: 'highpass', f0: 3000, f1: 6000, dur: .12, vol: .12 }); T({ f0: 2200 * r, dur: .08, vol: .02, type: 'square', lp: 4000 }); N({ ft: 'bandpass', f0: 5000, dur: .03, vol: .1, q: 8, delay: .06 }); },
  venom: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 500 * r, dur: .1, vol: .1, q: 8 }); T({ f0: 200 * r, f1: 140, dur: .08, vol: .05 }); N({ ft: 'bandpass', f0: 700 * r, dur: .05, vol: .06, q: 10, delay: .07 }); },
  gaze: (p, v, r, N, T) => { T({ f0: 110, f1: 104, dur: .9, vol: .08, type: 'sawtooth', lp: 400, rev: .8 }); T({ f0: 116, f1: 110, dur: .9, vol: .06, type: 'sawtooth', lp: 400, rev: .8 }); },
  dialysis: (p, v, r, N, T) => { for (let i = 0; i < 4; i++) { T({ f0: 70, f1: 50, dur: .15, vol: .3, delay: i * .18 }); N({ ft: 'lowpass', f0: 600, f1: 200, dur: .15, vol: .14, delay: i * .18 + .05 }); } N({ ft: 'bandpass', f0: 2600, f1: 1400, dur: .4, vol: .08, q: 3, delay: .75 }); },
});
const GRIM_GAIN = { kill: 1.45, hit: 1.4, ink: 2, pickup: 1.35, clear: 1.6, heal: 1.7, shop: 1.4, key: 1.7, menu: 1.4, ui: 1.5, card: 1.3, select: 1.25, inject: 1.3, reloadDone: 1.2, chipGet: 1.3, unlock: 1.3, orbOpen: 1.3 };

// support: a crackling radio, rotors, a flare, a shell coming in, the impact, a crate on a parachute
Object.assign(GRIM_SFX, {
  radio: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 1800, dur: .25, vol: .1, q: 2 }); for (let i = 0; i < 3; i++) T({ f0: 900 + i * 120, dur: .04, vol: .03, type: 'square', lp: 2200, delay: .05 + i * .06 }); N({ ft: 'bandpass', f0: 2400, dur: .1, vol: .06, q: 4, delay: .25 }); },
  heliIn: (p, v, r, N, T) => { N({ ft: 'lowpass', f0: 300, f1: 900, dur: 1.5, vol: .25, atk: 1 }); T({ f0: 40, f1: 60, dur: 1.5, vol: .3, atk: 1 }); },
  rotor: (p, v, r, N, T) => { N({ ft: 'lowpass', f0: 420, f1: 160, dur: .07, vol: .12 * v }); T({ f0: 48, dur: .06, vol: .12 * v }); },
  flare: (p, v, r, N, T) => { N({ ft: 'highpass', f0: 3000, f1: 6000, dur: .25, vol: .18 }); N({ ft: 'bandpass', f0: 1200, dur: 1.4, vol: .06, q: 1, atk: .2, delay: .2 }); },
  shellIn: (p, v, r, N, T) => { T({ f0: 1800, f1: 500, glide: .7, dur: .7, vol: .06, type: 'triangle' }); N({ ft: 'bandpass', f0: 2500, f1: 900, dur: .7, vol: .05, q: 6 }); },
  artillery: (p, v, r, N, T) => { T({ f0: 70, f1: 22, dur: 1.1, vol: .9 }); N({ ft: 'lowpass', f0: 2400, f1: 60, dur: 1.2, vol: .6 }); N({ ft: 'bandpass', f0: 500, dur: .8, vol: .15, rev: 1 }); },
  dropIn: (p, v, r, N, T) => { N({ ft: 'lowpass', f0: 600, f1: 200, dur: 2, vol: .12, atk: .6 }); T({ f0: 60, f1: 50, dur: 2, vol: .12, atk: .6 }); },
});
// the rewarding moments keep their bright, snappy sounds (picking things up, a serum taking hold, a kill, a clear): the grim versions are dropped for these
for (const k of ['ink', 'pickup', 'select', 'kill', 'hit', 'crit', 'clear', 'heal', 'key', 'unlock', 'shop', 'chipGet', 'orbOpen', 'orbBurst', 'reloadDone', 'skillReady', 'card']) delete GRIM_SFX[k];

// the truck: the boom creaks up, the starter cranks, the engine catches, revs, and runs (pitch climbs as it pulls away)
Object.assign(GRIM_SFX, {
  gateBoom: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 380, f1: 720, dur: .7, vol: .12, q: 11 }); T({ f0: 140, f1: 120, dur: .5, vol: .06, type: 'square', lp: 600 }); N({ ft: 'bandpass', f0: 2000, dur: .05, vol: .12, q: 6, delay: .68 }); },
  engineCrank: (p, v, r, N, T) => { for (let i = 0; i < 6; i++) { N({ ft: 'lowpass', f0: 900, f1: 300, dur: .07, vol: .16, delay: i * .085 }); T({ f0: 70 + (i % 2) * 8, f1: 60, dur: .07, vol: .1, type: 'sawtooth', lp: 400, delay: i * .085 }); } },
  engineCatch: (p, v, r, N, T) => { N({ ft: 'lowpass', f0: 2500, f1: 200, dur: .12, vol: .3 }); T({ f0: 42, f1: 75, glide: .25, dur: .6, vol: .32, type: 'sawtooth', lp: 420 }); N({ ft: 'lowpass', f0: 500, f1: 220, dur: .6, vol: .2, atk: .03 }); T({ f0: 30, dur: .5, vol: .35 }); },
  engineRev: (p, v, r, N, T) => { T({ f0: 52, f1: 120, glide: .5, dur: .9, vol: .28, type: 'sawtooth', lp: 650 }); T({ f0: 104, f1: 240, glide: .5, dur: .8, vol: .08, type: 'square', lp: 900 }); N({ ft: 'bandpass', f0: 300, f1: 900, dur: .9, vol: .12, q: 2 }); },
  gravel: (p, v, r, N, T) => { N({ ft: 'bandpass', f0: 900, f1: 500, dur: 1.4, vol: .07, q: .8, atk: .3 }); N({ ft: 'lowpass', f0: 300, f1: 160, dur: 1.6, vol: .1, atk: .4 }); },
  engineRun: (p, v, r, N, T) => { T({ f0: 40 * p, dur: .13, vol: .15 * v, type: 'sawtooth', lp: 260 * p, atk: .01 }); T({ f0: 80 * p, dur: .1, vol: .04 * v, type: 'square', lp: 500 * p, atk: .01 }); N({ ft: 'lowpass', f0: 320 * p, dur: .1, vol: .07 * v }); },
});
