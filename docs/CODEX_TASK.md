> 2026-10-31 / Issue #13: 以下は旧キャンペーン作業の記録。現在は `integration/moon-journey-v01` → `claude/polish-mobile` のDraft PRで統合。本編入口は `moon-journey.html`、5面の採用データと検証・設計との差分は [MOON_JOURNEY_QA.md](MOON_JOURNEY_QA.md)。担当分担・統合順は現Issueを優先し、mainマージ・公開・LAN起動は行わない。

# Codex Implementation Task · HOPSCROLL v0.2 (logic / level QA)

You own `src/core.mjs`, `tests/*`, and docs about gameplay QA. **Do not edit** `src/game.mjs`, `style.css`, `index.html` unless the integration owner explicitly approves. Work in a separate branch `codex/core-levels`, based on the integration branch. Inspect current HEAD first.

## Goal

Improve an already-playable 6-stage prototype into a transparent, fair one-button speed / landing game for Slapjam #2. Player controls *world scroll velocity* only, not bunny jump timing. Fixed jump period is sacred.

## Priorities

1. Run `node tests/core.test.mjs`. Inspect the complete mechanic before changing it.
2. Verify each stage has a non-accidental valid path. Build an *exact* time-of-press deterministic solver or robust discretized state search, and record a control sequence (when to press/release) for Stage 001–006. Account for transitions inside a jump.
3. Stage 001–003 must demonstrate respectively: a gap needing speed, a safe island needing braking, and a three-island tempo chain. Reduce pixel-perfect solutions; target forgiving safe windows for mobile thumbs.
4. Add tests for framerate-independent landings, hold/release timing, edge death, goal landing (not just passing), and prediction.
5. Provide a human playtest checklist, with first-time comprehension, retry behavior, and readability.
6. Keep all levels serializable and code independent of DOM.

## Non-goals

No assets, no narrative, no new controls, no multiplayer, no level editor. Do not change the fixed jump tempo or add the ability to pause scroll.

## Acceptance

- Tests pass with Node 22 and browser.
- Six levels each have a documented witness solution.
- No secretly impossible or forced-pixel-perfect challenge in the first three levels.
- One screen, one button; game remains fully playable offline on itch.io.
- Commit and open a Draft PR; do not merge automatically.
