// Invasion-only character, item and combat rules. No exploration tables are mutated.
'use strict';
function ivEffectStats() {
  const iv=G.iv, role=ivRole(), factor=k=>role?.scale?.[k]??1;
  if(!iv.cache){
    const s={...iv.base};
    for(const [id,n] of Object.entries(iv.items))for(const [k,v] of Object.entries(IV_I[id].m))s[k]=(s[k]||0)+v*n;
    for(const [k,n] of Object.entries(ivSetCounts()))if(n>=2){const set=IV_SETS[k];s[set.st]+=set.v[Math.min(6,n)-2];}
    for(const w of iv.w){if(w.id==='hand')s.harvest+=[3,6,12,25][w.t];if(w.id==='chopper')s.food+=[1,1,1,2][w.t];
      if(w.id==='jousting_lance')s.speed+=[2,3,4,5][w.t];if(w.id==='rock'){s.armor+=[0,1,1,2][w.t];s.hp+=[0,0,2,2][w.t];}}
    for(const k in s)s[k]*=factor(k);
    for(const [k,v] of Object.entries(role?.base||{}))s[k]+=v;
    const add=(k,n)=>s[k]+=n*factor(k), distinct=new Set(iv.w.map(w=>w.id)).size;
    add('hp',distinct*ivCount('jelly'));
    add('aspd',distinct*(6*ivCount('spider')-3*ivCount('focus')));
    add('eng',Math.max(0,s.elem)*ivCount('strange_book'));
    add('hp',Math.max(0,s.armor)*ivCount('stone_skin'));
    add('regen',Math.max(0,-s.speed)*2*ivCount('esty_s_couch'));
    add('dmg',s.speed*ivCount('power_generator')+s.kb*ivCount('coil'));
    add('luck',Math.max(0,s.crit)*2*ivCount('lucky_coin'));
    if(ivCount('fairy'))add('regen',Object.keys(iv.items).filter(id=>iv.items[id]>0).reduce((v,id)=>v+(IV_I[id].t===0?1:IV_I[id].t===3?-3:0),0));
    iv.cache=s;
  }
  const s={...iv.cache}, add=(k,n)=>s[k]+=n*factor(k), fighting=iv.phase==='fight', ticks=fighting?Math.floor((iv.elapsed||0)/5):0;
  add('hp',Math.floor(G.ink/80)*ivCount('padding'));
  if(iv.hpCap!==undefined)s.hp=Math.min(s.hp,iv.hpCap-10);
  if(iv.speedCap!==undefined)s.speed=Math.min(s.speed,iv.speedCap);
  s.hp=Math.max(-9,s.hp);
  if(role?.id==='chunky')s.dmg+=Math.floor((10+s.hp)/3);
  if(fighting){
    if((iv.still||0)>=.5){add('armor',8*ivCount('barricade'));add('dodge',20*ivCount('chameleon'));add('aspd',40*ivCount('statue'));
      for(const w of iv.w)if(w.id==='jousting_lance')s.dmg-=[10,15,20,25][w.t];}
    add('aspd',ivCount('community_support')*ivLiving().length);
    add('regen',ivCount('fried_rice')*G.enemies.filter(e=>!e.dead&&e.ivBurn?.n>0).length+2*ticks*ivCount('medikit'));
    add('dmg',5*ticks*ivCount('wisdom')-2*(iv.waveHits||0)*ivCount('triangle_of_power'));
    const moth=(iv.pets||[]).some(p=>p.id==='doc_moth'&&dist(p.x,p.y,G.p.x,G.p.y)<42);
    if(moth){s.regen*=2;s.steal*=2;}
    if(ivCount('regeneration_potion')&&G.p.hp<(10+s.hp)/2)s.regen*=2;
    for(const w of iv.w)if(w.id==='sharp_tooth')add('steal',Math.floor((1-G.p.hp/(10+s.hp))*100/[25,20,15,10][w.t]));
    s.xp+=(iv.waveMods?.celery_tea||0)*50+(iv.waveMods?.peacock||0)*100;
    s.enemyHp+=(iv.waveMods?.celery_tea||0)*100;
  }
  add('dmg',Math.max(0,s.steal)*2*ivCount('bloody_hand'));
  add('aspd',Math.max(0,s.dodge)*2*ivCount('retromation_s_hoodie'));
  return s;
}
function ivSyncStats(){const s=ivStats(),p=G.p;p.maxHp=Math.max(1,Math.round(10+s.hp));p.hp=Math.min(p.hp,p.maxHp);G.S.speed=Math.max(.3,1+s.speed/100);}
function ivGainItem(id){
  if(!IV_I[id]||!ivItemOk(id))return false;
  const iv=G.iv,s=ivStats(),max=G.p.maxHp,hadSnow=ivCount('snowball');
  iv.items[id]=ivCount(id)+1;
  if(id==='handcuffs')iv.hpCap=max;
  if(id==='shackles')iv.speedCap=s.speed;
  if(hadSnow&&(IV_I[id].m.elem||0)>0)iv.base.elem++;
  if(['bait','celery_tea','lure','peacock','weird_ghost','hourglass'].includes(id))iv.pending[id]=(iv.pending[id]||0)+1;
  if(id==='hourglass')iv.wave=Math.max(0,iv.wave-1);
  ivDirty();return true;
}
function ivShopEffects(){const iv=G.iv;iv.freeRolls=ivCount('dangerous_bunny');
  if(ivCount('anvil')){const pool=iv.w.filter(w=>w.t<3);if(pool.length)choice(pool).t++;else iv.base.armor+=2;ivDirty();}}
function ivShopRerollCost(){return G.iv.freeRolls>0?0:ivRerollCost();}
function ivWaveEffects(){
  const iv=G.iv,p=G.p;iv.elapsed=0;iv.still=0;iv.lastPos={x:p.x,y:p.y};iv.waveHits=iv.waveBurnKills=iv.stomach=0;iv.waveTimers={};iv.procQueue=[];
  iv.waveMods=iv.pending||{};iv.pending={};iv.blocks=ivCount('tardigrade');iv.pets=[];iv.trees=[];iv.drones=[];iv.healShots=[];iv.buildAnchor=null;iv.buildIndex=0;iv.crateDrops=0;
  if(ivCount('piggy_bank')&&iv.wave<20)G.ink+=Math.floor(G.ink*.2);
  if(ivCount('candy_bag')){for(let i=0;i<8;i++)iv.base[choice(IV_STATS)[0]]++;if(Math.random()<.1)iv.champs.push(iv.dur-5);}
  ivDirty();p.hp=p.maxHp;
  if(ivCount('sad_tomato'))p.hp=Math.max(1,Math.ceil(p.maxHp*.5));
  if(iv.waveMods.weird_ghost||iv.waveMods.hourglass)p.hp=1;
  for(const id of ['turret','explosive_turret','laser_turret','incendiary_turret','medical_turret','garden','bot_o_mine','tyler'])for(let i=0;i<ivCount(id);i++)ivBuild(id);
  for(const w of iv.w){if(w.id==='wrench'||IV_W[w.id].turret)ivBuild(['turret','incendiary_turret','laser_turret','explosive_turret'][w.t]);
    if(w.id==='pruner'){const s=ivBuild('garden');s.period=[15,14,12,10][w.t];}}
  for(const id of ['blazemander','bonk_dog','catling_gun','doc_moth','jellyshield','lootworm','ratzilla','scapegoat','wandering_bot'])for(let i=0;i<ivCount(id);i++)iv.pets.push({id,x:p.x+rand(-35,35),y:p.y+rand(-35,35),a:rand(0,6.283),cd:.5,special:0,hp:20+iv.wave*3,revive:0});
  iv.treeTimer=8;for(let i=0;i<1+ivCount('tree');i++)ivGrowTree();
  for(let b=0;b<(iv.waveMods.bait||0);b++){const n=randi(7,8);for(let i=0;i<n;i++){const [x,y]=ivFree(120);ivSpawn('lamprey',x,y);}}
  for(let i=0;i<(iv.waveMods.lure||0)*2;i++){const [x,y]=ivFree(120),e=ivSpawn('looter',x,y);if(e)e.ivLoot=true;}
}
function ivWaveEndEffects(){const iv=G.iv;
  iv.base.hp+=3*ivCount('grind_s_magical_leaf')-ivCount('robot_arm');iv.base.regen+=ivCount('grind_s_magical_leaf');iv.base.steal+=ivCount('grind_s_magical_leaf');
  iv.base.melee+=3*ivCount('robot_arm');iv.base.eng+=3*ivCount('robot_arm');iv.base.dmg+=3*ivCount('vigilante_ring');iv.base.xp+=5*ivCount('celery_tea');
  iv.pets=[];iv.trees=[];iv.procQueue=[];iv.waveMods={};ivDirty();
}
function ivEvery(key,dt,period,fn){const timers=G.iv.waveTimers;timers[key]=(timers[key]||0)+dt;while(timers[key]>=period){timers[key]-=period;fn();if(!G.p.alive)break;}}
function ivEffectTick(dt){const iv=G.iv,p=G.p;iv.elapsed+=dt;
  iv.still=dist(p.x,p.y,iv.lastPos.x,iv.lastPos.y)<.1?(iv.still||0)+dt:0;iv.lastPos={x:p.x,y:p.y};ivSyncStats();
  ivEvery('second',dt,1,()=>{const self=ivCount('blood_donation')+ivCount('bloody_hand');if(self)ivHurt(self,p.x,p.y,true);if(p.alive&&ivCount('torture'))ivHealP(5,'torture');});
  if(!p.alive)return;
  if(ivCount('alien_eyes'))ivEvery('eyes',dt,3,()=>{for(let i=0;i<6*ivCount('alien_eyes');i++)ivProjectile(p.x,p.y,i/(6*ivCount('alien_eyes'))*Math.PI*2,6+.5*p.maxHp,{crit:ivStats().crit/100}, {life:2,fx:'plasma'});});
  const structureTime=dt*ivStructureRate();
  if(ivCount('landmines'))ivEvery('mines',structureTime,12,()=>{for(let i=0;i<ivCount('landmines');i++)ivBuild('mine');});
  iv.w.forEach((w,i)=>{if(w.id==='screwdriver')ivEvery('screw'+i,structureTime,[12,9,6,3][w.t],()=>ivBuild('mine'));});
  iv.treeTimer-=dt;if(iv.treeTimer<=0){iv.treeTimer=10/(1+ivCount('tree')*.5);ivGrowTree();}
  for(const e of G.enemies){if(e.ivVulnerable>0)e.ivVulnerable-=dt;if(e.ivBotSlow>0)e.ivBotSlow-=dt;}
  ivUpdatePets(dt);
  for(let i=0;i<128&&iv.procQueue.length;i++)iv.procQueue.shift()();
}
function ivCollect(k,byPet=false){const iv=G.iv,st=ivStats(),p=G.p;
  if(k.kind==='ink'){
    let n=1;if(Math.random()<ivCount('metal_detector')*.05)n*=2;if(byPet&&Math.random()<.1)n*=2;ivGainMat(n);
    if(Math.random()<ivCount('cute_monkey')*.08)ivHealP(1);
    if(iv.role==='lucky'&&Math.random()<.75)ivRandomDamage(1+.15*st.luck);
    if(ivCount('baby_elephant')&&Math.random()<.25)ivRandomDamage((1+.25*st.luck)*ivCount('baby_elephant'));
    AU.play('ink',1,.4);
  }else{
    if(p.hp>=p.maxHp&&ivCount('extra_stomach')&&iv.stomach<8){iv.base.hp++;iv.stomach++;ivDirty();}
    ivHealP(k.legendary?100:Math.max(1,3+st.food));
    if(k.kind==='crate'){iv.crates.push({legendary:!!k.legendary});G.ink+=15*ivCount('bag');AU.play('crate');}else AU.play('heal');
    if(Math.random()<.5*ivCount('spicy_sauce'))ivExplosion(p.x,p.y,40,ivScaleDamage(10+p.maxHp),{effect:true});
  }
  ivDirty();
}
function ivDrop(kind,x,y,extra={}){if(kind==='crate')G.iv.crateDrops=(G.iv.crateDrops||0)+1;const attract=kind==='ink'&&Math.random()<.25*ivCount('baby_gecko')+ivCount('sifd_s_relic');G.picks.push({kind,x,y,vx:rand(-35,35),vy:rand(-35,35),t:0,attract,...extra});}
const ivScaleDamage = n => Math.max(1,n*Math.max(0,1+ivStats().dmg/100));
function ivRandomDamage(n){const pool=ivLiving().filter(e=>e.spawnT<=0);if(pool.length)ivHit(choice(pool),ivScaleDamage(n),{effect:true,c:C.gold},0);}
function ivKillEffects(e,o){const iv=G.iv,st=ivStats(),lk=Math.max(0,1+st.luck/100);let n=e.ivLoot?8:e.boss||e.champ?10:(e.ivDef?.mat||1)+(Math.random()<Math.min(.6,.035*iv.wave)?1:0);
  if(!e.ivMajor&&iv.event?.kind==='horde'&&Math.random()<.35)n=0;
  n*=Math.max(0,1+st.materials/100);n=Math.floor(n)+(Math.random()<n%1?1:0);
  if(o.ivMat&&Math.random()<o.ivMat)n++;
  if(o.crit&&Math.random()<ivCount('hunting_trophy')*.33)n++;
  if(o.crit&&Math.random()<ivCount('tentacle')*.2)ivHealP(1);
  for(let i=0;i<n;i++)ivDrop('ink',e.x,e.y);
  if(e.ivLoot||!e.boss&&Math.random()<.03*lk*(1+ivCount('fruit_basket')*.5))ivDrop('food',e.x,e.y);
  if(e.ivLoot||e.boss||e.champ||Math.random()<.01*lk/(1+(iv.crateDrops||0)))ivDrop('crate',e.x,e.y,{legendary:!!(e.boss||e.champ)});
  if(e.ivBurn?.n>0&&ivCount('will_o_wisp')){iv.waveBurnKills++;if(iv.waveBurnKills%30===0&&iv.waveBurnKills<=120){iv.base.elem+=ivCount('will_o_wisp');ivDirty();}}
  if(o.slot){const w=o.slot;w.kills=(w.kills||0)+1;if(['ghost_flint','ghost_scepter'].includes(w.id)&&w.kills%[20,18,16,12][w.t]===0){iv.base[w.id==='ghost_flint'?'aspd':'hp']++;ivDirty();}}
  for(let i=0;i<ivCount('baby_with_a_beard');i++){const tg=ivNearest(e.x,e.y,400);if(tg)ivProjectile(e.x,e.y,ang(e.x,e.y,tg.x,tg.y),ivScaleDamage(1+st.ranged),{effect:true},{life:2,fx:'nail'});}
  if(ivCount('cyberball')&&Math.random()<.25)iv.procQueue.push(()=>ivRandomDamage((1+.25*st.luck)*ivCount('cyberball')));
  if(Math.random()<.2*ivCount('rip_and_tear'))iv.procQueue.push(()=>ivExplosion(e.x,e.y,28,ivScaleDamage(10+.5*st.melee),{effect:true}));
}
function ivHurt(dmg,sx,sy,self=false){const p=G.p,iv=G.iv;
  if(!p.alive||G.state!=='play'||iv.phase!=='fight'||(typeof TST!=='undefined'&&TST.god)||(!self&&p.inv>0))return false;
  const st=ivStats();
  if(!self&&Math.random()<Math.min(ivCount('ghost_outfit')?.7:.6,Math.max(0,st.dodge)/100)){
    floatText(p.x,p.y-14,L('iv_dodge'),C.green,1,.5);
    if(ivCount('adrenaline')&&Math.random()<.5)ivHealP(5);
    if(ivCount('riposte')){const tg=ivNearest(sx,sy,12);if(tg)ivHit(tg,ivScaleDamage((1+3*st.melee)*ivCount('riposte')),{effect:true},0);}
    return false;
  }
  if(!self&&iv.blocks>0){iv.blocks--;p.inv=.5;ringFx(p.x,p.y,13,C.gold,.2,2);return false;}
  const mul=st.armor>=0?1/(1+st.armor/15):1-st.armor/15,n=self?dmg:Math.max(1,Math.round(dmg*mul));
  p.hp-=n;iv.waveHits++;p.lastHit=0;G.hits=(G.hits||0)+1;
  if(!self){p.inv=.5;AU.play('hurt');shake(.2,true);flash(C.red,.2,true);}floatText(p.x,p.y-16,'-'+n,C.red,1,.6);
  if(p.hp<=0){p.hp=0;p.alive=false;G.state='dead';G.endT=0;ivFinish(false);AU.play('death');AU.setMode('calm');}
  return true;
}
const ivTargets=()=>[...G.enemies,...G.iv.trees].filter(e=>!e.dead);
function ivNearest(x,y,r,filter=()=>true){let best=null;for(const e of ivTargets()){if(e.dead||e.spawnT>0||!filter(e))continue;const d=dist(x,y,e.x,e.y);if(d<r){r=d;best=e;}}return best;}
function ivProjectile(x,y,a,dmg,ho={},extra={}){const speed=extra.speed||230,st=ivStats();const q={x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1.3,dmg:Math.max(1,dmg),ho:{kb:Math.max(0,st.kb)*4,...ho},pierce:0,bounce:0,expl:0,split:0,hit:new Set(),c:ho.c||C.cyan,...extra};
  q.pierce+=ivCount('bandana')+ivCount('sharp_bullet');q.bounce+=ivCount('ricochet');q.pierceMul=Math.max(0,Math.min(1,(extra.pierceMul??.5)+st.pierceDmg/100));q.age=0;q.maxLife=q.life;
  if(extra.fx==='laser')ivBeam(x,y,a,speed*q.life,dmg,q.ho,q);else G.iv.shots.push(q);return q;}
function ivExplosion(x,y,r,dmg,o={},exclude=new Set()){
  const st=ivStats();r*=Math.max(.1,1+st.expl/100);dmg*=Math.max(0,1+st.explDmg/100);ivAddVisual({kind:'explosion',x,y,r,seed:Math.random()*Math.PI*2,life:.48});
  for(const e of ivTargets())if(!e.dead&&!exclude.has(e)&&dist(x,y,e.x,e.y)<r+e.r)ivHit(e,dmg,{...o,explosion:true},ang(x,y,e.x,e.y));
}
function ivBurn(e,dmg,n=3,spread=true){if(e.dead||e.ivTree)return;
  const old=e.ivBurn;if(!old||dmg>=old.dmg)e.ivBurn={dmg:Math.max(1,dmg),n,t:1};
  if(spread){let left=ivCount('snake');for(const other of ivLiving().filter(o=>o!==e&&!o.ivBurn&&dist(o.x,o.y,e.x,e.y)<65).sort((a,b)=>dist(a.x,a.y,e.x,e.y)-dist(b.x,b.y,e.x,e.y))){if(left--<=0)break;ivBurn(other,dmg,n,false);}}
}
function ivBurnTick(e,dt){const b=e.ivBurn;if(!b||b.n<=0)return false;
  const period=Math.max(.2,1-.2*ivCount('eyes_surgery')+ivCount('frozen_heart'));b.t-=dt;
  while(b.t<=0&&b.n>0&&!e.dead){b.t+=period;const dmg=b.dmg+(ivCount('greek_fire')?e.hp*(e.ivMajor?.01:.1):0);ivHit(e,dmg,{effect:true,burning:true,c:C.orange},0);b.n--;}
  if(b.n<=0)e.ivBurn=null;return e.dead;
}
function ivHit(e,dmg,o={},ka=0){o.lastCrit=false;if(!e||e.dead||e.spawnT>0||e.inv>0)return false;
  if(e.ivTree){e.hp-=ivCount('lumberjack_shirt')?e.hp:dmg;e.flash=.1;if(e.hp<=0)ivKillTree(e);return true;}
  const st=ivStats(),crit=Math.random()<(o.crit||0),cm=o.cm||2;
  if(e.ivMajor)dmg*=Math.max(0,1+st.bossDmg/100);if(e.ivVulnerable>0)dmg*=1.1;
  if(crit&&ivCount('giant_belt'))dmg+=e.hp*(e.ivMajor?.01:.1)/cm;
  G.S.critMul=cm;let hit;
  try{hit=hitEnemy(e,Math.max(1,dmg),{proc:0,knock:o.kb||0,ka,critBonus:crit?1:0,color:o.c,quiet:o.quiet,ivMat:o.matKill,ivRanged:o.ivRanged,slot:o.slot});}finally{G.S.critMul=2;}
  if(hit!==true)return hit;
  const iv=G.iv;
  if(!o.effect&&!o.structure&&iv.lsN<10&&Math.random()<Math.max(0,st.steal/100+(o.heal||0))){iv.lsN++;ivHealP(1);}
  if(!e.dead){
    if(o.elemental&&ivCount('ice_cube')&&!e.ivIced){e.ivIced=true;e.ivVulnerable=3;}
    if(!o.effect){
      const sausage=o.structure?0:ivCount('scared_sausage');if(o.burn||Math.random()<sausage*.25)ivBurn(e,o.fixedBurn?(o.structure?o.burn:ivScaleDamage(o.burn)):ivScaleDamage((o.burn||0)+sausage+st.elem),o.burnN||3);
      if(ivCount('ugly_tooth'))e.ivTooth=Math.min(.2,(e.ivTooth||0)+.05);
    }
    if(o.slow){e.slowT=1.5;e.slowMul=e.ivMajor?.85:.6;}
  }
  if(o.slot){const w=o.slot;
    if(w.id==='thief_dagger'&&e.dead&&crit&&Math.random()<[.5,.56,.62,.8][w.t])ivGainMat(1);
    if(w.id==='cacti_club')for(let i=0;i<3+w.t;i++)ivProjectile(e.x,e.y,rand(0,Math.PI*2),ivScaleDamage(1+w.t+[.6,.7,.8,1][w.t]*st.ranged),{effect:true},{fx:'nail'});
    if(w.id==='lightning_shiv'){const tg=ivNearest(e.x,e.y,160,q=>q!==e);if(tg)ivProjectile(e.x,e.y,ang(e.x,e.y,tg.x,tg.y),ivScaleDamage([5,6,8,11][w.t]+.8*st.elem),{elemental:true},{bounce:w.t,hit:new Set([e])});}
    if(w.id==='plank'&&!o.explosion&&Math.random()<[.25,.3,.4,.5][w.t])ivExplosion(e.x,e.y,24,dmg,{effect:true},new Set([e]));
  }
  if(o.chain&&!o.effect){const hitSet=new Set([e]);let cur=e;for(let i=0;i<o.chain;i++){const tg=ivNearest(cur.x,cur.y,85,q=>!hitSet.has(q));if(!tg)break;hitSet.add(tg);G.bolts.push({pts:zig(cur.x,cur.y,tg.x,tg.y),life:.14,max:.14,c:C.cyan});ivHit(tg,dmg*.6,{effect:true,elemental:true},0);cur=tg;}}
  o.lastCrit=crit;return true;
}
function ivGrowTree(){const iv=G.iv;if(iv.trees.filter(t=>!t.dead).length>=20)return;const [x,y]=ivFree(40);iv.trees.push({ivTree:true,x,y,r:7,hp:5+iv.wave*2,spawnT:0,inv:0,dead:false,flash:0});}
function ivKillTree(e){if(e.dead)return;e.dead=true;const lk=Math.max(0,1+ivStats().luck/100);ivDrop(Math.random()<.2*lk/(1+(G.iv.crateDrops||0))?'crate':'food',e.x,e.y);if(ivCount('pocket_factory'))ivBuild('turret',e.x,e.y);burst(e.x,e.y,8,C.green,40,.3);}
function ivBuild(k,x,y){if(x===undefined){if(G.iv.role==='engineer'&&k!=='mine'){const iv=G.iv;if(!iv.buildAnchor){const [ax,ay]=ivFree(45);iv.buildAnchor=[clamp(ax,100,WORLD.w*T-100),clamp(ay,100,WORLD.h*T-100)];}const i=iv.buildIndex++,a=i*2.399963,rad=17*Math.sqrt(i);x=clamp(iv.buildAnchor[0]+Math.cos(a)*rad,32,WORLD.w*T-32);y=clamp(iv.buildAnchor[1]+Math.sin(a)*rad,32,WORLD.h*T-32);}else [x,y]=ivFree(40);}const s={k,x,y,cd:.5,a:0,t:0,special:0};G.iv.str.push(s);return s;}
function ivStructureRate(){const st=ivStats();return Math.max(.1,1+(st.structureSpeed+ivCount('improved_tools')*st.aspd*.5)/100);}
function ivUpdateStructures(dt){const iv=G.iv,st=ivStats(),eng=st.eng,rate=ivStructureRate();
  for(const s of [...iv.str]){s.t+=dt*rate;s.flash=Math.max(0,(s.flash||0)-dt);s.cd-=dt*rate;s.special+=dt*rate;
    const ho={structure:true,crit:ivCount('pile_of_books')?Math.max(0,st.crit)/100:0,c:'#7fa3a8'};
    if(s.k==='garden'){if(s.t>=(s.period||15)){s.t=0;ivDrop('food',s.x,s.y);}continue;}
    if(s.k==='medical_turret'){if(s.cd<=0&&G.p.hp<G.p.maxHp&&dist(s.x,s.y,G.p.x,G.p.y)<100){s.cd=2;iv.healShots=iv.healShots||[];iv.healShots.push({x:s.x,y:s.y-7,heal:Math.max(1,3+.05*eng),life:3});}continue;}
    if(s.k==='mine'){if(s.t>.8&&ivLiving().some(e=>e.spawnT<=0&&dist(e.x,e.y,s.x,s.y)<e.r+8)){iv.str.splice(iv.str.indexOf(s),1);ivExplosion(s.x,s.y,30,Math.max(1,10+eng),ho);}continue;}
    if(s.k==='bot_o_mine'&&s.special>=5){s.special=0;ivBuild('mine',s.x+rand(-25,25),s.y+rand(-25,25));}
    const tg=ivNearest(s.x,s.y,180);if(!tg||s.cd>0)continue;s.flash=.12;s.a=ang(s.x,s.y-7,tg.x,tg.y);s.cd=s.k==='tyler'?3:1;
    if(s.k==='tyler'){for(let i=0;i<10;i++)ivProjectile(s.x,s.y,i/10*Math.PI*2,Math.max(1,12+.9*eng+.9*st.elem),{...ho,slow:1},{pierce:99,speed:90,life:2,fx:'arc'});continue;}
    if(s.k==='incendiary_turret'){ivProjectile(s.x,s.y-7,s.a,1,{...ho,burn:Math.max(1,5+.33*eng),burnN:8,fixedBurn:true},{fx:'flame',flame:true,pierce:99,life:.6});continue;}
    const dmg=s.k==='explosive_turret'?25+1.5*eng:s.k==='laser_turret'?20+1.25*eng:s.k==='bot_o_mine'?10+eng:10+.8*eng;
    ivProjectile(s.x,s.y-7,s.a,Math.max(1,dmg),ho,{expl:s.k==='explosive_turret'?30:0,pierce:s.k==='laser_turret'?99:0,fx:s.k==='laser_turret'?'laser':s.k==='explosive_turret'?'grenade':'bullet'});
  }
  for(const q of iv.healShots||[]){const p=G.p,a=ang(q.x,q.y,p.x,p.y);q.x+=Math.cos(a)*180*dt;q.y+=Math.sin(a)*180*dt;q.life-=dt;if(dist(q.x,q.y,p.x,p.y)<10){ivHealP(Math.round(q.heal));q.life=0;}}
  iv.healShots=(iv.healShots||[]).filter(q=>q.life>0);
}
function ivUpdatePets(dt){const iv=G.iv,p=G.p,st=ivStats();
  for(const q of iv.pets){q.cd-=dt;q.special+=dt;q.a+=dt;
    if(q.id==='jellyshield'){q.x=p.x+Math.cos(q.a)*28;q.y=p.y+Math.sin(q.a)*28;continue;}
    if(q.id==='scapegoat'&&q.hp<=0){if(dist(q.x,q.y,p.x,p.y)<24)q.revive+=dt;else q.revive=0;if(q.revive>=2){q.hp=20+iv.wave*3;q.revive=0;}continue;}
    let tg=ivNearest(q.x,q.y,200),tx=p.x+Math.cos(q.a*.5)*50,ty=p.y+Math.sin(q.a*.5)*50;
    if(q.id==='lootworm'){tg=G.picks.find(k=>k.kind==='ink')||iv.trees.find(t=>!t.dead);}
    if(tg&&!['catling_gun','doc_moth','wandering_bot','scapegoat'].includes(q.id)){tx=tg.x;ty=tg.y;}
    const a=ang(q.x,q.y,tx,ty),v=q.id==='bonk_dog'&&q.special>=5?250:65,d=dist(q.x,q.y,tx,ty);q.facing=a;q.x=clamp(q.x+Math.cos(a)*Math.min(d,v*dt),T*2,(WORLD.w-2)*T);q.y=clamp(q.y+Math.sin(a)*Math.min(d,v*dt),T*2,(WORLD.h-2)*T);
    if(q.id==='lootworm'&&tg&&dist(q.x,q.y,tg.x,tg.y)<10){if(tg.ivTree)ivKillTree(tg);else{const i=G.picks.indexOf(tg);if(i>=0){G.picks.splice(i,1);ivCollect(tg,true);}}continue;}
    if(q.id==='wandering_bot'){for(const e of ivLiving())if(dist(q.x,q.y,e.x,e.y)<40)e.ivBotSlow=.15;continue;}
    if(q.id==='scapegoat'){for(const e of ivLiving())if(dist(q.x,q.y,e.x,e.y)<e.r+7&&q.cd<=0){q.hp-=e.ivDamage;q.cd=.5;}continue;}
    if(q.id==='catling_gun'&&tg&&q.cd<=0){q.cd=dist(q.x,q.y,p.x,p.y)<45||iv.pets.some(o=>o!==q&&dist(o.x,o.y,q.x,q.y)<45)?.5:1;ivProjectile(q.x,q.y,ang(q.x,q.y,tg.x,tg.y),ivScaleDamage(10+.6*st.ranged),{effect:true});}
    if(q.id==='blazemander'&&q.special>=4){q.special=0;for(let i=0;i<8;i++)ivProjectile(q.x,q.y,i/8*Math.PI*2,ivScaleDamage(1+.01*st.elem),{burn:3+.5*st.elem,burnN:5,fixedBurn:true},{flame:true});}
    if(q.id==='bonk_dog'&&q.special>=5&&tg&&dist(q.x,q.y,tg.x,tg.y)<14){q.special=0;ivExplosion(q.x,q.y,30,ivScaleDamage(8+.4*st.melee),{effect:true});}
    if(tg&&q.cd<=0&&dist(q.x,q.y,tg.x,tg.y)<15&&['ratzilla','bonk_dog','blazemander'].includes(q.id)){
      q.cd=.8;const dmg=q.id==='ratzilla'?5+.1*p.maxHp:q.id==='bonk_dog'?10+.6*st.melee:1+.01*st.elem;
      ivHit(tg,ivScaleDamage(dmg),{effect:true},a);if(q.id==='blazemander')ivBurn(tg,ivScaleDamage(3+.5*st.elem),5);
    }
  }
}
function ivEnemySpeed(e){return Math.max(.1,1+ivStats().enemySpeed/100)*(1-(e.ivTooth||0))*(e.ivBotSlow>0?.5:1);}
function ivEnemyTarget(e){return G.iv.pets.find(q=>q.id==='scapegoat'&&q.hp>0)||G.p;}
const _ivEffectsGround=drawSupportGround;drawSupportGround=function(cx,cy){_ivEffectsGround(cx,cy);if(!ivOn())return;
  for(const t of G.iv.trees)if(!t.dead){const x=t.x-cx,y=t.y-cy;rect(x-2,y-4,4,10,'#8b6340');disc(x,y-8,8,'#5d8750');disc(x-4,y-10,5,'#8ab25e');}
  ivDrawCompanions(cx,cy);
};
