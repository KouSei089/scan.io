import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// ★ここがメタデータの設定です
export const metadata: Metadata = {
  title: "Scan.io | スマート家計簿",
  description: "レシートスキャンで割り勘を自動化するWebアプリ",
  // スマホでホーム画面に追加した時の設定（任意）
  manifest: "/manifest.json", 
  themeColor: "#ffffff",
  // スマホでの表示倍率を固定して使いやすくする
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  // iOS用のアイコン設定
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Scan.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 言語設定を日本語に変更
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}