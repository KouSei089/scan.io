# Scan.io 🧾

レシートをスキャンして、パートナーとの支出を自動で割り勘計算できる家計簿アプリです。
Google Gemini API (AI) を活用し、画像から「店名」「日付」「金額」を自動抽出します。

## ✨ 機能

- **レシートAIスキャン**: カメラで撮るだけで内容を自動入力
- **手入力モード**: レシートがない支払いも記録可能
- **自動割り勘**: 月ごとに「どっちがいくら払うべきか」を自動計算
- **ユーザー管理**: 2名までのユーザー登録・ログイン機能
- **履歴・修正**: 月別の履歴表示、削除、カテゴリ編集
- **レスポンシブ**: スマホ・PC両対応

## 🛠 技術スタック

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (gemini-flash-latest)
- **Styling**: Tailwind CSS
- **Deployment**: Netlify

## 🚀 ローカルでの起動方法

1. リポジトリをクローン
2. 依存関係をインストール
   ```bash
   npm install
   ```
3. 環境変数を設定
   `.env.local` ファイルを作成し、以下のキーを設定してください。
   ```env
   GOOGLE_API_KEY=あなたのGeminiキー
   NEXT_PUBLIC_SUPABASE_URL=SupabaseのURL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SupabaseのAnonキー
   ```
4. 開発サーバーを起動
   ```bash
   npm run dev
   ```

## 🗄 データベース設定 (Supabase SQL)

以下のSQLを実行してテーブルを作成してください。

```sql
-- 1. 家計簿テーブル
create table expenses (
  id serial primary key,
  store_name text,
  amount integer,
  purchase_date date,
  paid_by text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ユーザーテーブル
create table users (
  id serial primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```