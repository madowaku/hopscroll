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
