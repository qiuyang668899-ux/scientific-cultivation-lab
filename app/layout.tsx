import type { Metadata } from "next";
import "./globals.css";

const siteOrigin = process.env.SITE_ORIGIN || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: "科学修仙实验室｜假设 · 验证 · 探索 · 实践",
  description: "一个将修行命题转译成可操作训练与可证伪实验的人类潜能研究工具。",
  openGraph: {
    title: "科学修仙实验室",
    description: "假设 · 验证 · 探索 · 实践——将传说转译为可操作训练与可证伪实验。",
    type: "website",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "科学修仙实验室" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "科学修仙实验室",
    description: "假设 · 验证 · 探索 · 实践",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
