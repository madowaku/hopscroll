# HOPSCROLL 🐇⚡ — v0.2

**Theme: SPEED** · SLAPJAM #2.

A one-button, mobile-portrait rhythm/landing puzzle. The bunny jumps every **0.78 seconds**. Hold to scroll the world fast and release to scroll slowly. You control the world, not the jump.

## Play and build

- Static source: `index.html`, `style.css`, `src/core.mjs`, `src/game.mjs`.
- Local test: `python -m http.server 8000` then open `http://localhost:8000`.
- Controls: hold Space (desktop) or press-and-hold (mobile) for FAST; release for SLOW.
- Test: `node --test tests/core.test.mjs`.
- Build itch single-file HTML: `python scripts/build.py`, then ZIP `itch-dist/index.html` at archive root.
- Logical resolution 360×640, target portrait 720×1280.

## Status

v0.2 prototype: six test-solvable stages, larger goal marker, clearer stars, Stage 1 tutorial, more forgiving Stage 3 and smaller bunny. Core tests passed locally. Browser and Android manual smoke-test still required before submission.

## AI agent coordination

Please read `docs/HANDOFF_JA.md`, `docs/CODEX_TASK.md`, `docs/CLAUDE_CODE_TASK.md`, and `docs/INTEGRATION.md`. Codex handles logic/tests, Claude Code handles presentation. Use separate branches and Draft PRs; do not auto-merge.

## Jam checklist

- [ ] Check Android touch, audio and portrait layout.
- [ ] Test FAST reset on pointercancel/app switch/restart.
- [ ] Playtest Stage 1–3 without coaching.
- [ ] Test itch embedded HTML before 2026-11-01 00:00 JST.
- [ ] Credit tools actually used.

Initial code and procedural graphics are provided for the user's own game development. Do not use unlicensed third-party assets.
