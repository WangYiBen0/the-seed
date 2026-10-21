// Invasion-only combat presentation and transient ground marks.
'use strict';
const IV_DECAL_HOLD=3, IV_DECAL_FADE=.7, IV_DECAL_LIMIT=256, IV_WEAPON_SCALE=.75;
function ivVisualTick(dt){const iv=G.iv;if(!iv)return;
  iv.visualTime=(iv.visualTime||0)+dt;
  iv.decals=(iv.decals||[]).filter(d=>iv.visualTime-d.born<IV_DECAL_HOLD+IV_DECAL_FADE);
  for(const f of iv.visualFx||[])f.life-=dt;
  iv.visualFx=(iv.visualFx||[]).filter(f=>f.life>0);
  for(const s of iv.w)s.recoil=Math.max(0,(s.recoil||0)-dt*32);
}
function ivAddVisual(f){const iv=G.iv;iv.visualFx=iv.visualFx||[];if(iv.visualFx.length>=192)iv.visualFx.shift();iv.visualFx.push({...f,max:f.life});}
const _ivArtSplat=splat;
splat=function(x,y,c,n=10,rr=10){
  if(!ivOn()||!G.iv)return _ivArtSplat(x,y,c,n,rr);
  const iv=G.iv,points=[];
  for(let i=0;i<Math.min(n,16);i++){const a=rand(0,Math.PI*2),r=rand(0,rr),px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r);
    if(blocksShot(tileAtPx(px,py))||tileAtPx(px,py)===TL.PIT)continue;points.push([px,py,randi(1,2)]);}
  iv.decals=iv.decals||[];if(iv.decals.length>=IV_DECAL_LIMIT)iv.decals.shift();iv.decals.push({born:iv.visualTime||0,c,points});
};
const ivDecalAlpha=d=>.55*clamp(1-((G.iv.visualTime||0)-d.born-IV_DECAL_HOLD)/IV_DECAL_FADE,0,1);
const _ivArtWorld=drawWorld;
drawWorld=function(...args){_ivArtWorld(...args);if(!ivOn()||!G.iv)return;const [cx,cy]=args;ctx.save();for(const d of G.iv.decals||[]){ctx.globalAlpha=ivDecalAlpha(d);ctx.fillStyle=d.c;for(const [x,y,s]of d.points)ctx.fillRect(Math.round(x-cx),Math.round(y-cy),s,s);}ctx.restore();};
function ivMuzzle(s,a,target){const sp=ivWeaponSprite(s.id);let r=(sp.muzzle-sp.px)*IV_WEAPON_SCALE;
  if(target)r=Math.min(r,Math.max(0,dist(s.x,s.y,target.x,target.y)-(target.r||0)-1));
  for(let d=0;d<r;d+=2)if(shotBlocked(s.x+Math.cos(a)*d,s.y+Math.sin(a)*d)){r=Math.max(0,d-2);break;}
  return {x:s.x+Math.cos(a)*r,y:s.y+Math.sin(a)*r};
}
function ivShotStyle(q){
  // A structure's owner is for damage attribution, not its projectile model.
  // In particular, a tier-II wrench fires flame, never the wrench's melee art.
  const id=q.ho?.slot?.id,weaponFx=!q.ho?.structure&&!IV_W[id]?.melee?IV_WEAPON_ART[id]?.fx:null;
  return q.fx||(q.flame?'flame':weaponFx)||(q.expl?'shell':q.ho?.slow?'crystal':q.ho?.elemental?'arc':'bullet');
}
function ivMuzzleFlash(s,w,a,m){const fx=IV_WEAPON_ART[s.id].fx;s.a=a;s.recoil=['rocket','heavy','pellet','sniper','rail'].includes(fx)?3:1.5;
  if(!['disc','stone','glob'].includes(fx))ivAddVisual({kind:'muzzle',fx,x:m.x,y:m.y,a,life:fx==='flame'?.07:.055});
  if(['bullet','heavy','pellet','sniper'].includes(fx))part({x:s.x,y:s.y,vx:Math.cos(a+Math.PI/2)*30,vy:Math.sin(a+Math.PI/2)*30-15,c:'#b39a65',s:1,life:.24,max:.24,grav:80,drag:1});
}
// A beam resolves collisions along the visible segment immediately. Walls stop it;
// pierce damage falloff and purchased ricochets use the same rules as bullets.
function ivBeam(x,y,a,range,dmg,ho,opts={}){
  let pierce=opts.pierce||0,bounces=opts.bounce||0,hit=new Set(),remaining=range;
  const mul=opts.pierceMul??.5,style=opts.fx||'laser';
  for(let leg=0;leg<64&&remaining>0;leg++){
    const dx=Math.cos(a),dy=Math.sin(a);let length=remaining;
    for(let d=0;d<=remaining;d+=1)if(shotBlocked(x+dx*d,y+dy*d)){length=Math.max(0,d-1);break;}
    const candidates=ivTargets().filter(e=>!e.dead&&e.spawnT<=0&&!hit.has(e)).map(e=>{const along=(e.x-x)*dx+(e.y-y)*dy,off=Math.abs((e.x-x)*dy-(e.y-y)*dx),r=e.r+1;return {e,d:Math.max(0,along-Math.sqrt(Math.max(0,r*r-off*off))),along,off,r};}).filter(t=>t.off<=t.r&&t.along+t.r>=0&&t.d<=length).sort((a,b)=>a.d-b.d);
    let bounceTarget=null,stop=false;
    for(const t of candidates){hit.add(t.e);ivHit(t.e,dmg,ho,a);ivAddVisual({kind:'impact',fx:style,x:x+dx*t.d,y:y+dy*t.d,a,life:.14});
      if(pierce>0){pierce--;dmg*=mul;continue;}
      length=t.d;stop=true;
      if(bounces>0){bounceTarget=ivNearest(t.e.x,t.e.y,140,e=>!hit.has(e));if(bounceTarget)bounces--;}
      break;
    }
    const ex=x+dx*length,ey=y+dy*length;
    ivAddVisual({kind:'beam',fx:style,x,y,ex,ey,life:style==='rail'?.16:.12});
    if(!bounceTarget||!stop)break;
    remaining=Math.max(0,remaining-length);x=ex;y=ey;a=ang(x,y,bounceTarget.x,bounceTarget.y);
  }
  return hit;
}
function ivDrawHeldWeapons(cx,cy){const iv=G.iv;if(!iv)return;
  for(const s of iv.w){if(s.x===undefined)continue;const w=IV_W[s.id],sp=ivWeaponSprite(s.id),x=Math.round(s.x-cx),y=Math.round(s.y-cy),a=s.a||0;
    if(s.mode==='out'){
      if(w.attack==='sweep'){ctx.save();ctx.globalAlpha=.23;ctx.strokeStyle='#d6d3ba';ctx.lineWidth=2;ctx.beginPath();ctx.arc(G.p.x-cx,G.p.y-cy,s.mr+8,a-(s.swingDir||1)*.6,a,(s.swingDir||1)<0);ctx.stroke();ctx.restore();}
      else if(w.attack==='thrust'||w.attack==='punch'){ctx.save();ctx.globalAlpha=.35;line(x-Math.cos(a)*10,y-Math.sin(a)*10,x,y,'#bcb8a7',1);ctx.restore();}
      else if(w.attack==='saw'){const k=Math.floor(G.time*30)%3;line(x+Math.cos(a)*8,y+Math.sin(a)*8,x+Math.cos(a)*15,y+Math.sin(a)*15+k-1,'#d8b76e',1);}
    }
    ctx.save();ctx.translate(x,y);ctx.rotate(a);if(Math.cos(a)<0)ctx.scale(1,-1);ctx.imageSmoothingEnabled=false;ctx.translate(-(s.recoil||0),0);ctx.drawImage(sp.n,-sp.px*IV_WEAPON_SCALE,-sp.py*IV_WEAPON_SCALE,sp.w*IV_WEAPON_SCALE,sp.h*IV_WEAPON_SCALE);ctx.restore();
    if(s.t>0)rect(x-1,y+5,2,1,IV_TIER_C[s.t]);
  }
}
function ivDrawShot(q,cx,cy){
  const fx=ivShotStyle(q),a=Math.atan2(q.vy,q.vx),age=q.age||0,x=q.x-cx,y=q.y-cy;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);
  switch(fx){
    case 'pellet':line(-5,0,0,0,'#8e8067',1);rect(-1,-1,2,2,'#e7d5a2');break;
    case 'bullet':line(-7,0,-2,0,'#a38555',1);rect(-3,-1,4,2,'#efd9a1');rect(1,0,1,1,'#fff0cd');break;
    case 'heavy':line(-9,0,-2,0,'#ba8b4d',1);rect(-4,-1,5,3,'#d5bd87');rect(1,0,2,1,'#f5e0b5');break;
    case 'sniper':ctx.globalAlpha=.5;line(-17,0,-3,0,'#e4c991',1);ctx.globalAlpha=1;rect(-3,-1,5,2,'#fff0c8');break;
    case 'nail':line(-7,0,3,0,'#c1c9c4',1);rect(-7,-2,2,5,'#828e8c');rect(2,0,2,1,'#f0eee0');break;
    case 'bolt':case 'harpoon':line(-10,0,4,0,'#c7c6ae',1);line(-9,-2,-6,0,'#8a7350',1);line(-9,2,-6,0,'#8a7350',1);line(0,-3,4,0,'#c1cdcd',1);line(0,3,4,0,'#c1cdcd',1);if(fx==='harpoon'){line(-3,-3,0,0,'#a4b4b5',1);line(-3,3,0,0,'#a4b4b5',1);}break;
    case 'rocket':ctx.globalAlpha=.35;line(-15,0,-5,0,'#8c7759',2);ctx.globalAlpha=1;rect(-10,-1,6,2,'#d6a34b');rect(-6,-2,7,4,'#8b927f');rect(-2,-2,3,1,'#cfd3bb');line(1,-2,4,0,'#b9704e',1);line(1,2,4,0,'#b9704e',1);rect(-6,-4,2,3,'#abb5a5');rect(-6,2,2,3,'#abb5a5');break;
    case 'grenade':{ctx.rotate(-a);const lift=Math.sin(Math.min(1,age/(q.maxLife||1.3))*Math.PI)*7;ctx.globalAlpha=.3;disc(0,2,3,'#111111');ctx.globalAlpha=1;ctx.translate(0,-lift);ctx.rotate(age*9);rect(-3,-3,6,6,'#878a59');rect(-3,-3,6,1,'#c0bc87');rect(-2,-1,4,2,'#d6a552');rect(-1,-5,2,2,'#5e6257');break;}
    case 'shell':rect(-5,-2,7,4,'#c39b5e');rect(2,-1,2,2,'#af5d42');rect(-5,-2,2,4,'#e2c17e');line(-9,0,-5,0,'#806c48',1);break;
    case 'flame':{const r=2+Math.min(4,age*9),tail=Math.min(20,age*Math.hypot(q.vx,q.vy));for(let j=4;j>=0;j--){const u=j/4,sy=Math.sin(age*27+j*1.6)*u*2;ctx.globalAlpha=.32+(1-u)*.3;disc(-tail*u,sy,Math.max(1,r*(1-u*.65)),j%2?'#b36935':'#ac4f32');}ctx.globalAlpha=.75;disc(0,0,r*.65,'#df9c4f');ctx.globalAlpha=.85;disc(1,0,Math.max(1,r*.28),'#f3d49c');rect(-r-3,Math.sin(age*37)*2,2,1,'#d68a40');break;}
    case 'ember':ctx.globalAlpha=.45;line(-12,0,-4,0,'#ad6739',3);ctx.globalAlpha=1;disc(0,0,3,'#d29445');disc(1,0,1,'#f5de9f');rect(-6,-2,2,1,'#b87442');break;
    case 'arc':case 'shock':{const k=Math.sin(age*60)>0?1:-1;line(-12,0,-8,-3*k,'#80bac6',1);line(-8,-3*k,-4,2*k,'#deeee0',1);line(-4,2*k,2,0,'#80bac6',1);if(fx==='shock'){rect(-2,-3,2,2,'#d9b66f');rect(-2,2,2,2,'#d9b66f');}break;}
    case 'crystal':ctx.globalAlpha=.35;line(-10,0,-3,0,'#84bcb6',2);ctx.globalAlpha=1;line(-4,0,1,-3,'#a8d4ce',1);line(1,-3,4,0,'#d9ece3',1);line(4,0,1,3,'#a8d4ce',1);line(1,3,-4,0,'#84bcb6',1);line(-3,0,3,0,'#f2f3dc',1);break;
    case 'disc':ctx.rotate(age*22);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);rect(0,-1,6,2,'#b9c5c2');rect(4,-3,2,2,'#ebecda');}rect(-1,-1,2,2,'#4d5956');break;
    case 'needle':line(-5,0,5,0,'#d5d8c5',1);rect(-5,-2,5,4,'#b67978');rect(-4,-1,3,2,'#ca4d4e');rect(-7,-2,2,4,'#e2dcc8');break;
    case 'glob':ctx.globalAlpha=.8;disc(0,0,3,'#a2af6d');disc(-4,1,1,'#819755');rect(-1,-2,2,1,'#d9d9ae');break;
    case 'drill':line(-7,0,-3,0,'#a9865e',2);for(let i=0;i<4;i++){const size=4-i;line(-4+i*2,-size,-4+i*2,size,i%2?'#7c8987':'#c4cdbe',1);}rect(3,0,2,1,'#eff0d5');break;
    case 'plasma':ctx.globalAlpha=.3;disc(-3,0,5,'#849859');ctx.globalAlpha=1;ringC(0,0,3,'#b2c47c',1);disc(0,0,1,'#e1d8b5');rect(-7,1,2,1,'#829259');break;
    case 'stone':ctx.rotate(age*8);rect(-2,-2,5,4,'#969284');rect(-2,-2,3,1,'#d6cdb9');rect(1,1,2,2,'#625d53');break;
    default:throw Error('Projectile without visual identity: '+fx);
  }
  ctx.restore();
}
function ivDrawCombatVisuals(cx,cy){
  for(const q of G.iv.shots)ivDrawShot(q,cx,cy);
  for(const f of G.iv.visualFx||[]){const k=f.life/f.max,x=f.x-cx,y=f.y-cy,c=f.fx==='rail'?'#92c4d0':f.fx==='laser'?'#e96b58':f.fx==='arc'||f.fx==='shock'?'#9ccdd2':'#e3b974';ctx.save();
    if(f.kind==='beam'){const ex=f.ex-cx,ey=f.ey-cy;ctx.globalAlpha=k*.13;line(x,y,ex,ey,c,5);ctx.globalAlpha=k*.7;line(x,y,ex,ey,c,2);ctx.globalAlpha=k;line(x,y,ex,ey,'#fff0d6',1);if(f.fx==='rail'){const a=ang(x,y,ex,ey),n=Math.floor(dist(x,y,ex,ey)/18);ctx.globalAlpha=k*.5;for(let i=1;i<n;i++)ringC(lerp(x,ex,i/n),lerp(y,ey,i/n),2,c,1);}}
    else if(f.kind==='muzzle'){ctx.translate(x,y);ctx.rotate(f.a);ctx.globalAlpha=k;if(['laser','rail','arc','shock','plasma','crystal'].includes(f.fx)){line(0,-3,0,3,c,1);rect(-1,-1,3,2,'#e4ead3');}else if(!['needle','glob'].includes(f.fx)){line(-1,0,5,0,c,2);line(0,-2,3,0,c,1);line(0,2,3,0,c,1);rect(0,0,2,1,'#fff0c8');}}
    else if(f.kind==='impact'){ctx.translate(x,y);ctx.rotate(f.a);ctx.globalAlpha=k;for(const s of [-1,1])line(0,0,-4*(1-k),s*5*(1-k),c,1);rect(-1,-1,2,2,'#f4dfbc');}
    ctx.restore();
  }
}
function ivDrawStructures(cx,cy){for(const s of G.iv.str){const id=s.k==='mine'?'landmines':s.k,sp=ivItemSprite(id),x=Math.round(s.x-cx),y=Math.round(s.y-cy);shadow(x,y+4,8);
    if(['turret','laser_turret','explosive_turret','incendiary_turret'].includes(s.k)){rect(x-7,y+2,5,2,'#292a29');rect(x+3,y+2,5,2,'#292a29');rect(x-4,y-1,10,3,'#494b46');rect(x-1,y-6,3,6,'#929d99');const wid={turret:'smg',laser_turret:'laser_gun',explosive_turret:'cluster',incendiary_turret:'flamer'}[s.k],w=ivWeaponSprite(wid);ctx.save();ctx.translate(x,y-5);ctx.rotate(s.a||0);if(Math.cos(s.a||0)<0)ctx.scale(1,-1);ctx.drawImage(w.n,-5,-5,20,13);ctx.restore();}
    else ctx.drawImage(sp.n,x-10,y-15,20,20);
  }
}
function ivDrawCompanions(cx,cy){for(const q of G.iv.pets){const x=Math.round(q.x-cx),y=Math.round(q.y-cy),sp=ivItemSprite(q.id),lift=['doc_moth','jellyshield','wandering_bot'].includes(q.id)?Math.sin(G.time*5)*1.5-3:Math.floor(G.time*8)%2;shadow(x,y+5,6);ctx.save();if(q.hp<=0)ctx.globalAlpha=.4;ctx.translate(x,y);if(Math.cos(q.facing||0)<0)ctx.scale(-1,1);ctx.drawImage(sp.n,-9,-13+lift,18,18);ctx.restore();
    if(q.id==='doc_moth'){ctx.save();ctx.globalAlpha=.14;ringC(x,y,42,'#97ab8a',1);ctx.restore();}
    if(q.id==='jellyshield'){ctx.save();ctx.globalAlpha=.65;ringC(x,y,8,'#8ac1c1',1);ctx.restore();}
    if(q.id==='scapegoat'&&q.hp<=0)text('靠近复活',x,y+8,TH.dim,.8,'center');
  }
  for(const q of G.iv.healShots||[]){const x=q.x-cx,y=q.y-cy;rect(x-2,y,5,1,'#a5c590');rect(x,y-2,1,5,'#cbd6ae');}
}
