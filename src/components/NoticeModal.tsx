"use client";

import React from "react";
import { AlertTriangle, Bell, X, ShieldAlert } from "lucide-react";
import { Notice, Language } from "@/types";
import { I18N } from "@/lib/constants";

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: Notice | null;
  lang: Language;
}

export function NoticeModal({ isOpen, onClose, notice, lang }: NoticeModalProps) {
  if (!isOpen || !notice) return null;

  const isKr = lang === "KR";
  const t = I18N[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            {notice.isEmergency ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                <ShieldAlert className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <Bell className="h-5 w-5" />
              </div>
            )}
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                {notice.isEmergency
                  ? isKr
                    ? "긴급 공지사항"
                    : "紧急通告"
                  : isKr
                  ? "리조트 안내사항"
                  : "度假村通知"}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {t.noticeModal.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 squishy-btn"
            aria-label={isKr ? "닫기" : "关闭"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 모달 본문 - 한국어 내용 / 중국어 내용 위아래 동시 표기 구조 */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 공지 제목 */}
          <div className="space-y-1 pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
              {isKr ? notice.titleKr : notice.titleCn}
            </h4>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {isKr ? notice.titleCn : notice.titleKr}
            </p>
          </div>

          {/* 공지 본문 내용 - 한국어 섹션 */}
          <div className="rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 p-4 space-y-1.5 border border-slate-200/60 dark:border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>{isKr ? "한국어 안내" : "韩语通知 (KR)"}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-medium">
              {notice.contentKr}
            </p>
          </div>

          {/* 공지 본문 내용 - 중국어 섹션 */}
          <div className="rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 p-4 space-y-1.5 border border-slate-200/60 dark:border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
              <span>{isKr ? "중국어 안내" : "中文说明 (CN)"}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-medium">
              {notice.contentCn}
            </p>
          </div>

          {/* 긴급 안내 플래그 알림 (소프트 코랄 로즈) */}
          {notice.isEmergency && (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-3.5 border border-rose-200/60 dark:border-rose-800/60 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-semibold">
                {isKr
                  ? "운행 상황 및 도로 사정에 따라 배차 일정이 일부 변동될 수 있습니다."
                  : "因路况及天气等原因，班车运行日程可能会有临时微调。"}
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 버튼 */}
        <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/70 dark:border-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-sm squishy-btn shadow-sm hover:opacity-95"
          >
            {t.noticeModal.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
