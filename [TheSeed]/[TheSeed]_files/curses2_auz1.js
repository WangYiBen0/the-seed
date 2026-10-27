// ===== ACHROMA curses II: night blindness, rejection, emphysema; and a reroll at the curse portal now costs 1 maximum health =====
'use strict';
Object.assign(ICONS, {
  c_night: ['..1111..', '.1....1.', '1..11..1', '1.1111.1', '1.1111.1', '1..11..1', '.1....1.', '..1111..'].map((r, j) => j === 3 || j === 4 ? '1.1..1.1' : r),
  c_reject: ['11....11', '.11..11.', '..1111..', '...11...', '...11...', '..1111..', '.11..11.', '11....11'],
  c_lung: ['...11...', '...11...', '.1.11.1.', '11.11.11', '11.11.11', '11....11', '11....11', '.1....1.'],
});
CURSES.push(
  { id: 'night', icon: 'c_night', n: N4('NIGHT BLINDNESS', '夜盲症', '夜盲症', '夜盲症'), d: N4('YOU SEE ABOUT 30% LESS OF WHAT IS AROUND YOU.', '角色周圍的可視範圍縮小約 30%。', '周囲の視界が約30%狭まる。', '角色周围的可视范围缩小约 30%。') },
  { id: 'reject', icon: 'c_reject', n: N4('REJECTION', '排異反應', '拒絶反応', '排异反应'), d: N4('SERUM CHOICES OFFER ONLY 2 SYRINGES, NOT 3.', '選血清時只出 2 支針，不再是 3 支。', '血清の選択肢が3本から2本になる。', '选血清时只出 2 支针，不再是 3 支。') },
  { id: 'lung', icon: 'c_lung', n: N4('EMPHYSEMA', '肺氣腫', '肺気腫', '肺气肿'), d: N4('DASH COOLDOWN +100%.', '衝刺冷卻 +100%。', 'ダッシュのクールダウン+100%。', '冲刺冷却 +100%。') },
);
for (const c of CURSES.slice(-3)) CURSE[c.id] = c;
// emphysema: the dash takes twice as long to come back; and the health given up for rerolls stays given up (G.mhpLoss)
const _curseStatsC2 = curseStats; curseStats = function (S) { _curseStatsC2(S); if (hasCurse('lung')) S.dashCd *= 2; if (G && G.mhpLoss) S.maxHp -= G.mhpLoss; };
// rejection: only two syringes to choose from
const _rollCardsC2 = rollCards; rollCards = function (...a) { const r = _rollCardsC2(...a); return hasCurse('reject') ? r.slice(0, 2) : r; };
// night blindness: the world fades into the dark beyond a circle around you (drawn after the world, like the pale's silence)
const _drawDarkC2 = drawDark; drawDark = function (cx, cy) { _drawDarkC2(cx, cy); const p = G.p; if (!hasCurse('night') || !p) return;
  const x = p.x - cx, y = p.y - cy - 3, R = 150, ring = (r, f) => { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(x, y, r, 0, 6.2832, true); ctx.clip('evenodd'); f(); ctx.restore(); };
  ring(R, () => ctx.drawImage(ditherLayer(.45, '#000'), 0, 0)); ring(R * 1.22, () => ctx.drawImage(ditherLayer(.8, '#000'), 0, 0)); ring(R * 1.42, () => rect(0, 0, W, H, '#000')); };
// the curse portal's reroll: it costs 1 maximum health now (you need at least 3 to pay it)
curseRerollOk = function () { return !!(G.curseQ && !G.curseQ.rr && G.p.maxHp > 2 && curseHasReplacement()); };
const _updateCurseC2 = updateCurse; updateCurse = function (rdt) { const q = G.curseQ, rr0 = q && q.rr, hp0 = G.p.hp; _updateCurseC2(rdt);
  if (q && !rr0 && q.rr) { G.p.hp = hp0; G.mhpLoss = (G.mhpLoss || 0) + 1; recomputeStats(); G.p.hp = Math.min(G.p.hp, G.p.maxHp); saveRun(); notify(L('n_mhpLoss'), CURSE_C); } };
Object.assign(STR, { cu_rr: ['REROLL: -1 MAX HEALTH', '以生命上限刷新', '最大HPで引き直す', '以生命上限刷新'], n_mhpLoss: ['MAXIMUM HEALTH -1', '生命上限 -1', '最大HP -1', '生命上限 -1'] });
// a resumed run applies the given-up health once its save is read (the save is read after the stats are first worked out)
const _resumeRunC2 = resumeRun; resumeRun = function (...a) { const r = _resumeRunC2(...a); if (G && G.p && G.mhpLoss) recomputeStats(); return r; };
