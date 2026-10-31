# Moon Journey v0.5 引き継ぎ（クロ姉 → Codex）

2026-10-31。ブランチ `claude/moon-journey-ui`。Codex の `integration/moon-journey-v01`（`024d510`）から分岐。
オーナーは Android 実機で試遊済みで、評価は「楽しかった！いい感じ！」。main へのマージ、itch での公開、LAN サーバーの起動はしていない。

## このブランチで入ったもの（`024d510` から）
| 区分 | 内容 | 主なファイル |
|---|---|---|
| 見た目 | PR #7 の星空を移植した：3層の視差スクロール、FAST で流れる星、流れ星、彗星の尾、光る道。予測リングを最前面に描く | `src/moon-sky.mjs`（新規）、`src/moon-lab.mjs` |
| 画像 | Codex が生成した、タイトル絵（月からの地球見）、月光橋、流星橋、地球。橋は3分割（両端を固定し中央だけ伸ばす）で描く。画像が読めないときはコード描画に戻す | `assets/img/*`、`scripts/make_moon_art.py`、`art/generated/moon-journey/` |
| UI | 月道バー（ステージ選択・進行度・結果を1本で表示）、タイトル画面、日英切替、カードは道の下（親指の届く位置）、丸い FAST ボタンと盤面の長押しの両方で FAST | `moon-journey.html`、`moon-lab.css`、`src/moon-i18n.mjs`（新規） |
| 練習 | Stage 001 の最初の平らな道で長押しを練習（長押し → 離す → いいね）。一度終えたら localStorage に記録 | `src/moon-lab.mjs` |
| 団子 | 着地点が団子の島に重なると、予測リングが金色になる。取ると「+団子」を表示。月道バーに印、結果カードに一言、フィナーレで届けた数を表示 | `src/moon-lab.mjs`、`src/moon-sky.mjs` |
| ルール | **月光橋の猶予 `BRIDGE_GRACE=.12`**：FAST を押して 0.12 秒未満なら月光橋に乗れる。**流星橋（`kind:'meteor'`）**：FAST で着地したときだけ固い。離して 0.12 秒未満の着地も可 | `src/moon-core.mjs` |
| ステージ | **006「流星の海」**を地球見の夜（005）の前に置いた。23ホップ。お手本のどれか1回の速さを変えると必ず落ちる。月印は9ホップ目 | `src/moon-journey-levels.mjs` |
| 音 | BGM「Love it Rabbit」は、`assets/bgm/love-it-rabbit.mp3`（git 管理外）があるときだけ同梱する。FAST では音が明るくなるだけで、音量は上げない。速度切替の風切り音、失敗音、流星橋の音を追加。着地音に2オクターブ上の音を重ね、全体の音量を上げた | `src/moon-audio.mjs`、`scripts/build_moon_journey.py` |
| 酔い対策 | FAST でも視点を拡大縮小しない（試遊での指摘） | `src/moon-lab.mjs` |

設計の記録：`docs/MOON_UI_REVIEW_v0.1.md` の v0.2〜v0.5 節。仕掛けの案：`docs/MOON_GIMMICK_IDEAS_v0.1.md`。

## 検証（すべてローカルの Chrome で合格）
```
node --test tests/core.test.mjs tests/star-run.test.mjs tests/moon.test.mjs tests/moon-journey.test.mjs
python scripts/build_moon_journey.py && python -m zipfile -e itch-dist/HOPSCROLL-Moon-Journey-v0.1.zip itch-dist/moon-journey-verified
python -m http.server 8000 --bind 127.0.0.1   # 別ターミナル
node tests/moon-browser.mjs && node tests/moon-audio-browser.mjs
JOURNEY_URL=http://127.0.0.1:8000/itch-dist/moon-journey-verified/index.html node tests/moon-journey-browser.mjs
node tests/ui-smoke.mjs
node tests/moon-journey-captures.mjs <before-dir> itch-dist/moon-journey-verified   # 変更前後の比較画像（任意）
```
追加・変更したテスト：
- 月光橋の猶予（0.1 秒なら乗れる、0.2 秒なら落ちる）。
- 006 で、どの1ホップの速さを変えても落ちること。流星橋の猶予（0.1 秒なら乗れる、0.15 秒なら落ちる）。
- タイトル画面、言語切替、⌂ でタイトルへ戻ること。
- 盤面の長押しで FAST になり、メニューのボタンでは FAST にならないこと。プレイ中に月道の点を押すと一時停止すること。
- カードがレーンに重ならないこと。
- ステージは並び順ではなく ID で特定するようにした。

## Codex に頼みたいこと（オーナーの判断待ち。優先順のおすすめ）
1. **このブランチをレビューして `integration/moon-journey-v01` へ統合**し、CI を確認する。`.github/workflows/verify.yml` に `node --check src/moon-sky.mjs` と `src/moon-i18n.mjs` を追加済み。
2. **流星の海の難しさ**：今は「1回でも速さを間違えると落ちる」作り。オーナーは楽しいと言っているが、易しい別ルート（例：006 の前半に少し広い足場）を入れるかは試遊で決める。
3. `docs/MOON_GIMMICK_IDEAS_v0.1.md` の次の候補：**お守り団子**（1回だけ月印から再開できる）と、**3つの月**（クリア／FULL MOON／団子）とミッション。どちらも物理を変えずにできる。
4. README の更新：配布 ZIP の中身（タイトル絵、地球、橋の画像、BGM の条件付き同梱）、操作の説明、6ステージ。

## 注意
- **Codex の既定モデル**：`~/.codex/config.toml` の `model = "gpt-6.1-sol"` は、ChatGPT アカウントでは使えない（400 model_not_found）。画像生成は `-m gpt-6-astra` で実行した。設定ファイルは書き換えていない。
- **BGM の扱い**：配布 ZIP に第三者の BGM を入れる方針に変えた。以前の Codex の方針は「BGM は入れない」。itch に公開する前に、ライセンスとクレジットを確認する必要がある。
- **物理を担当する範囲**：Issue #15 の分担では物理とレベルは Codex だったが、オーナーの直接の依頼で `moon-core.mjs`（猶予と流星橋）と `moon-journey-levels.mjs`（006）をクロ姉が変更した。
- **ステージ ID と並び**：006 は 005 の前に置いている。ID と並び順は一致しない。
- Moon Lab（`moon-lab.html`）は日本語のまま。同じ描画コードを使うので、星空と光る道はこちらにも入っている。
- **未確認**：itch への埋め込み、iOS、遅い Android 端末での描画性能、`prefers-reduced-motion` の実機での見え方。
