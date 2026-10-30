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

// Absorb arithmetic roundoff only, not a gameplay-sized collision allowance.
const POSITION_EPSILON = 1e-8;
export function isSafe(level, x) {
  return level.platforms.some(([a,b]) => x >= a + 8 - POSITION_EPSILON && x <= b - 8 + POSITION_EPSILON);
}
export function inGoal(level, x) {
  return x >= level.goal[0] - POSITION_EPSILON && x <= level.goal[1] + POSITION_EPSILON && isSafe(level, x);
}
export function predictLanding(state, fast) {
  return state.x + (fast ? FAST_SPEED : SLOW_SPEED) * Math.max(0, PERIOD - state.phase);
}
// Stable codes for the UI; corrections describe the nearest safe landing.
export function landingFailure(level, x) {
  if (isSafe(level, x)) return null;
  let nearest = null;
  for (const [a, b] of level.platforms) {
    const targetX = Math.max(a + 8, Math.min(b - 8, x));
    if (!nearest || Math.abs(targetX - x) < Math.abs(nearest.targetX - x)) {
      nearest = { reason: x < a ? 'undershoot' : x > b ? 'overshoot' : 'edge',
        x, targetX, correction: targetX > x ? 'more-fast' : 'more-slow' };
    }
  }
  return nearest;
}
export function createState(level) {
  return { x: level.start, phase: 0, jumps: 0, status: 'playing', lastEvent: null, failure: null, starCount: 0, collected: [] };
}
// Deterministic, independent of animation framerate; called by both game and tests.
export function advance(state, level, dt, fast) {
  if (state.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return [];
  const events=[];
  let remain=dt;
  while (remain > 0 && state.status === 'playing') {
    const previousX = state.x;
    const step=Math.min(remain, PERIOD - state.phase);
    state.x += (fast ? FAST_SPEED : SLOW_SPEED)*step;
    state.phase += step;
    remain -= step;
    // Collect highly visible stars whenever the character crosses them mid-hop.
    for(let i=0;i<(level.stars?.length||0);i++){
      const star=level.stars[i];
      if(!state.collected.includes(i) && previousX <= star+10+POSITION_EPSILON && state.x >= star-10-POSITION_EPSILON){
        state.collected.push(i);state.starCount++;events.push('star');
      }
    }
    if (state.phase >= PERIOD - 1e-12) {
      state.phase = 0;
      state.jumps += 1;
      if (!isSafe(level,state.x)) {
        state.status='dead'; state.failure=landingFailure(level,state.x); events.push('fall');
      } else if (inGoal(level,state.x)) {
        state.status='clear'; events.push('clear');
      } else {
        events.push('land');
      }
    }
  }
  if (events.length) state.lastEvent = events[events.length - 1];
  return events;
}
