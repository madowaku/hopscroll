# HOPSCROLL — Moon Journey v0.1

団子を持った月兎娘ミチルが、地球見祭へ向かう5ステージの旅。押している間は世界がFAST、離すとSLOW。自動ジャンプは0.78秒のまま、距離と着地する速さを選びます。

- 本編入口：`moon-journey.html`（001 月の庭 → 002 夜風の間 → 003 月光橋 → 004 ふたつの月道 → 005 地球見の夜）。
- 月光橋はSLOW着地だけ安全。団子は任意・着地で獲得。月印からの再挑戦、最初から、ノー復帰のFULL MOONに対応。
- ステージ選択は選択中の面だけ名前を開き、プレイ画面とNEXTを優先。Space / HOLD / プレイ画面の長押しで操作。

## Build and verify

```text
node --test tests/core.test.mjs tests/star-run.test.mjs tests/moon.test.mjs tests/moon-journey.test.mjs
python scripts/build_moon_journey.py
python -m zipfile -e itch-dist/HOPSCROLL-Moon-Journey-v0.1.zip itch-dist/moon-journey-verified
python -m http.server 8000 --bind 127.0.0.1
```

Source: `http://127.0.0.1:8000/moon-journey.html`. Extracted distribution: `http://127.0.0.1:8000/itch-dist/moon-journey-verified/index.html`.
Set `JOURNEY_URL` to the latter URL and run `node tests/moon-journey-browser.mjs` with the repository's `playwright-core` dependency and Chrome available. The server is an optional local-only command; no LAN server is required.

The ZIP has `index.html` at its root and includes modules, sprite B, credits and provenance. It deliberately excludes third-party BGM. It is prepared for review, not published. Physical Android, itch embedding, human listening and fun/retry acceptance remain open; see [QA](docs/MOON_JOURNEY_QA.md).

## Reversible experiments and history

- `index.html`: original six-stage campaign; `python scripts/build.py` still creates its single-file `itch-dist/index.html` independently.
- `moon-lab.html`: two-stage bridge/fork regression target using the same runtime.
- `star-run.html`: independent **finite 24-hop** score experiment.
- Current integration authority: [Issue #13](https://github.com/madowaku/hopscroll/issues/13), [stage design](docs/MOON_STAGE_PACK_v0.1.md), [approved character](docs/MOON_RABBIT_CHARACTER_v0.1.md), [QA and admitted coordinate changes](docs/MOON_JOURNEY_QA.md). Older division-of-work and merge instructions in HANDOFF/CODEX_TASK/CLAUDE_CODE_TASK/INTEGRATION describe earlier campaigns.
