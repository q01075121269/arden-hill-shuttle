"use client";

import React, { useState, useTransition } from "react";
import {
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  MapPin,
  CalendarClock,
} from "lucide-react";
import { updateShuttleTripStatusAction, TripStage } from "@/app/actions/driver";
import { SHUTTLE_TIMETABLE } from "@/lib/constants";

export type ShuttleDirection = "outbound" | "inbound";

interface TripControlPanelProps {
  vehicleNumber: string;
  driverName: string;
  direction: ShuttleDirection;
  onDirectionChange: (dir: ShuttleDirection) => void;
  currentRound: number;
  onRoundChange: (round: number) => void;
  onStatusUpdated: (statusText: string) => void;
}

export function TripControlPanel({
  vehicleNumber,
  driverName,
  direction,
  onDirectionChange,
  currentRound,
  onRoundChange,
  onStatusUpdated,
}: TripControlPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStage, setCurrentStage] = useState<TripStage>("READY_DEPART");

  const isOutbound = direction === "outbound";
  const timetableList = isOutbound
    ? SHUTTLE_TIMETABLE.outbound
    : SHUTTLE_TIMETABLE.inbound;

  const currentSchedule =
    timetableList.find((item) => item.round === currentRound) ||
    timetableList[0];

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
          label: "이마트 (대체마트)",
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
          label: "이마트 (대체마트)",
          sub: "신제주점 경유",
        },
        {
          stage: "ARRIVE_RESORT",
          step: 4,
          label: "아덴힐 도착",
          sub: "리조트 도착",
        },
      ];

  // 구간 상태 변경 핸들러
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

  // 방향 전환 시 구간 초기화
  const handleToggleDirection = (newDir: ShuttleDirection) => {
    onDirectionChange(newDir);
    setCurrentStage("READY_DEPART");
  };

  return (
    <div className="space-y-3">
      {/* 1. 노선 방향 전환 탭 & 정규 시간표 회차 선택 바 */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        {/* 방향 전환 2분할 탭 */}
        <div className="flex items-center justify-between gap-2">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full">
            <button
              type="button"
              onClick={() => handleToggleDirection("outbound")}
              className={`min-h-[40px] py-1.5 px-2 rounded-xl text-center font-black text-xs sm:text-sm squishy-btn transition-all ${
                isOutbound
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              아덴힐 ➔ 공항 방면
            </button>
            <button
              type="button"
              onClick={() => handleToggleDirection("inbound")}
              className={`min-h-[40px] py-1.5 px-2 rounded-xl text-center font-black text-xs sm:text-sm squishy-btn transition-all ${
                !isOutbound
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              공항 ➔ 아덴힐 방면
            </button>
          </div>
        </div>

        {/* 1~5회차 정규 운행 시간표 선택 버튼 바 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-0.5">
            <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200 font-bold">
              <CalendarClock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>정규 운행 회차 및 시간 선택</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums">
              선택: {currentRound}회차 ({currentSchedule.time} 출발)
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {timetableList.map((item) => {
              const isSelected = currentRound === item.round;
              return (
                <button
                  key={item.round}
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && navigator.vibrate) {
                      navigator.vibrate(30);
                    }
                    onRoundChange(item.round);
                  }}
                  className={`py-2 px-1 rounded-xl text-center squishy-btn border transition-all ${
                    isSelected
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="text-[11px] font-bold leading-none">
                    {item.round}회
                  </div>
                  <div className="text-xs font-black tabular-nums mt-1 leading-none">
                    {item.time}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 회차 타임라인 상세 안내 */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
            <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>운행 일정:</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold tabular-nums truncate text-[11px] sm:text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">
              출발 {currentSchedule.time}
            </span>
            <span>➔</span>
            <span>이마트 {currentSchedule.emartTime}</span>
            <span>➔</span>
            <span>도착 {currentSchedule.destTime}</span>
          </div>
        </div>
      </div>

      {/* 2. 컴팩트 원터치 운행 구간 보고 바 (슬림 직관 4단계 버튼) */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            원터치 운행 구간 보고
          </span>
          {isPending && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse text-[11px]">
              관제 동기화 중...
            </span>
          )}
        </div>

        {/* 4단계 버튼 (그리드 2x2 또는 4열 가로 핏) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stages.map((s) => {
            const isCurrent = currentStage === s.stage;
            return (
              <button
                key={s.stage}
                type="button"
                disabled={isPending}
                onClick={() => handleStageSelect(s.stage)}
                className={`min-h-[54px] p-2.5 rounded-2xl flex flex-col justify-center squishy-btn border transition-all text-left relative ${
                  isCurrent
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30"
                    : "bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    STEP {s.step}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-black bg-white text-emerald-800 px-1.5 py-0.5 rounded-md">
                      현재
                    </span>
                  )}
                </div>

                <div className="font-black text-xs sm:text-sm tracking-tight mt-1 leading-tight truncate">
                  {s.label}
                </div>
                <div
                  className={`text-[11px] font-medium leading-none mt-0.5 truncate ${
                    isCurrent
                      ? "text-white/80"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {s.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
