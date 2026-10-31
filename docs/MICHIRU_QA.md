# ミチル描画・検証記録

- `src/game.mjs`: 足元原点、右向き、約60pxのCanvasミチル。耳・袖・帯はflowに追従。既存のlean、puni squash、失敗落下を維持。タイトル・結果カードも共通描画。
- `art/generated/michiru/`: 5ポーズ参考シート、透過512px単体絵、プロンプト全文・加工・ピクセル検証の来歴。
- `tests/michiru-captures.mjs`: ビルド済みHTMLの描画を使う再現用撮影スクリプト。コア状態と仮想時計を操作した自動確認であり、人間の試遊ではない。
- `docs/screenshots/michiru/`: SLOW、FAST、着地、クリア、失敗、タイトル／結果カード、48px相当の比較。

## 確認結果

2026-10-31: `node --test tests/core.test.mjs tests/star-run.test.mjs`、`python scripts/build.py`、`node tests/ui-smoke.mjs`、`node tests/michiru-captures.mjs` 成功。Chrome、playwright-core 1.56.1。360×640、720×1280、320×700の入力・表示、クリア・失敗・再挑戦確認。48px表示を目視し、二足の人物、片耳の折れ、袖、串の3点を確認。細かな表情は結果カードの方が明瞭。実機・人間の試遊は未実施。

ビルドは既存の未同梱BGMについてmissing通知あり。音源は追加していない。物理、コース、PERIOD、HERO_X、FLOOR、RABBIT_SCALEは変更なし。

## 仕様差・判断

- 正本 `docs/MOON_RABBIT_CHARACTER_v0.1.md`「アート制作・受入条件」、`README.md`「AI agent coordination」、`docs/INTEGRATION.md`「Avoid race conditions」、`docs/CODEX_TASK.md` 冒頭／Non-goals、`docs/HANDOFF_JA.md`「Codexくんへの指示」、`docs/CLAUDE_CODE_TASK.md` 冒頭は旧担当区分（Codexは物理、Claudeは描画）。今回の明示依頼を優先して描画を編集した。旧文書の指定ブランチ／Draft PR手順も今回のcodex/michiru-character・コミットのみを優先。
- `docs/CODEX_TASK.md` Priorities 3はStage 1をgap導入とするが、既存コードは安全なpractice。今回の物理・コース不変更を優先してそのまま。今回の制作ではその仕様を再決定していない。
- 正本「物語の見せ方」「ゲーム上の役割」の地球見祭・分岐のおまけ団子・エンディング等は今回のキャラ置換範囲外で未実装。既存のコース・演出を保持。
- 生成参考シートは再生成して頭身を改善。ただし背景は厳密な#0d1630ではなく微小な色むらがあり、側面での耳の左右連続性／FASTでの折れ耳形状も完全ではない。単体絵は実アルファありだが人物内も半透明が多く、装飾・頭身にCanvasとの差がある。承認済み正本としては扱わない。
- タイトルのhero-art画像ファイル自体は差し替えず、描画時に非表示として共通Canvasへ切替。画像品質の差をゲームへ持ち込まず、同じ耳・服・団子のシルエットを表示する判断。旧画像は履歴資料として保持。
