// Invasion presentation only: enamel insignia, salvage containers and airlock cuts.
'use strict';
const IV_STAT_COLOR={hp:'#e88c84',regen:'#9cd6a4',steal:'#d88ca7',dmg:'#efaa78',melee:'#ddbc93',ranged:'#ddcd82',elem:'#86ccd6',aspd:'#e9ce78',crit:'#ed9f91',eng:'#d9b575',range:'#95bddf',armor:'#a2bbc8',dodge:'#a1d8c8',speed:'#bbd18a',luck:'#a9d46f',harvest:'#d8bb73'};
const IV_PREF_COLOR={rounded:'#c6c9a0',brawler:'#d19b70',crazy:'#dc9f9a',ranger:'#d5c77f',mage:'#83c6d2',chunky:'#9bbac7',old:'#aabc9c',lucky:'#b2cf77',engineer:'#dfb66a',doctor:'#a7d6bc'};
const ivReducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function ivDrawBadge(sp,x,y,size){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sp.n,Math.round(x-size/2),Math.round(y-size/2),size,size);ctx.restore();}
function ivStatSprite(id){const key='stat:'+id;if(IV_ART_CACHE.has(key))return IV_ART_CACHE.get(key);
  const s=ivPixelArt(24,24,({r,l,p,e,ring})=>{const c=IV_STAT_COLOR[id]||'#cbbfa0';
    switch(id){
      case 'hp':p([[3,6],[6,3],[10,3],[12,6],[15,3],[19,3],[22,6],[21,12],[12,21],[3,12]],'#a34c49');p([[4,6],[7,4],[10,5],[12,9],[16,5],[19,5],[20,8],[17,14],[12,18],[7,13]],c);l(6,6,9,6,'cream');break;
      case 'regen':ring(12,12,9,9,'olive','dark');r(9,5,6,14,c);r(5,9,14,6,c);r(10,5,2,4,'light');r(6,10,3,2,'light');r(11,15,3,3,'olive');break;
      case 'steal':p([[12,2],[20,12],[19,18],[14,22],[8,21],[4,17],[5,12]],'#995566');p([[12,4],[17,12],[16,17],[12,20],[7,17],[7,13]],c);r(8,12,2,5,'light');p([[17,4],[21,3],[20,13]],'cream');break;
      case 'dmg':p([[12,2],[14,8],[21,5],[17,11],[23,15],[16,16],[14,23],[10,17],[3,21],[6,14],[1,9],[9,9]],'#b76f43');p([[12,7],[16,12],[13,18],[8,14]],c);r(11,10,3,4,'light');break;
      case 'melee':p([[18,2],[22,2],[21,7],[10,18],[6,14]],'steel');l(9,13,19,3,'light',2);l(5,13,12,20,'copper',2);l(8,17,3,22,'wood',3);r(3,20,2,2,'amber');break;
      case 'ranged':p([[8,7],[11,2],[14,7],[14,20],[8,20]],'amber');r(8,9,6,11,c);r(9,9,2,8,'light');r(7,19,8,2,'copper');p([[17,9],[19,5],[21,9],[21,20],[17,20]],'steel');r(18,10,1,7,'light');break;
      case 'elem':p([[13,2],[15,9],[20,5],[22,14],[18,21],[9,22],[3,17],[4,9],[8,13]],'#527c91');p([[13,5],[14,13],[18,10],[19,16],[15,20],[8,18],[7,14]],c);p([[12,12],[15,17],[12,20],[10,17]],'light');break;
      case 'aspd':ring(12,13,9,9,'copper','dark');l(4,9,7,6,'light');p([[14,2],[7,13],[12,13],[9,23],[19,10],[14,10]],c);r(13,6,2,3,'light');break;
      case 'crit':ring(12,12,7,7,c,'dark');l(12,2,12,8,'rose');l(12,16,12,22,'rose');l(2,12,8,12,'rose');l(16,12,22,12,'rose');r(10,10,4,4,'light');r(11,11,2,2,'red');break;
      case 'eng':for(let i=0;i<8;i++){const a=i*Math.PI/4;r(10+Math.cos(a)*8,10+Math.sin(a)*8,4,4,'copper');}ring(12,12,8,8,c,'shade');ring(12,12,4,4,'light','dark');r(10,4,3,1,'light');break;
      case 'range':ring(11,11,8,8,'steel','dark');ring(11,11,5,5,c,'cyan');l(16,17,21,22,'shade',3);l(7,9,10,6,'light');l(4,11,8,11,'light');r(11,10,2,2,'light');break;
      case 'armor':p([[3,4],[12,2],[21,4],[20,14],[16,20],[12,23],[7,20],[4,14]],'shade');p([[5,5],[12,4],[19,5],[18,13],[14,19],[12,20],[8,17]],c);l(12,5,12,18,'light');r(6,6,3,1,'light');r(15,7,3,2,'steel');break;
      case 'dodge':p([[10,3],[14,2],[18,5],[18,9],[14,15],[18,21],[12,21],[8,14],[12,8]],c);l(3,7,7,5,'steel');l(2,12,6,10,'cyan');l(4,19,7,17,'steel');r(13,4,3,2,'light');break;
      case 'speed':p([[10,3],[17,4],[16,14],[21,17],[21,21],[7,21],[7,14]],'olive');p([[10,5],[15,6],[14,15],[19,17],[19,19],[9,19],[9,14]],c);r(7,20,14,2,'cream');l(2,8,6,8,'steel');l(1,12,5,12,'steel');l(3,16,6,16,'steel');break;
      case 'luck':l(12,12,16,22,'olive',2);e(11,6,4,4,'olive');e(6,12,4,4,'olive');e(16,12,4,4,'olive');e(11,5,3,3,c);e(5,11,3,3,c);e(16,11,3,3,c);l(11,7,11,12,'light');l(6,11,10,13,'lime');r(4,9,2,1,'cream');r(14,9,2,1,'cream');break;
      case 'harvest':l(11,4,11,22,'copper',2);for(let i=0;i<4;i++){p([[11,8+i*3],[5,4+i*3],[5,8+i*3],[10,11+i*3]],'amber');p([[12,8+i*3],[18,3+i*3],[18,7+i*3],[13,11+i*3]],c);}r(10,2,2,4,'light');break;
      default:ring(12,12,8,8,c,'dark');r(10,6,4,12,'light');r(6,10,12,4,'light');
    }});IV_ART_CACHE.set(key,s);return s;
}
function ivPreferenceSprite(id){const key='pref:'+id;if(IV_ART_CACHE.has(key))return IV_ART_CACHE.get(key);
  const c=IV_PREF_COLOR[id],s=ivPixelArt(36,36,({r,l,p,e,ring})=>{
    if(id==='engineer'){r(10,24,6,4,'steel');r(22,24,6,4,'steel');r(14,21,10,4,'shade');r(17,16,3,8,'copper');p([[10,13],[15,9],[24,10],[25,18],[11,18]],'amber');r(13,11,8,3,'cream');r(23,12,8,3,'steel');r(29,11,2,5,'shade');r(12,16,3,2,'cyan');l(10,26,7,29,'copper');}
    else if(id==='doctor'){r(8,13,20,15,'cream');r(11,10,14,3,'steel');r(13,9,10,2,'steel');r(9,14,18,2,'light');r(16,17,5,9,'red');r(13,20,11,3,'red');r(8,24,3,4,'olive');r(25,24,3,4,'olive');}
    else if(id==='rounded'){p([[18,6],[21,15],[29,18],[21,21],[18,29],[15,21],[7,18],[15,15]],c);p([[18,10],[20,17],[18,21],[16,17]],'light');e(18,18,2,2,'cyan');r(17,24,2,3,'copper');}
    else if(id==='old'){p([[9,12],[18,6],[27,12],[25,24],[18,29],[11,24]],'olive');r(13,13,11,12,'steel');r(15,15,7,9,'dark');r(17,16,3,6,'amber');r(10,11,4,4,'cream');r(23,11,4,4,'cream');}
  });
  const stat={brawler:'melee',crazy:'crit',ranger:'ranged',mage:'elem',chunky:'armor',lucky:'luck'}[id];
  if(stat){const d=s.n.getContext('2d');if(id==='brawler'){const w=ivWeaponSprite('fist');d.drawImage(w.n,4,10,29,19);}else d.drawImage(ivStatSprite(stat).n,6,6,24,24);}
  IV_ART_CACHE.set(key,s);return s;
}
function ivCrateSprite(red=false,open=0){const key='crate:'+red+':'+open;if(IV_ART_CACHE.has(key))return IV_ART_CACHE.get(key);
  const s=ivPixelArt(36,40,({r:rawR,l:rawL,p:rawP})=>{const r=(x,y,w,h,c)=>rawR(x,y+8,w,h,c),l=(x,y,xx,yy,c)=>rawL(x,y+8,xx,yy+8,c),p=(pts,c)=>rawP(pts.map(([x,y])=>[x,y+8]),c);const c=red?'#bd5a50':'#83aa68',dark=red?'#603a36':'#3e5943';
    p([[4,12],[11,8],[31,8],[33,13],[32,28],[6,28]],'shade');r(6,15,25,12,dark);r(7,16,23,3,c);r(7,25,23,2,c);r(10,17,3,10,'steel');r(26,17,3,10,'steel');r(14,19,10,4,'dark');r(17,18,4,6,red?'amber':'cream');r(18,19,2,2,'light');
    const dy=-Math.min(4,open)*2;p([[4,11+dy],[11,7+dy],[30,7+dy],[33,11+dy],[31,16+dy],[5,16+dy]],c);l(8,10+dy,28,10+dy,'light');r(10,8+dy,3,8,'steel');r(26,8+dy,3,8,'steel');r(15,12+dy,10,2,dark);if(red){r(18,9+dy,3,5,'amber');r(16,11+dy,7,1,'amber');}for(const x of [7,29])r(x,23,1,1,'light');
  });IV_ART_CACHE.set(key,s);return s;
}
function ivDrawGroundCrate(k,x,y,t){const b=Math.sin(t*3.5)*1.2,c=k.legendary?'#e68b73':'#a6ca83';shadow(x,y+4,7);ivDrawBadge(ivCrateSprite(k.legendary),x,y-3+b,18);ctx.save();ctx.globalAlpha=.35+.2*Math.sin(t*4);ringC(x,y+2,9,c,1);ctx.restore();if(Math.sin(t*4+x)>.6){line(x+7,y-12,x+7,y-8,c,1);line(x+5,y-10,x+9,y-10,c,1);}}
function ivPrepareCrate(){IVU.crateOpen=false;IVU.crateAge=0;IVU.hits=[];IVU.detail=null;}
function ivCrateOffer(){const k=G.iv.crates[0];if(!k)return null;if(k.k==='i')return k;return k.offer||(k.offer=ivRollItem(k.legendary?3:ivRollTier(),false,true));}
function ivOpenCrate(){if(G.state!=='ivcrate'||!G.iv.crates.length||IVU.crateOpen)return;ivCrateOffer();IVU.crateOpen=true;IVU.crateAge=0;IVU.hits=[];AU.play('crate');}
function ivDrawCrateUI(px,panelW){const k=G.iv.crates[0];if(!k)return;const red=!!k.legendary,c=red?'#e18b79':'#a6cb83',cx=(px-8)/2,t=IVU.crateAge||0,ready=IVU.crateOpen&&(t>=.65||ivReducedMotion());
  ivTop('');ivStatsPanel(px,24,panelW,H-30);
  if(!ready){const progress=IVU.crateOpen?(ivReducedMotion()?1:clamp(t/.65,0,1)):0,y=117;
    ctx.save();ctx.globalAlpha=.07+.1*progress;disc(cx,y,44+12*progress,c);ctx.restore();
    if(progress>0){ctx.save();for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=20+progress*45;ctx.globalAlpha=(1-progress)*.8;line(cx+Math.cos(a)*rr,y+Math.sin(a)*rr,cx+Math.cos(a)*(rr+5),y+Math.sin(a)*(rr+5),c,1);}ctx.restore();}
    ivDrawBadge(ivCrateSprite(red,Math.round(clamp((progress-.08)/.55,0,1)*4)),cx,y-Math.sin(progress*Math.PI)*5,80);
    ivBtn({x:cx-62,y:204,w:124,h:24,f:ivOpenCrate},'开启',c);
  }else{const o=ivCrateOffer(),x=Math.round(cx-68),y=44;ivCard(x,y,136,145,o,false);IVU.hits.push({x,y,w:136,h:145,f:()=>ivOpenDetail(o)});
    ivBtn({x,y:199,w:65,h:24,f:()=>ivCrate(true)},'收下',c,ivItemOk(o.id));ivBtn({x:x+71,y:199,w:65,h:24,f:()=>ivCrate(false)},'回收 +'+ivRecycleValue(o),'#b7c996');}
}

// Short curtains are drawn after all overlays, so truck arrivals remain visible.
// They never swallow input: selecting during a cut simply starts the next cut.
function ivTransition(label){IVU.motion={t:0,d:ivReducedMotion()?.10:.42,label};}
const _ivPresentationBegin=ivBegin;ivBegin=function(){_ivPresentationBegin();ivPrepareCrate();ivTransition('营地接驳 / 选择偏好');};
const _ivPresentationRole=ivChooseRole;ivChooseRole=function(id){const before=G.state;_ivPresentationRole(id);if(G.state!==before)ivTransition('偏好已载入 / 选择装备');};
const _ivPresentationWave=ivStartWave;ivStartWave=function(){_ivPresentationWave();ivTransition('闸门开启 / 第 '+G.iv.wave+' 波');};
const _ivPresentationNext=ivNextScreen;ivNextScreen=function(){_ivPresentationNext();ivTransition(({ivcrate:'开启补给',ivlv:'选择强化',ivshop:'营地补给 / 整备',win:'抵抗完成 / 返回营地'})[G.state]||'整备');};
const _ivPresentationShop=ivOpenShop;ivOpenShop=function(){_ivPresentationShop();ivTransition('营地补给 / 整备');};
const _ivPresentationLv=ivLvPick;ivLvPick=function(o){_ivPresentationLv(o);if(G.state==='ivlv')ivTransition('选择强化');};
const _ivPresentationReroll=ivReroll;ivReroll=function(){const rr=G.iv.rr,free=G.iv.freeRolls;_ivPresentationReroll();if(rr!==G.iv.rr||free!==G.iv.freeRolls)IVU.shopPulse=.25;};
const _ivPresentationUpdate=update;update=function(dt){if(ivOn()&&G.iv){if(IVU.motion){IVU.motion.t+=dt;if(IVU.motion.t>=IVU.motion.d)IVU.motion=null;}if(G.state==='ivcrate'&&IVU.crateOpen)IVU.crateAge+=dt;IVU.shopPulse=Math.max(0,(IVU.shopPulse||0)-dt);}
  const previous=G.state;_ivPresentationUpdate(dt);if(ivOn()&&previous==='ivstart'&&G.state==='ivrole')ivTransition('返回 / 选择偏好');};
const _ivPresentationRender=render;render=function(){_ivPresentationRender();if(!ivOn()||!G.iv)return;
  if(IVU.shopPulse&&G.state==='ivshop'){beginUI();ctx.save();ctx.globalAlpha=IVU.shopPulse*.25;rect(9,25,W-126,136,TH.ember);ctx.restore();}
  const m=IVU.motion;if(!m||G.state==='pause')return;beginUI();ctx.save();const k=clamp(m.t/m.d,0,1);
  if(ivReducedMotion()){ctx.globalAlpha=(1-k)*.55;rect(0,0,W,H,'#000');}else ivDrawShutter(k);
  ctx.restore();};

function ivDrawExplosion(f,cx,cy){const x=f.x-cx,y=f.y-cy,t=1-f.life/f.max,r=f.r,k=1-t;ctx.save();
  ctx.globalAlpha=.45*k;ringC(x,y,r*Math.min(1,t*3.4),'#d9ac72',1);
  for(let i=0;i<7;i++){const a=i*2.399963+f.seed,rr=r*.33*Math.sqrt(t),xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr*.65-t*6,sz=Math.max(1,r*(.12+.07*Math.sin(i+f.seed))*(.5+t));ctx.globalAlpha=.32*k;disc(xx,yy,sz,'#58564b');if(t<.55){ctx.globalAlpha=(1-t/.55)*.72;disc(xx,yy,sz*1.25,i%2?'#c57842':'#dda756');ctx.globalAlpha=(1-t/.55)*.6;disc(xx,yy-1,sz*.55,'#efce86');}}
  if(t<.32){ctx.globalAlpha=(1-t/.32)*.8;disc(x,y,Math.max(2,r*.15),'#efd5a0');}
  for(let i=0;i<9;i++){const a=i*2.399963+f.seed,d=r*(.2+t*.85);ctx.globalAlpha=k*.8;line(x+Math.cos(a)*d,y+Math.sin(a)*d,x+Math.cos(a)*(d+3*k),y+Math.sin(a)*(d+3*k),'#d9ab65',1);}ctx.restore();
}
const _ivPresentationCombat=ivDrawCombatVisuals;ivDrawCombatVisuals=function(cx,cy){
  for(const q of G.iv.shots){const trail=q.trail||[],fx=ivShotStyle(q);if(!['rocket','grenade','plasma','glob','crystal','arc','needle'].includes(fx))continue;ctx.save();const color=({rocket:'#aa8b61',grenade:'#a89a72',plasma:'#8bb9d5',glob:'#b2c684',crystal:'#82c9c4',arc:'#9bd4d5',needle:'#ce9191'})[fx];for(let i=1;i<trail.length;i++){ctx.globalAlpha=.06+i/trail.length*.2;line(trail[i-1].x-cx,trail[i-1].y-cy,trail[i].x-cx,trail[i].y-cy,color,fx==='rocket'?2:1);}ctx.restore();}
  for(const f of G.iv.visualFx||[])if(f.kind==='explosion')ivDrawExplosion(f,cx,cy);
  _ivPresentationCombat(cx,cy);
};
