# web（Web ダッシュボード）

M5 GPS レコーダーの CSV をアップロードし、地図上に走行軌跡を表示・再生する Next.js アプリ。
使い方・本番運用・ライセンスはリポジトリ直下の [README](../README.md)、仕様は [docs/ideas/web-dashboard-spec.md](../docs/ideas/web-dashboard-spec.md) を参照。

## 技術構成

Next.js 16（App Router / Cache Components）・TypeScript・Tailwind CSS 4・shadcn/ui（Radix）・Leaflet + react-leaflet + OpenStreetMap・SQLite（better-sqlite3 + Drizzle ORM）・Vitest

## コマンド

| コマンド                   | 内容                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `npm run dev`              | 開発サーバー（http://localhost:3000）                        |
| `npm run build`            | 本番ビルド（`.next/standalone` に public・static もコピー）  |
| `npm run start:standalone` | 本番ビルドを起動                                             |
| `npm test`                 | ユニットテスト・統合テスト（Vitest）                         |
| `npm run lint`             | ESLint                                                       |
| `npm run typecheck`        | 型チェック（ルートの型を生成してから `tsc`）                 |
| `npm run db:generate`      | `src/server/db/schema.ts` の変更からマイグレーションを生成   |
| `npm run demo:generate`    | ダミー CSV を `demo/` に生成                                 |
| `npm run screenshots`      | README 用のスクリーンショットを `../docs/images/` に撮る     |

## ディレクトリ構成

```
web/
├── src/
│   ├── app/                  # ページ・Server Actions（actions.ts）・GeoJSON API（api/tracks/[id]/geojson）
│   ├── components/           # 画面部品（ui/ は shadcn/ui、map/ は地図と再生）
│   ├── lib/                  # フレームワークに依存しない処理（CSV 解析・GeoJSON 変換・距離・表示形式・再生の時刻計算）
│   └── server/               # サーバー専用（DB・ファイル保存・track-service）
├── drizzle/                  # マイグレーション（起動時に自動適用）
├── scripts/                  # ダミーデータ生成・スクリーンショット撮影
├── demo/                     # ダミー CSV（架空のルート）
└── data/                     # 開発時のデータ保存先（Git 管理外）
```

## データベース

- スキーマは `src/server/db/schema.ts`。変更したら `npm run db:generate` でマイグレーションを生成してコミットする
- マイグレーションはアプリ起動後の最初のアクセス時に自動で適用される

## テスト

- `src/**/*.test.ts` と `scripts/**/*.test.ts` が対象
- `track-service` の統合テストは一時ディレクトリに DB とファイルを作って実行する
- テストの座標は東京タワー付近（35.658636, 139.745407）を使う。実際の走行データ（位置情報）はテスト・ドキュメントに含めない
- リポジトリ直下に `sample_data/`（実際の走行データ、Git 管理外）を置いた場合のみ、ダミーデータがその範囲と重ならないことも確認する

## スクリーンショットの撮り直し

画面を変更したら README の画像を撮り直す。画像は**ダミーデータ**（`demo/`）で撮影し、実際の走行データは使わない。

```bash
npx playwright install --with-deps chromium   # 初回のみ（--with-deps は OS のライブラリも入れるため sudo が必要）
npm run build
npm run screenshots
```

- 一時ディレクトリを `DATA_DIR` にして本番ビルドを起動し、ダミー CSV を画面から登録して撮影する（開発用の `data/` には触れない）
- OSM タイル利用ポリシーに従い、手動で実行して数枚撮るだけにする。CI などで繰り返し実行しない
- ダミーデータのルートを変える場合は `scripts/demo-routes.ts` を編集して `npm run demo:generate` を実行する（実データの範囲と重ならないことをテストで確認している）
