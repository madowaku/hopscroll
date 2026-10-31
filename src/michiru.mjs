// Approved PR #12 sprite B and its original code-native fallback. Foot-origin in both modes.
function michiruShape(g,{earA=-.25,mood='play',glow=10,flow=0,crouch=0}={}){
  const f=Math.max(0,Math.min(1,flow)),c=Math.max(0,Math.min(1,crouch)),u=9*(1-f)*(1-c);
  const white='#f5f1fa',hair='#e5e0f2',shade='#aba1d5',navy='#243052',skin='#ffdfce',pink='#f3acbc';
  g.save();g.lineJoin='round';g.lineCap='round';
  const path=(d,c,edge=true)=>{const p=new Path2D(d);g.fillStyle=c;
    if(edge){g.strokeStyle='#d8eaff';g.lineWidth=1.2;g.shadowColor='#d8eaff';g.shadowBlur=Math.min(glow,1.5);g.stroke(p);}
    g.shadowBlur=0;g.fill(p);};
  const line=(d,c=shade,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.stroke(new Path2D(d));};
  const oval=(x,y,rx,ry,c)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  // Bare knees and separate boots: the rear leg kicks back as speed rises, the front knee tucks up while SLOW,
  // and both fold short (wider, lower) in the landing crouch.
  g.save();g.scale(1+.18*c,1-.42*c);
  path(`M -10 -31 L 0 -29 L ${-5-24*f} ${-9-10*f} L ${-14-24*f} ${-10-10*f} Z`,skin);
  path(`M ${-14-24*f} ${-13-10*f} L ${-5-24*f} ${-11-10*f} L ${-2-24*f} ${-3-10*f} Q ${-8-24*f} ${1-10*f} ${-17-24*f} ${-3-10*f} Z`,white);
  path(`M 3 -30 L 13 -31 L ${13+9*f-u*.6} ${-10-u} L ${5+9*f-u*.6} ${-8-u} Z`,skin);
  path(`M ${4+9*f-u*.6} ${-12-u} L ${14+9*f-u*.6} ${-13-u} L ${16+9*f-u*.6} ${-6-u} Q ${24+9*f-u*.6} ${-4-u} ${21+9*f-u*.6} ${-u} L ${4+9*f-u*.6} ${-u} Z`,white);
  line(`M ${4+9*f-u*.6} ${-11-u} L ${14+9*f-u*.6} ${-12-u}`,shade,3);
  line(`M ${-14-24*f} ${-12-10*f} L ${-5-24*f} ${-10-10*f}`,shade,3);
  g.restore();
  // Lean the torso forward about the hips, independently of the existing whole-body lean.
  g.translate(0,12.6*c-30);g.rotate(.24*f);g.translate(0,30);
  path(`M -8 -64 Q -20 -52 ${-35-17*f} ${-25-28*f} Q -20 -15 15 -25 L 15 -58 Z`,navy);
  path(`M -8 -63 Q -24 -54 ${-37-18*f} ${-30-27*f} Q -29 -20 -14 -26 Q -2 -15 19 -29 L 12 -59 Z`,white);
  path('M -7 -58 L 12 -58 L 15 -27 Q 4 -20 -4 -30 Z',shade,false);
  path('M -3 -58 L 8 -58 L 10 -28 Q 3 -23 -2 -30 Z',white,false);
  path(`M -8 -44 Q -27 ${-38-15*f} ${-43-17*f} ${-39-17*f} L ${-35-20*f} ${-34-19*f} L -7 -41 Z`,'#e6bf73',false);
  path('M -10 -46 L 13 -46 L 14 -42 L -10 -42 Z','#e6bf73',false);
  // Broad rear sleeve, with a visible navy opening and lilac fold.
  path(`M -7 -62 Q -20 -63 ${-38-21*f} ${-45-15*f} Q ${-42-17*f} ${-22-30*f} -12 -32 L 6 -53 Z`,hair);
  path(`M ${-38-21*f} ${-45-15*f} Q ${-36-17*f} ${-25-28*f} -17 -34 Q -29 -37 ${-38-21*f} ${-45-15*f} Z`,navy,false);
  line(`M -9 -57 Q -22 -49 ${-31-16*f} ${-42-12*f}`);
  path('M -9 -66 L 12 -66 L 17 -56 L 1 -51 L -13 -57 Z',navy);
  path('M -8 -64 L 2 -55 L 0 -48 L -16 -58 Z',hair);
  path('M 11 -64 L 2 -55 L 9 -50 L 17 -58 Z',white);
  // Bob silhouette with soft rounded tips, never a round white animal head.
  path(`M -22 -65 Q -29 -81 -19 -91 Q -5 -103 14 -94 Q 26 -90 26 -77 Q 24 -66 20 -64 L 8 -59 L -13 -60 Q -18 -60 -22 -63 Q ${-29-13*f} -63 ${-27-13*f} -67 Q ${-26-15*f} -70 ${-29-16*f} -73 Q -26 -77 -22 -75 Z`,hair);
  // Far left ear: rising base, pronounced corner, then a broad downward tip.
  g.save();g.translate(7,-94);g.rotate(earA*.22-.65*f);
  path('M -4 3 Q 3 -15 18 -15 Q 24 -14 25 -8 L 30 4 Q 30 9 23 6 L 15 -4 L 15 -9 Q 6 -7 3 4 Z',shade);
  path('M 0 0 Q 8 -12 18 -13 L 17 -8 Q 8 -6 4 3 Z',pink,false);
  path('M 18 -14 Q 25 -14 25 -7 L 30 3 Q 31 10 23 5 L 16 -5 Z',white);
  g.restore();
  // Near right ear stays unbroken, sweeping far behind the head at FAST.
  g.save();g.translate(-13,-93);g.rotate(earA*(.75+.35*f)-.3*f);
  path('M -5 4 Q -12 -12 -5 -28 Q -3 -32 0 -27 Q 10 -11 5 4 Z',white);
  path('M -2 0 Q -7 -13 -3 -23 Q 5 -11 2 1 Z',pink,false);g.restore();
  // Human cheek/chin contour: no projecting nose or muzzle.
  path('M -7 -87 Q 11 -94 22 -82 L 23 -72 Q 24 -62 14 -59 Q 3 -57 -6 -65 Z',skin,false);
  oval(-6,-70,4,5,skin);
  // Crown, long bangs, and the cheek-framing side lock.
  path('M -24 -76 Q -26 -95 -8 -98 Q 16 -102 25 -83 L 25 -76 L 20 -79 L 16 -88 Q 17 -80 13 -75 Q 6 -79 3 -89 Q 2 -78 -5 -74 L -7 -63 Q -12 -60 -16 -61 Q -21 -63 -20 -67 Q -24 -67 -24 -71 Z',hair);
  path('M -18 -87 Q -20 -73 -15 -65 L -10 -66 L -10 -73 Q -13 -77 -10 -91 Z',white,false);
  line('M -6 -94 Q -12 -83 -8 -73 M 4 -94 Q 5 -82 13 -76 M -20 -79 L -20 -70');
  // One large profile eye, eyelash and small blush; closed smile / X on cards.
  if(mood==='happy')line('M 11 -72 Q 16 -79 20 -72','#50342f',2);
  else if(mood==='dizzy')line('M 11 -78 L 19 -70 M 19 -78 L 11 -70','#50342f',2);
  else{
    oval(16,-73.5,4.2,6,'#50342f');oval(17,-71.5,2.6,3.4,'#795044');oval(17.2,-76,1.3,1.8,'#fff8ef');
    line('M 10 -78 Q 15 -82 20 -78','#50342f',1.4);
  }
  oval(17,-65.5,4,1.7,pink);
  line('M 21 -69 L 22 -68','#bc8279',.7);
  line(mood==='happy'?'M 16 -62 Q 18 -60 20 -62':'M 18 -62 L 20 -62','#9b665f',.8);
  // Front sleeve and hand move inward to protect the skewer during FAST.
  g.save();g.translate(-8*f,13*f);
  path(`M 8 -56 Q -2 -52 ${-5-12*f} ${-32-14*f} Q 10 -27 26 -46 L 23 -54 Q 17 -50 8 -56 Z`,white);
  path('M 23 -54 Q 17 -48 23 -43 L 28 -47 Z',navy,false);
  line('M 7 -51 Q 5 -43 1 -39');
  line('M 27 -44 L 35 -78','#ac8058',1.7);
  oval(29,-60,4.8,4.8,pink);oval(31,-69,4.8,4.8,'#fff0e6');oval(33,-78,4.8,4.8,'#fff0e6');
  path('M 23 -53 Q 28 -57 30 -52 L 28 -46 Q 24 -44 22 -48 Z',skin,false);
  g.restore();g.restore();
  g.restore();
}
const MICHIRU_FRAMES={front:[3,3,107,218,54],happy:[116,3,107,218,54],profile:[229,3,95,218,46],slow:[330,3,116,202,60],fast:[452,3,142,170,84],land:[600,3,125,156,64]};
const MICHIRU_UNIT=.6; // 218 atlas px standing = 131 units = 65 CSS px; the SLOW hop pose is ~61 px.

export function createMichiru(){
 const atlas=new Image();let status='loading',lastPose='front';
 atlas.onload=()=>{status='ready';};atlas.onerror=()=>{status='broken';};
 atlas.src=new URL('../assets/img/michiru-sprites.png',import.meta.url).href;
 return {get status(){return status;},get pose(){return lastPose;},draw(g,x,y,pose='slow',scale=.48){
  lastPose=pose;g.save();g.translate(x,y);g.scale(scale,scale);
  if(status==='ready'){
   const f=MICHIRU_FRAMES[pose];g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.shadowColor='#cfe6ff';g.shadowBlur=4;
   g.drawImage(atlas,f[0],f[1],f[2],f[3],-f[4]*MICHIRU_UNIT,-f[3]*MICHIRU_UNIT,f[2]*MICHIRU_UNIT,f[3]*MICHIRU_UNIT);
  }else if(status==='broken')michiruShape(g,{flow:pose==='fast'?1:0,crouch:pose==='land'?1:0,mood:pose==='happy'?'happy':'play'});
  g.restore();
 }};
}
