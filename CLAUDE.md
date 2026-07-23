# Coding Agent Guidelines

## 目次

- [基本原則](#基本原則)
- [UX ライティング](#ux-ライティング)
- [開発コマンド](#開発コマンド)
- [アーキテクチャ](#アーキテクチャ)
- [不変条件（絶対に破らないこと）](#不変条件絶対に破らないこと)
- [API 規約](#api-規約)
- [コーディングガイドライン](#コーディングガイドライン)

## 基本原則

- 常に日本語でコミュニケーションを行ってください。すべてのコミットメッセージ、コメント、エラーメッセージ、ユーザーとのやり取りは日本語で行ってください。
- ファイルの削除を行う場合は、必ず実行前に以下を報告し、明示的なユーザー承認を得てください。
  - 対象ファイルのリスト
  - 実行する変更の詳細説明
  - 影響範囲の説明
- 不明な点がある場合は常に質問し、推測で進めてはなりません。
- 実装後の必須作業として、`pnpm run codecheck`を実行してください。
  - 型エラーやリンターのエラーが出た場合は、コミット前に必ず修正してください。
  - ユーザーが明示的に許可した場合を除き、エラーを解消するために`.oxlintrc.json`や`tsconfig.json`を変更してはなりません。

### コミットメッセージ

- コミットメッセージは原則として `feat:` `fix:` `docs:` `chore:` `refactor:` `test:` `ci:` などの prefix を付けた日本語の 1 行で記述してください。
- 本文（複数行の詳細説明）は原則として書かないでください。

## UX ライティング

- ボタンやリンクのラベルは体言止め（名詞で終える言い方）ではなく、動詞 +「する」で終える言い切りの形にしてください（例:「アップロードする」「アルバムを作成する」）。
- 画面内で同じ情報を重複して表示しないでください（例: ヘッダーにアプリ名が表示済みの場合、本文で同じ文言を繰り返さない）。
- 新しい文言を追加・変更する前に、同じ画面や近い機能で既に使われている表記・語尾を確認し、トーンを揃えてください。

## 開発コマンド

### 基本コマンド

- `pnpm run dev` - 開発サーバーを起動（http://localhost:3000）
- `pnpm run build` - 本番アプリケーションをビルド
- `pnpm run preview` - 本番ビルドをローカルでプレビュー
- `pnpm run cf-typegen` - Cloudflare バインディングの型を生成
- `pnpm run typecheck` - TypeScript で型チェック
- `pnpm run codecheck` - typecheck + lint + format + knip を一括実行

### データベース

- `pnpm run db:generate` - `src/db/schema.ts` からマイグレーション SQL を `./drizzle` に生成
- `pnpm run db:studio` - Drizzle Studio を起動
- `pnpm wrangler d1 migrations apply photo --local` - ローカル D1 にマイグレーションを適用
- `pnpm wrangler d1 migrations apply photo --remote` - 本番 D1 にマイグレーションを適用

## アーキテクチャ

### 技術スタック

- **言語**: TypeScript / React 19
- **フレームワーク**: TanStack Start（TanStack Router による file-based routing）
- **UI**: Mantine v9 + CSS Modules（postcss-preset-mantine）
- **ビルド**: Vite
- **コード品質**: Oxlint / Oxfmt
- **Git hooks**: Lefthook
- **デプロイ**: Cloudflare Workers（wrangler / @cloudflare/vite-plugin）
- **データベース**: Cloudflare D1 + Drizzle ORM
- **認証**: Clerk
- **ストレージ**: Cloudflare R2（画像本体。DB には `storage_key` のみ保持）

### RSC は存在しない

TanStack Start は RSC を使いません。full-document SSR + hydration + server functions です。`"use client"` / `"use server"` / `import "server-only"` は使用できません。Next.js App Router の書き方を持ち込まないでください。

- **loader の戻り値はクライアントに JSON としてシリアライズされます**。秘匿すべき情報を含めてはなりません
- サーバー専用処理は server function（`createServerFn`）に置きます

### プロジェクト構造

```bash
src/
├── routes/                 # TanStack Router の file-based routes（フラットなドット記法）
│   ├── __root.tsx          # ルートドキュメント（HTML シェル）
│   ├── admin.*.tsx         # 管理画面（要ログイン）
│   ├── albums.$slug.tsx    # 公開アルバムページ
│   └── api/                # API ルート（画像配信など）
├── router.tsx              # ルーターの生成（getRouter）
├── routeTree.gen.ts        # 自動生成（編集禁止）
├── components/             # コンポーネント（PascalCase。CSS Modules を併置）
├── server/                 # server functions（createServerFn）
├── db/                     # Drizzle スキーマと DB クライアント
├── integrations/           # 外部サービス連携（Clerk など）
├── lib/                    # グローバルユーティリティ
└── env.ts                  # 環境変数のバリデーション（@t3-oss/env-core）
```

- コンポーネントの名前・ファイル名は PascalCase（例: `PhotoCard.tsx`）で命名し、`components/` 直下にフラットに配置してください。コンポーネントごとのディレクトリやバレル `index.ts` は作成しないでください。
- コンポーネント固有のスタイルは同名の CSS Module（例: `PhotoCard.module.css`）に記述してください。

### インポートとパスエイリアス

- 同階層でないモジュールをインポートする場合は、**相対パスではなくパスエイリアスを使用してください**。
- プロジェクトでは `#/` が `src/` にマップされています。例: `#/lib/slug` → `src/lib/slug`。
- **同一ディレクトリ内**のインポートでは相対パス（`./PhotoCard` など）を使用して構いません。

## 不変条件（絶対に破らないこと）

- 公開判定はアクセスコンテキストで使い分ける。**アルバム経由のアクセスでは album の visibility**、**写真単体のアクセスでは photo の visibility** に従う。単純な「最小公開度の AND」にしない
- アクセス判定の順序: (1) オーナー本人なら常に可、(2) visibility が public なら可、(3) 該当 share 行があれば可、いずれもなければ不可
- 画像などのバイナリを D1 に入れない。R2 に保存し、DB には `storage_key` のみ保持する
- 新規テーブルには `user_id` 列とインデックスをデフォルトで入れる（将来の多ユーザー化に備えた shared-ready 設計）
- `src/routeTree.gen.ts` は自動生成ファイルのため編集しない

## API 規約

- ルート定義は `createFileRoute`、search params は `validateSearch` + zod でバリデーションする
- server function は `createServerFn().validator().handler()` で定義し、`src/server/` に置く
- server function はエラーをスローせず、結果オブジェクト（`{ success: false, error: "..." } as const` など）で返す
- Drizzle の `sql` テンプレートで相関サブクエリを書く場合、列は `${table}.col` の形で修飾する（`${table.col}` は非修飾になり JOIN 先の列に解決されることがある）

## コーディングガイドライン

### `any`の禁止

- いかなる理由があっても`any`を使用してはなりません。
- `unknown`や`never`の使用も避けてください。
- 実データと一致する型を定義してください。

### 型アサーションの禁止

- 型アサーションは禁止です。
- 型アサーションを使用する場合は、明確な理由をコメントアウトとして記述してください。

### `interface`の禁止

- 型定義に`interface`を使用してはなりません。`type`を使用してください。
- 唯一の例外は宣言マージが必須の場面（`src/router.tsx` の `Register`）です。理由をコメントで記述してください。

### コメントの禁止

- 原則としてコメントは記述してはなりません。
- 型アサーションやuseEffectの使用理由など、他のガイドラインが記述を求める場合のみ例外とします。
- コメントを書く場合は括弧を使用しないでください。

### 過度な抽象化の禁止

- 無駄に関数化・定数化しすぎてはなりません。
- 再利用される明確な根拠がない限り、処理の切り出しや定数への抽出を行わないでください。

### コンポーネントファイルの構成

- コンポーネントファイルにはコンポーネント関数とその Props 型以外を原則置かないでください。
- className 等はモジュールレベルの変数やヘルパー関数に切り出さず、使用箇所にインラインで記述してください。

### useEffectの禁止

- 初期データを取得するためにuseEffectを使用してはなりません。
- データ取得はルートの loader で行い、`Route.useLoaderData()` で参照してください。
- ブラウザAPIアクセスやイベントリスナー登録など、真に必要な場合のみuseEffectの使用を許可します。この場合は明確な理由をコメントアウトとして記述すべきです。

### ローディング表示

- server function の呼び出し中は`useTransition`等でローディング表示を行ってください。
- ボタンを連打できないように`disabled`を設定してください。
