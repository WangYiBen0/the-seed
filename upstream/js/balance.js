// ===== TheSeed balance pass: champions rest longer between attacks. When a champion's AI sets a new cooldown while idle, it first
// rests for another 80% of that cooldown in real time (floor and difficulty speed-ups do not shorten the rest), so its pauses are
// at least 1.8x as long as before.
'use strict';
const CHAMP_REST = .8;
for (const id of Object.keys(CHAMP)) { const f = AI[id]; if (typeof f !== 'function') continue;
  AI[id] = function (e, dt, ...rest) {
    if (e.chRest > 0) { e.chRest -= dt; e.cd = Math.max(e.cd, e.chHold || 0); }
    const before = e.cd, r = f.call(this, e, dt, ...rest);
    if (!(e.chRest > 0) && e.st === 'idle' && e.cd > before + .05) { e.chRest = e.cd * CHAMP_REST; e.chHold = e.cd; }
    return r; }; }
