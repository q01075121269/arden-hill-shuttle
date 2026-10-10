"use client";

import React, { useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { AppInstallModal } from "@/components/common/AppInstallModal";

interface InstallAppButtonProps {
  appName?: string;
  className?: string;
  variant?: "header" | "card" | "compact";
}

export function InstallAppButton({
  appName = "아덴힐 스마트 셔틀",
  className = "",
  variant = "header",
}: InstallAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "header" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 font-black text-xs squishy-btn transition-colors shrink-0 ${className}`}
          title="스마트폰 홈 화면에 앱 설치하기"
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="whitespace-nowrap">앱 설치</span>
        </button>
      )}

      {variant === "compact" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 squishy-btn shrink-0 ${className}`}
          title="스마트폰 홈 화면에 앱 설치하기"
        >
          <Smartphone className="h-4 w-4" />
        </button>
      )}

      {variant === "card" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-between squishy-btn hover:brightness-105 transition-all ${className}`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>스마트폰 홈 화면에 바로가기 앱 설치하기</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-black">
            설치 ➔
          </span>
        </button>
      )}

      <AppInstallModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appName={appName}
      />
    </>
  );
}
