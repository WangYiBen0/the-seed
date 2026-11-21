// Invasion-only detail inspection, with the same full effects on mouse and touch.
'use strict';
addEventListener('mousedown',e=>{if(!ivOn()||!IV_UI.has(G.state))return;const r=view.getBoundingClientRect();Input.mx=clamp((e.clientX-r.left)/r.width*W,0,W-1);Input.my=clamp((e.clientY-r.top)/r.height*H,0,H-1);});
function ivOpenDetail(o){IVU.detail={o,page:0,pages:1,t0:G.time};IVU.pop=null;IVU.hits=[];}
function ivDetailPage(delta){if(IVU.detail){const d=IVU.detail;d.page=(d.page+delta+d.pages)%d.pages;}}
const _ivUpdateDetail=ivUpdateUI;ivUpdateUI=function(dt){
  if(IVU.detail){if(Input.clicked){const h=IVU.hits.slice().reverse().find(b=>inR(b,Input.mx,Input.my));Input.clicked=false;if(h)h.f();return;}if(pressed('Escape')||pressed('Enter'))IVU.detail=null;else if(pressed('ArrowRight')||pressed('PageDown'))ivDetailPage(1);else if(pressed('ArrowLeft')||pressed('PageUp'))ivDetailPage(-1);return;}
  return _ivUpdateDetail(dt);
};
function ivDetailRows(o,width){
  const rows=[],mods=o.k==='i'?Object.keys(IV_I[o.id].m):[],weaponIcons=['dmg',o.k==='w'?Object.keys(IV_W[o.id].sc)[0]:null,'aspd','range'];
  ivDesc(o).forEach(([s,c,weaponStat],i)=>{const stat=o.k==='i'?mods[i]:o.k==='w'?(weaponStat||weaponIcons[i]):o.k==='u'?o.id:null;
    wrapW(s,width-20).forEach((t,j)=>rows.push({s:t,c,stat:j===0?stat:null,continuation:j>0}));});
  return rows;
}
const _ivDrawDetail=ivDrawUI;ivDrawUI=function(){
  _ivDrawDetail();if(!IVU.detail)return;
  const detail=IVU.detail,o=detail.o,pw=Math.min(376,W-28),maxH=Math.min(232,H-24),c=o.k==='p'?IV_PREF_COLOR[o.id]:IV_TIER_C[o.t],lh=lineH()+6;
  const rows=ivDetailRows(o,pw-32),capacity=Math.max(1,Math.floor((maxH-101)/lh)),pages=Math.max(1,Math.ceil(rows.length/capacity)),per=Math.max(1,Math.ceil(rows.length/pages));
  const ph=Math.min(maxH,Math.max(152,101+per*lh)),x=Math.round((W-pw)/2),y=Math.round((H-ph)/2);detail.pages=pages;detail.page=clamp(detail.page,0,pages-1);IVU.hits=[];
  const dk=easeOut(clamp((G.time-(detail.t0||0))/.2,0,1));ctx.save();ctx.globalAlpha*=dk;rect(0,0,W,H,'rgba(5,4,4,.84)');ctx.translate(0,Math.round((1-dk)*10));rect(x+4,y+5,pw,ph,'rgba(0,0,0,.45)');box(x,y,pw,ph,'#0e0d0b','#bdb5a6');rect(x+1,y+1,pw-2,2,c);rect(x+1,y+3,pw-2,61,'#15120f');
  const sp=o.k==='p'?ivPreferenceSprite(o.id):o.k==='u'?ivStatSprite(o.id):o.k==='w'?ivWeaponSprite(o.id):ivItemSprite(o.id),scale=Math.min(52/sp.w,46/sp.h);
  ctx.save();ctx.imageSmoothingEnabled=!!sp.smooth;ctx.drawImage(sp.n,x+38-sp.w*scale/2,y+34-sp.h*scale/2,sp.w*scale,sp.h*scale);ctx.restore();
  text(fitText(ivName(o),pw-94,1.5),x+76,y+16,'#e6dfd1',1.5);
  const meta=o.k==='p'?IV_ROLES.find(r=>r.id===o.id).en:o.k==='w'?IV_W[o.id].set.map(k=>tr(IV_SETS[k].n)).join(' · '):o.k==='u'?'强化':(['普通','精良','稀有','传说'][o.t]+'  '+IV_TIER_N[o.t]);
  text(fitText(meta,pw-94),x+77,y+42,c,.9);line(x+14,y+64,x+pw-14,y+64,'#36322d',1);
  rows.slice(detail.page*per,(detail.page+1)*per).forEach((r,i)=>{const yy=y+76+i*lh;if(i%2===0)rect(x+12,yy-3,pw-24,lh,'rgba(255,255,255,.025)');if(r.stat)ivDrawBadge(ivStatSprite(r.stat),x+23,yy+4,12);text(r.s,x+36,yy,r.c);});
  const fy=y+ph-30;line(x+14,fy-6,x+pw-14,fy-6,'#36322d',1);let bx=x+14;
  if(o.owned){const index=G.iv.w.indexOf(o.owned),can=index>=0&&o.owned.t<3&&G.iv.w.some(s=>s!==o.owned&&s.id===o.id&&s.t===o.t);
    ivBtn({kind:'detail-recycle',x:bx,y:fy,w:76,h:21,f:()=>{const n=G.iv.w.indexOf(o.owned);if(n>=0)ivSell(n);IVU.detail=null;}},'回收 +'+ivRecycleValue(o),'#a7c28d');bx+=82;
    ivBtn({kind:'detail-combine',x:bx,y:fy,w:54,h:21,f:()=>{if(can){ivCombine(G.iv.w.indexOf(o.owned));IVU.detail=null;}else AU.play('locked');}},'合成',can?'#d8b878':'#3c3732',can);bx+=62;
  }
  if(pages>1){ivBtn({kind:'detail-prev',x:bx,y:fy,w:24,h:21,f:()=>ivDetailPage(-1)},'<',TH.bone2);text((detail.page+1)+' / '+pages,bx+43,fy+6,TH.dim,.9,'center');ivBtn({kind:'detail-next',x:bx+64,y:fy,w:24,h:21,f:()=>ivDetailPage(1)},'>',TH.bone2);}
  ivBtn({kind:'detail-close',x:x+pw-76,y:fy,w:62,h:21,f:()=>{IVU.detail=null;}},'关闭',c);ctx.restore();
};
