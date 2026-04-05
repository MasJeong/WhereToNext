import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { brandDisplayName } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: brandDisplayName,
  description: `한국 출발 여행자를 위한 목적지 추천 플랫폼 ${brandDisplayName} 검색처럼 바로 시작하고, 저장·공유·비교로 결정을 이어갈 수 있어요.`,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brandDisplayName,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

/**
 * Renders the shared application document wrapper.
 * @param props Nested route content
 * @returns Root html layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        style={
          {
            "--font-body": "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
            "--font-ko": "\"Apple SD Gothic Neo\", \"Malgun Gothic\", \"Noto Sans KR\", sans-serif",
            "--font-display": "\"Iowan Old Style\", \"Palatino Linotype\", \"Times New Roman\", serif",
            "--font-mono": "\"SFMono-Regular\", \"JetBrains Mono\", Consolas, \"Liberation Mono\", monospace",
          } as CSSProperties
        }
        className="compass-app-body antialiased"
      >
        <div className="compass-app-frame compass-app-shell">
          <div className="compass-route-stage">{children}</div>
        </div>
      </body>
    </html>
  );
}
