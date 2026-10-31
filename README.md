# HOPSCROLL — Moon Journey v0.5

月に住む兎人の女の子ミチルが、月見団子を持って地球見祭へ向かうステージ型ジャンプゲーム。**押している間はFAST（270px/s）、離すとSLOW（105px/s）**。0.78秒ごとの自動ジャンプを、道の流れる速さでコントロールします。

## itch.io向け Moon Journey（現在の提出候補）

- **6ステージ**：001 月の庭 → 002 夜風の間 → 003 しずかな月光橋 → 004 ふたつの月道 → 006 流星の海 → 005 地球見の夜。表示順とステージIDは一致しません。
- **開始画面**：`moon-journey.html`。タイトルからSTART／ステージ選択、日英切替、音のミュートができます。
- **操作**：ゲーム画面を押し続ける、丸いHOLDボタンを押し続ける、またはSpaceキーを押すとFAST。離すとSLOW。メニュー操作ではFASTになりません。
- **月光橋**（薄藤）：SLOW着地なら安全。FASTに切り替えてから0.12秒未満の着地も安全。
- **流星橋**（金）：FAST着地なら安全。SLOWに切り替えてから0.12秒未満の着地も安全。
- **団子**：一部の島へ着地すると任意取得。**月印**は中間チェックポイント。復帰せずにクリアするとFULL MOON。
- **演出**：ミチルの透過スプライト、夜空の視差・流星の尾・光る月道、オリジナルの着地音。言語設定と練習完了はブラウザ内に保存されます。

## itch用ZIPの作成と検証

```sh
node --test tests/core.test.mjs tests/star-run.test.mjs tests/moon.test.mjs tests/moon-journey.test.mjs
python scripts/build_moon_journey.py
python -m zipfile -e itch-dist/HOPSCROLL-Moon-Journey-v0.5.zip itch-dist/moon-journey-verified
python -m http.server 8000 --bind 127.0.0.1
```

別ターミナルから、`JOURNEY_URL=http://127.0.0.1:8000/itch-dist/moon-journey-verified/index.html node tests/moon-journey-browser.mjs` を実行。Windowsでは必要に応じて環境変数`JOURNEY_URL`の設定方法を使い分けてください。テストにはPlaywright CoreとローカルChromeが必要です。

**提出するのは `HOPSCROLL-Moon-Journey-v0.5.zip`** です。ZIP直下に`index.html`が入り、必要なスプライト・背景・モジュール・`CREDITS.txt`・`PROVENANCE.md`を同梱します。ソースの`moon-journey.html`だけをアップロードしても画像やスクリプトは揃いません。

## Androidの音声確認（2026-10-31）

- ゲームを開始したときに1回だけ小さなチャイムを鳴らし、**音声エンジンが実際に解放されたか耳で確認**できるようにしました。着地時の音色は小型スマホスピーカー向けに倍音を増やしています。
- タイトル画面／プレイ画面の「♪」を **OFF → ON** と切り替えると、ONへ戻した瞬間に「リン」という短い試聴音が鳴ります。タイトル中はゲームを始めずに試聴できます。
- 音が聞こえなければ、Androidの**メディア音量**、Chrome/ブラウザの音声ミュート、Bluetooth等の出力先を確認してください。ゲーム中の `window.__MOON_LAB__.audio` には `state`（running/suspended）、`muted`、`paused`、`played`、`lastCue`、`peak` のデバッグ情報があります（音声ファイルや個人情報は送信しません）。
- このWeb Audio検証はPC自動試験でも行いますが、Android実機から聞こえたかどうかはユーザーの試遊が最終判断です。

BGMの希望曲は [**Love it Rabbit**（えだまめ88 / OpenTracks）](https://opentracks.com/bgm/detail/19294)。作者はゲームへの利用を認めていますが、[ゲーム利用条件](https://opentracks.com/help/articles/game_trpg/)は、音源を単独で簡単に抜き出せる形式での再配布を禁じています。**通常の提出用ZIPには音源を含めません。**

### 選んだBGMをローカルのAndroidで試聴する（公開用ではない）

公式サイトから取得したファイルを、Git管理外の `assets/bgm/love-it-rabbit.mp3` に置きます。PowerShellなら：

```powershell
$env:INCLUDE_BGM = '1'
python scripts/build_moon_journey.py
Remove-Item Env:INCLUDE_BGM
```

出力された `HOPSCROLL-Moon-Journey-v0.5.zip` のHTML内部にデータURIとしてBGMが埋め込まれ、**MP3ファイル単体はZIPに含まれません**。ただしデータURIも技術的には取り出せるため、**埋め込み方式だけで公開ライセンス上の問題がすべて解消するとは断定できません**。運営にブラウザゲームのHTML/ZIP形式での同梱可否を確認してから一般公開してください。音声を含むローカル試聴ビルドをそのままitch.ioへアップロードしないこと。標準ビルドは効果音のみで動きます。

生成AIによる画像制作・加工の経緯はZIP内のPROVENANCEと制作記録を参照し、itch.ioのAI利用開示欄を確認してください。**音声自動テストはブラウザ信号の上限・出力を検証するもので、人の耳での聴感・Android端末音量を保証しません**。人間の試遊、itch埋め込み、権利開示は公開前の確認事項です。

## 旧版と実験版

- `index.html` / `scripts/build.py`：旧6面キャンペーンと独立した単一HTMLビルド（保管用）。
- `moon-lab.html`：003/004の灰箱・物理・音声回帰テスト。
- `star-run.html`：X用の**有限24ジャンプ試作**。まだ無限エンドレスではありません。
- 開発の根拠： [Issue #13](https://github.com/madowaku/hopscroll/issues/13)、[Stage Pack](docs/MOON_STAGE_PACK_v0.1.md)、[月兎娘設定](docs/MOON_RABBIT_CHARACTER_v0.1.md)、[既存統合QA](docs/MOON_JOURNEY_QA.md) と [v0.5引継ぎ](docs/HANDOFF_CODEX_MOON_JOURNEY_v0.5.md)。

**このREADMEはv0.5候補の説明です。mainへのマージや公開が済んだという意味ではありません。**
