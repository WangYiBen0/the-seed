// 绝境探索的可选修饰符；状态随本局存档保存，普通出击和入侵不携带。
'use strict';
const RUN_MODIFIERS = [
  {id:'rage',n:'激怒',d:'敌人攻击频率翻倍（首领只生效 20%）',reward:2,ic:'frenzy',c:'#df8069'},
  {id:'deathfight',n:'死斗',d:'敌人受到致命伤害后不可选中，继续战斗2秒后死亡',reward:2,ic:'skull',c:'#bd9cdb'},
  {id:'bulwark',n:'铁壁',d:'敌人进入战斗后的20秒内受到伤害降低20%',reward:2,ic:'shield',c:'#91b9cf'},
  {id:'rot',n:'腐烂',d:'敌人免疫燃烧、中毒和冰冻',reward:3,ic:'drop',c:'#adbf79'},
  {id:'cyst',n:'囊肿',d:'所有敌人生命上限增加25%',reward:3,ic:'heart',c:'#d7958c'}
];
const MODSEL = {ids:[],hits:[],t:0};
let PENDING_MODIFIERS = [], MOD_AI_BODY=null, MOD_AI_RATE=1;
function cleanModifiers(ids,diff,mode){return diff==='despair'&&mode!=='invade'&&Array.isArray(ids)?RUN_MODIFIERS.filter(m=>ids.includes(m.id)).map(m=>m.id):[];}
function takeRunModifiers(){const ids=cleanModifiers(PENDING_MODIFIERS,G.diff,RUN_MODE);PENDING_MODIFIERS=[];return ids;}
function hasRunModifier(id){return G.mode!=='invade'&&G.diff==='despair'&&!G.preview&&!(window.BOSS_TEST&&BOSS_TEST.on)&&!!G.modifiers?.includes(id);}
function runModifierReward(){return RUN_MODIFIERS.reduce((n,m)=>n+(hasRunModifier(m.id)?m.reward:0),0);}
function enemyAttackRate(){return hasRunModifier('rage')?2:1;}
function modifierDamageMul(e){return hasRunModifier('bulwark')&&(e.modCombatAge||0)<20?.8:1;}
function modifierEnemyTick(e,dt){
  e.modCombatAge=(e.modCombatAge||0)+dt;
  if(!(e.deathFightLeft>0))return false;
  e.deathFightLeft=Math.max(0,e.deathFightLeft-dt);
  if(e.deathFightLeft>1e-8){e.hp=0;e.burn=e.venom=e.frozen=0;e.sleepT=e.stunT=0;return false;}
  e.deathFightLeft=0;e.modDeathFinal=true;
  killEnemy(e,e.deathFightHit||{});return true;
}
const _spawnEnemyMod=spawnEnemy;spawnEnemy=function(...args){
  const e=_spawnEnemyMod(...args);
  if(hasRunModifier('cyst')&&!e.boss)e.hp=e.maxHp=e.maxHp*1.25;
  // 各类武器、地面场与扩散都写这些状态，统一拒绝写入以覆盖全部来源。
  if(hasRunModifier('rot'))for(const key of ['burn','burnT','venom','venomT','frozen'])Object.defineProperty(e,key,{enumerable:true,configurable:true,get:()=>0,set:()=>{}});
  return e;
};
const _spawnBossMod=spawnBoss;spawnBoss=function(...args){const b=_spawnBossMod(...args);if(hasRunModifier('cyst')&&b.def.form!==2)b.hp=b.maxHp=b.maxHp*1.25;return b;};
const _moveBodyMod=moveBody;moveBody=function(e,dx,dy,...rest){const rate=e===MOD_AI_BODY?MOD_AI_RATE:1;return _moveBodyMod(e,dx/rate,dy/rate,...rest);};
const _hitEnemyMod=hitEnemy;hitEnemy=function(e,dmg,o={}){if(!e||e.deathFightLeft>0)return false;return _hitEnemyMod(e,dmg,o);};
const _dotTickMod=dotTick;dotTick=function(e,dt){if(e.deathFightLeft>0)return false;return _dotTickMod(e,dt);};
const _killEnemyMod=killEnemy;killEnemy=function(e,o={}){
  if(!e||e.dead)return;
  // A completed timed trial is an explicit cleanup, not another lethal combat hit.
  if(o.roomCleanup){e.deathFightLeft=0;e.modDeathFinal=true;}
  if(e.deathFightLeft>0)return;
  if(hasRunModifier('deathfight')&&!e.modDeathFinal){
    e.hp=0;e.deathFightLeft=2;e.deathFightHit={...o};e.burn=e.venom=e.frozen=0;e.sleepT=e.stunT=0;e.inv=Math.max(2,e.inv||0);
    floatText(e.x,e.y-e.r-10,'死斗', '#bd9cdb',1,.8);ringFx(e.x,e.y,e.r+8,'#bd9cdb',.3,1);return;
  }
  return _killEnemyMod(e,o);
};
const _drawMarksMod=drawMarks;drawMarks=function(e,x,y){_drawMarksMod(e,x,y);if(e.deathFightLeft>0){ringC(x,y,e.r+5,'#bd9cdb',1);text(Math.max(.1,e.deathFightLeft).toFixed(1),x,y-e.r-12,'#ddc6ef',.85,'center');}else if(hasRunModifier('bulwark')&&(e.modCombatAge||0)<20){ringC(x,y,e.r+3,'#91b9cf',1);}};

// 普通出击清空待选修饰符；重新挑战沿用当前局，读档由 game.js 恢复。
const _sortieMod=sortie;sortie=function(i,ids=[]){if(!DIFFS[i])return;PENDING_MODIFIERS=cleanModifiers(ids,DIFFS[i].id,DEP.mode);return _sortieMod(i);};
const _pickDiffMod=pickDiff;pickDiff=function(){PENDING_MODIFIERS=[];return _pickDiffMod();};
const _restartRunMod=restartRun;restartRun=function(){PENDING_MODIFIERS=cleanModifiers(G.modifiers,G.diff,G.mode);return _restartRunMod();};
const _toMenuMod=toMenu;toMenu=function(){PENDING_MODIFIERS=[];MODSEL.hits=[];return _toMenuMod();};
function modifierEntryAllowed(){return DEP.mode==='explore'&&DIFFS[DEP.pick]?.id==='despair';}
function openModifierSelect(){if(!modifierEntryAllowed())return;MODSEL.ids=[];MODSEL.hits=[];MODSEL.t=0;goPage('modifiers');Input.clicked=Input.down=false;AU.play('menuOk');}
function toggleModifier(id){if(!RUN_MODIFIERS.some(m=>m.id===id))return;MODSEL.ids=MODSEL.ids.includes(id)?MODSEL.ids.filter(k=>k!==id):MODSEL.ids.concat(id);AU.play('select');}
function launchModifiedRun(){if(!modifierEntryAllowed()||!MODSEL.ids.length)return;const ids=MODSEL.ids.slice();MENU.page='main';MENU.stack=[];MODSEL.hits=[];sortie(DEP.pick,ids);}
Object.assign(ICONS, { skull: ['.111111.', '11111111', '1..11..1', '1..11..1', '11111111', '.111111.', '.1.11.1.', '........'] });
function modifierRect(){const w=Math.min(456,W-16),h=Math.min(250,H-12);return{x:Math.round((W-w)/2),y:Math.round((H-h)/2),w,h};}
function modCardRects(r){const n=RUN_MODIFIERS.length,gap=6,cw=Math.floor((r.w-20-gap*(n-1))/n),ch=r.h-96;return RUN_MODIFIERS.map((m,i)=>({x:r.x+10+i*(cw+gap),y:r.y+46,w:cw,h:ch}));}
// a check mark in the corner of a chosen card
function modCheck(x,y,c){rect(x,y,11,11,c);for(const [dx,dy] of [[2,5],[3,6],[4,7],[5,6],[6,5],[7,4],[8,3]])rect(x+dx,y+dy,1,1,'#120d0a');}
function drawModifierSelect(){
  const r=modifierRect(),c='#c4364a',alpha=easeOut(clamp(MODSEL.t/.2,0,1)),reward=RUN_MODIFIERS.reduce((n,m)=>n+(MODSEL.ids.includes(m.id)?m.reward:0),0);MODSEL.hits=[];
  ctx.save();ctx.globalAlpha=alpha;winBackdrop(.82);winFrame(r.x,r.y,r.w,r.h,c,'',{close:false});
  // the head: a red tag, the title, what choosing does
  {const tag='DESPAIR',tw=textW(tag)+10;rect(r.x+10,r.y+9,tw,12,c);text(tag,r.x+15,r.y+12,'#120d0a');textS('修饰符',r.x+18+tw,r.y+8,'#f2ebde',1.5);
   text('自愿加码：每带上一个修饰符，通关时额外获得火种',r.x+r.w-10,r.y+12,'#8e877b',1,'right');rect(r.x+10,r.y+30,r.w-20,1,'#2d2925');rect(r.x+10,r.y+30,40,1,c);}
  // the cards
  const cards=modCardRects(r),lh=lineH();
  RUN_MODIFIERS.forEach((m,i)=>{const q=cards[i],on=MODSEL.ids.includes(m.id),hv=!TOUCH.on&&inR(q,Input.mx,Input.my),k=easeOut(clamp((MODSEL.t-i*.05)/.25,0,1)),lift=(hv?2:0)+Math.round((1-k)*10),b={x:q.x,y:q.y,w:q.w,h:q.h,f:()=>toggleModifier(m.id)};MODSEL.hits.push(b);
    const y=q.y-lift;ctx.globalAlpha=alpha*k;
    rect(q.x,y,q.w,q.h,on?thA(m.c,.13):'#0f0e0d');box(q.x,y,q.w,q.h,null,on?m.c:hv?'#5a524a':'#2a2622');rect(q.x,y,q.w,2,on?m.c:thA(m.c,.35));if(on)box(q.x-1,y-1,q.w+2,q.h+2,null,thA(m.c,.35));
    // the emblem on a dark disc
    const cx=q.x+q.w/2,ey=y+26;disc(cx,ey,15,'#070606');ringC(cx,ey,15,on?m.c:thA(m.c,.45),1);if(ICONS[m.ic])icon(m.ic,cx-12,ey-12,on?m.c:thA(m.c,.8),3);
    textS(m.n,cx,y+48,on?'#f2ebde':m.c,1.5,'center');
    wrapW(m.d,q.w-12).slice(0,5).forEach((l,j)=>text(l,cx,y+70+j*lh,on?'#d8d0c2':'#8e877b',1,'center'));
    // the reward at the foot
    const rs='+'+m.reward,rw=textW(rs)+16,rx=Math.round(cx-rw/2);rect(q.x+6,y+q.h-22,q.w-12,1,'#24211e');drawProof(rx,y+q.h-15);text(rs,rx+11,y+q.h-14,on?TH.gold:'#a08a5a');
    if(on)modCheck(q.x+q.w-14,y+3,m.c);});
  ctx.globalAlpha=alpha;
  // the foot: back, the total, launch
  const fy=r.y+r.h-28,bk={x:r.x+10,y:fy,w:64,h:18,f:()=>backPage()},go={x:r.x+r.w-140,y:fy,w:130,h:18,f:launchModifiedRun};MODSEL.hits.push(bk);if(MODSEL.ids.length)MODSEL.hits.push(go);
  rect(r.x+10,fy-8,r.w-20,1,'#1d1a17');
  drawBtn(bk.x,bk.y,bk.w,bk.h,L('back'),!TOUCH.on&&inR(bk,Input.mx,Input.my),TH.bone2);
  {const n=MODSEL.ids.length,s1='已选 '+n+' 个',x0=r.x+86;text(s1,x0,fy+5,n?'#e6dfd1':'#6e675c');const x1=x0+textW(s1)+12;if(n){drawProof(x1,fy+4);text('通关额外 +'+reward,x1+11,fy+5,TH.gold);}else text('至少选择一个修饰符',x1,fy+5,'#57524a');}
  drawBtn(go.x,go.y,go.w,go.h,'携带修饰符出击',!!MODSEL.ids.length,MODSEL.ids.length?c:TH.faint);ctx.restore();
}
const _drawMenuMod=drawMenu;drawMenu=function(t){if(MENU.page==='modifiers'){drawModifierSelect();return;}return _drawMenuMod(t);};
const _updateMenuMod=updateMenu;updateMenu=function(dt){if(MENU.page!=='modifiers')return _updateMenuMod(dt);MODSEL.t+=dt;
  if(pressed('Escape')){backPage();return;}
  {const n=RUN_MODIFIERS.length;MODSEL.sel=MODSEL.sel||0;if(pressed('KeyA')||pressed('ArrowLeft'))MODSEL.sel=(MODSEL.sel+n-1)%n;if(pressed('KeyD')||pressed('ArrowRight'))MODSEL.sel=(MODSEL.sel+1)%n;if(pressed('Space'))toggleModifier(RUN_MODIFIERS[MODSEL.sel].id);if(pressed('Enter'))launchModifiedRun();}
  if(Input.clicked){Input.clicked=false;MODSEL.hits.find(b=>inR(b,Input.mx,Input.my))?.f();}
};
const _updateTaskbarMod=updateTaskbar;updateTaskbar=function(dt){if(Input.clicked&&TBAR.shown===0&&DEP.modBtn&&modifierEntryAllowed()&&inR(DEP.modBtn,Input.mx,Input.my)){Input.clicked=false;openModifierSelect();return;}return _updateTaskbarMod(dt);};
const _padTargetsMod=padTargets;padTargets=function(){
  if(NAMEED.open||OVL.open||FSQ.open||ANN.open||WC.open||G.hintQ)return _padTargetsMod();
  if(G.state==='menu'&&MENU.page==='modifiers')return MODSEL.hits;
  if(G.state==='menu'&&MENU.page==='difficulty')return DIFFS.map((_,i)=>diffCard(i)).concat(DSEL.hits);
  if(G.state==='menu'&&MENU.page==='main'&&TBAR.area===0&&TBAR.shown===0&&TBAR.k>.6&&DEP.mode){
    const it=tbItems()[0],rows=it.rows(),b=areaBox(it,rows),targets=rows.map((r,i)=>r.head||r.off||r.info?null:{x:b.x-5,y:b.ry+i*b.rh,w:b.w,h:b.rh,deployRow:i});
    const first=DEP.pick>=0?DEP.btn:targets[TBAR.sel];return [first,...targets,DEP.btn,DEP.modBtn].filter((q,i,a)=>q&&a.indexOf(q)===i);
  }
  return _padTargetsMod();
};
const _padBackMod=padBack;padBack=function(){if(G.state==='ivrole'&&ivOn()){ivBackToDeploy();return;}return _padBackMod();};
const _ivUpdateUIMod=ivUpdateUI;ivUpdateUI=function(dt){if(G.state==='ivrole'&&pressed('Escape')){ivBackToDeploy();return;}return _ivUpdateUIMod(dt);};
