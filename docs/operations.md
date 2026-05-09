# 運用ガイド

## 起動方法

### ローカル実行

**前提**:

- Node.js 22 以降（`--strip-types` フラグが必要）
- pnpm
- Playwright 用ブラウザ（初回のみインストールが必要）

```bash
# 依存インストール
pnpm install

# Playwright の Chromium をインストール（Nintendo / ヨドバシ チェッカー用）
pnpm exec playwright install chromium

# .env を設定
cp .env.example .env
# .env を編集して SLACK_WEBHOOK_URL と RAKUTEN_APP_ID を設定

# 起動
pnpm start
```

### Docker 単体

```bash
docker build -t stock-alert .
docker run --env-file .env -v stock-state:/app/data stock-alert
```

> Docker イメージは `mcr.microsoft.com/playwright:v1.59.1-noble` をベースにしており、Chromium は事前インストール済みです。

### Docker Compose（推奨）

```bash
# 起動（初回はイメージをビルド）
docker compose up --build

# バックグラウンドで起動
docker compose up --build -d

# 停止
docker compose down
```

`docker-compose.yml` は名前付きボリューム `state-data` を `/app/data` にマウントします。コンテナを再作成しても `data/state.json` が保持され、再起動後も差分検知が正常に動作します。

---

## 状態ファイル

### パスと構造

状態は `data/state.json` に保存されます（Docker では `/app/data/state.json`）。

```json
{
  "https://books.rakuten.co.jp/rb/4088843819/": "out_of_stock",
  "https://www.yodobashi.com/product/100000001007954538/": "in_stock",
  "https://store.nintendo.co.jp/item/HAC-S-KAAAA.html": "out_of_stock"
}
```

キーは商品 URL、値は `'in_stock'` / `'out_of_stock'` のいずれかです（`'unknown'` は記録されません）。

### 状態のリセット

状態ファイルを削除すると、次のティックで全商品がベースライン化されます（通知なし）。商品リストを大幅に変更したときや、通知の誤検知をリセットしたいときに使います。

```bash
# ローカル
rm data/state.json

# Docker Compose（ボリュームごと削除）
docker compose down -v
```

---

## ログ

構造化ロガーは使用していません。起動ログと例外が `console.log` / `console.error` で標準出力・標準エラーに出力されます。

| 出力 | 内容 |
|---|---|
| `ready` | 起動完了。`startOrchestrator` が呼び出された |
| `products.yaml が見つかりません` (stderr) | `products.yaml` が見つからず終了 |
| `.env の設定が不正です: ...` (stderr) | 環境変数の検証エラーで終了 |
| スタックトレース (stderr) | `runOnce` 内で未捕捉の例外が発生（通知失敗など） |

> チェッカー内の取得エラー（ネットワーク障害・タイムアウト）はログ出力なしで `unknown` として処理されます。

---

## タイムアウト・リトライ方針

### タイムアウト

| チェッカー | 操作 | タイムアウト |
|---|---|---|
| 楽天ブックス | fetch | Node デフォルト（明示指定なし） |
| Nintendo | `page.goto` | 30 秒 |
| Nintendo | JS 描画待機 | 5 秒 |
| ヨドバシ（fetch） | fetch | Node デフォルト（明示指定なし） |
| ヨドバシ（Playwright） | `page.goto` | 30 秒 |
| ヨドバシ（Playwright） | JS 描画待機 | 3 秒 |

### リトライ

専用のリトライ機構はありません。各チェッカーは失敗時に `'unknown'` を返し、`orchestrator.ts` がそれをスキップします。次の `CHECK_INTERVAL_SECONDS` 後に再試行されるのが事実上のリトライです。

### 通知失敗時の挙動

Slack Webhook への POST が失敗した場合（`NotifierError`）、`state[url]` の更新は行われません。次のティックで再度状態変化が検出され、再通知が試みられます。

---

## 通知の挙動

### Slack メッセージの形式

```
[在庫アラート] Nintendo Switch 2 (yodobashi)
ステータス: in_stock
URL: https://www.yodobashi.com/product/100000001007954538/
```

### 通知のトリガー

| 状況 | 動作 |
|---|---|
| 初回チェック（状態ファイルなし・URL 未登録） | 通知なし（ベースライン化のみ） |
| 前回と状態が同じ | 通知なし |
| `out_of_stock` → `in_stock` | Slack 通知 |
| `in_stock` → `out_of_stock` | Slack 通知 |
| チェッカーが `unknown` を返す | 通知なし・状態更新なし |

---

## 既知の制約

- **並列実行なし**: 商品を逐次処理するため、Playwright が絡む商品が多いと 1 ティックの実行時間が長くなります。商品数が増えた場合は `CHECK_INTERVAL_SECONDS` を調整してください
- **複数プロセス非対応**: `data/state.json` の読み書きはアトミックでないため、同じ状態ファイルを使う複数プロセスを同時起動すると競合が発生する可能性があります
- **初回チェックに遅延あり**: `setInterval` のみ使用しているため、起動直後の最初のチェックは `CHECK_INTERVAL_SECONDS` 秒後に行われます
- **Block Kit 未対応**: Slack 通知は `text` フィールドのみのシンプルな Webhook メッセージです。リッチフォーマットは未実装です
