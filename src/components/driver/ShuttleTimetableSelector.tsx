"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  CalendarClock,
  Clock,
  Car,
  Bus,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Check,
  Users,
} from "lucide-react";
import { SHUTTLE_TIMETABLE } from "@/lib/constants";
import { ShuttleDirection } from "@/components/driver/TripControlPanel";
import { toggleBoardingCheckAction } from "@/app/actions/driver";

export interface TimetablePassengerItem {
  id: string;
  round: number;
  direction?: "outbound" | "inbound";
  passengerName: string;
  phone: string;
  pickupLocation: string;
  dropoffLocation?: string;
  passengerCount: number;
  status: "pending" | "boarding_completed";
  memo?: string;
}

// 1~6회차 양방향 승객 데이터 (기본 및 로컬 스토리지 연동)
const DEFAULT_PASSENGERS: TimetablePassengerItem[] = [
  // 1회차 아덴힐발 (08:10)
  {
    id: "RES-101",
    round: 1,
    direction: "outbound",
    passengerName: "김민수 (112동)",
    phone: "010-3321-9988",
    pickupLocation: "112동 앞",
    passengerCount: 2,
    status: "pending",
    memo: "골프백 2개 지참",
  },
  {
    id: "RES-102",
    round: 1,
    direction: "outbound",
    passengerName: "박지영 (135동)",
    phone: "010-8877-2233",
    pickupLocation: "135동 앞",
    passengerCount: 3,
    status: "pending",
  },
  {
    id: "RES-103",
    round: 1,
    direction: "outbound",
    passengerName: "Li Na (188동)",
    phone: "010-6644-1122",
    pickupLocation: "188동 앞",
    passengerCount: 1,
    status: "boarding_completed",
  },
  // 1회차 공항발 (09:30)
  {
    id: "RES-104",
    round: 1,
    direction: "inbound",
    passengerName: "왕웨이 (105동)",
    phone: "010-9988-7766",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "105동 앞",
    passengerCount: 2,
    status: "pending",
    memo: "제주항공 7C124편 도착",
  },
  {
    id: "RES-105",
    round: 1,
    direction: "inbound",
    passengerName: "최지훈 (120동)",
    phone: "010-5544-3322",
    pickupLocation: "신제주 이마트 앞",
    dropoffLocation: "120동 앞",
    passengerCount: 1,
    status: "pending",
  },

  // 2회차 아덴힐발 (10:30)
  {
    id: "RES-201",
    round: 2,
    direction: "outbound",
    passengerName: "최원석 (164동)",
    phone: "010-4411-2299",
    pickupLocation: "164동 앞",
    passengerCount: 4,
    status: "pending",
  },
  {
    id: "RES-202",
    round: 2,
    direction: "outbound",
    passengerName: "정유진 (102동)",
    phone: "010-2233-4455",
    pickupLocation: "102동 앞",
    passengerCount: 1,
    status: "pending",
  },
  // 2회차 공항발 (11:30)
  {
    id: "RES-203",
    round: 2,
    direction: "inbound",
    passengerName: "이수현 (142동)",
    phone: "010-1122-3344",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "142동 앞",
    passengerCount: 2,
    status: "pending",
  },

  // 3회차 아덴힐발 (12:30)
  {
    id: "RES-301",
    round: 3,
    direction: "outbound",
    passengerName: "정수진 (156동)",
    phone: "010-7711-3344",
    pickupLocation: "156동 앞",
    passengerCount: 2,
    status: "pending",
  },
  {
    id: "RES-302",
    round: 3,
    direction: "outbound",
    passengerName: "김태형 (120동)",
    phone: "010-5566-7788",
    pickupLocation: "커뮤니티 센터 앞",
    passengerCount: 1,
    status: "pending",
  },
  // 3회차 공항발 (13:30)
  {
    id: "RES-303",
    round: 3,
    direction: "inbound",
    passengerName: "강동현 (170동)",
    phone: "010-8822-4411",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "170동 앞",
    passengerCount: 1,
    status: "pending",
  },

  // 4회차 아덴힐발 (15:00)
  {
    id: "RES-401",
    round: 4,
    direction: "outbound",
    passengerName: "한상우 (108동)",
    phone: "010-9911-3322",
    pickupLocation: "108동 앞",
    passengerCount: 2,
    status: "pending",
  },
  // 4회차 공항발 (16:00)
  {
    id: "RES-403",
    round: 4,
    direction: "inbound",
    passengerName: "배진호 (114동)",
    phone: "010-4455-6677",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "114동 앞",
    passengerCount: 2,
    status: "pending",
  },

  // 5회차 아덴힐발 (16:30)
  {
    id: "RES-501",
    round: 5,
    direction: "outbound",
    passengerName: "송민호 (128동)",
    phone: "010-8899-0011",
    pickupLocation: "128동 앞",
    passengerCount: 3,
    status: "pending",
  },

  // 6회차 아덴힐발 (18:00)
  {
    id: "RES-601",
    round: 6,
    direction: "outbound",
    passengerName: "신동엽 (190동)",
    phone: "010-3344-8899",
    pickupLocation: "190동 앞",
    passengerCount: 2,
    status: "pending",
  },
  // 6회차 공항발 (19:20)
  {
    id: "RES-602",
    round: 6,
    direction: "inbound",
    passengerName: "유재석 (101동)",
    phone: "010-7788-9900",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "101동 앞",
    passengerCount: 2,
    status: "pending",
  },
];

const STORAGE_KEY = "AH_DRIVER_BOARDING_CACHE";

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

  const [expandedRound, setExpandedRound] = useState<number | null>(currentRound);
  const [passengers, setPassengers] = useState<TimetablePassengerItem[]>(DEFAULT_PASSENGERS);
  const [isPending, startTransition] = useTransition();

  // 로컬 스토리지 캐시 동기화
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPassengers(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // currentRound 변경 시 해당 회차 펼치기
  useEffect(() => {
    setExpandedRound(currentRound);
  }, [currentRound]);

  const handleSelectRound = (round: number) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onRoundChange(round);
    setExpandedRound((prev) => (prev === round ? null : round));
  };

  // 승차 완료 토글 핸들러
  const handleToggleBoarding = (item: TimetablePassengerItem) => {
    const nextStatus: "pending" | "boarding_completed" =
      item.status === "pending" ? "boarding_completed" : "pending";

    setPassengers((prev) => {
      const updated = prev.map((p) =>
        p.id === item.id ? { ...p, status: nextStatus } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    if (navigator.onLine) {
      startTransition(async () => {
        await toggleBoardingCheckAction({
          reservationId: item.id,
          currentStatus: item.status,
          passengerCount: item.passengerCount,
        });
      });
    }
  };

  return (
    <section aria-label="정규 셔틀 운행 시간표 및 회차 선택" className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
      {/* 1. 노선 방향 2분할 탭 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-0.5">
          <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200 font-black">
            <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>정규 셔틀 운행 시간표 (터치 시 탑승자 명단 & 승차 확인)</span>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            1~6회차 운행
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

      {/* 2. 1회차~6회차 타임라인 카드 리스트 (터치 시 바로 밑으로 탑승자 명단 & 승차 버튼 인라인 노출) */}
      <div className="space-y-2.5">
        {timetableList.map((item) => {
          const isSelected = currentRound === item.round;
          const isExpanded = expandedRound === item.round;
          const isCounty = item.defaultVehicle === "county";

          // 해당 회차의 승객 목록
          const roundPaxList = passengers.filter(
            (p) => p.round === item.round && (!p.direction || p.direction === direction)
          );
          const totalPaxCount = roundPaxList.reduce((acc, p) => acc + p.passengerCount, 0);
          const boardedPaxCount = roundPaxList
            .filter((p) => p.status === "boarding_completed")
            .reduce((acc, p) => acc + p.passengerCount, 0);

          return (
            <div
              key={item.round}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? "bg-white dark:bg-[#151D2A] border-emerald-500 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                  : isSelected
                  ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* 회차 카드 헤더 (시간 터치 시 바로 밑으로 탑승자 명단 토글) */}
              <button
                type="button"
                onClick={() => handleSelectRound(item.round)}
                className="w-full p-3 sm:p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer squishy-btn"
              >
                {/* 좌측: 회차 배지 및 출발/도착 시간 */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.round}회차
                    </span>

                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1 tabular-nums">
                      <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.time} 출발</span>
                    </span>

                    <span className="text-xs text-slate-400 hidden sm:inline">
                      ({item.routeKr})
                    </span>
                  </div>

                  {/* 3단계 상세 타임라인 */}
                  <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300 truncate">
                    <span>이마트 {item.emartTime}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>도착 {item.destTime}</span>
                  </div>
                </div>

                {/* 우측: 예약 승객 현황 & 배차 배지 & 펼치기 화살표 */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block tabular-nums">
                      {totalPaxCount > 0 ? (
                        <>탑승 {boardedPaxCount}/{totalPaxCount}명</>
                      ) : (
                        <span className="text-slate-400 font-normal">예약 0명</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isCounty ? "카운티 29인승" : "카니발 리무진"}
                    </span>
                  </div>

                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {/* =========================================================================
                  [핵심] 해당 시간 바로 밑으로 인라인 노출되는 탑승자 명단 & 원터치 승차 버튼
                  ========================================================================= */}
              {isExpanded && (
                <div className="p-3 sm:p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{item.round}회차 탑승자 명단 ({roundPaxList.length}개 팀)</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      승차 완료: {boardedPaxCount} / {totalPaxCount}명
                    </span>
                  </div>

                  {roundPaxList.length === 0 ? (
                    <div className="py-6 text-center text-xs font-bold text-slate-400 bg-white dark:bg-[#1E222B] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      해당 회차에 예약된 탑승객이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roundPaxList.map((pax) => {
                        const isBoarded = pax.status === "boarding_completed";

                        return (
                          <div
                            key={pax.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              isBoarded
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80"
                                : "bg-white dark:bg-[#1E222B] border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                            }`}
                          >
                            {/* 탑승객 기본 정보 */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black shrink-0">
                                  {pax.pickupLocation}
                                </span>
                                <span
                                  className={`font-black text-sm ${
                                    isBoarded
                                      ? "text-slate-400 line-through"
                                      : "text-slate-900 dark:text-slate-100"
                                  }`}
                                >
                                  {pax.passengerName}
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  ({pax.passengerCount}명)
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                {pax.dropoffLocation && (
                                  <span className="truncate">하차: {pax.dropoffLocation}</span>
                                )}
                                <a
                                  href={`tel:${pax.phone}`}
                                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px] shrink-0"
                                >
                                  <Phone className="h-3 w-3" />
                                  <span>{pax.phone}</span>
                                </a>
                              </div>

                              {pax.memo && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md inline-block">
                                  💬 {pax.memo}
                                </p>
                              )}
                            </div>

                            {/* 원터치 [승차 완료] 토글 버튼 */}
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleToggleBoarding(pax)}
                              className={`h-10 px-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 squishy-btn border transition-all shrink-0 cursor-pointer ${
                                isBoarded
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20"
                                  : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              <Check className={`h-4 w-4 ${isBoarded ? "text-white" : "text-emerald-600"}`} />
                              <span>{isBoarded ? "승차 완료" : "승차"}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
