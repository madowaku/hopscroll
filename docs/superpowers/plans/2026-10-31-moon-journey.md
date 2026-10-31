# Moon Journey Implementation Plan

**Goal:** Issue #13: playable Michiru integration first, then five verified stages and an offline ZIP.
**Architecture:** Keep core physics and the two-stage Moon Lab regression target. Share Michiru rendering with the existing approved atlas and Canvas fallback. A journey entry uses the same runtime with ordered campaign data.
**Tech Stack:** Native Canvas/DOM ES modules, Node solver/tests, Python packaging, real Chrome automation.
**Spec:** Issue #13, docs/MOON_STAGE_PACK_v0.1.md, docs/MOON_RABBIT_CHARACTER_v0.1.md.

## Constraints
- Work only in integration/moon-journey-v01 dedicated worktree. No main merge, publication or LAN server.
- PERIOD=.78, SLOW=105, FAST=270. Preserve legacy campaign and STAR RUN.
- Minimal labels; playfield and landing preview explain the mechanic. Procedural landing audio only.

## Review focus
- Atlas HTTP failure leaves a visible character carrying dango.
- Touch cancellation, blur and restart release input.
- Checkpoint starts with safe released landing and preserves items; recovery excludes FULL MOON.
- Narrow viewport cards leave the landing track and HOLD accessible.
- Extracted offline ZIP resolves every module and licensed asset.

## Tasks
- [x] Merge #9 → #12 → #10 → #11 with auditable merge commits; baseline physics/solver suites.
- [x] P0: src/michiru.mjs, src/moon-lab.mjs, moon-journey.html: approved poses/fallback and 003→004 next/retry flow. Browser input, screenshots, commit/push and Draft PR.
- [x] P1: src/moon-journey-levels.mjs, tests/moon-journey.test.mjs: 001/002/005 with safe intro, release decisions, optional fork and festival. Replay reference/alternate solver paths across frame rates and local timing jitter. Checkpoint envelopes. Commit/push.
- [x] Export: scripts/build_moon_journey.py, tests/moon-journey-browser.mjs and CI. Build ZIP root index and exercise extracted artifact in Chrome at 320×700, 360×640, 720×1280, including fallback, transitions, bonus/recovery, sound. Review screenshots. Update README/HANDOFF/QA with provenance, deviations and human/device limits. Commit/push and update Draft PR.
