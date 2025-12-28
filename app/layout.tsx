import type { Metadata } from "next";
// Noto_Sans_JP から M_PLUS_Rounded_1c に変更
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

// M PLUS Rounded 1c を設定
const mPlusRounded1c = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"], // 必要な太さを指定
  variable: "--font-m-plus-rounded-1c",
});

export const metadata: Metadata = {
  title: "Scan.io | スマート家計簿",
  description: "レシートスキャンで割り勘を自動化するWebアプリ",
  manifest: "/manifest.json", 
  themeColor: "#ffffff",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
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
    <html lang="ja">
      {/* className を mPlusRounded1c に変更 */}
      <body className={mPlusRounded1c.className}>{children}</body>
    </html>
  );
}