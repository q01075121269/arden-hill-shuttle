import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "아덴힐 스마트 셔틀 운영 시스템 | Arden Hill Shuttle",
  description: "아덴힐 리조트 입주민 및 투숙객을 위한 스마트 셔틀 예약 및 실시간 위치 관제 시스템",
  icons: {
    icon: "/images/logo-symbol.png",
    shortcut: "/images/logo-symbol.png",
    apple: "/images/logo-symbol.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="w-full max-w-full overflow-x-hidden box-border min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
