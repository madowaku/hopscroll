// Design v0.1: only Stage 003/004 are admitted to this isolated experiment.
// Coordinates remain explicit and reviewable. Render the inset safe span.
const surfaces = rows => rows.map(([a,b,kind='normal'])=>({a,b,kind}));
export const moonLevels = [
 {id:'003',title:'しずかな月光橋',subtitle:'速く進んで、離して道をつくる。',start:75,
  route:'SSFFMSFMSSFMFSFMSFFSMF',goal:[3410,3485],
  checkpoint:{hop:9,a:1345,b:1385,x:1363.2},
  surfaces:surfaces([[0,288],[397,501],[608,712],[775,865,'bridge'],[865,955],[1065,1169],[1232,1322,'bridge'],[1322,1494],[1604,1708],[1771,1869,'bridge'],[1979,2162],[2271,2375],[2439,2529,'bridge'],[2529,2619],[2728,2832],[2939,3122],[3188,3286,'bridge'],[3396,3500]])},
 {id:'004',title:'ふたつの月道',subtitle:'違うリズムで、同じ場所へ。',start:75,
  route:'SSFFSMFFSSFMSFFMSSFFMSMFFS',goal:[3995,4070],
  checkpoint:{hop:12,a:1840,b:1885,x:1866.3},
  bonusIsland:{a:1586,b:1644},
  surfaces:surfaces([[0,288],[397,501],[608,791],[857,955],[1065,1169],[1276,1540],[1578,1652],[1660,1754],[1817,1997],[2107,2211],[2317,2421],[2485,2747],[2856,2960],[3067,3171],[3234,3414],[3481,3579],[3688,3792],[3899,4082]])}
];
