WALKTHROUGH — 迫り来るラーメン・タイピングゲーム（ウォークスルー）

目的
- 中学校社会科ワードで遊ぶ、"タイピング・オブ・ザ・デッド"風ゲームの開発記録と変更履歴を逐次残す。

フォーマット
- 日付 時刻 — 短い見出し
  - やったこと（数行）
  - 次のステップ

エントリ

2026-05-05T09:19:30+00:00 — セッション開始
- ユーザー要求: 中学社会科の語彙を使った迫り来る敵をタイピングで倒すゲームの提案。モード: 直接打つ / 問題→解答。ローマ字入力の柔軟対応要望。
- 次: plan.md 作成

2026-05-05T09:24:33+00:00 — plan.md 作成
- ゲームの目的、技術スタック候補、TODO リスト（design-game, define-wordsets, implement-core, ...）を作成。
- 次: todos 登録して開始

2026-05-05T09:25:xx+00:00 — TODO 登録 & design-game 開始/完了
- todos に 11 件登録。design-game を in_progress にし、後で done に更新。
- 次: スキャフォールド追加

2026-05-05T09:25:xx+00:00 — 最小ゲーム骨組み追加
- src/romaji.ts（正規化ユーティリティ）作成
- src/game.ts（Canvas ベースの最小動作プロトタイプ）作成。🍜の敵、入力判定、スコア/ライフ実装。
- design-game → done, define-wordsets → in_progress
- 次: ワードセット作成

2026-05-05T09:27:00+00:00 — ワードセット追加
- src/wordsets/junior_high_social_studies.json を作成（ローマ字ワード一覧）
- define-wordsets → done, implement-core → in_progress
- 次: implement-core 実装

2026-05-05T09:28:xx+00:00 — implement-core 強化
- ワードセット読み込み、コンボ/倍率、難易度スケーリング、破壊エフェクトを追加
- src/audio.ts（簡易オーディオヘルパ）を追加
- implement-core → done, input-modes → in_progress
- 次: 入力モード（直接 / QA）実装

2026-05-05T09:31:xx+00:00 — 入力モード実装（Tab で切替）
- src/wordsets/junior_high_social_studies_qna.json を作成（問題→解答セット）
- src/game.ts を更新して direct/qa モードを実装。QA では問題表示→回答で倒す。HUD にモード表示。
- input-modes → done, romaji-mapper → in_progress
- 次: romaji-mapper 実装（n の扱い等）

運用ルール（このファイルについて）
- 各「作業完了」レスポンス時にこの WALKTHROUGH.md を追記していく。
- エントリは短く、行った変更と次のステップを必ず含める。

今後の優先タスク（短）
- romaji-mapper 実装（促音・拗音・連続 n 対応）
- BGM/SFX を public/assets に追加して src/audio.ts と接続
- UI（スタート画面、難易度選択、チュートリアル）


2026-05-05T11:05:31+00:00 — romaji-mapper 統合とビルド/コミット完了
- やったこと: src/romaji.ts に romaji 正規化を実装（促音・んの扱い）し、src/game.ts に組み込んで入力判定を正規化済み文字列で行うようにした。ビルド成功、変更をコミット。
- 次のステップ: public/assets に BGM/SFX を追加して src/audio.ts と接続し、ゲームに音を実装する。


2026-05-05T11:08:46+00:00 — スタート画面と音声フック実装
- やったこと: src/game.ts にスタート画面（任意のキー/クリックで開始）を追加し、src/audio.ts の playBgm/playSfx を利用するフックを組み込んだ。プリロード呼び出しも追加。ビルド成功、変更をコミット。
- 次のステップ: public/assets に実際の BGM/SFX ファイルを追加する（プレースホルダを配置済みなら動作確認）。UI 微調整と音量設定 UI を追加予定。

---
(自動更新用ファイル)
