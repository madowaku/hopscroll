> 2026-10-31 / Issue #13: 以下は旧キャンペーン作業の記録。現在は `integration/moon-journey-v01` → `claude/polish-mobile` のDraft PRで統合。本編入口は `moon-journey.html`、5面の採用データと検証・設計との差分は [MOON_JOURNEY_QA.md](MOON_JOURNEY_QA.md)。担当分担・統合順は現Issueを優先し、mainマージ・公開・LAN起動は行わない。

# Claude Code Implementation Task · HOPSCROLL v0.2 (feel / visuals / mobile)

You own `src/game.mjs` rendering and UI, `style.css`, `index.html`, and visual/audio QA docs. **Do not edit** `src/core.mjs` or `tests/*` unless integration owner approves. Work on `claude/polish-mobile` in a separate branch/worktree. Read `src/core.mjs` contracts, preserve all imports/exports.

## Goal

Make the speed choice delightful and instantly legible, with minimal UI and portrait mobile experience. A cute creature bounces at a constant beat while the entire world slides underneath it. The contrast between slow precision and fast leaps must feel dramatic.

## Priorities

1. Test at 360×640 and 720×1280, plus narrow Android viewports; no clipped buttons or overlays.
2. Focus on clarity: the predicted NEXT landing preview must clearly reflect whether the current held speed will land safely, and change immediately when pressed/released.
3. Upgrade squash/stretch, hop sound, speed swoosh, dangerous gap vs safe platform, celebration. Use procedural Canvas / Web Audio to avoid asset dependencies unless approved.
4. Make pressing responsive with touch and Space. No stuck hold on pointer cancel, window blur, restart, dialogs.
5. Ensure `prefers-reduced-motion` behavior as practical. Avoid mandatory sound and use accessible UI labels.
6. Add itch cover / screenshot directions and English-first page copy in `docs/ITCH_COPY.md`.

## Non-goals

Do not alter jumping interval, speed, safe platform collision semantics, or level positions. Avoid features that expand the one-button premise.

## Acceptance

- Intro-to-first-input in under 5 seconds.
- First-time player knows to hold and release after one attempt.
- Speed switch is visible/audible without adding screen clutter.
- Responsive Android portrait, itch embedded build and desktop keyboard all work.
- No external requests (all assets local).
- Commit and open a Draft PR; do not merge automatically.
