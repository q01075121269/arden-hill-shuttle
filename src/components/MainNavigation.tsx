"use client";

import React from "react";
import { Clock, MapPin, ReceiptText } from "lucide-react";
import { Language } from "@/types";
import { I18N } from "@/lib/constants";

export type TabType = "schedule" | "tracking" | "history";

interface MainNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  lang: Language;
}

export function MainNavigation({ activeTab, onTabChange, lang }: MainNavigationProps) {
  const t = I18N[lang];

  const navItems = [
    {
      id: "schedule" as TabType,
      label: t.tabs.schedule, // 운행 시간표
      icon: Clock,
    },
    {
      id: "tracking" as TabType,
      label: t.tabs.tracking, // 실시간 위치
      icon: MapPin,
    },
    {
      id: "history" as TabType,
      label: t.tabs.history, // 요금 검색
      icon: ReceiptText,
    },
  ];

  return (
    <nav className="w-full bg-slate-50 dark:bg-[#111318] border-b border-slate-200/80 dark:border-slate-800 transition-colors box-border">
      <div className="max-w-md mx-auto px-4 py-2">
        {/* 모바일 3등분 그리드, 말줄임표 박멸 트랙 */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`group flex items-center justify-center gap-1.5 min-h-[48px] py-2 px-1.5 rounded-xl text-center font-bold text-sm squishy-btn transition-all duration-200 ${
                  isActive
                    ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400 scale-105"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                />
                <span className="whitespace-nowrap tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
