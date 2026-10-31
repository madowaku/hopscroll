// Star-rabbit sky for the Moon stages, ported from the campaign renderer (src/game.mjs, PR #7):
// layered parallax stars that streak while FAST, shooting stars, a comet tail behind Michiru,
// and lanes that glow icy blue. Draw-only: nothing here touches physics or collision.
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Deterministic sky so every run (and every screenshot) looks the same.
const rand=(s=>()=>(s=s*16807%2147483647)/2147483647)(20261101);
const STARS=Array.from({length:96},()=>({x:rand()*420,y:rand(),r:.35+rand()*1.25,layer:rand()<.55?0:rand()<.65?1:2,tw:rand()*6.3}));
const PAR=[.03,.09,.2];
// Generated bridge and Earth art (art/generated/moon-journey, shrunk by scripts/make_moon_art.py).
// Until an image loads, or if it fails, the code-drawn version is used.
const art=name=>{const im=new Image();im.decoding='async';im.src=new URL(`../assets/img/${name}`,import.meta.url).href;return im;};
const ready=im=>im.complete&&im.naturalWidth>0;
const ART={moon:art('moon-bridge.webp'),meteor:art('meteor-bridge.webp'),earth:art('earth.webp')};
// 3-slice cuts in the 768-wide images: slab top/thickness, where the slab body starts/ends,
// and the plain middle that stretches. Measured by eye on a pixel grid.
const SLICE={moon:{top:8,thick:30,slabL:10,slabR:758,capL:110,capR:650},meteor:{top:18,thick:34,slabL:95,slabR:752,capL:210,capR:615}};
function drawSlab(g,im,c,L,R,floor,alpha){
 const w=im.naturalWidth,h=im.naturalHeight;let k=11/c.thick;
 // Narrow bridges: shrink the caps so the stretched middle never goes negative.
 k=Math.min(k,(R-L)/((c.capL-c.slabL)+(c.slabR-c.capR)+4));
 const y=floor-c.top*k,dh=h*k,ml=L+(c.capL-c.slabL)*k,mr=R-(c.slabR-c.capR)*k;
 g.save();g.globalAlpha*=alpha;
 g.drawImage(im,0,0,c.capL,h,L-c.slabL*k,y,c.capL*k,dh);
 g.drawImage(im,c.capL,0,c.capR-c.capL,h,ml,y,mr-ml,dh);
 g.drawImage(im,c.capR,0,w-c.capR,h,mr,y,(w-c.capR)*k,dh);
 g.restore();
}

export function createSky(){
 // flow: 0 = calm SLOW sky, 1 = full FAST rush. It rises quickly but falls slowly, so on RELEASE
 // the streaks and the comet tail unravel instead of snapping off.
 let flow=0,time=0,wasFast=false;
 const meteors=[],motes=[],trail=[];
 const spawn=p=>{if(motes.length<220)motes.push({vx:0,vy:0,g:0,size:2,life:.6,age:0,...p});};
 function burst(x,y,fast){
  motes.push({ring:true,x,y,life:fast?.3:.45,age:0,color:fast?'#bdf1ff':'#e6dcff',grow:fast?40:22});
  if(reduceMotion)return;
  for(let n=0;n<(fast?10:7);n++){const a=Math.PI*(.5+n/(fast?9:6));spawn({x,y,vx:Math.cos(a)*(fast?170:60),vy:Math.sin(a)*(fast?120:40),g:fast?0:-20,life:fast?.35:.7,size:fast?2.2:1.8,color:fast?'#fff8d6':'#d9d3ff'});}
 }
 return {
  get flow(){return flow;},
  reset(){flow=0;wasFast=false;meteors.length=motes.length=trail.length=0;},
  // hero: {x: world x, y: screen y of the cloak}; live = the run is advancing.
  step(dt,fast,live,hero){
   time+=dt;
   const target=live&&fast?1:0;
   flow=reduceMotion?target:flow+(target-flow)*Math.min(1,dt*(target>flow?10:2.2));
   if(live&&fast!==wasFast)burst(hero.x,hero.y,fast);
   wasFast=live&&fast;
   for(let i=motes.length-1;i>=0;i--){const p=motes[i];p.age+=dt;if(p.age>=p.life){motes.splice(i,1);continue;}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
   for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];m.age+=dt;if(m.age>=m.life){meteors.splice(i,1);continue;}m.x+=m.vx*dt;m.y+=m.vy*dt;}
   if(live)trail.push({x:hero.x,y:hero.y,t:time});
   while(trail.length&&time-trail[0].t>.5)trail.shift();
   if(reduceMotion)return;
   if(flow>.35&&Math.random()<dt*3.2*flow)meteors.push({x:150+Math.random()*260,y:.05+Math.random()*.4,vx:-560-Math.random()*240,vy:150+Math.random()*80,life:.55,age:0,len:.05+Math.random()*.04});
   // Stardust shed by the cloak: a thin wisp when SLOW, a long glittering stream when FAST.
   if(live&&Math.random()<dt*(5+55*flow))spawn({x:hero.x-12,y:hero.y+(Math.random()-.5)*6,vx:-10-30*flow,vy:(Math.random()-.5)*16,g:-6,life:.3+.75*flow,size:1.2+Math.random()*1.6,color:Math.random()<.5?'#fff3c0':'#cfefff'});
  },
  landing(x,floor){if(reduceMotion)return;for(let n=0;n<7;n++)spawn({x:x+(n-3)*4,y:floor-2,vx:(n-3)*26,vy:-22-Math.random()*22,g:50,life:.4,size:2,color:n%2?'#dff4ff':'#9fd8ff'});},
  // Floating pickup label ("+団子") with a gold ring, rising above Michiru.
  pop(x,y,text){motes.push({text,x,y,vx:0,vy:-34,g:0,life:1.2,age:0});motes.push({ring:true,x,y:y+30,life:.5,age:0,color:'#ffd879',grow:34});
   if(!reduceMotion)for(let n=0;n<12;n++){const a=n/12*Math.PI*2;spawn({x,y:y+30,vx:Math.cos(a)*120,vy:Math.sin(a)*120,g:90,life:.55,size:2.2,color:n%2?'#fff6c4':'#f6b8c8'});}},
  // Gold stardust rising from the moon gate on a clear.
  celebrate(a,b,floor){const colors=['#ffd84a','#fff7dc','#bfe8ff','#ffe9a8'];motes.push({ring:true,x:(a+b)/2,y:floor-20,life:.6,age:0,color:'#ffd84a',grow:60});
   for(let n=0;n<(reduceMotion?0:54);n++)spawn({x:a+Math.random()*(b-a),y:floor-2-Math.random()*20,vx:(Math.random()-.5)*50,vy:-60-Math.random()*190,g:-25,life:1.2+Math.random()*.6,size:1.6+Math.random()*2.4,color:colors[n%4]});},
  // Moon gate over the goal span: two pillars, an arch holding a full moon, a gold pad and a light column.
  drawGoal(g,L0,R0,floor){
   const L=L0-16,R=R0+16,cx=(L0+R0)/2,w=R-L,top=floor-128;
   const beam=g.createLinearGradient(0,top,0,floor);beam.addColorStop(0,'#ffd65a00');beam.addColorStop(1,'#ffd65a55');g.fillStyle=beam;g.fillRect(L,top,w,floor-top);
   g.fillStyle='#ffcf4a';g.beginPath();g.roundRect(L0,floor-4,R0-L0,9,4);g.fill();g.fillStyle='#fff3c4';for(let x=L0+6;x<R0-6;x+=14)g.fillRect(x,floor-2,7,3);
   g.fillStyle='#ffd665';for(const px of [L-4,R-3]){g.beginPath();g.roundRect(px,floor-112,7,112,3);g.fill();}
   g.strokeStyle='#ffd665';g.lineWidth=5;g.beginPath();g.ellipse(cx,floor-110,w/2+1,24,0,Math.PI,0);g.stroke();
   const my=floor-122,pulse=reduceMotion?1:1+Math.sin(time*2.2)*.06,halo=g.createRadialGradient(cx,my,4,cx,my,42*pulse);
   halo.addColorStop(0,'#fff6d6ee');halo.addColorStop(.4,'#ffe28a88');halo.addColorStop(1,'#ffd87900');g.fillStyle=halo;g.beginPath();g.arc(cx,my,42*pulse,0,Math.PI*2);g.fill();
   g.fillStyle='#fffaf0';g.beginPath();g.arc(cx,my,13,0,Math.PI*2);g.fill();
   g.fillStyle='#f3e4b8';g.beginPath();g.arc(cx-4,my-3,2.6,0,Math.PI*2);g.arc(cx+5,my+4,2,0,Math.PI*2);g.fill();
   // Small banners on the pillars, swaying.
   const sway=reduceMotion?0:Math.sin(time*2)*2;
   for(const [px,c] of [[L-4,'#e4c5eb'],[R-3,'#b9d7ff']]){g.fillStyle=c;g.beginPath();g.moveTo(px+7,floor-100);g.lineTo(px+7+14+sway,floor-94);g.lineTo(px+7,floor-84);g.closePath();g.fill();}
  },
  drawSky(g,W,H,floor,camera){
   const bg=g.createLinearGradient(0,0,0,floor);bg.addColorStop(0,'#0a1230');bg.addColorStop(.55,'#1d2160');bg.addColorStop(.88,'#2c4580');bg.addColorStop(1,'#4d7fa8');
   g.fillStyle=bg;g.fillRect(0,0,W,floor);
   const nebula=(x,y,r,c)=>{const n=g.createRadialGradient(x,y,0,x,y,r);n.addColorStop(0,c);n.addColorStop(1,'#00000000');g.fillStyle=n;g.fillRect(x-r,y-r,r*2,r*2);};
   const drift=((camera*.012)%520+520)%520;
   nebula(250-drift,floor*.5,150,'#7a4fd833');nebula(770-drift,floor*.3,170,'#4fb5d82a');nebula(610-drift,floor*.85,130,'#c06ad022');
   const streak=reduceMotion?0:flow;g.lineCap='round';
   for(const s of STARS){
    const x=((s.x-camera*PAR[s.layer])%420+420)%420-30,y=s.y*(floor-20);
    g.globalAlpha=(.35+.5*(reduceMotion?.5:.5+.5*Math.sin(time*1.7+s.tw)))*(1-streak*.4);
    g.strokeStyle=g.fillStyle=s.layer===2?'#fff6dc':'#dfe8ff';
    const len=streak*(4+s.layer*16);
    if(len>1){g.lineWidth=s.r*1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x+len,y);g.stroke();}
    else{g.beginPath();g.arc(x,y,s.r,0,Math.PI*2);g.fill();}
   }
   g.globalAlpha=1;
   for(const m of meteors){const k=1-m.age/m.life,my=m.y*floor,tx=m.x-m.vx*m.len,ty=my-m.vy*m.len,s=g.createLinearGradient(m.x,my,tx,ty);
    s.addColorStop(0,`rgba(255,250,225,${.9*k})`);s.addColorStop(1,'rgba(160,210,255,0)');g.strokeStyle=s;g.lineWidth=2;g.beginPath();g.moveTo(m.x,my);g.lineTo(tx,ty);g.stroke();}
   const haze=g.createLinearGradient(0,floor-90,0,floor);haze.addColorStop(0,'#8fd3ff00');haze.addColorStop(1,`rgba(143,211,255,${.12+.1*flow})`);g.fillStyle=haze;g.fillRect(0,floor-90,W,90);
   // A dark void below the lane, so gaps read instantly.
   const below=g.createLinearGradient(0,floor,0,H);below.addColorStop(0,'#0b1030');below.addColorStop(1,'#03050f');g.fillStyle=below;g.fillRect(0,floor,W,H-floor);
  },
  // Normal footpath: glowing body + underglow; the bright line spans exactly the safe part (8 in from each end).
  drawLane(g,L,R,safeL,safeR,floor,dash){
   // Short underglow that falls away into the night, so a lane never reads as a solid block.
   const under=g.createLinearGradient(0,floor+8,0,floor+50);under.addColorStop(0,`rgba(110,190,255,${.3+.15*flow})`);under.addColorStop(1,'rgba(110,190,255,0)');
   g.fillStyle=under;g.fillRect(L+3,floor+8,R-L-6,42);
   const body=g.createLinearGradient(0,floor,0,floor+14);body.addColorStop(0,'#b9e4ff');body.addColorStop(1,'#3f6fc4');
   g.fillStyle=body;g.beginPath();g.roundRect(L,floor,R-L,14,6);g.fill();
   g.fillStyle=`rgba(190,235,255,${.35+.2*flow})`;g.fillRect(safeL,floor-3,safeR-safeL,5);
   g.fillStyle='#f6fcff';g.fillRect(safeL,floor-1,safeR-safeL,2.5);
   g.fillStyle='#ffffffb0';const len=4+(reduceMotion?0:flow*18);
   for(const d of dash)if(d<R-4)g.fillRect(d,floor+6,Math.min(len,R-d-2),1.6);
  },
  // Moon bridge: solid, glowing lavender while SLOW (safe); a faint dashed ghost while FAST (it will not hold).
  drawBridge(g,L,R,safeL,safeR,floor,fast){
   if(ready(ART.moon)){drawSlab(g,ART.moon,SLICE.moon,L,R,floor,fast?.2:1);
    if(fast){g.strokeStyle='rgba(214,190,235,.75)';g.lineWidth=2;g.setLineDash([5,5]);g.strokeRect(L+1,floor,R-L-2,8);g.setLineDash([]);}
    else{g.fillStyle='#faf7ff';g.fillRect(safeL,floor-1,safeR-safeL,2);}
    return;}
   if(fast){
    g.fillStyle='rgba(120,105,170,.16)';g.fillRect(L,floor,R-L,8);
    g.strokeStyle='rgba(214,190,235,.75)';g.lineWidth=2;g.setLineDash([5,5]);g.strokeRect(L+1,floor,R-L-2,8);g.setLineDash([]);
    return;
   }
   const under=g.createLinearGradient(0,floor+6,0,floor+36);under.addColorStop(0,'rgba(190,170,255,.4)');under.addColorStop(1,'rgba(190,170,255,0)');
   g.fillStyle=under;g.fillRect(L+3,floor+6,R-L-6,30);
   const body=g.createLinearGradient(0,floor,0,floor+9);body.addColorStop(0,'#e4dcff');body.addColorStop(1,'#8b80d0');
   g.fillStyle=body;g.beginPath();g.roundRect(L,floor,R-L,9,4);g.fill();
   g.fillStyle='rgba(222,210,255,.55)';g.fillRect(safeL,floor-4,safeR-safeL,6);
   g.fillStyle='#faf7ff';g.fillRect(safeL,floor-1,safeR-safeL,2.5);
   if(!reduceMotion){g.fillStyle='#fff';for(let i=0;i<3;i++){const t=(time*.6+i/3)%1;g.globalAlpha=Math.sin(t*Math.PI)*.9;g.beginPath();g.arc(safeL+(safeR-safeL)*((i*.37+.15)%1),floor-6-t*10,1.3,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
  },
  // Meteor bridge: a gold-white streak that is solid while FAST and only a faint dotted trace while SLOW.
  drawMeteor(g,L,R,safeL,safeR,floor,solid){
   if(ready(ART.meteor)){drawSlab(g,ART.meteor,SLICE.meteor,L,R,floor,solid?1:.2);
    if(!solid){g.fillStyle='rgba(255,226,170,.6)';for(let x=L+3;x<R-3;x+=7)g.fillRect(x,floor+2,3,2);}
    else{g.fillStyle='#fffaf0';g.fillRect(safeL,floor-1,safeR-safeL,2);}
    return;}
   if(!solid){
    g.fillStyle='rgba(255,220,150,.08)';g.fillRect(L,floor,R-L,7);
    g.fillStyle='rgba(255,226,170,.55)';for(let x=L+3;x<R-3;x+=7)g.fillRect(x,floor+2,3,2);
    return;
   }
   const under=g.createLinearGradient(0,floor+6,0,floor+34);under.addColorStop(0,'rgba(255,214,120,.42)');under.addColorStop(1,'rgba(255,214,120,0)');
   g.fillStyle=under;g.fillRect(L+3,floor+6,R-L-6,28);
   const body=g.createLinearGradient(L,0,R,0);body.addColorStop(0,'#ffd27b');body.addColorStop(.5,'#fff6d8');body.addColorStop(1,'#ffc46a');
   g.fillStyle=body;g.beginPath();g.roundRect(L,floor,R-L,8,4);g.fill();
   g.fillStyle='rgba(255,236,180,.6)';g.fillRect(safeL,floor-4,safeR-safeL,6);g.fillStyle='#fffaf0';g.fillRect(safeL,floor-1,safeR-safeL,2.5);
   // Streaks trailing off the back edge, like a falling star lying down.
   if(!reduceMotion){g.strokeStyle='rgba(255,238,190,.7)';g.lineWidth=1.4;g.lineCap='round';for(let i=0;i<3;i++){const y=floor+2+i*2,len=10+((time*40+i*13)%18);g.beginPath();g.moveTo(L,y);g.lineTo(L-len,y);g.stroke();}}
  },
  // Earth: the generated globe when loaded, otherwise false.
  get earthReady(){return ready(ART.earth);},
  drawEarth(g,x,y,r){if(!ready(ART.earth))return false;const s=r*2*1.08;g.drawImage(ART.earth,x-s/2,y-s/2,s,s);return true;},
  // Comet tail along Michiru's real recent path: longer and brighter while FAST, easing out after RELEASE.
  drawTrail(g,sx){
   const span=.1+.32*flow;let prev=null;g.lineCap='round';
   for(const p of trail){const age=time-p.t;if(age>span){prev=null;continue;}
    const x=sx(p.x),k=1-age/span;
    if(prev){g.strokeStyle=`rgba(255,244,200,${(.1+.5*flow)*k})`;g.lineWidth=1+7*k*(.35+.65*flow);g.beginPath();g.moveTo(prev[0],prev[1]);g.lineTo(x,p.y);g.stroke();}
    prev=[x,p.y];
   }
  },
  drawMotes(g,sx){
   for(const p of motes){const k=p.age/p.life,x=sx(p.x);g.globalAlpha=Math.max(0,1-k);
    if(p.ring){g.strokeStyle=p.color;g.lineWidth=3*(1-k)+.5;g.beginPath();g.arc(x,p.y,10+k*p.grow,0,Math.PI*2);g.stroke();}
    else if(p.text){g.globalAlpha=Math.min(1,(1-k)*2);g.font='bold 16px "Yu Gothic UI",system-ui,sans-serif';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#2a1d3a';g.strokeText(p.text,x,p.y);g.fillStyle='#ffe9a8';g.fillText(p.text,x,p.y);g.textAlign='start';}
    else{g.fillStyle=p.color;g.beginPath();g.arc(x,p.y,p.size*(1-k*.5),0,Math.PI*2);g.fill();}
   }
   g.globalAlpha=1;
  }
 };
}
