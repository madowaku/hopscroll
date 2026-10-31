# Moon Journey integration — Issue #13

## P0 playable milestone
- Integrated #9 f138226 → #12 ed44861 → #10 327ce92 → #11 bf65af0 with separate merge commits in the dedicated integration worktree.
- `/moon-journey.html`: Michiru sprite B in real 003/004 play, SLOW/FAST/landing/HAPPY/failure, Canvas fallback on actual image HTTP failure, next-stage and restart flow. Moon Lab remains a two-stage regression target.
- Baseline campaign / STAR RUN / Moon physics and solver tests pass. Chrome Moon browser tests pass at 320×700, 360×640, 720×1280 including both full routes, optional dango, checkpoint recovery, FULL MOON, pointercancel, blur/pause and restart.
- `node tests/moon-journey-browser.mjs`: approved atlas, SLOW/FAST/HAPPY, failed image request fallback and 003→004 through real UI. Captures in `docs/moon-journey-screenshots/`; inspected 360px live play: visible sprite, unobscured NEXT and reachable HOLD.
- Source provenance remains `art/generated/michiru/PROVENANCE.md`; no new generated art or soundtrack.

## Current scope and discrepancies
Issue #13 supersedes the earlier division of work and merge order in HANDOFF/CODEX_TASK/INTEGRATION, and the design pack's rollout order. Approved PR #12 character document is retained. The provisional 003/004 checkpoint and terrain differences remain documented in MOON_LAB_QA and are not reverted.

## Pending after P0
001/002/005 solver admission, five-stage entry, real Moon Journey ZIP and built-artifact Chrome QA. Human enjoyment, physical Android, physical speaker listening and itch embedding are unverified. No main merge, deployment, itch publication or LAN server.
