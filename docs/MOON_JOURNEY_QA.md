# Moon Journey integration — Issue #13

## P0 playable milestone
- Integrated #9 f138226 → #12 ed44861 → #10 327ce92 → #11 bf65af0 with separate merge commits in the dedicated integration worktree.
- `/moon-journey.html`: Michiru sprite B in real 003/004 play, SLOW/FAST/landing/HAPPY/failure, Canvas fallback on actual image HTTP failure, next-stage and restart flow. Moon Lab remains a two-stage regression target.
- Baseline campaign / STAR RUN / Moon physics and solver tests pass. Chrome Moon browser tests pass at 320×700, 360×640, 720×1280 including both full routes, optional dango, checkpoint recovery, FULL MOON, pointercancel, blur/pause and restart.
- `node tests/moon-journey-browser.mjs`: approved atlas, SLOW/FAST/HAPPY, failed image request fallback and 003→004 through real UI. Captures in `docs/moon-journey-screenshots/`; inspected 360px live play: visible sprite, unobscured NEXT and reachable HOLD.
- Source provenance remains `art/generated/michiru/PROVENANCE.md`; no new generated art or soundtrack.

## Current scope and discrepancies
Issue #13 supersedes the earlier division of work and merge order in HANDOFF/CODEX_TASK/INTEGRATION, and the design pack's rollout order. Approved PR #12 character document is retained. The provisional 003/004 checkpoint and terrain differences remain documented in MOON_LAB_QA and are not reverted.

## Five-stage admitted campaign

Source entry: `moon-journey.html`; runtime `src/moon-lab.mjs`; campaign data `src/moon-journey-levels.mjs`. `moon-lab.html` keeps only003/004. Stage tabs reveal only the selected name. First bridge has a frozen, real-rule HOLD demonstration: SLOW prediction is safe and FAST prediction fails on the actual bridge. No tutorial wall or extra headline. Successful final landing suppresses NEXT/MISS.

| Stage | Reference hops | Additional bounded solver route | Decision |
|---|---:|---:|---|
|001|12|8 (3 hold durations)|Three safe experimental landings, first gap, mixed final distance|
|002|18|15 (5 durations)|Distance gained by FAST versus overshooting narrow islands|
|003|22|20 (7 durations)|FAST travels; release changes bridge support|
|004|26|20 / bonus21 (5 / 7 durations)|S→F and F→S rejoin; optional landing-only dango|
|005|32|31 with or without required bonus (6 durations)|Bridge/release timing, near/far choice, safe recovery and Earth-viewing festival|

Hop totals are witnesses, not enforced counts. Solver searches 0/.1/.2/.3/.4/.5/.6/.7/.78 FAST seconds, both orders, 4px buckets, 18px clearance and at most32 hops. These are additional sampled paths, not global optima or proof over continuous inputs. Choice/free timing is established by simulation; human enjoyment and retry appeal are untested. The finale's repeated bridge/release motifs still need human pacing feedback.

## Design/provenance differences and chosen authority

- `docs/MOON_STAGE_PACK_v0.1.md`, Stage001: text promises three safe landings, but provisional0–370 kills early FAST exploration. Followed the stated teaching intent and Issue #13's permission to adjust provisional data: first ordinary floor is0–744 (three full FAST landings end706.8). The first two provisional normal floors are merged. Reference12-hop route remains valid; all-FAST and all-SLOW fail later. No checkpoint in001.
- Same design, Stage003/004: keep PR #10's previously verified partitions, missing bonus island and moved checkpoints (003 Hop9 /1345–1385;004 Hop12 /1840–1885), as detailed in MOON_LAB_QA. These supersede provisional overlap and Hop11/Hop13 positions. No regression to those unsafe recovery positions.
- Same design, Stage002: provisional floors and18-hop route admitted after verification. Checkpoint capture1260–1300 around reference Hop9/x1280.7 provides a safe released landing on the same ordinary floor.
- Same design, Stage005: partition bridge/normal overlaps at865,1533,2822,4825. Extend ordinary checkpoint floor2564–2668 to2564–2720; capture2600–2630 around Hop16/x2616.3. Recovery starts S→ordinary floor, then S→bridge, replacing the original M with two safe visible hops (same end within0.6px). Add near island3281–3361, partition preceding bridge end3273; from reference Hop20/x3237.6 choose S→3319.5 then F→3530.1, or F→3448.2 then S→3530.1. Landing-only bonus3420–3476 is optional. Reference32-hop route still clears. Festival is procedural scenery, not a new rule.
- `HANDOFF_JA.md`, `INTEGRATION.md`, `CODEX_TASK.md`, `CLAUDE_CODE_TASK.md`: earlier division of work/merge order is historical. Followed current Issue #13 and annotated each document. CODEX_TASK's old Stage1 hole introduction differs from existing safe playground; legacy code was retained.
- `README.md` previously described only the old six-stage prototype and build. Updated to current Journey entry and separate ZIP builder; legacy `index.html` and single-file builder remain reversible. STAR RUN remains finite24-hop.
- `art/generated/michiru/PROVENANCE.md` early Canvas-only card notes describe an earlier experiment. Its later PR #12 B atlas adoption is authoritative; appended current integration clarification. Approved eyes/ear/dango settings in character v0.1 retained. New Journey helper copies the approved frame/foot-origin definition and original Canvas paths without changing collision or legacy bundling. No new image generation/editing or soundtrack used.

## Verification and artifacts

Passed locally on2026-10-31:

- `node --test tests/core.test.mjs tests/star-run.test.mjs tests/moon.test.mjs tests/moon-journey.test.mjs`: all four files pass. Five exact references and solver alternatives at30/60/120/144Hz; local groups of up to three transitions ±30ms for new001/002/005 (003/004 already covered). No global accumulated-jitter claim. Bridge re-press guards delay release/re-press60ms;005 Hop30 SLOW bridge also needs the guard. No grace or physics change.
- Sample every checkpoint capture interval at0.5px INCLUDING endpoints: first released recovery hop has ordinary support. Exact-state restoration, collected bonus, phase0 and FULL MOON eligibility checked.001 first3 hops sampled over independent FAST duration0–.78 in.06 steps, plus all-FAST endpoint.
- `python scripts/build.py`; `node tests/ui-smoke.mjs`: original single-file build, safe playground hold/release, three viewports and three failure/retry cases pass.
- `node tests/moon-browser.mjs`; `node tests/moon-audio-browser.mjs`: existing moon routes, bonus recovery and browser audio synthesis/unavailable API pass after integration.
- `python scripts/build_moon_journey.py`; `python -m zipfile -e itch-dist/HOPSCROLL-Moon-Journey-v0.1.zip itch-dist/moon-journey-verified`; `JOURNEY_URL=http://127.0.0.1:8013/itch-dist/moon-journey-verified/index.html node tests/moon-journey-browser.mjs`: actual extracted ZIP in real Chrome.001→005→001 through UI; both optional fork choices; all four checkpoints recover and clear without FULL MOON; full restart; pause/blur; real CDP touch/cancel; real image request failure with visible Canvas substitute; SLOW/FAST/landing/HAPPY poses. No module/asset request or page errors (deliberate failed atlas excluded).
-320×700,360×640,720×1280: all stage tabs, intro/failure cards leave landing runway visible; HOLD stays in viewport, no horizontal overflow. Inspected built entry, live sprite, finale, recovery and fallback screenshots. Narrow real-time check:116 frames through two landings, p95 frame interval13.5ms, nonzero analyser peak0.02444 and exactly2 landing cues. Machine-specific sanity only; not Android performance or human listening evidence.

ZIP output: `itch-dist/HOPSCROLL-Moon-Journey-v0.1.zip` (~190KB), root `index.html`, allowlisted modules+sprite only, `CREDITS.txt` and `PROVENANCE.md`. No external runtime requests or third-party music. Old `itch-dist/index.html` remains the legacy build; it is **not** the Journey upload. CI builds both and browser-tests the extracted Journey ZIP, then uploads ZIP and captures.

To reproduce locally: `python -m http.server 8000 --bind 127.0.0.1` at repository root; open `http://127.0.0.1:8000/moon-journey.html`, or the extracted built entry above with port8000. This is a local-only command, not a LAN service.

Captures: [entry320](moon-journey-screenshots/entry-320.png), [live Michiru360](moon-journey-screenshots/michiru-360.png), [festival](moon-journey-screenshots/clear-005.png), [recovery](moon-journey-screenshots/festival-recovery.png), [HTTP failure fallback](moon-journey-screenshots/fallback.png).

## Human acceptance still open

Physical Android touch/app lifecycle and speaker output, itch iframe/hosting acceptance, human listening/fatigue, understanding the bridge and optional branch without coaching, and the pleasure of retrying all five stages. Automated inputs and screenshots establish technical behavior only. AI art/tool disclosure and final credits are included for creator review; no assertion of completed publication acceptance.

No main merge, deployment, itch upload/publication or LAN server. Original PRs #9/#10/#11/#12 remain intact. Work uses the dedicated integration worktree and Draft PR targeting `claude/polish-mobile`.
