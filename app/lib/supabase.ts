import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// URLが読み込めていない場合に、コンソールに警告を出す
if (!supabaseUrl || !supabaseKey) {
  console.error("🚨 Supabaseの環境変数が読み込めません！ .env.localを確認してください");
}

// undefinedの場合は空文字を入れてクラッシュを防ぐ（エラーは見やすくなる）
export const supabase = createClient(
  supabaseUrl || "", 
  supabaseKey || ""
);