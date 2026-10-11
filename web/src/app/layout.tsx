import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "M5 GPS Dashboard",
  description: "M5 GPS レコーダーで記録した走行軌跡を地図上に表示・再生する",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${notoSansJp.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex h-dvh flex-col">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
