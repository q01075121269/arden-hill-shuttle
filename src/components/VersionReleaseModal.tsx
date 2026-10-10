"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, X, Rocket } from "lucide-react";
import {
  APP_VERSION,
  CURRENT_RELEASE_INFO,
  checkShouldShowReleaseModal,
  markReleaseSeen,
} from "@/lib/version";
import { Language } from "@/types";

interface VersionReleaseModalProps {
  lang?: Language;
}

export function VersionReleaseModal({ lang = "KR" }: VersionReleaseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isKr = lang === "KR";

  useEffect(() => {
    // 최초 접속 시 버전 업데이트 감지
    if (checkShouldShowReleaseModal()) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleClose = (dontShowToday = false) => {
    markReleaseSeen(dontShowToday);
    setIsOpen(false);
  };

  const highlights = isKr
    ? CURRENT_RELEASE_INFO.highlightsKr
    : CURRENT_RELEASE_INFO.highlightsCn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="px-6 py-5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v{APP_VERSION}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {CURRENT_RELEASE_INFO.releaseDate}
                </span>
              </div>
              <h3 className="text-base font-black tracking-tight mt-0.5">
                {isKr
                  ? `시스템이 v${APP_VERSION}으로 업데이트되었습니다`
                  : `系统已更新至 v${APP_VERSION}`}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 squishy-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 본문 업데이트 상세 내역 */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isKr ? "주요 릴리즈 업데이트 내역" : "主要更新内容"}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {isKr
                ? "안정적이고 스마트한 리조트 셔틀 운영을 위해 다음 기능이 적용되었습니다."
                : "为了提供更稳定、智能的度假村班车服务，本次更新包含以下功能。"}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {highlights.map((item, index) => (
              <div
                key={index}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 조작 버튼: [오늘은 그만 보기] / [확인] */}
        <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleClose(true)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            {isKr ? "오늘은 그만 보기" : "今日不再提示"}
          </button>

          <button
            type="button"
            onClick={() => handleClose(false)}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-xs squishy-btn shadow-sm hover:opacity-95"
          >
            {isKr ? "확인 완료" : "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}
