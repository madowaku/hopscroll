> 2026-10-31 / Issue #13: 以下は旧キャンペーン作業の記録。現在は `integration/moon-journey-v01` → `claude/polish-mobile` のDraft PRで統合。本編入口は `moon-journey.html`、5面の採用データと検証・設計との差分は [MOON_JOURNEY_QA.md](MOON_JOURNEY_QA.md)。担当分担・統合順は現Issueを優先し、mainマージ・公開・LAN起動は行わない。

# Integration instructions · 2026-10-30

**Direction:** HOPSCROLL, one button, mobile portrait browser. Theme SPEED. Lock mechanics before polish. Only change scope if the first 3 levels are not fun.

**Avoid race conditions:** Codex owns core/tests; Claude Code owns rendering/UI. Both branch from a common commit. Never run both tools in the same worktree. Integrate with PRs, not overwriting files.

**Order:**
1. Commit playable prototype as baseline to `madowaku/hopscroll`.
2. Codex validates solvers/levels on its branch, Claude Code polishes visuals on its own branch.
3. Merge Codex first after deterministic tests; rebase Claude Code on merged main and run smoke tests.
4. Human tests on phone: first three stages, deliberate death/retry, fingertip release, app-switch resume, itch embedded version.
5. Once first three feel good, expand/trim stages based on time, not the reverse.

**Hard deadline**: 2026-11-01 00:00 Japan time; target a real submitted entry comfortably before deadline. No late bug fixes allowed. Official rules: https://itch.io/jam/slapjam-ai-2
