"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  WifiOff,
  Search,
  Check,
  Building,
  Navigation,
} from "lucide-react";
import { toggleBoardingCheckAction } from "@/app/actions/driver";
import { ShuttleDirection } from "@/components/driver/TripControlPanel";

export interface DriverPassengerItem {
  id: string;
  round: number;
  direction?: "outbound" | "inbound";
  passengerName: string;
  phone: string;
  pickupLocation: string;
  dropoffLocation?: string; // 공항발 노선용 하차 희망 동수
  passengerCount: number;
  status: "pending" | "boarding_completed";
  memo?: string;
}

// 1회차 ~ 6회차 양방향 승객 시뮬레이션 데이터
const DEFAULT_PASSENGERS: DriverPassengerItem[] = [
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
    memo: "유아 카시트 동반",
  },
  {
    id: "RES-202",
    round: 2,
    direction: "outbound",
    passengerName: "송미경 (142동)",
    phone: "010-2233-1188",
    pickupLocation: "142동 앞",
    passengerCount: 2,
    status: "pending",
  },
  // 2회차 공항발 (11:30)
  {
    id: "RES-203",
    round: 2,
    direction: "inbound",
    passengerName: "장미란 (115동)",
    phone: "010-3399-8811",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "115동 앞",
    passengerCount: 3,
    status: "pending",
    memo: "대한항공 KE1205편 도착",
  },
  {
    id: "RES-204",
    round: 2,
    direction: "inbound",
    passengerName: "박성민 (182동)",
    phone: "010-4455-8899",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "182동 앞",
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
  {
    id: "RES-304",
    round: 3,
    direction: "inbound",
    passengerName: "오수빈 (131동)",
    phone: "010-3311-6622",
    pickupLocation: "신제주 이마트 앞",
    dropoffLocation: "131동 앞",
    passengerCount: 2,
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
  {
    id: "RES-402",
    round: 4,
    direction: "outbound",
    passengerName: "윤서연 (173동)",
    phone: "010-3344-5566",
    pickupLocation: "173동 앞",
    passengerCount: 3,
    status: "pending",
  },
  // 4회차 공항발 (16:20)
  {
    id: "RES-403",
    round: 4,
    direction: "inbound",
    passengerName: "유재석 (122동)",
    phone: "010-6611-9922",
    pickupLocation: "신제주 이마트 앞",
    dropoffLocation: "122동 앞",
    passengerCount: 2,
    status: "pending",
  },
  {
    id: "RES-404",
    round: 4,
    direction: "inbound",
    passengerName: "정혜원 (144동)",
    phone: "010-5522-3311",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "144동 앞",
    passengerCount: 3,
    status: "pending",
  },

  // 5회차 아덴힐발 (18:20)
  {
    id: "RES-501",
    round: 5,
    direction: "outbound",
    passengerName: "조현우 (190동)",
    phone: "010-4488-2211",
    pickupLocation: "커뮤니티 센터 앞",
    passengerCount: 3,
    status: "pending",
  },
  {
    id: "RES-502",
    round: 5,
    direction: "outbound",
    passengerName: "임지훈 (115동)",
    phone: "010-7799-3322",
    pickupLocation: "115동 앞",
    passengerCount: 2,
    status: "pending",
  },
  // 5회차 공항발 (19:10)
  {
    id: "RES-503",
    round: 5,
    direction: "inbound",
    passengerName: "배수지 (103동)",
    phone: "010-7733-1199",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "103동 앞",
    passengerCount: 2,
    status: "pending",
  },
  {
    id: "RES-504",
    round: 5,
    direction: "inbound",
    passengerName: "노현우 (165동)",
    phone: "010-9933-2211",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "165동 앞",
    passengerCount: 2,
    status: "pending",
  },

  // 6회차 아덴힐발 (20:00)
  {
    id: "RES-601",
    round: 6,
    direction: "outbound",
    passengerName: "김도현 (102동)",
    phone: "010-8811-2244",
    pickupLocation: "102동 앞",
    passengerCount: 2,
    status: "pending",
    memo: "야간 탑승",
  },
  // 6회차 공항발 (21:10)
  {
    id: "RES-602",
    round: 6,
    direction: "inbound",
    passengerName: "박서준 (119동)",
    phone: "010-9922-3355",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "119동 앞",
    passengerCount: 2,
    status: "pending",
    memo: "진에어 LJ501편 도착",
  },
];

interface PassengerBoardingListProps {
  currentRound: number;
  direction?: ShuttleDirection;
}

export function PassengerBoardingList({
  currentRound,
  direction = "outbound",
}: PassengerBoardingListProps) {
  const [isPending, startTransition] = useTransition();
  const [passengers, setPassengers] = useState<DriverPassengerItem[]>(DEFAULT_PASSENGERS);
  const [isOffline, setIsOffline] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");

  const STORAGE_KEY = `AH_DRIVER_PASSENGERS_CACHE_v5`;

  // 오프라인 로컬 캐시 복원 및 네트워크 감지
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) setIsOffline(true);

    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setPassengers(JSON.parse(cached));
      } else {
        setPassengers(DEFAULT_PASSENGERS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PASSENGERS));
      }
    } catch {
      setPassengers(DEFAULT_PASSENGERS);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 승차 완료 토글 핸들러
  const handleToggleBoarding = (item: DriverPassengerItem) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40]);
    }

    const nextStatus: "pending" | "boarding_completed" =
      item.status === "pending" ? "boarding_completed" : "pending";

    setPassengers((prev) => {
      const updated = prev.map((p) =>
        p.id === item.id ? { ...p, status: nextStatus } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Local cache save error:", err);
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

  // 현재 회차 및 노선 방향 기준 승객 필터링
  const roundPassengers = useMemo(() => {
    return passengers.filter(
      (p) =>
        p.round === currentRound &&
        (!p.direction || p.direction === direction)
    );
  }, [passengers, currentRound, direction]);

  // 검색어 필터링
  const filteredList = useMemo(() => {
    if (!filterSearch.trim()) return roundPassengers;
    const q = filterSearch.toLowerCase().trim();
    return roundPassengers.filter(
      (p) =>
        p.passengerName.toLowerCase().includes(q) ||
        p.pickupLocation.toLowerCase().includes(q) ||
        (p.dropoffLocation && p.dropoffLocation.toLowerCase().includes(q)) ||
        p.phone.includes(q)
    );
  }, [roundPassengers, filterSearch]);

  // 통계 계산
  const totalCount = useMemo(
    () => roundPassengers.reduce((sum, p) => sum + p.passengerCount, 0),
    [roundPassengers]
  );
  const boardedCount = useMemo(
    () =>
      roundPassengers
        .filter((p) => p.status === "boarding_completed")
        .reduce((sum, p) => sum + p.passengerCount, 0),
    [roundPassengers]
  );

  // [동별 승차 요약 바] - 동별 자동 그룹화(Group by) 계산
  // 아덴힐 출발 노선: 승차 위치(동수) 기준 집계
  // 공항 출발 노선: 하차 희망 위치(동수) 기준 집계
  const locationSummaryParts = useMemo(() => {
    if (roundPassengers.length === 0) return [];
    const grouped: Record<string, number> = {};

    roundPassengers.forEach((p) => {
      const locKey =
        direction === "outbound"
          ? p.pickupLocation
          : p.dropoffLocation || p.pickupLocation;
      grouped[locKey] = (grouped[locKey] || 0) + p.passengerCount;
    });

    return Object.entries(grouped).map(([loc, count]) => ({
      location: loc,
      count,
    }));
  }, [roundPassengers, direction]);

  const isOutbound = direction === "outbound";

  return (
    <section aria-label="선택된 회차의 탑승자 명단 & 승차 체크" className="space-y-3">
      {/* =========================================================================
          [동별 승차 요약 바] - 최상단 고대비 강조 카드 (필수 반영)
          예: "📍 탑승 위치 요약: 102동 앞 2명 | A 103동 1명 | 커뮤니티 센터 2명 (총 5명 탑승 예정)"
          ========================================================================= */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white dark:bg-[#1E222B] dark:border-2 dark:border-emerald-500 shadow-md space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-700/80 pb-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-400">
            <span className="text-base">📍</span>
            <span>
              {isOutbound
                ? "탑승 위치 요약 (동별 동선 안내)"
                : "하차 희망 위치 요약 (아덴힐 도착)"}
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            총 {totalCount}명 {isOutbound ? "탑승 예정" : "하차 예정"}
          </span>
        </div>

        {locationSummaryParts.length === 0 ? (
          <div className="text-xs text-slate-400 font-bold py-1">
            현재 회차에 예약된 승객이 없습니다.
          </div>
        ) : (
          <div className="text-xs sm:text-sm font-bold text-white dark:text-slate-100 leading-relaxed break-keep">
            <span className="text-emerald-400 dark:text-emerald-300 font-black">
              {isOutbound ? "📍 탑승 위치 요약: " : "📍 하차 위치 요약: "}
            </span>
            {locationSummaryParts.map((item, idx) => (
              <span key={item.location}>
                <span className="text-white font-extrabold">{item.location}</span>{" "}
                <span className="text-emerald-300 font-black">{item.count}명</span>
                {idx < locationSummaryParts.length - 1 && (
                  <span className="text-slate-500 mx-1.5 font-normal">|</span>
                )}
              </span>
            ))}
            <span className="text-slate-300 dark:text-slate-400 font-bold ml-1.5">
              (총 {totalCount}명 {isOutbound ? "탑승 예정" : "하차 예정"})
            </span>
          </div>
        )}
      </div>

      {/* 2. 회차 헤더 및 검색 인풋 */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {currentRound}회차 승객 명단
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                {isOutbound ? "아덴힐 ➔ 공항" : "공항 ➔ 아덴힐"}
              </span>
              {isOffline && (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 text-xs font-bold flex items-center gap-1 animate-pulse">
                  <WifiOff className="h-3 w-3" />
                  오프라인
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              승차 체크 현황:{" "}
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                {boardedCount}명 / 총 {totalCount}명 완료
              </span>
            </p>
          </div>

          {/* 검색창 */}
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="승객명 또는 동수 검색..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 3. 승객 카드 목록 (성함, 인원수, 위치, 대형 [승차 완료] 토글 버튼) */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#1E222B] border border-dashed border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs sm:text-sm font-bold">
            해당 회차 및 노선에 예약된 탑승객이 없습니다.
          </div>
        ) : (
          filteredList.map((item) => {
            const isBoarded = item.status === "boarding_completed";

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isBoarded
                    ? "bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800/70 shadow-xs"
                    : "bg-white dark:bg-[#1E222B] border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-400"
                }`}
              >
                {/* 승객 정보 (성함, 인원수, 위치, 연락처) */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-black text-base sm:text-lg tracking-tight ${
                        isBoarded
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {item.passengerName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                        isBoarded
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      {item.passengerCount}명 탑승
                    </span>
                    {item.memo && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold border border-amber-200/60 dark:border-amber-800/60">
                        {item.memo}
                      </span>
                    )}
                  </div>

                  {/* 승차 / 하차 위치 안내 */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {isOutbound ? (
                        <span>
                          승차 위치: <strong className="text-emerald-700 dark:text-emerald-300">{item.pickupLocation}</strong>
                        </span>
                      ) : (
                        <span>
                          승차: {item.pickupLocation}{" "}
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">
                            ➔ 하차: {item.dropoffLocation || "아덴힐"}
                          </span>
                        </span>
                      )}
                    </div>

                    <a
                      href={`tel:${item.phone}`}
                      className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 font-bold"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.phone}</span>
                    </a>
                  </div>
                </div>

                {/* 우측 대형 녹색 [승차 완료] 토글 버튼 (48px 이상) */}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggleBoarding(item)}
                  className={`w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 squishy-btn border transition-all shrink-0 ${
                    isBoarded
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      isBoarded ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <span>{isBoarded ? "승차 완료됨" : "승차 완료"}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
