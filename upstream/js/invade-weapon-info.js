// Visible weapon capabilities. Cards and full details use the same records.
// These describe the implemented invasion rules; they do not change combat.
'use strict';
const ivInfoNum=n=>String(Math.round(n*100)/100);
function ivWeaponFeatures(o){
  const id=o.id,t=o.t,w=IV_W[id],st=ivStats(),out=[],pct=n=>Math.round(n*100),tier=n=>ivTier(n,t);
  const add=(key,short,detail,stat='eng',color='#e8c38a')=>out.push({key,short,detail,stat,color});
  if(id==='wrench'||w.turret){
    const kind=['turret','incendiary_turret','laser_turret','explosive_turret'][t],name=['机枪炮塔','喷火炮塔','激光炮塔','爆破炮塔'][t];
    add('turret','每波建1座'+name,'每把武器在每波开始时生成1座'+tr(IV_I[kind].n)+'。炮塔伤害受工程学加成。');
  }
  if(id==='screwdriver'){const base=[12,9,6,3][t],period=ivInfoNum(base/ivStructureRate());
    add('mine','每'+period+'秒生成地雷','每'+period+'秒生成1枚地雷；基础间隔'+base+'秒，受建筑攻击速度修正。爆炸基础伤害10＋100%工程学。');}
  if(id==='pruner'){const base=[15,14,12,10][t],period=ivInfoNum(base/ivStructureRate());
    add('garden','每波建花园；'+period+'秒产食物','每把武器在每波开始时生成1座花园，每'+period+'秒产出1份回血食物；基础间隔'+base+'秒，受建筑攻击速度修正。','regen');}
  if(id==='ghost_flint'||id==='ghost_scepter'){const n=[20,18,16,12][t],speed=id==='ghost_flint';
    add('growth','单波每'+n+'击杀；'+(speed?'攻速＋1%':'生命＋1'),'本武器每击杀'+n+'个敌人，本局永久增加'+(speed?'1%攻击速度':'1点生命上限')+'。每把武器分别累计，换波清零击杀计数，已获得的加成保留。',speed?'aspd':'hp');}
  if(id==='stick'){const n=[4,6,8,10][t];add('stick','每把其他木棍＋'+n+'伤害','每装备1把其他缠布木棍，本武器的基础伤害增加'+n+'，随后受伤害百分比加成。','dmg');}
  if(id==='hand'){const n=[3,6,12,25][t];add('harvest','收获＋'+n,'装备时增加'+n+'收获。','harvest','#abd18a');}
  if(id==='chopper'){const n=[1,1,1,2][t];add('food','拾取回血物资多回'+n+'生命','装备时，普通食物和绿色补给箱额外恢复'+n+'生命。','regen','#abd18a');}
  if(id==='rock'){const armor=[0,1,1,2][t],hp=[0,0,2,2][t];if(armor)add('armor','护甲＋'+armor,'装备时增加'+armor+'护甲。','armor','#abd18a');if(hp)add('hp','生命上限＋'+hp,'装备时增加'+hp+'生命上限。','hp','#abd18a');}
  if(id==='jousting_lance'){const speed=[2,3,4,5][t],loss=[10,15,20,25][t];add('speed','移动速度＋'+speed+'%','装备时增加'+speed+'%移动速度。','speed','#abd18a');add('standing','静止时伤害－'+loss+'%','静止满0.5秒后，伤害减少'+loss+'%；重新移动后解除。','dmg','#e89583');}
  if(id==='sharp_tooth'){const n=[25,20,15,10][t];add('missing-hp','每缺'+n+'%生命；窃取＋1%','战斗中，每损失'+n+'%最大生命，增加1%生命窃取，向下取整。','steal');}
  if(id==='thief_dagger'){const chance=pct([.5,.56,.62,.8][t]);add('crit-material','暴击击杀'+chance+'%得1材料','由本武器的暴击击杀敌人时，有'+chance+'%概率额外获得1材料。','harvest');}
  if(id==='cacti_club'){const n=3+t,sc=pct([.6,.7,.8,1][t]);add('spikes','命中射出'+n+'枚飞刺','命中敌人后随机射出'+n+'枚飞刺；每枚基础伤害'+(1+t)+'＋'+sc+'%远程伤害，再受伤害百分比加成。','ranged');}
  if(id==='lightning_shiv')add('lightning','命中发射闪电'+(t?'；弹射'+t+'次':''),'命中后向附近另一目标发射闪电；基础伤害'+[5,6,8,11][t]+'＋80%元素伤害，再受伤害百分比加成'+(t?'，可弹射'+t+'次':'')+'。','elem');
  if(id==='plank'){const chance=pct([.25,.3,.4,.5][t]);add('plank-explosion','命中'+chance+'%触发爆炸','直接命中敌人时，有'+chance+'%概率对周围其他敌人造成一次等同本次命中伤害的爆炸；基础半径72，受爆炸范围和爆炸伤害加成。','dmg');}
  if(id==='revolver'){const reload=ivInfoNum(ivWCd(o)*[2.07,1.93,1.80,1.67][t]/w.cd[t]);add('reload','每6发装填'+reload+'秒','每射击6次后，下次射击间隔变为'+reload+'秒，受攻击速度修正。','aspd');}
  if(w.critPierce)add('crit-pierce','暴击额外穿透'+tier(w.critPierce)+'次','同一发弹体首次暴击后，额外获得'+tier(w.critPierce)+'次穿透。','crit');
  if(w.critBounce)add('crit-bounce','暴击额外弹射'+tier(w.critBounce)+'次','同一发弹体首次暴击后，额外获得'+tier(w.critBounce)+'次弹射。','crit');
  if(w.burn){const n=tier(w.burnN||3),damage=ivInfoNum(ivScaleDamage(tier(w.burn)+st.elem));add('burn','燃烧'+damage+'伤×'+n+'次','命中后点燃敌人，基础燃烧'+n+'次，每次'+damage+'伤害；基础数值'+tier(w.burn)+'＋100%元素伤害，受伤害百分比加成。','elem');}
  if(w.expl){const chance=pct(tier(w.explChance??1));add('explosion',chance<100?'命中'+chance+'%爆炸':'命中爆炸','每发弹体有'+chance+'%概率携带爆炸；基础半径'+w.expl*3+'，受爆炸范围和爆炸伤害加成。','dmg');}
  if(w.chain)add('chain','连锁'+tier(w.chain)+'个目标','命中后最多连锁'+tier(w.chain)+'个其他目标，每次造成直接命中伤害的60%。','elem');
  if(w.slow)add('slow','减速40%，持续1.5秒','命中后使普通敌人减速40%，主要首领减速15%，持续1.5秒。','speed');
  if(tier(w.heal||0)>0){const heal=pct(tier(w.heal));add('lifesteal','生命窃取＋'+heal+'%','本武器命中时有'+heal+'%基础概率恢复1生命，与生命窃取属性相加；与其他武器共用每秒10次触发上限。','steal','#abd18a');}
  if(w.split)add('split','命中分裂'+w.split+'枚弹体','首次命中后向随机方向分裂'+w.split+'枚弹体，每枚造成分裂前弹体伤害的50%。','ranged');
  if(w.slam)add('slam','落地范围冲击','砸击落地时产生基础半径'+w.slam*3+'的爆炸冲击，造成相同基础伤害；不重复命中本次挥击已击中的目标。','melee');
  const pierce=tier(w.pierce||0),bounce=tier(w.bounce||0);
  if(pierce){const falloff=pct(1-(w.pierceMul??.5));add('pierce',(pierce>50?'贯穿弹道':'穿透'+pierce+'次')+(falloff?' · 递减'+falloff+'%':''),'弹体可额外穿透'+pierce+'个目标；每次穿透后的伤害'+(falloff?'降低'+falloff+'%':'不衰减')+'，衰减受穿透伤害属性修正。','ranged');}
  if(bounce)add('bounce','弹射'+bounce+'次','弹体可向未命中的附近目标弹射'+bounce+'次。','ranged');
  if(w.matKill){const chance=pct(w.matKill);add('material','击杀'+chance+'%多掉1材料','本武器击杀敌人时，有'+chance+'%概率额外掉落1材料。','harvest');}
  return out;
}
function ivWeaponDescription(o){
  const w=IV_W[o.id],base=w.dmg[o.t],damage=ivWDmg(o),scale=Object.entries(w.sc).map(([k,v])=>Math.round(ivTier(v,o.t)*100)+'%'+tr(IV_STAT[k].n)).join(' ');
  const rows=[
    [L('iv_dmgL')+' '+damage+(damage!==base?' ('+base+')':'')+(w.pel?' ×'+ivTier(w.pel,o.t):''),'#e6dfd1','dmg'],
    [scale,'#8e877b',Object.keys(w.sc)[0]],
    [L('iv_cdL')+' '+ivWCd(o).toFixed(2)+'s   '+L('iv_critL')+' '+Math.round(ivWCrit(o)*100)+'% ×'+ivTier(w.cm,o.t),'#c9c1b2','aspd'],
    [L('iv_rangeL')+' '+Math.round(ivWRange(o)*3),'#c9c1b2','range']
  ];
  for(const f of ivWeaponFeatures(o))rows.push([f.detail,f.color,f.stat]);
  const style=({sweep:'挥砍',thrust:'突刺',punch:'出拳',slam:'砸击',saw:'锯切'})[w.attack];
  const kb=Math.max(0,ivTier(w.kb,o.t)+ivStats().kb);if(style||kb)rows.push([[style,kb?'击退 '+ivInfoNum(kb):''].filter(Boolean).join(' · '),'#9ba99c','melee']);
  return rows;
}
// A fixed header and compact primary stats leave the whole lower area for traits.
// No clipping, scrolling, hover, rotating text or detail click is used for traits.
function ivWeaponCardLayout(o,width,height){
  const scale=.95,lh=10,features=ivWeaponFeatures(o),rows=[];
  for(const f of features)for(const clause of f.short.split('；'))for(const s of wrapW(clause,width-12,scale))rows.push({s,c:f.color,key:f.key});
  // Weapons with no additional proc still show how they attack.
  if(!rows.length){const w=IV_W[o.id],s=({sweep:'近战挥砍',thrust:'近战突刺',punch:'近身出拳',slam:'近战砸击',saw:'持续锯切'})[w.attack]||'远程射击';rows.push({s,c:'#bdb5a6',key:'attack'});}
  const title=wrapW(tr(IV_W[o.id].n),width-36,.95).map(s=>fitText(s,width-36,.95)),header=Math.max(29,9+title.length*9),body=header+42;
  return {title,header,body,rows,scale,lh,bottom:body+rows.length*lh,available:height-3};
}
function ivDrawWeaponCard(x,y,width,height,o,hover){
  const c=IV_TIER_C[o.t],w=IV_W[o.id],layout=ivWeaponCardLayout(o,width,height);
  box(x,y,width,height,hover?'#15130f':'#0e0d0b',hover?c:'#2b2823');rect(x+1,y+1,width-2,2,c);if(hover)rect(x+1,y+height-2,width-2,1,thA(c,.35));
  ivIcon(o,x+16,y+15,1);layout.title.forEach((s,i)=>text(s,x+31,y+8+i*9,c,.95));
  const tags=w.set.map(k=>tr(IV_SETS[k].n)).join(' · ');text(fitText(tags,width-29,.8),x+6,y+layout.header-2,'#857f74',.8);text(IV_TIER_N[o.t],x+width-6,y+layout.header-2,c,.8,'right');
  const half=(width-12)/2,stat=(key,value,xx,yy)=>{ivDrawBadge(ivStatSprite(key),xx+4,yy+3,9);text(value,xx+11,yy,'#e6dfd1',.9);},sy=y+layout.header+6;
  stat('dmg',ivWDmg(o)+(w.pel&&ivTier(w.pel,o.t)>1?'×'+ivTier(w.pel,o.t):''),x+6,sy);
  stat('aspd',ivInfoNum(ivWCd(o))+'s',x+6+half,sy);
  stat('range',Math.round(ivWRange(o)*3),x+6,sy+10);stat('crit',Math.round(ivWCrit(o)*100)+'%',x+6+half,sy+10);
  // where the damage comes from: each scaling stat's badge and its share, on the card itself
  {const sc=Object.entries(w.sc).map(([k,v])=>[k,Math.round(ivTier(v,o.t)*100)]),fit=pc=>sc.reduce((a,[,v])=>a+11+textW(v+(pc?'%':''),.85)+4,0)<=width-12,pc=fit(true);let xx=x+6;
    for(const [k,v] of sc){const s=v+(pc?'%':'');if(xx+11+textW(s,.85)>x+width-6)break;ivDrawBadge(ivStatSprite(k),xx+4,sy+23,9);text(s,xx+10,sy+20,IV_STAT_COLOR[k]||'#bdb5a6',.85);xx+=11+textW(s,.85)+4;}}
  const body=y+layout.body;line(x+5,body-4,x+width-5,body-4,'#2b2823',1);
  layout.rows.forEach((r,i)=>text(r.s,x+6,body+i*layout.lh,r.c,layout.scale));
}
