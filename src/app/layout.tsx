import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "차용 — 승계·리스·렌트 플랫폼", template: "%s | 차용" },
  description:
    "안전하게 승계하는 가장 쉬운 방법, 차용. 월 납입금만 보고 간편하게 비교하세요.",
  openGraph: {
    title: "차용 — 승계·리스·렌트 플랫폼",
    description: "월 납입금만 보고 간편하게 비교하세요.",
    siteName: "차용",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[var(--chayong-bg)] antialiased">
        {children}
      </body>
    </html>
  );
}
