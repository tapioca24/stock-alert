# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
pnpm start          # 起動（node --strip-types --env-file=.env src/index.ts）
pnpm typecheck      # 型チェック（tsc --noEmit、ビルド成果物は生成しない）
pnpm test           # 全テスト実行（vitest run）

# 単一テストファイルを実行
pnpm vitest run tests/rakutenChecker.test.ts

# Playwright ブラウザのインストール（初回のみ）
pnpm exec playwright install chromium
```

## アーキテクチャ

### データフロー

`products.yaml` と `.env` を `src/index.ts` が読み込み、`src/config.ts` で valibot 検証 → `src/main.ts` でチェッカー群を初期化 → `src/orchestrator.ts` の `setInterval` ループが `runOnce` を定期実行する。

`runOnce` は各商品を**逐次**チェックし、前回状態（`data/state.json`）と比較して差分があれば `src/notifier.ts` 経由で Slack Webhook に通知する。初回（`state[url] === undefined`）は通知せずベースライン記録のみ。`'unknown'` は状態更新・通知ともにスキップ。

### Checker 型

```ts
// src/checker.ts
type StockStatus = 'in_stock' | 'out_of_stock' | 'unknown'
type Checker = (product: Product) => Promise<StockStatus>
```

各サイトは `create<Site>Checker(...)` ファクトリ関数（クロージャで依存を束縛）で `Checker` を返す。**例外はスローせず `'unknown'` を返す**のが各チェッカーの責務。

### サイト別の取得戦略

| siteType | 手法 | 在庫判定 |
|---|---|---|
| `rakuten` | 楽天 Books API（URL から ISBN を抽出） | `availability === '1'` |
| `nintendo` | Playwright（headless Chromium、5 秒待機） | カートボタンの `disabled` 属性 |
| `yodobashi` | fetch + cheerio、`unknown` なら Playwright（3 秒待機） | `#salesInfoTxt` テキスト |

### 新サイト追加時の変更箇所

1. `src/<site>Checker.ts` — `create<Site>Checker` を実装
2. `src/config.ts` — `SiteTypeSchema` の picklist に追加
3. `src/main.ts` — siteType ディスパッチに分岐追加
4. `tests/<site>Checker.test.ts` — HTML パース関数をエクスポートしてユニットテスト

### 実行環境の注意

- **Node 22 以降が必須**（`--strip-types` 使用）
- `tsc` はビルドしない（`noEmit: true`）、型チェック専用
- 状態ファイル `data/state.json` は Docker では `state-data` ボリュームにマウント
