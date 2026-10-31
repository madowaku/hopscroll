> 2026-10-31 / Issue #13: 以下は旧キャンペーン作業の記録。現在は `integration/moon-journey-v01` → `claude/polish-mobile` のDraft PRで統合。本編入口は `moon-journey.html`、5面の採用データと検証・設計との差分は [MOON_JOURNEY_QA.md](MOON_JOURNEY_QA.md)。担当分担・統合順は現Issueを優先し、mainマージ・公開・LAN起動は行わない。

# HOPSCROLL v0.2 · Codex / Claude Code 引き継ぎ

## 目的
SLAPJAM #2（テーマ：SPEED）向けに、「キャラクターは固定テンポで跳び続け、プレイヤーは世界のスクロール速度のみ操作する」ゲームを仕上げる。

## 現状
- 1ボタンで低速105px/sと高速270px/sを切替。固定周期0.78秒。
- プレイヤーの画面内Xは固定、ジャンプ中に世界が動く。
- 予想着地点NEXT、失敗、再挑戦、6ステージ、星、クリア進行保存、合成効果音を実装。
- Stage 1のチュートリアル、見やすいゴール、星、Stage 3の緩和を追加。
- テストで6面すべての到達可能性を検証済み。
- **Android実機・itch埋め込み・v0.2の実画面スモークテストは未実施**。
- **ゲームとしての楽しさは未検証**。人間の試遊最優先。

## 注意
- ソース: `src/core.mjs`（物理・レベル）／`src/game.mjs`（描画・操作）、 `index.html` と `style.css`。
- 単一HTMLビルド: `python scripts/build.py` → `itch-dist/index.html`。最新変更は必ず再ビルド。
- itch.io提出は `itch-dist/index.html` だけをZIP直下に入れる。開発ソースZIPをそのままアップロードしない。
- テスト: `node tests/core.test.mjs`。

## Codexくんへの指示
`docs/CODEX_TASK.md` に従って `src/core.mjs` と `tests/*` を改善。Stage 001〜003を遊びやすくし、全6面の解法を自動検証。`codex/core-levels` ブランチで作業してDraft PR、mainに自動マージしないこと。

## Claude Code（クロ姉）への指示
`docs/CLAUDE_CODE_TASK.md` に従ってゲーム体験、アニメ、効果音、タッチと狭画面UIをブラッシュアップ。`src/core.mjs` と `tests/*` は変更しない。`claude/polish-mobile` ブランチで作業してDraft PR、mainに自動マージしないこと。

## 統合順序
1. baselineのコミットをGitHubに作る。
2. Codex / Claude Codeが別ブランチ・別worktreeで並行作業。
3. Codex → main、Claudeを最新mainへ追従 → main。競合を起こした場合は手で調整。
4. `node tests/core.test.mjs`、`python scripts/build.py`、PCブラウザとAndroid実機テスト。
5. itch.ioでHTMLアップロード・実際の埋め込み画面を試遊してから提出。

**締切：2026-11-01 00:00 JST**（公式October 31 15:00 UTC）。締切後は差し替え不可。
