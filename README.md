# React + TypeScript + Vite（日本語）

このテンプレートは、Vite 上で React + TypeScript を最小構成で動かすためのセットアップです。HMR（ホットリロード）と基本的な ESLint ルールを含みます。

## 起動方法

1. 依存関係をインストール:

```bash
npm install
```

2. 開発サーバーを起動（ローカルで確認）:

```bash
npm run dev
# デフォルトは http://localhost:5173
```

3. ビルド / プレビュー:

```bash
npm run build
npm run preview
```

---

## 発生しているエラーの解説（日本語）

1) src/main.tsx が 404 になるエラー:

エラーメッセージ例: "src/main.tsx:1 Failed to load resource: the server responded with a status of 404 ()"

- 原因: index.html が `/src/main.tsx` を参照しているが、ファイルが存在しない、または開発サーバーを立ち上げていない、あるいはファイルへ直接 file:// で開いている（この場合サーバーが必要）など。
- 対処:
  - 開発サーバーを起動してページを http(s) 経由で開く（npm run dev）。
  - ファイルが存在するか確認（src/main.tsx は本リポジトリにあります）。
  - index.html の script タグのパスが正しいか確認（通常 Vite では `/src/main.tsx` で問題ありません）。

2) "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received":

- 原因: このエラーは多くの場合、ブラウザ拡張（Chrome 拡張等）または Service Worker がメッセージリスナーで `return true` を返して非同期応答を示したが、実際に応答を送らずにチャンネルが閉じたときに発生します。アプリのコードではなく、ブラウザ側（拡張や登録された Service Worker）が起点であることが多いです。
- 確認手順（優先度順）:
  1. 開発者ツール（DevTools）→ Console → エラーのスタックトレースをクリック。発生元が `chrome-extension://` や `extension://`、あるいは `service-worker` の URL なら拡張機能や Service Worker 起因です。
  2. ブラウザの拡張を一時的に無効化してページを再読み込みする（原因切り分け）。
  3. DevTools → Application → Service Workers で登録済みの Service Worker を unregister（登録解除）してリロード。
  4. シークレット/プライベートウィンドウで開いてみる（拡張が無効化された状態で動作確認できる）。
  5. もし拡張を開発している場合は、メッセージハンドラで必ず sendResponse を呼ぶか、非同期で sendResponse を呼ぶ場合は `return true` を返す実装を正しく行う。

- 拡張のメッセージリスナーの正しい例（Chrome 拡張の背景スクリプト）:

```js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ping') {
    // 非同期に応答する場合は return true して sendResponse を後で呼ぶ
    setTimeout(() => sendResponse({ pong: true }), 500);
    return true; // 非同期応答を示す
  }
  // 同期応答なら直接 sendResponse を呼ぶ
  sendResponse({ ok: true });
});
```

---

## 具体的な対処手順（推奨順）

1. ターミナルでプロジェクトルートに移動し、依存をインストールして dev サーバーを起動:

```bash
npm install
npm run dev
```

2. ブラウザで http://localhost:5173 を開き、DevTools を表示して Console に出るエラーの発生元（拡張か Service Workerか）を確認。

3. 拡張由来であれば拡張を無効化（またはシークレットで確認）。Service Worker 由来であれば Application→Service Workers で unregister してページを再読み込み。

4. 必要なら、発生しているエラーの Console のスタックトレースをここに貼ってください。原因の特定と具体的な対処（どの拡張が原因か、どのコードを修正すべきか）をさらに手伝います。

---

必要なら、この README をさらに詳しく整備（日本語の開発ガイド、よくあるトラブルシュートの節追加、コマンドやスクリーンショットの追加など）します。希望があれば教えてください。

---

Playable demo: https://ramen0129.github.io/ramen20260505/ (enable Pages for gh-pages branch if not active)

Audio:
- Placeholder WAV assets added: public/assets/bgm-loop.wav, public/assets/sfx-hit.wav
- To replace: overwrite those files and run `npm run build` then push gh-pages branch.

