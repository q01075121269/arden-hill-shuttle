"use client";

import React from "react";
import { LogOut, X, AlertCircle } from "lucide-react";
import { Language } from "@/types";

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lang?: Language;
  title?: string;
  description?: string;
}

/**
 * 전 모듈 공통 모바일 앱 종료 확인 모달 컴포넌트
 * 글래스모피즘 오버레이, rounded-3xl 카드, KR/CN 다국어 및 2분할 버튼을 지원합니다.
 */
export function ExitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  lang = "KR",
  title,
  description,
}: ExitConfirmModalProps) {
  if (!isOpen) return null;

  const isKr = lang === "KR";
  const defaultTitle = isKr ? "아덴힐 셔틀을 종료하시겠습니까?" : "确定要退出雅顿山班车系统吗？";
  const defaultDesc = isKr
    ? "언제든 다시 접속하여 예약 및 운행 상태를 확인하실 수 있습니다."
    : "您可以随时重新进入以查看班车实时状态。";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/50 dark:bg-black/70 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 space-y-4 break-keep animate-in zoom-in-95 duration-150">
        {/* 상단 아이콘 및 닫기 버튼 */}
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center shadow-xs">
            <LogOut className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 squishy-btn"
            aria-label={isKr ? "닫기" : "关闭"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 본문 텍스트 */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title || defaultTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
            {description || defaultDesc}
          </p>
        </div>

        {/* 2분할 버튼 그룹: [계속 이용하기] | [종료] */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 w-full">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm squishy-btn hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center"
          >
            {isKr ? "계속 이용하기" : "继续使用"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[48px] w-full px-3 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm squishy-btn shadow-md shadow-rose-600/20 transition-all flex items-center justify-center cursor-pointer"
          >
            {isKr ? "종료" : "退出"}
          </button>
        </div>
      </div>
    </div>
  );
}
