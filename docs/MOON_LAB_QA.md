# 月道の実験：Stage 003 / 004 QA

## Scope and play

Design source: [MOON_STAGE_PACK_v0.1.md](https://github.com/madowaku/hopscroll/blob/design/moon-rabbit-long-stages-v01/docs/MOON_STAGE_PACK_v0.1.md), blob `4652545abb32cff3eade0c1e590f4ace0c3ea79f` (PR #9).

Standalone local prototype: **`/moon-lab.html`**. Run `python -m http.server 8000 --bind 0.0.0.0` and open `http://localhost:8000/moon-lab.html`. Android on the same network can use the PC's LAN IPv4, subject to firewall/network access. No APK required. No deployment, publication or main merge.

Only 003 (22-hop reference) and 004 (26-hop reference) are implemented here. Campaign six stages, STAR RUN, final art and the existing itch build remain separate. No engine migration, image generation or paid provider calls. Michiru is deliberately not claimed implemented: the small rabbit is a temporary code-native greybox marker pending Claude's art and human approval of the mechanics.

## Rules

- Existing `core.mjs` movement/landing loop is reused unchanged: 105/270 px/s, 0.78-second jumps. `moon-core.mjs` supplies a collision view containing ordinary floors plus bridges only when released.
- Bridges check the input at landing, with no charge/grace period. FAST landing fails with `quiet-bridge-fast`. NEXT reads the same collision view as the actual landing.
- Floors are rendered only across their safe inset span (8 px inside each original edge). Bridge brightness, dashed FAST state, text and ring color provide redundant cues. The ready-screen HOLD demonstration is safe and stationary.
- Stage 004: near landing 1491.3 then 1701.9 (S/F), far landing 1620 then 1701.9 (F/S). Bonus only on a successful landing in 1586–1644; passing overhead does not collect it.
- Moon marks capture actual successful landing X/jump count/items. Retry restores phase zero and resets all input; separate restart begins fresh. FULL MOON depends on never USING checkpoint recovery, not on avoiding the checkpoint itself.
- Background/blur pauses; resume clears input. Foreground long frames are capped at 50 ms, matching the prototype's fairness convention.
- Only anonymous in-memory session counters (attempts, failure locations/reasons, hints, clears, bonus clears). No analytics service or transmission. Read-only diagnostic snapshots at `window.__MOON_LAB__`; no mutable game-state test hook.

## Changes from provisional design

1. Stage 003 provisional bridge/normal overlap pairs `775–873 / 857–955`, `1232–1330 / 1314–1494`, `2439–2537 / 2521–2619` are partitioned at 865, 1322, 2529. No coordinate has both support types. The inset gap at the shared boundary is visibly unpainted. All intended landings remain safe; reference minimum safe clearance is 32.5 px.
2. Stage 004 prose specifies a far island at 1620 but its provisional platform list omits it. Added `1578–1652`; shifted the following platform start from 1650 to 1660 so the islands remain distinct. Both two-hop branches reunite at 1701.9. This follows the written mechanic and the design's explicit allowance to adjust provisional coordinates.
3. Stage 004 moon-mark capture zone is 1918–1989 inside the ordinary floor. Using the entire 1817–1997 platform incorrectly activated at reference Hop12; the narrowed zone activates at intended Hop13 (1948.2).
4. The exact S/F/M reference is valid, but its immediate re-press after a bridge landing is not tolerant of EARLY input: that necessarily violates the specified SLOW-at-landing rule. A robust alternate input schedule delays two re-presses by 60 ms, with the preceding release also delayed 60 ms to preserve subsequent position. This changes no game rule. Specifically Stage003 uses release 9.140 / re-press 9.420 s and release 16.160 / re-press 16.440 s (instead of 9.080/9.360 and 16.100/16.380). All other transitions use the reference schedule.
5. Reference hop counts are examples, not enforced lengths. Search found shorter 20-hop routes through each stage and a 21-hop bonus route through 004. HUD therefore counts actual hops without presenting 22/26 as mandatory totals.

## Automated evidence

- Red test first: `node --test tests/moon.test.mjs` failed with missing implementation before modules were added.
- `node --test tests/core.test.mjs tests/star-run.test.mjs tests/moon.test.mjs`: PASS. Existing campaign and STAR RUN regressions included.
- Both exact reference routes pass at 30/60/120/144 Hz with identical rounded landing traces. Both constant FAST and constant SLOW fail.
- Every contiguous window of up to 3 actual input transitions is shifted independently by +/-30 ms (8 sign combinations), at all four frame rates. The guarded bridge schedule and Stage004 reference clear. This is local timing tolerance, not a claim about arbitrary accumulated timing drift or every possible play sequence.
- Exact bridge boundary collision/prediction agreement; equal-distance SLOW-then-FAST failure vs FAST-then-SLOW success; bonus landing vs overhead crossing; checkpoint state, full restart and FULL MOON eligibility covered.
- `node tests/moon-solver.mjs`: bounded search of FAST durations 0/.1/.2/.3/.4/.5/.6/.7/.78 seconds, both input orders, 4px state buckets, <=32 hops, >=18px safe clearance. Additional routes are replayed at four frame rates. No bridge-free Stage003 solution found IN THIS SAMPLE; no global impossibility or continuous optimum claim.
- `python scripts/build.py`: PASS for existing campaign distribution; Moon Lab is not silently included in that release.
- `node tests/moon-browser.mjs`: PASS using local HTTP Chrome, normal UI/keyboard events and virtual clock. 360x640 / 720x1280 / 320x700 intro, visible controls, no horizontal overflow, real CDP touch/cancel, blur/pause, death/retry; full 003/004 reference routes, bridge FAST/SLOW captures, optional bonus path, checkpoint recovery with bonus retained, completion without FULL MOON after recovery, fresh restart. No teleport or collision bypass; no page errors.
- CI includes Moon node tests, syntax checks and browser smoke/capture artifacts.

## Reference trace

S = .78s released; F = .78s held; M = .50s held then .28s released. Exact reference traces below; guarded jitter schedule described above is a separate valid route. Margins are inside already-inset collision intervals.

### Stage 003

Reference: SSFFMSFMSSFMFSFMSFFSMF

| Hop | X | Landing input | Safe margin |
|---|---|---|---|
| 1 | 156.9 | SLOW | 123.1 |
| 2 | 238.8 | SLOW | 41.2 |
| 3 | 449.4 | FAST | 43.6 |
| 4 | 660 | FAST | 44.0 |
| 5 | 824.4 | SLOW | 32.6 |
| 6 | 906.3 | SLOW | 33.3 |
| 7 | 1116.9 | FAST | 43.9 |
| 8 | 1281.3 | SLOW | 32.7 |
| 9 | 1363.2 | SLOW | 33.2 |
| 10 | 1445.1 | SLOW | 40.9 |
| 11 | 1655.7 | FAST | 43.7 |
| 12 | 1820.1 | SLOW | 40.9 |
| 13 | 2030.7 | FAST | 43.7 |
| 14 | 2112.6 | SLOW | 41.4 |
| 15 | 2323.2 | FAST | 43.8 |
| 16 | 2487.6 | SLOW | 33.4 |
| 17 | 2569.5 | SLOW | 32.5 |
| 18 | 2780.1 | FAST | 43.9 |
| 19 | 2990.7 | FAST | 43.7 |
| 20 | 3072.6 | SLOW | 41.4 |
| 21 | 3237 | SLOW | 41.0 |
| 22 | 3447.6 | FAST | 43.6 |

### Stage 004

Reference: SSFFSMFFSSFMSFFMSSFFMSMFFS

| Hop | X | Landing input | Safe margin |
|---|---|---|---|
| 1 | 156.9 | SLOW | 123.1 |
| 2 | 238.8 | SLOW | 41.2 |
| 3 | 449.4 | FAST | 43.6 |
| 4 | 660 | FAST | 44.0 |
| 5 | 741.9 | SLOW | 41.1 |
| 6 | 906.3 | SLOW | 40.7 |
| 7 | 1116.9 | FAST | 43.9 |
| 8 | 1327.5 | FAST | 43.5 |
| 9 | 1409.4 | SLOW | 122.6 |
| 10 | 1491.3 | SLOW | 40.7 |
| 11 | 1701.9 | FAST | 33.9 |
| 12 | 1866.3 | SLOW | 41.3 |
| 13 | 1948.2 | SLOW | 40.8 |
| 14 | 2158.8 | FAST | 43.8 |
| 15 | 2369.4 | FAST | 43.6 |
| 16 | 2533.8 | SLOW | 40.8 |
| 17 | 2615.7 | SLOW | 122.7 |
| 18 | 2697.6 | SLOW | 41.4 |
| 19 | 2908.2 | FAST | 43.8 |
| 20 | 3118.8 | FAST | 43.8 |
| 21 | 3283.2 | SLOW | 41.2 |
| 22 | 3365.1 | SLOW | 40.9 |
| 23 | 3529.5 | SLOW | 40.5 |
| 24 | 3740.1 | FAST | 43.9 |
| 25 | 3950.7 | FAST | 43.7 |
| 26 | 4032.6 | SLOW | 41.4 |

## Screenshots and visual review

[320x700 intro](moon-lab-screenshots/intro-320.png) · [360x640 intro](moon-lab-screenshots/intro-360.png) · [720x1280 intro](moon-lab-screenshots/intro-720.png)

[FAST bridge](moon-lab-screenshots/bridge-fast.png) · [SLOW bridge](moon-lab-screenshots/bridge-slow.png) · [two paths](moon-lab-screenshots/fork.png) · [003 FULL MOON](moon-lab-screenshots/clear-003.png) · [004 FULL MOON](moon-lab-screenshots/clear-004.png) · [checkpoint clear](moon-lab-screenshots/checkpoint-clear.png)

Inspected actual screenshots: playfield unobstructed while running, clearly differentiated conditional bridge and ordinary floor, NEXT and dango visible, primary HOLD reachable in narrow portrait layout. This is a greybox mechanic review, not fidelity QA against approved Michiru imagery.

## Human acceptance remains open

No actual Android/device touch/lifecycle, LAN reachability or human fun test performed. Before expanding to five stages or integrating final visuals:

- Can the player predict that releasing makes the bridge safe, without reading a solution?
- Does a bridge failure clearly explain FAST vs SLOW rather than feel arbitrary?
- Do both fork paths look like choices, and does landing for dango make sense?
- Is the 22/26-hop reference-length session engaging? Does the checkpoint encourage retry?
- Do real touch cancellation and app switch/resume remain SLOW on Android?

## Instruction precedence and tool scope

Old `docs/HANDOFF_JA.md` Codex branch/integration sections, `docs/CODEX_TASK.md` ownership/branch section and `docs/INTEGRATION.md` merge-order section describe earlier campaign work. Current user direction and PR #9's staged greybox scope govern this branch `codex/moon-bridge-paths`; base remains `claude/polish-mobile`. Current message asks 003/004 first, superseding PR #9's broader P0/P1 rollout ordering; other three stages are intentionally not implemented.

Game Studio / Web Game Foundations / Game UI Frontend / Game Playtest were used for simulation boundaries, input/UI and browser verification. Existing Canvas+DOM is retained rather than migrating to Phaser/Three/R3F. No selected visual reference or approved sprite seed was supplied, so Image-to-Code, ImageGen and sprite production are deferred to the separate art work. `game-dev` was not found on PATH; its asset, GPU-bundle and measured-performance workflows were not run. No third-party generation service was substituted.
