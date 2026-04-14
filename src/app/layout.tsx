import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "SooGo",
  description: "한국 출발 여행자를 위한 목적지 추천 플랫폼 SooGo입니다. 검색처럼 바로 시작하고, 저장·공유·비교로 결정을 이어갈 수 있어요.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: {
      url: "/apple-touch-icon.png",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SooGo",
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
        className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} compass-app-body antialiased`}
      >
        <div className="compass-app-frame compass-app-shell">
          <div className="compass-route-stage">{children}</div>
        </div>
      </body>
    </html>
  );
}
