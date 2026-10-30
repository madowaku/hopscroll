export const PERIOD = 0.78;
export const SLOW_SPEED = 105;
export const FAST_SPEED = 270;

export const levels = [
  { title: 'THE FIRST GAP', hint: 'Hold to fly farther.', start: 75,
    platforms: [[0,260],[360,930]], goal: [745,900], stars: [475,650] },
  { title: 'SLOW DOWN!', hint: 'Sometimes slower is safer.', start: 75,
    platforms: [[0,255],[340,505],[605,1080]], goal: [895,1055], stars: [420,760] },
  { title: 'THREE LITTLE ISLANDS', hint: 'SLOW → FAST → SLOW. You can do this!', start: 75,
    platforms: [[0,245],[325,520],[555,785],[810,1280]], goal: [1020,1225], stars: [400,670,1080] },
  { title: 'THE LONG LEAP', hint: 'Change speed during a jump.', start: 75,
    platforms: [[0,330],[440,655],[760,1230]], goal: [1025,1205], stars: [530,880] },
  { title: 'FAST, SLOW, FAST', hint: 'Find your own rhythm.', start: 75,
    platforms: [[0,275],[375,575],[675,860],[950,1440]], goal: [1225,1415], stars: [450,775,1070] },
  { title: 'SPEED MASTER', hint: 'Bring it all together!', start: 75,
    platforms: [[0,285],[370,545],[630,815],[905,1100],[1200,1690]], goal: [1460,1660], stars: [490,760,990,1330] },
];

export function isSafe(level, x) {
  return level.platforms.some(([a,b]) => x >= a + 8 && x <= b - 8);
}
export function inGoal(level, x) {
  return x >= level.goal[0] && x <= level.goal[1] && isSafe(level, x);
}
export function predictLanding(state, fast) {
  return state.x + (fast ? FAST_SPEED : SLOW_SPEED) * Math.max(0, PERIOD - state.phase);
}
export function createState(level) {
  return { x: level.start, phase: 0, jumps: 0, status: 'playing', lastEvent: null, starCount: 0, collected: [] };
}
// Deterministic, independent of animation framerate; called by both game and tests.
export function advance(state, level, dt, fast) {
  if (state.status !== 'playing' || dt <= 0) return [];
  const events=[];
  let remain=dt;
  while (remain > 1e-9 && state.status === 'playing') {
    const previousX = state.x;
    const step=Math.min(remain, PERIOD - state.phase);
    state.x += (fast ? FAST_SPEED : SLOW_SPEED)*step;
    state.phase += step;
    remain -= step;
    // Collect highly visible stars whenever the character crosses them mid-hop.
    for(let i=0;i<(level.stars?.length||0);i++){
      const star=level.stars[i];
      if(!state.collected.includes(i) && previousX <= star+10 && state.x >= star-10){
        state.collected.push(i);state.starCount++;events.push('star');
      }
    }
    if (state.phase >= PERIOD - 1e-8) {
      state.phase = 0;
      state.jumps += 1;
      if (!isSafe(level,state.x)) {
        state.status='dead'; events.push('fall');
      } else if (inGoal(level,state.x)) {
        state.status='clear'; events.push('clear');
      } else {
        events.push('land');
      }
    }
  }
  return events;
}
