// Invasion-only, transparent silhouettes redrawn from the Brotato Wiki references.
// Paths are cached at 3x resolution; the arena and item inspection share the art.
'use strict';
const IV_SUMMON_IDS=['turret','laser_turret','incendiary_turret','explosive_turret','medical_turret','mine','garden','bot_o_mine','tyler','blazemander','bonk_dog','catling_gun','doc_moth','jellyshield','lootworm','ratzilla','scapegoat','wandering_bot'];
function ivSummonCanvas(paint){
  const n=document.createElement('canvas');n.width=108;n.height=102;const d=n.getContext('2d');d.scale(1.02,1.02);d.lineJoin='round';d.lineCap='round';
  const ink='#111212',path=(s,c,stroke=ink,w=3.8)=>{const p=new Path2D(s);if(c){d.fillStyle=c;d.fill(p);}if(stroke){d.strokeStyle=stroke;d.lineWidth=w;d.stroke(p);}},
    ellipse=(x,y,rx,ry,c,stroke=ink,w=3.8)=>{d.beginPath();d.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(c){d.fillStyle=c;d.fill();}if(stroke){d.strokeStyle=stroke;d.lineWidth=w;d.stroke();}},
    rect=(x,y,w,h,c,r=2,stroke=ink)=>{d.beginPath();d.roundRect(x,y,w,h,r);d.fillStyle=c;d.fill();if(stroke){d.strokeStyle=stroke;d.lineWidth=3.8;d.stroke();}},
    line=(s,c=ink,w=3.8)=>path(s,null,c,w);
  paint({d,path,ellipse,rect,line,ink});return {n,w:36,h:34,smooth:true};
}
function ivPaintSummon(id,frame,{d,path:p,ellipse:e,rect:r,line:l,ink}){
  const step=[0,1,0,-1][frame],white='#ece9e4',grey='#a1a6ac',dark='#5f6670';
  const eye=(x,y,rx=5,ry=7)=>{e(x,y,rx,ry,ink,null);e(x-1,y-2,rx*.36,ry*.32,'#fff',null);};
  const mine=(x,y,sc=1)=>{d.save();d.translate(x,y);d.scale(sc,sc);p('M-24 0 Q-25 12 -18 15 Q0 23 22 12 L24 1 Z',grey);e(0,1,24,12,'#bfc0bf');e(0,0,16,7,'#8c9397',ink,2.8);e(0,-1,7,4,frame%2?'#ed5c66':'#c84d59',ink,2.5);d.restore();};
  if(['turret','incendiary_turret','laser_turret','explosive_turret','medical_turret'].includes(id)){
    const big=id==='explosive_turret',left=big?17:25,right=big?85:77,top=big?14:17,bottom=big?73:70;
    // Four splayed steel legs behind the dome, no unrelated held-weapon overlay.
    p(`M${left+6} 61 L${left-10} 77 L${left-8} 86 L${left+1} 84 L${left+14} 66 Z`,grey);
    p(`M${right-6} 61 L${right+10} 77 L${right+8} 86 L${right-1} 84 L${right-14} 66 Z`,grey);
    p('M37 65 L28 88 L34 94 L42 91 L49 70 Z','#aeb2b7');p('M64 65 L73 89 L68 94 L61 91 L54 70 Z','#adb2b6');
    const shell=({turret:'#ceb787',incendiary_turret:'#717e92',laser_turret:'#dfdedd',explosive_turret:'#75a467',medical_turret:'#ebe9e7'})[id];
    p(`M${left} ${bottom} L${left} ${top+26} C${left} ${top-6} ${right} ${top-6} ${right} ${top+26} L${right} ${bottom} Q51 ${bottom+8} ${left} ${bottom}Z`,shell);
    l(`M${left+10} ${top+20} Q${left+12} ${top+6} 51 ${top+5}`,({turret:'#efdab3',incendiary_turret:'#a5aec0',laser_turret:'#fff',explosive_turret:'#a2c68b',medical_turret:'#fff'})[id],4);
    l(`M${left+3} ${bottom-1} Q51 ${bottom+4} ${right-3} ${bottom-1}`,'#535a5d',2);
    if(id==='turret'||big){const yy=51+step*.5;e(51,yy,big?18:16,big?18:16,'#73797d');e(51,yy,11,12,'#30363c');e(51,yy,6,7,'#13191d');l('M43 43 Q47 38 54 40','#b9bcbc',2.5);}
    if(id==='incendiary_turret'){r(36,44+step*.5,30,13,'#1a2028',5);r(41,48+step*.5,20,4,'#a7b0b9',2,null);p('M44 69 L44 81 Q51 87 58 81 L58 69Z','#cf626d');l('M47 73 L47 80','#f4a0a3',2);}
    if(id==='laser_turret'){p('M27 34 L39 42 L43 51 L37 56 L27 50Z','#a1a7ae');p('M76 34 L65 42 L60 51 L66 56 L76 50Z','#a1a7ae');p('M29 68 L41 57 L46 58 L44 68 L35 73Z','#b5b8be');p('M73 68 L62 57 L57 58 L59 68 L68 73Z','#b5b8be');e(51,52,13,14,'#9c7ca0');e(51,52,7,8,frame%2?'#f3b8e0':'#d9a0cb');e(48,49,2,3,'#fff1fc',null);}
    if(id==='medical_turret')p('M45 38 L57 38 L57 49 L68 49 L68 61 L57 61 L57 72 L45 72 L45 61 L34 61 L34 49 L45 49Z','#91cd80',ink,3);
    return;
  }
  switch(id){
    case 'mine':mine(51,71,1.25);break;
    case 'garden':
      p('M10 61 L84 56 L94 66 L88 88 L18 89Z','#d9d8d4');p('M10 61 L20 54 L87 54 L94 66 L20 70Z','#828179');p('M18 60 L84 58 L87 63 L21 66Z','#655446',ink,2);l('M20 72 L22 85 L85 84','#a9abaa',3);
      l(`M37 63 Q34 44 ${35+step} 31`,'#315a34',4);p('M35 44 C16 43 19 28 28 29 Q38 28 36 41Z','#6db057');p('M36 36 Q36 22 49 24 Q52 36 36 40Z','#83c16d');
      l(`M67 61 Q64 38 ${67-step} 21`,'#315a34',4);p('M65 42 Q49 40 51 26 Q64 25 66 38Z','#7db667');p('M67 32 Q67 15 82 17 Q84 29 67 35Z','#84c271');l('M52 62 L51 47','#518342',3);p('M51 52 Q42 45 46 41 Q54 41 56 46Z','#8bc477',ink,2.8);break;
    case 'tyler':
      p('M30 64 L25 44 L14 43 L18 58 L35 74Z','#252632');p('M72 65 L80 45 L90 43 L86 59 L69 76Z','#252632');
      p('M29 65 Q26 31 35 17 Q50 4 66 17 Q77 31 73 65Z','#292a39');p('M35 39 Q36 22 51 21 Q66 23 68 38 L65 52 Q50 62 37 51Z','#dddcd8');e(43,39,5,7,'#252632',null);e(60,39,5,7,'#252632',null);p('M49 43 L46 49 L54 49Z','#252632',null);l('M40 53 Q51 59 62 52 M46 54 L46 58 M53 55 L53 59 M59 54 L59 57','#252632',2.5);
      p('M34 60 L69 60 L72 74 L30 74Z','#394b65');l('M37 65 L66 65','#8192b1',3);p('M27 72 L74 72 L81 92 Q52 98 21 92Z','#d7d8d7');p('M68 74 L65 83 L71 84 L67 94',null,ink,3);l('M28 77 L24 89','#fff',3);break;
    case 'bot_o_mine':
      e(51,89,11,7,'#595d62');l('M46 90 L55 90','#bbc0c5',2);p('M35 62 L30 81 Q50 95 72 81 L66 62Z','#c9ac7b');l('M38 69 L35 80 Q48 86 62 82','#f1d7a8',3);e(62,76,2.5,2.5,'#be6062',ink,1.8);
      r(23,37,11,20,'#969897',4);r(70,37,11,20,'#969897',4);r(30,26,44,39,'#d0b68b',8);r(35,32,34,31,'#444a51',7);e(52,47,12,13,'#1d222b');e(52,47,7,7,'#76ad65');e(52,46,3,3,'#b9e5a0',null);l('M51 26 L51 13','#f4d8a7',5);e(51,10+step,6,6,'#d26f7c');e(49,8+step,2,2,'#f8b7b8',null);break;
    case 'wandering_bot':
      p('M35 52 Q18 40 14 54 Q11 70 30 73Z','#d7975b');p('M69 52 Q86 41 90 55 Q91 70 73 73Z','#d7975b');e(52,83,9,10,'#cfa666');
      p('M52 19 Q75 32 76 58 Q78 81 53 82 Q26 80 29 57 Q29 35 52 19Z','#d69558');p('M52 32 Q65 42 65 58 Q65 72 53 73 Q40 71 41 58 Q40 43 52 32Z','#72bfc5');p('M51 37 Q44 49 47 60 L53 65 Q51 47 57 44Z','#c8f4ed',null);e(52,10,23,5,'#8ed9d3',ink,3);break;
    case 'blazemander':
      p('M39 79 Q15 88 11 67 L7 65 L10 78 Q17 96 49 91Z','#9b4240');p('M33 47 Q24 54 26 84 Q38 96 67 90 Q79 82 68 54Z','#a94c43');p('M52 57 Q45 72 50 87 L63 86 Q66 73 61 58Z','#efc96b');
      p('M25 45 Q14 31 25 21 Q37 12 58 18 L65 14 L67 24 L80 30 L79 44 Q64 53 43 48Z','#a74b47');p('M19 33 L25 36 L26 46 L32 44 L29 35 L28 30Z','#e8bd5e',null);p('M45 19 L57 19 L54 24 L44 24Z','#eccc70',null);eye(32,27,5,6);eye(64,23,3,4);p('M49 40 L53 34 L56 41 L66 41 L69 36 L72 42Z','#dcd7b9',ink,2);e(73,31,2,2,ink,null);
      p('M29 75 L34 64 L38 66 L35 81Z','#e1a951',ink,2);p('M66 78 L74 76 L70 87 L62 89Z','#e2b95a',ink,2.5);p('M15 72 L19 64 L23 71 M27 59 L32 53 L35 60','#efb75f',ink,3);break;
    case 'bonk_dog':
      p('M29 80 Q18 94 48 93 Q75 97 77 83 L66 65 L36 65Z','#ac8d6d');p('M28 24 L20 6 Q10 8 16 37 L29 39Z','#be9d7e');p('M64 23 L76 7 Q84 17 73 41 L61 36Z','#be9d7e');p('M22 15 L20 30 L25 33Z','#d58b98',null);p('M73 15 L65 32 L71 33Z','#d58b98',null);
      p('M21 52 L9 56 L21 63 L12 72 L26 73 L25 85 L37 77 L62 81 L74 89 L76 76 L90 77 L83 65 L93 59 L78 54Z','#4e545f');for(const [x,y,a]of [[17,62,-1],[27,77,0],[76,73,1],[85,59,1]])p(`M${x} ${y-5} L${x+a*7} ${y+5} L${x-7} ${y+2}Z`,white,ink,2.6);
      e(50,49,28,27,'#ba9877');p('M43 31 Q47 24 55 29 L55 39 L44 40Z','#6f5f51',null);eye(32,45,7,9);eye(69,43,5,7);e(50,54,7,5,'#342b2b');p('M29 60 Q52 69 77 55 Q75 83 49 80 Q31 78 29 60Z','#282629');for(const x of [35,43,64,72])p(`M${x} 64 L${x+3} 72 L${x+6} 63Z`,white,ink,1.8);p(`M48 70 Q45 90 57 90 Q68 89 62 ${71+step}Z`,'#ce7a86');l('M55 74 L55 84','#743f49',2);l('M48 23 Q47 9 54 9','#c4a88c',5);e(54,8,4,4,'#c4a88c');break;
    case 'catling_gun':
      p('M29 72 Q22 91 49 93 Q79 96 78 78 L65 58 L35 58Z','#c69f61');p('M23 39 L20 12 L39 28 L61 27 L80 15 L77 47Z','#c5a267');p('M24 20 L28 35 L35 29 M73 23 L65 31 L75 37','#e3c2a0',ink,2);e(51,50,27,22,'#c7a468');eye(35,44,7,8);eye(66,43,6,7);p('M46 50 L56 50 L51 55Z','#4a3233',ink,2);p('M36 60 L40 55 L44 63 L58 63 L62 56 L67 61','#ece6d8',ink,2);l('M23 50 L16 47 M23 56 L15 58 M76 49 L83 45 M77 55 L85 57',ink,2);
      for(const x of [8,78]){r(x,54,17,24,'#8e969c',3);e(x+4,66,4,8,'#313840',ink,2);l(`M${x+11} 58 L${x+11} 74`,'#c8ced0',2);}
      p('M27 65 Q50 78 78 65 L75 78 Q48 90 27 77Z','#4f4740');for(let i=0;i<8;i++){d.save();d.translate(31+i*5.7,72+Math.sin(i/7*Math.PI)*6);d.rotate(.3-i*.08);r(-2,-4,4,11,'#bd925d',1);l('M-1 -3 L1 -3','#e8c98f',2);d.restore();}l('M49 26 Q49 11 55 11','#b48f55',4);e(56,9,3,3,'#dbc18c');break;
    case 'doc_moth':{
      const f=step*4;
      p(`M45 47 Q13 ${7+f} 10 34 Q8 51 39 57 Q8 54 18 82 Q31 94 47 66Z`,'#72bd99');p(`M59 47 Q91 ${7+f} 94 34 Q97 53 65 57 Q96 52 84 82 Q73 94 57 66Z`,'#77c4a2');
      p('M20 33 Q18 23 28 28 Q43 36 35 45 Q24 47 20 33Z','#71d2c1',null);e(29,36+step,6,7,'#c38bc3',null);p('M73 28 Q87 24 85 36 Q79 48 69 44 Q65 36 73 28Z','#6dd8c2',null);e(77,36+step,6,7,'#c38bc3',null);e(30,68,7,8,'#74ddbd',null);e(73,68,7,8,'#74ddbd',null);e(31,69,4,4,'#bd8fbd',null);e(72,69,4,4,'#bd8fbd',null);
      p('M45 42 Q38 72 51 87 Q66 72 58 42Z','#70d7ba');e(51,36,11,11,'#252429');e(45,35,3,4,'#cc98c5',null);e(57,35,3,4,'#cc98c5',null);l('M46 27 L39 12 M57 27 L64 12',ink,4);e(38,10,4,4,'#87c99e');e(65,10,4,4,'#87c99e');break;}
    case 'jellyshield':
      for(let i=0;i<5;i++){const x=31+i*10;l(`M${x} 63 C${x+7+step*3} 77 ${x-9} 82 ${x-2} 92`,ink,7);l(`M${x} 63 C${x+7+step*3} 77 ${x-9} 82 ${x-2} 92`,'#82c1c8',3);}
      p('M23 58 Q15 32 32 20 Q52 5 71 23 Q86 37 79 58 L84 70 Q53 78 19 70Z','#99d0d1');e(52,41,17,20,'#5a9caf',ink,2.5);e(55,42,10,14,'#4d76ad',null);e(54,42,6,9,'#73b3d0',null);e(65,28,7,8,'#edffff',null);e(37,20,6,3,'#e9ffff',null);e(26,52,5,6,'#d2f3eb',null);l('M26 66 Q50 71 75 66','#bce9e4',3);break;
    case 'lootworm':
      for(let i=0;i<5;i++){const x=12+i*12,yy=74-i*2+step*(i%2?1:-1);e(x,yy,8+i*1.5,10+i*1.3,i%2?'#65b477':'#83c389');e(x-2,yy-4,2,3,'#b0ddaa',null);}
      p('M43 43 Q37 29 51 23 Q75 14 86 30 L85 68 Q77 89 58 82 Q42 76 43 43Z','#74bd82');l('M55 23 L52 11 M77 22 L80 11',ink,3);e(51,9,4,4,'#81c77c');e(80,9,4,4,'#81c77c');eye(48,35,6,8);eye(83,32,5,7);
      p('M57 39 Q68 24 75 40 L71 46 Q85 66 70 75 Q52 73 56 56 L62 46Z','#553337');p('M57 39 Q66 29 68 39 L67 50 L61 51Z','#af806b',ink,2);p('M58 62 L62 56 L65 64 L71 57 L75 64 L73 69 L61 69Z','#d8d9be',ink,1.6);p('M62 78 L72 77 Q82 94 66 96 L65 88 L60 88Z','#ce706d');break;
    case 'ratzilla':
      l(`M33 77 Q16 ${75+step*4} 7 78`,ink,7);l(`M33 77 Q16 ${75+step*4} 7 78`,'#b77a8d',3);
      p('M27 79 Q27 52 49 49 Q67 45 76 62 L91 68 L88 80 Q63 90 27 79Z','#726657');e(55,50,9,10,'#897566');e(74,52,6,8,'#998473');e(57,64,9,10,'#bf4258');e(55,61,3,3,'#ffa2a8',null);p('M78 79 L78 87 L84 87 L85 79Z','#e8e2ce',ink,2.5);l('M84 64 L91 58 M88 69 L98 66 M89 73 L98 76',ink,2.5);e(91,71,3,3,ink,null);break;
    case 'scapegoat':
      p('M34 39 Q17 13 22 12 Q39 9 45 34Z','#bba88d');p('M61 34 Q64 4 78 9 L86 18 Q74 15 72 39Z','#bba88d');l('M29 18 L26 23 M35 22 L31 28 M72 16 L78 19 M70 23 L76 26','#66584d',2);
      p('M20 62 Q17 41 36 42 Q48 30 65 47 Q84 49 80 66 Q94 77 84 89 Q51 98 19 87 Q9 77 20 62Z','#d99fbe');
      p('M23 61 Q12 70 23 79 Q29 84 31 74 Q34 67 39 72 Q45 78 50 66 Q56 56 62 66 L68 81 Q77 87 79 77','#edbfd4');
      p('M44 36 Q43 24 51 29 Q56 18 64 27 Q76 24 75 36 Q86 42 74 49 L48 49 Q37 47 44 36Z','#f2cadb');
      p('M59 48 L74 48 L80 61 L85 68 L78 76 L67 69 L63 59Z','#9f7188');eye(69,55,3,4);p('M78 67 L83 70 L78 73Z',white,ink,1.5);p('M52 47 Q43 54 52 64 Q57 57 59 49Z','#ece0df',ink,2.5);e(30,84,3,3,'#f7dce3',ink,2);e(38,85,2,2,'#b578a1',ink,1.5);e(63,89,4,3,'#f7dce3',ink,2);break;
  }
}
function ivSummonSprite(id,frame=0){frame=((Math.floor(frame)%4)+4)%4;const key='summon:'+id+':'+frame;if(!IV_ART_CACHE.has(key))IV_ART_CACHE.set(key,ivSummonCanvas(a=>ivPaintSummon(id,frame,a)));return IV_ART_CACHE.get(key);}

// Wiki item references depict the summoning object for pets, and the unit itself
// for structures. Keep this intentional distinction in the shop.
function ivSummonItemSprite(id){const key='summon-item:'+id;if(IV_ART_CACHE.has(key))return IV_ART_CACHE.get(key);
  const sp=ivSummonCanvas(a=>{const {d,path:p,ellipse:e,rect:r,line:l,ink}=a;
    switch(id){
      case 'blazemander':p('M22 69 Q15 46 40 17 Q51 5 63 18 Q90 48 80 72 Q74 91 50 91 Q27 90 22 69Z','#b04e43');p('M40 18 L47 35 L38 44 L48 54 L40 68 L47 88 L61 88 L57 72 L68 60 L59 49 L64 35 L56 28 L56 14Z','#efb354',null);l('M42 33 L49 38 L42 45 L51 52 L46 60',ink,3);break;
      case 'bonk_dog':p('M20 41 L80 41 L92 80 Q51 94 10 80Z','#ba5e68');e(50,42,30,10,'#492c31');l('M19 72 Q48 82 82 72','#e28a92',3);p('M36 61 C25 53 27 69 34 68 C26 77 41 80 41 70 L61 70 C70 80 77 68 69 65 C76 57 61 53 61 62 L41 62Z','#e9e1dc',ink,2.5);break;
      case 'catling_gun':p('M27 44 L52 30 L81 43 L80 79 L52 92 L25 77Z','#ac895f');p('M26 45 L52 57 L81 44 L52 31Z','#5e4934');p('M26 45 L12 35 L38 22 L52 31Z','#cead81');p('M52 31 L66 18 L94 30 L81 44Z','#d5b88b');p('M26 45 L12 57 L38 71 L52 57Z','#d3b58a');p('M52 57 L67 72 L94 56 L81 44Z','#c4a47a');l('M52 61 L52 88','#6e5038',2);break;
      case 'doc_moth':l('M51 47 Q43 76 64 80 Q78 82 76 68','#4f9359',5);p('M54 69 Q31 69 34 54 Q47 53 54 69Z','#82b36d');for(let i=0;i<8;i++){d.save();d.translate(51,35);d.rotate(i*Math.PI/4);e(0,-15,7,13,'#ece8dc',ink,2.6);d.restore();}e(51,35,11,11,'#e1bc62',ink,3);break;
      case 'jellyshield':p('M24 72 Q15 51 26 28 Q39 10 61 19 Q84 24 81 49 L86 69 L76 77 Q46 91 24 72Z','#9ad1d2');e(52,48,23,27,'#5c9eaf');e(55,48,14,20,'#4f78ac',null);e(57,48,9,14,'#79b0d0',null);e(68,29,9,10,'#efffff',null);e(32,64,6,7,'#d3f4f0',null);break;
      case 'lootworm':p('M23 68 Q17 43 41 16 Q52 7 64 20 Q86 45 79 71 Q73 91 51 91 Q28 90 23 68Z','#8bc17d');for(const [x,y,rx,ry]of [[47,25,7,10],[33,51,6,9],[65,44,8,10],[51,71,8,11],[72,76,3,5]])e(x,y,rx,ry,'#4f7955',null);break;
      case 'ratzilla':p('M16 58 L56 20 L87 56 L86 80 L18 83Z','#cb8a4d');p('M16 58 L56 20 L87 56 L49 67Z','#e6c174');p('M16 58 L49 67 L49 86 L18 83Z','#ddb068');p('M49 67 L87 56 L86 80 L49 86Z','#c89a56');for(const [x,y,rx,ry]of [[48,39,5,4],[63,53,7,4],[32,58,4,3],[28,72,3,4],[67,74,4,5]])e(x,y,rx,ry,'#aa763d',null);break;
      case 'scapegoat':p('M12 37 L82 30 L92 52 L87 82 L19 86 L11 66Z','#cfb66a');for(let i=0;i<11;i++)l(`M${17+i*6} 37 L${19+i*6} 79`,i%2?'#a78c48':'#e6d38d',2);p('M32 35 L40 34 L45 83 L36 84Z','#72949b',ink,2);p('M68 31 L76 31 L79 83 L71 84Z','#72949b',ink,2);break;
      case 'landmines':d.save();d.translate(-15,-13);d.scale(.87,.87);ivPaintSummon('mine',0,a);d.restore();d.save();d.translate(27,19);d.scale(.75,.75);ivPaintSummon('mine',1,a);d.restore();break;
      default:ivPaintSummon(id,0,a);
    }
  });IV_ART_CACHE.set(key,sp);return sp;
}
const _ivItemBeforeSummons=ivItemSprite;ivItemSprite=function(id){return id==='landmines'||IV_SUMMON_IDS.includes(id)?ivSummonItemSprite(id):_ivItemBeforeSummons(id);};
ivDrawStructures=function(cx,cy){for(const s of G.iv.str){const x=Math.round(s.x-cx),y=Math.round(s.y-cy),sp=ivSummonSprite(s.k,Math.floor((G.time+s.x*.01)*5));shadow(x,y+4,9);ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(sp.n,x-18,y-28,36,34);ctx.restore();
  if(s.flash>0&&['turret','explosive_turret','incendiary_turret'].includes(s.k)){ctx.save();ctx.globalAlpha=Math.min(1,s.flash*8);disc(x,y-10,2,s.k==='incendiary_turret'?'#f1ad65':'#f8dc9c');ctx.restore();}
}};
ivDrawCompanions=function(cx,cy){for(const q of G.iv.pets){const x=Math.round(q.x-cx),y=Math.round(q.y-cy),sp=ivSummonSprite(q.id,Math.floor((G.time+q.x*.01)*7)),hover=['doc_moth','jellyshield','wandering_bot'].includes(q.id),lift=hover?Math.sin(G.time*4+q.a)*1.5-3:0;shadow(x,y+5,8);ctx.save();ctx.imageSmoothingEnabled=true;if(q.hp<=0)ctx.globalAlpha=.4;ctx.translate(x,y);if(Math.cos(q.facing||0)<0)ctx.scale(-1,1);ctx.drawImage(sp.n,-16,-25+lift,32,30);ctx.restore();
  if(q.id==='jellyshield'){ctx.save();ctx.globalAlpha=.25;ringC(x,y-4,13,'#8ac1c1',1);ctx.restore();}
  if(q.id==='scapegoat'&&q.hp<=0){text('靠近复活',x,y+10,TH.dim,.8,'center');if(q.revive){rect(x-10,y+7,20,1,'#303b38');rect(x-10,y+7,10*q.revive,1,'#c7ca9a');}}
}for(const q of G.iv.healShots||[]){const x=q.x-cx,y=q.y-cy;ctx.save();ctx.globalAlpha=.2;disc(x,y,5,'#8bcaa7');ctx.restore();rect(x-2,y,5,1,'#a5c590');rect(x,y-2,1,5,'#e3e5c6');}};
