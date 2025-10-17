import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const notoSerifSC = Noto_Serif_SC({
    variable: "--font-noto-serif-sc",
    subsets: ["latin"],
    weight: ["400", "700"],
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
    title: "历史回响 - 历史人物猜谜游戏",
    description: "十条线索，一位伟人。穿越时空迷雾，你能否揭晓谜底？",
    keywords: ["历史", "游戏", "猜名人", "知识问答", "History Echoes"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${notoSerifSC.variable} ${inter.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
