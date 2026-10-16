// Original first eight PC characters, expressed as invasion preferences.
'use strict';
const IV_ROLES = [
  {id:'rounded',n:'均衡适应',en:'BALANCED',tags:[],ic:'prism',base:{hp:5,speed:5,harvest:8},lines:['生命上限＋5','移动速度＋5%','收获＋8'],start:['knife','stick','fist','cacti_club','ghost_flint','wrench','pistol','smg','double_barrel_shotgun','slingshot','taser','wand']},
  {id:'brawler',n:'近身搏击',en:'CLOSE COMBAT',tags:["Melee Damage"],ic:'frenzy',base:{dodge:15,range:-50,ranged:-50},weapon:'fist',lines:['徒手武器攻击速度＋50%','额外携带1个拳头','闪避＋15%，范围－50','远程伤害－50'],start:['fist','hand','claw']},
  {id:'crazy',n:'精准猛攻',en:'PRECISION',tags:["Crit Chance", "Melee Damage"],ic:'axe',base:{aspd:25,dodge:-30,eng:-10,ranged:-10},weapon:'knife',lines:['精准武器范围＋100','攻击速度＋25%','额外携带1把小刀','闪避－30%，工程学－10','远程伤害－10'],start:['knife','thief_dagger','scissors','lightning_shiv','claw','sharp_tooth','shuriken']},
  {id:'ranger',n:'远距火力',en:'LONG RANGE',tags:["Ranged Damage", "Range"],ic:'round',base:{range:50},scale:{ranged:1.5,hp:.75},weapon:'pistol',lines:['范围＋50，额外携带1把手枪','远程伤害的属性修改＋50%','不能装备近战武器','生命上限的属性修改－25%'],start:['pistol','smg','revolver','double_barrel_shotgun','laser_gun','shredder','crossbow','slingshot']},
  {id:'mage',n:'元素反应',en:'ELEMENTAL',tags:["Elemental Damage"],ic:'bolt',base:{},scale:{elem:1.25,melee:0,ranged:0,eng:.5},items:['snake','scared_sausage'],lines:['元素伤害的属性修改＋25%','开局携带蛇和惊恐香肠','近战、远程伤害的属性修改－100%','工程学的属性修改－50%'],start:['wand','torch','plank','taser','lightning_shiv','smg','double_barrel_shotgun']},
  {id:'chunky',n:'厚重生存',en:'FORTIFIED',tags:["Max HP", "Luck", "Consumable"],ic:'heart',base:{steal:-100,food:3},scale:{hp:1.25,regen:.5,dodge:.5,speed:0},lines:['生命上限的属性修改＋25%','每3点生命上限提供1%伤害','消耗品额外恢复3生命','生命窃取－100%','生命再生、闪避的属性修改－50%','移动速度的属性修改－100%'],start:['fist','cacti_club','rock','stick','torch','plank','chopper','pruner','spiky_shield','double_barrel_shotgun','taser','ghost_scepter','shredder','revolver']},
  {id:'old',n:'稳守缓进',en:'STEADY',tags:["Less Enemies", "Less Enemy Speed"],ic:'clock',base:{enemySpeed:-25,harvest:10,enemies:-10,speed:-10},lines:['敌人移动速度－25%','收获＋10，地图面积－33%','敌人数量－10%','移动速度－10%'],start:['scissors','screwdriver','wrench','rock','plank','chopper','pruner','double_barrel_shotgun','revolver','taser','wand']},
  {id:'lucky',n:'幸运搜集',en:'SCAVENGING',tags:["Luck", "Pickup", "Exploration"],ic:'spiral',base:{luck:100,aspd:-60,xp:-50},scale:{luck:1.25},lines:['幸运＋100','幸运的属性修改＋25%','拾取材料时75%概率随机伤害敌人','触发伤害：1＋15%幸运','攻击速度－60%，经验获取－50%'],start:['stick','rock','fist','chopper','plank','screwdriver','jousting_lance','torch','pruner','slingshot','wand']},
  {id:'engineer',n:'工程布防',en:'FORTIFICATION',tags:['Engineering','Structure'],ic:'gear',base:{eng:10},scale:{eng:1.25,dmg:.5},weapon:'wrench',lines:['工程学＋10','工程学的属性修改＋25%','伤害%的属性修改－50%','额外携带1把工程扳手','炮塔与建筑集中布置'],start:['wrench','screwdriver','plank','hammer'],startTier:{hammer:1}},
  {id:'doctor',n:'医疗续航',en:'SUSTAIN',tags:['HP Regeneration'],ic:'heart',base:{regen:5,harvest:5,aspd:-100},scale:{regen:2,armor:.5},lines:['医疗武器攻击速度＋200%','所有武器攻击速度－100%','生命再生＋5，收获＋5','生命再生的属性修改＋100%','护甲的属性修改－50%'],start:['scissors','medical_gun']}
];
const ivRole = () => IV_ROLES.find(r => r.id === G.iv.role);
const ivWeaponAllowed = id => G.iv.role !== 'ranger' || !IV_W[id].melee;
const IV_SECONDARY = {
  kb:['击退',0], enemyHp:['敌人生命',1], enemySpeed:['敌人速度',1], enemies:['敌人数量',1], food:['消耗品回血',0],
  explDmg:['爆炸伤害',1], structureSpeed:['建筑攻击速度',1], pierceDmg:['穿透伤害',1], materials:['材料掉落',1], bossDmg:['首领与精英伤害',1]
};
for (const [k,[zh,pct]] of Object.entries(IV_SECONDARY)) { IV_STATS2.push([k,IZ(k,zh),pct]); IV_STAT[k]={k,n:IZ(k,zh),pct:!!pct}; }
function ivChooseRole(id) {
  if (G.iv.wave !== 0) return;
  const role = IV_ROLES.find(r => r.id === id); if (!role) return;
  const iv = G.iv; iv.role=id; iv.items={}; iv.w=[]; for (const k in iv.base) iv.base[k]=0;
  for (const item of role.items || []) iv.items[item]=1;
  iv.pending={}; iv.hpCap=iv.speedCap=undefined; ivDirty();
  // Area scales by 0.67, so each arena dimension scales by its square root.
  G.ivRoom=ivArena(); const r=G.ivRoom; G.p.x=r.cx*T+8; G.p.y=r.cy*T+8; G.p.safe={x:G.p.x,y:G.p.y};
  G.cam.x=G.p.x-W/2; G.cam.y=G.p.y-H/2; G.p.hp=G.p.maxHp;
  IVU.startPage=0; IVU.startSel=0; IVU.hits=[]; G.state='ivstart'; AU.play('select');
}
function ivChooseWeapon(id) {
  if(G.state!=='ivstart')return;
  const r=ivRole(); if (!r || !r.start.includes(id) || !ivWeaponAllowed(id)) return;
  G.iv.w=[]; if (r.weapon) ivGiveWeapon(r.weapon,0); ivGiveWeapon(id,r.startTier?.[id]||0); IVU.hits=[]; ivStartWave();
}
function ivDrawRoleUI() {
  ivTop('选择偏好'); const idx=clamp(IVU.roleSel||0,0,IV_ROLES.length-1),r=IV_ROLES[idx],pw=194,gw=W-pw-24,cw=Math.floor((gw-6)/2);
  IV_ROLES.forEach((role,i)=>{const x=10+i%2*(cw+6),y=34+Math.floor(i/2)*37,on=idx===i,c=IV_PREF_COLOR[role.id],b={x,y,w:cw,h:33,f:()=>{IVU.roleSel=i;AU.play('ui');}};
    IVU.hits.push(b);box(x,y,cw,33,on?'#17140f':'#0e0d0b',on?c:'#2b2823');rect(x+1,y+1,2,31,on?c:'#3a3631');ivDrawBadge(ivPreferenceSprite(role.id),x+18,y+16,28);
    text(role.n,x+35,y+7,on?'#e6dfd1':'#bdb5a6');text(fitText(role.en,cw-39),x+35,y+21,c,.75);if(on)rect(x+cw-5,y+4,2,2,c);});
  const x=W-pw-8,c=IV_PREF_COLOR[r.id];box(x,34,pw,H-93,'#0e0d0b','#36322d');rect(x+1,35,pw-2,2,c);ivDrawBadge(ivPreferenceSprite(r.id),x+25,59,36);text(r.n,x+49,46,c,1.35);text('生存倾向 / '+String(idx+1).padStart(2,'0'),x+49,65,TH.dim,.85);
  let y=85;for(const s of r.lines){for(const l of wrapW(s,pw-22)){text(l,x+11,y,TH.bone2,.95);y+=lineH()+1;}y+=3;}
  ivBtn({x,y:H-53,w:pw,h:23,f:()=>ivChooseRole(r.id)},'确认偏好 → 选择武器',c);
}
function ivDrawStartUI() {
  const r=ivRole(); if(!r){G.state='ivrole';return;} ivTop('选择武器 · '+r.n);
  const page=IVU.startPage||0, ids=r.start.slice(page*8,page*8+8), cw=Math.floor((W-38)/4), ch=104;
  ids.forEach((id,i)=>{const x=10+i%4*(cw+6),y=31+Math.floor(i/4)*108,o={k:'w',id,t:r.startTier?.[id]||0},b={x,y,w:cw,h:ch,f:()=>ivChooseWeapon(id)};
    IVU.hits.push(b); ivCard(x,y,cw,ch,o,inR(b,Input.mx,Input.my)||IVU.startSel===i); });
  ivBtn({x:10,y:H-23,w:85,h:18,f:()=>{G.state='ivrole';IVU.hits=[];}},'← 更换偏好',TH.bone2);
  if(r.start.length>8) ivBtn({x:W-106,y:H-23,w:96,h:18,f:()=>{IVU.startPage=1-page;IVU.startSel=0;}},'更多武器 '+(page+1)+'/2',TH.gold);
  if(r.weapon)text('额外初始武器：'+tr(IV_W[r.weapon].n),W/2,H-18,TH.dim,1,'center');
}
