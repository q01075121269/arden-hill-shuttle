"use client";

import React from "react";
import {
  CalendarClock,
  Clock,
  Car,
  Bus,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { SHUTTLE_TIMETABLE } from "@/lib/constants";
import { ShuttleDirection } from "@/components/driver/TripControlPanel";

interface ShuttleTimetableSelectorProps {
  direction: ShuttleDirection;
  onDirectionChange: (dir: ShuttleDirection) => void;
  currentRound: number;
  onRoundChange: (round: number) => void;
}

export function ShuttleTimetableSelector({
  direction,
  onDirectionChange,
  currentRound,
  onRoundChange,
}: ShuttleTimetableSelectorProps) {
  const isOutbound = direction === "outbound";
  const timetableList = isOutbound
    ? SHUTTLE_TIMETABLE.outbound
    : SHUTTLE_TIMETABLE.inbound;

  const handleSelectRound = (round: number) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onRoundChange(round);
  };

  return (
    <section aria-label="정규 셔틀 운행 시간표 및 회차 선택" className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
      {/* 1. 노선 방향 2분할 탭 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-0.5">
          <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200 font-black">
            <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>정규 셔틀 운행 시간표 & 회차 선택</span>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            1~6회차 정규 배차
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full">
          <button
            type="button"
            onClick={() => onDirectionChange("outbound")}
            className={`min-h-[42px] py-1.5 px-3 rounded-xl text-center font-black text-xs sm:text-sm squishy-btn transition-all ${
              isOutbound
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            아덴힐 ➔ 공항
          </button>
          <button
            type="button"
            onClick={() => onDirectionChange("inbound")}
            className={`min-h-[42px] py-1.5 px-3 rounded-xl text-center font-black text-xs sm:text-sm squishy-btn transition-all ${
              !isOutbound
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            공항 ➔ 아덴힐
          </button>
        </div>
      </div>

      {/* 2. 1회차~6회차 타임라인 카드 리스트 */}
      <div className="space-y-2">
        {timetableList.map((item) => {
          const isActive = currentRound === item.round;
          const isCounty = item.defaultVehicle === "county";

          return (
            <button
              key={item.round}
              type="button"
              onClick={() => handleSelectRound(item.round)}
              className={`w-full p-3 sm:p-3.5 rounded-2xl text-left border transition-all squishy-btn flex items-center justify-between gap-3 ${
                isActive
                  ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/25 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
              }`}
            >
              {/* 좌측: 회차 배지 및 타임라인 */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {item.round}회차
                  </span>

                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                    {item.routeKr}
                  </span>
                </div>

                {/* 3단계 상세 타임라인 */}
                <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200 truncate">
                  <span className={isActive ? "text-emerald-700 dark:text-emerald-400 font-black" : ""}>
                    출발 {item.time}
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>이마트 {item.emartTime}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>도착 {item.destTime}</span>
                </div>
              </div>

              {/* 우측: 배차 차종 배지 & 활성 인디케이터 */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  {isCounty ? (
                    <>
                      <Bus className="h-3 w-3 text-amber-600" />
                      <span>카운티 29인승</span>
                    </>
                  ) : (
                    <>
                      <Car className="h-3 w-3 text-sky-600" />
                      <span>카니발 리무진</span>
                    </>
                  )}
                </span>

                {isActive && (
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    선택됨
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
