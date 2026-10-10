"use client";

import React, { useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  Flag,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";
import { updateShuttleTripStatusAction, TripStage } from "@/app/actions/driver";
import { ShuttleDirection } from "@/components/driver/TripControlPanel";

interface QuickTripReportPanelProps {
  vehicleNumber: string;
  driverName: string;
  direction: ShuttleDirection;
  currentRound: number;
  onStatusUpdated: (statusText: string) => void;
}

export function QuickTripReportPanel({
  vehicleNumber,
  driverName,
  direction,
  currentRound,
  onStatusUpdated,
}: QuickTripReportPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStage, setCurrentStage] = useState<TripStage>("READY_DEPART");

  const isOutbound = direction === "outbound";

  // 4단계 구간 정의 (방향에 따라 자동 순서 반전 및 레이블 매핑)
  const stages: { stage: TripStage; step: number; label: string; sub: string }[] = isOutbound
    ? [
        {
          stage: "READY_DEPART",
          step: 1,
          label: "출발 준비",
          sub: "승차 대기",
        },
        {
          stage: "DEPART_RESORT",
          step: 2,
          label: "아덴힐 출발",
          sub: "리조트 발",
        },
        {
          stage: "ARRIVE_EMART",
          step: 3,
          label: "이마트(대체마트)",
          sub: "신제주점 경유",
        },
        {
          stage: "ARRIVE_AIRPORT",
          step: 4,
          label: "공항 도착",
          sub: "3층 5번 게이트",
        },
      ]
    : [
        {
          stage: "READY_DEPART",
          step: 1,
          label: "출발 준비",
          sub: "승차 대기",
        },
        {
          stage: "DEPART_AIRPORT",
          step: 2,
          label: "공항 출발",
          sub: "공항 발",
        },
        {
          stage: "ARRIVE_EMART",
          step: 3,
          label: "이마트(대체마트)",
          sub: "신제주점 경유",
        },
        {
          stage: "ARRIVE_RESORT",
          step: 4,
          label: "아덴힐 도착",
          sub: "리조트 도착",
        },
      ];

  const handleStageSelect = (stage: TripStage) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40]);
    }
    setCurrentStage(stage);
    startTransition(async () => {
      const res = await updateShuttleTripStatusAction({
        round: currentRound,
        stage,
        vehicleNumber,
        isEmergencyAlert: false,
        direction,
      });
      if (res.success) {
        onStatusUpdated(res.data.statusText);
      }
    });
  };

  return (
    <section aria-label="원터치 운행 구간 보고" className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between text-xs px-0.5">
        <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          원터치 운행 구간 보고 ({isOutbound ? "아덴힐 ➔ 공항" : "공항 ➔ 아덴힐"})
        </span>
        {isPending ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse text-[11px]">
            관제 실시간 동기화 중...
          </span>
        ) : (
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            터치 시 즉시 전송
          </span>
        )}
      </div>

      {/* 4단계 직관적 버튼 그리드 (모바일 4열 컴팩트 가로 핏) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stages.map((s) => {
          const isCurrent = currentStage === s.stage;
          return (
            <button
              key={s.stage}
              type="button"
              disabled={isPending}
              onClick={() => handleStageSelect(s.stage)}
              className={`min-h-[56px] p-2.5 rounded-2xl flex flex-col justify-center squishy-btn border transition-all text-left relative ${
                isCurrent
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30"
                  : "bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isCurrent
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {s.step}단계
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-black bg-white text-emerald-800 px-1.5 py-0.5 rounded-md shadow-xs">
                    진행중
                  </span>
                )}
              </div>

              <div className="font-black text-xs sm:text-sm tracking-tight mt-1 leading-tight truncate">
                {s.label}
              </div>
              <div
                className={`text-[10px] sm:text-[11px] font-medium leading-none mt-0.5 truncate ${
                  isCurrent ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {s.sub}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
