# Gameplay QA — 2026-10-30

Base: `5a88dfc`; fixed 0.78 s, 105/270 px/s and all level geometry preserved.

## Reproducible routes

Times are simulation seconds since retry/start; S = release, F = hold. Keep the last input until clear. Clearance includes the 8 px inset and final goal bounds. Jitter is a conservative independent ± bound for **every** transition simultaneously (rounded down). It is not measured human reaction time or the maximum available window.

|Stage / route|Input changes (seconds)|Hops|Minimum clearance px|Guaranteed ±ms|
|---|---|---:|---:|---:|
|1 / 1|0.00 S, 0.39 F|4|30.75|186|
|1 / 2|0.00 S, 0.39 F, 2.34 S|5|30.75|93|
|1 / 3|0.00 S, 1.95 F|5|13.20|79|
|2 / 1|0.00 S, 0.39 F, 3.12 S|5|25.75|78|
|2 / 2|0.00 S, 0.39 F, 2.34 S|7|25.75|78|
|2 / 3|0.00 S, 0.39 F, 2.34 S, 3.12 F|5|25.75|52|
|3 / 1|0.00 S, 0.39 F|5|15.75|95|
|3 / 2|0.00 S, 0.78 F, 1.56 S, 2.34 F|6|34.50|69|
|3 / 3|0.00 S, 0.78 F, 1.56 S, 2.34 F, 3.12 S, 4.29 F|7|34.50|41|
|4 / 1|0.00 F, 1.56 S, 2.34 F, 3.90 S|6|20.70|41|
|4 / 2|0.00 F, 1.56 S, 2.34 F, 3.12 S, 3.90 F|6|20.70|31|
|4 / 3|0.00 F, 1.56 S, 2.34 F, 3.12 S, 3.51 F|6|20.70|31|
|5 / 1|0.00 S, 0.39 F, 1.56 S, 2.34 F, 3.12 S, 3.90 F, 4.68 S|9|37.55|37|
|5 / 2|0.00 S, 0.39 F, 1.56 S, 2.34 F, 3.12 S, 3.90 F, 4.68 S, 5.46 F|8|41.35|35|
|5 / 3|0.00 S, 0.39 F, 1.56 S, 2.34 F, 3.12 S, 3.90 F, 4.68 S, 6.63 F|9|41.35|35|
|6 / 1|0.00 S, 1.56 F, 3.12 S, 3.90 F, 4.68 S, 5.46 F, 7.02 S|10|22.00|22|
|6 / 2|0.00 S, 1.56 F, 3.12 S, 3.90 F, 4.68 S, 5.46 F, 6.24 S|11|22.00|22|
|6 / 3|0.00 S, 0.39 F, 1.56 S, 2.34 F, 3.90 S, 4.68 F, 6.24 S|9|19.45|19|

The search tries slow, half-hop slow/fast, and fast per hop, keeping three paths per displacement/depth. It is a bounded witness search, not an exhaustive continuous-control optimizer. A transition shifted by δ changes any landing by at most 165δ px; summing across transitions proves the listed bound. Tests also replay all ± corner combinations.

## UI integration contract

`advance` still returns string events (`star`, `land`, `fall`, `clear`). `state.lastEvent` now records the most recent emitted event; read the returned array for per-call events. On fall, `state.failure` contains `reason` (`undershoot`, `overshoot`, `edge`), landing `x`, nearest safe `targetX`, and `correction` (`more-fast`, `more-slow`). Suggested copy: “Land further: hold longer”, “Land earlier: release sooner”, “Too close to the edge”. The correction concerns the nearest safe interval, not a solver recommendation. `createState` clears all diagnostics and pickups for immediate retry. UI display and held-input reset remain Claude's responsibility.

## Verification and limits

- Node 22.23.4: `npx --yes --package=node@22 node --test tests/core.test.mjs` passed. Node 24.14.0 also passed.
- Frame subdivision: 30/60/120/144 Hz plus irregular fixed slices; identical terminal status, jumps, stars, event order and position within 1e-7 px. Inputs are split at exact transition timestamps, not rounded to render frames.
- Inclusive goal/platform boundaries, mid-air goal crossing, duplicate star prevention, prediction after a speed switch, terminal-state no-op, invalid dt and fresh retry are checked.
- Build: `python scripts/build.py` passed; generated output is not committed.
- Browser harness: serve repository and open `/tests/browser.html` (108 simulations). This checks core execution, not physical input or frame scheduling.
- `src/game.mjs` currently caps dt at 45 ms. Under stalls/very low FPS, wall-clock gameplay slows despite core determinism. Rendering/input scheduling is outside this branch; integration must assess this explicitly.

## Human acceptance checklist (pending)

- [ ] First-time player can explain automatic jumps / hold fast / release slow without coaching.
- [ ] Stage 1–3: complete multiple attempts; record confusing deaths and whether the timing feels forgiving.
- [ ] Stage 3: try the 0.78 F → 1.56 S → 2.34 F route; judge thumb comfort, not just solver success.
- [ ] Stars collect in flight; touching/passing the goal in flight does not imply clear.
- [ ] Deliberate fall, instant retry and R/button retry: no held FAST, old stars or old failure message persists.
- [ ] Android: pointer cancel, finger leaving button, app switch/resume, portrait viewport and sound.
- [ ] Real itch embedded single-HTML build: input, restart, audio and saved progression.

## Document/code discrepancies retained for review

- Issue #1 “状況” says main is empty; remote main already contains `5a88dfc`. Used the existing committed baseline.
- `docs/CODEX_TASK.md` priorities 3 / `src/core.mjs` Stage 2–3: the intended braking/three-island lessons are not forced. Stage 2 can cross its middle island while holding FAST; Stage 3 has a one-press solution (route 1 above). Preserved the approved geometry and documented this for human playtest instead of redesigning rules.
- `src/core.mjs` Stage 4 hint says “Change speed during a jump”, but route 1 switches only at hop boundaries. Preserved existing hint/geometry; whether this should be mandatory is unconfirmed.
- `docs/CODEX_TASK.md` “based on the integration branch” does not name such a branch; `docs/HANDOFF_JA.md` and current remote identify the main baseline. Branched from main `5a88dfc` in a separate worktree.

Browser result: in-app Chromium displayed PASS for all 108 simulations on 2026-10-30; source-game intro also loaded successfully. Android and itch remain pending.
