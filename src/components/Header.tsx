"use client";

import React from "react";
import { Bus, Bell } from "lucide-react";
import { Language } from "@/types";
import { I18N } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthHeaderProfile } from "@/components/auth/AuthHeaderProfile";
import { InstallAppButton } from "@/components/common/InstallAppButton";

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenNotice: () => void;
  onLogoClick?: () => void;
  hasUnreadNotice?: boolean;
}

export function Header({
  currentLang,
  onLanguageChange,
  onOpenNotice,
  onLogoClick,
  hasUnreadNotice = true,
}: HeaderProps) {
  const t = I18N[currentLang];
  const isKr = currentLang === "KR";

  return (
    <header className="sticky top-0 z-40 w-full h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#111318]/90 backdrop-blur-md transition-colors box-border">
      <div className="max-w-md mx-auto px-3 h-full flex items-center justify-between">
        {/* 좌측: 로고 아이콘 + '아덴힐 셔틀' (한 줄 표출, whitespace-nowrap, 클릭 시 첫 화면 리셋) */}
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-2 text-left focus:outline-hidden squishy-btn group cursor-pointer shrink-0"
          title={isKr ? "홈 첫 화면으로 이동" : "返回主页"}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl p-0.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/images/logo-symbol.png"
              alt="아덴힐 스마트 셔틀 로고"
              className="h-full w-full object-contain drop-shadow-xs"
            />
          </div>
          <span className="font-black text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            {t.systemTitle}
          </span>
        </button>

        {/* 우측 조작 영역: 앱 설치 + 테마 토글 + 공지 벨 + [KR | CN] 언어 토글 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 홈 화면 앱 설치 버튼 (모바일 콤팩트, PC/태블릿 텍스트 배지) */}
          <InstallAppButton variant="header" className="hidden sm:flex" />
          <InstallAppButton variant="compact" className="sm:hidden" />

          {/* 다크/화이트 모드 원터치 토글 */}
          <ThemeToggle />

          {/* 공지사항 벨 버튼 */}
          <button
            type="button"
            onClick={onOpenNotice}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white squishy-btn border border-slate-200/70 dark:border-slate-700/80"
            aria-label={isKr ? "공지사항" : "通告"}
            title={isKr ? "공지사항" : "通告"}
          >
            <Bell className="h-4 w-4" />
            {hasUnreadNotice && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* 표준 축약형 [KR | CN] 언어 토글 버튼 */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => onLanguageChange("KR")}
              className={`px-2 py-1 rounded-lg text-xs font-black transition-all squishy-btn ${
                currentLang === "KR"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              KR
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("CN")}
              className={`px-2 py-1 rounded-lg text-xs font-black transition-all squishy-btn ${
                currentLang === "CN"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              CN
            </button>
          </div>

          {/* 간편 인증 프로필 및 원터치 로그인/로그아웃 모달 */}
          <AuthHeaderProfile />
        </div>
      </div>
    </header>
  );
}
