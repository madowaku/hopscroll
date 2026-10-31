import {moonLevels} from './moon-levels.mjs';
const surfaces=rows=>rows.map(([a,b,kind='normal'])=>({a,b,kind}));
// Reference routes are witnesses, not required hop counts or player instructions.
export const journeyLevels=[
 {id:'001',title:'月の庭',subtitle:'団子を届けに、月道へ。',start:75,route:'SSSFSSFFSSFM',goal:[1620,1685],checkpoint:null,
  // Even three full FAST hops (706.8) stay on the introductory lawn.
  surfaces:surfaces([[0,744],[854,958],[1064,1329],[1439,1543],[1606,1704]])},
 {id:'002',title:'夜風の間',subtitle:'遠くへ。けれど、飛びすぎず。',start:75,route:'SSFFSSMFSSFMFSFMFS',goal:[2660,2725],
  checkpoint:{hop:9,a:1260,b:1300,x:1280.7},
  surfaces:surfaces([[0,288],[397,501],[608,873],[939,1037],[1147,1412],[1521,1625],[1689,1787],[1896,2079],[2189,2293],[2356,2454],[2564,2747]])},
 ...moonLevels,
 // Meteor Sea: meteor bridges (gold) hold only FAST landings, moon bridges (lilac) only released ones.
 // Every landing is generated from the reference route; a wrong speed falls into a gap.
 {id:'006',title:'流星の海',subtitle:'速いまま降りると、流れ星が道になる。',start:75,
  route:'SSFSSFMFSSFFMSFMFSFMMFS',goal:[3505,3580],
  checkpoint:{hop:9,a:1270,b:1292,x:1280.7},
  // Frozen demo over the first meteor bridge: SLOW misses it, FAST lands on it.
  demo:{x:400,phase:.5},
  surfaces:surfaces([[0,288],[409.4,489.4,'meteor'],[491.3,653.2],[783.8,863.8,'meteor'],[948.2,1028.2,'bridge'],[1158.8,1238.8,'meteor'],
   [1240.7,1402.6],[1533.2,1613.2,'meteor'],[1743.8,1823.8,'meteor'],[1908.2,1988.2,'bridge'],[1990.1,2070.1],[2200.7,2280.7,'meteor'],
   [2365.1,2445.1,'bridge'],[2575.7,2655.7,'meteor'],[2657.6,2737.6],[2868.2,2948.2,'meteor'],[3032.6,3112.6,'bridge'],[3197,3277,'bridge'],
   [3407.6,3487.6,'meteor'],[3489.5,3599.5]])},
 {id:'005',title:'地球見の夜',subtitle:'地球の光へ、団子を届けよう。',start:75,
  route:'SSFFMSFFMSMFFSMFMSFMFSFMFSFMFSFM',goal:[5205,5267],festival:true,
  checkpoint:{hop:16,a:2600,b:2630,x:2616.3},
  // One ordinary released hop on recovery; two S hops replace reference M.
  recoveryRoute:'SSSFMFSFMFSFMFSFM',
  bonusIsland:{a:3420,b:3476},
  surfaces:surfaces([[0,288],[397,501],[608,712],[775,865,'bridge'],[865,955],[1065,1169],[1276,1380],
   [1443,1533,'bridge'],[1533,1623],[1689,1787,'bridge'],[1897,2001],[2107,2290],[2357,2455,'bridge'],
   [2564,2720],[2732,2822,'bridge'],[2822,2912],[3021,3125],[3189,3273,'bridge'],[3281,3361],
   [3396,3579],[3689,3793],[3856,3954,'bridge'],[4064,4247],[4356,4460],[4524,4622,'bridge'],
   [4731,4825],[4825,4914,'bridge'],[5024,5128],[5191,5289,'bridge']])}
];
