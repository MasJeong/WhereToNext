import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Manrope, Noto_Sans_KR } from "next/font/google";
import { brandDisplayName } from "@/lib/brand";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const koFont = Noto_Sans_KR({
  variable: "--font-ko",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
        className={`${bodyFont.variable} ${koFont.variable} ${displayFont.variable} ${monoFont.variable} compass-app-body antialiased`}
      >
        <div className="compass-app-frame compass-app-shell">
          <div className="compass-route-stage">{children}</div>
        </div>
      </body>
    </html>
  );
}
