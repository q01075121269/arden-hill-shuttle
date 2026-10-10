"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  CheckCircle2,
  Calendar,
  Truck,
  Users,
  ShieldCheck,
  PhoneCall,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { DriverProfile } from "@/components/driver/SafetyCheckModal";
import { EMERGENCY_CONTACTS } from "@/lib/constants";

interface DriverLogSummaryViewProps {
  currentDriver: DriverProfile;
  currentRound: number;
  safetyCheckDone: boolean;
}

interface LogRecord {
  id: string;
  date: string;
  round: number;
  direction: "outbound" | "inbound";
  route: string;
  scheduledTime: string;
  actualDepartTime: string;
  actualArriveTime: string;
  pax: number;
  vehicle: string;
  status: "completed" | "scheduled";
  notes: string;
}

// 1~6회차 시뮬레이션 일지 레코드 데이터
const MOCK_LOG_RECORDS: LogRecord[] = [
  {
    id: "LOG-01",
    date: "2026-10-09",
    round: 1,
    direction: "outbound",
    route: "아덴힐 ➔ 신제주 이마트 ➔ 제주공항",
    scheduledTime: "08:10",
    actualDepartTime: "08:10",
    actualArriveTime: "09:20",
    pax: 5,
    vehicle: "제주 70가 1142 (카니발)",
    status: "completed",
    notes: "골프백 2개 수송, 정시 출발/도착",
  },
  {
    id: "LOG-02",
    date: "2026-10-09",
    round: 1,
    direction: "inbound",
    route: "제주공항 ➔ 신제주 이마트 ➔ 아덴힐",
    scheduledTime: "09:30",
    actualDepartTime: "09:32",
    actualArriveTime: "10:35",
    pax: 3,
    vehicle: "제주 70가 1142 (카니발)",
    status: "completed",
    notes: "공항 3층 5번 게이트 정시 픽업",
  },
  {
    id: "LOG-03",
    date: "2026-10-09",
    round: 2,
    direction: "outbound",
    route: "아덴힐 ➔ 신제주 이마트 ➔ 제주공항",
    scheduledTime: "10:30",
    actualDepartTime: "10:30",
    actualArriveTime: "11:25",
    pax: 6,
    vehicle: "제주 72바 5501 (카운티)",
    status: "completed",
    notes: "유아 동반 가족 안전벨트 확인 완료",
  },
  {
    id: "LOG-04",
    date: "2026-10-09",
    round: 2,
    direction: "inbound",
    route: "제주공항 ➔ 신제주 이마트 ➔ 아덴힐",
    scheduledTime: "11:30",
    actualDepartTime: "11:30",
    actualArriveTime: "12:20",
    pax: 5,
    vehicle: "제주 72바 5501 (카운티)",
    status: "completed",
    notes: "이마트 신제주점 경유 승객 하차",
  },
  {
    id: "LOG-05",
    date: "2026-10-09",
    round: 3,
    direction: "outbound",
    route: "아덴힐 ➔ 신제주 이마트 ➔ 제주공항",
    scheduledTime: "12:30",
    actualDepartTime: "12:30",
    actualArriveTime: "13:20",
    pax: 3,
    vehicle: "제주 70가 1142 (카니발)",
    status: "completed",
    notes: "정상 운행",
  },
  {
    id: "LOG-06",
    date: "2026-10-09",
    round: 3,
    direction: "inbound",
    route: "제주공항 ➔ 신제주 이마트 ➔ 아덴힐",
    scheduledTime: "13:30",
    actualDepartTime: "13:30",
    actualArriveTime: "14:20",
    pax: 3,
    vehicle: "제주 70가 1142 (카니발)",
    status: "completed",
    notes: "정상 운행",
  },
  {
    id: "LOG-07",
    date: "2026-10-09",
    round: 4,
    direction: "outbound",
    route: "아덴힐 ➔ 신제주 이마트 ➔ 제주공항",
    scheduledTime: "15:00",
    actualDepartTime: "-",
    actualArriveTime: "-",
    pax: 5,
    vehicle: "제주 72바 5501 (카운티)",
    status: "scheduled",
    notes: "승객 예약 접수 완료 (출발 대기)",
  },
  {
    id: "LOG-08",
    date: "2026-10-09",
    round: 4,
    direction: "inbound",
    route: "제주공항 ➔ 신제주 이마트 ➔ 아덴힐",
    scheduledTime: "16:20",
    actualDepartTime: "-",
    actualArriveTime: "-",
    pax: 5,
    vehicle: "제주 72바 5501 (카운티)",
    status: "scheduled",
    notes: "공항 픽업 예정",
  },
  {
    id: "LOG-09",
    date: "2026-10-09",
    round: 5,
    direction: "outbound",
    route: "아덴힐 ➔ 신제주 이마트 ➔ 제주공항",
    scheduledTime: "18:20",
    actualDepartTime: "-",
    actualArriveTime: "-",
    pax: 5,
    vehicle: "제주 70가 1142 (카니발)",
    status: "scheduled",
    notes: "야간 운행 예정",
  },
  {
    id: "LOG-10",
    date: "2026-10-09",
    round: 5,
    direction: "inbound",
    route: "제주공항 ➔ 신제주 이마트 ➔ 아덴힐",
    scheduledTime: "19:10",
    actualDepartTime: "-",
    actualArriveTime: "-",
    pax: 4,
    vehicle: "제주 70가 1142 (카니발)",
    status: "scheduled",
    notes: "야간 복귀 운행 예정",
  },
  {
    id: "LOG-11",
    date: "2026-10-09",
    round: 6,
    direction: "outbound",
    route: "아덴힐 ➔ 신제주 이마트 ➔ 제주공항",
    scheduledTime: "20:00",
    actualDepartTime: "-",
    actualArriveTime: "-",
    pax: 2,
    vehicle: "제주 70가 1142 (카니발)",
    status: "scheduled",
    notes: "마지막 회차 예정",
  },
  {
    id: "LOG-12",
    date: "2026-10-09",
    round: 6,
    direction: "inbound",
    route: "제주공항 ➔ 신제주 이마트 ➔ 아덴힐",
    scheduledTime: "21:10",
    actualDepartTime: "-",
    actualArriveTime: "-",
    pax: 2,
    vehicle: "제주 70가 1142 (카니발)",
    status: "scheduled",
    notes: "마지막 공항 복귀 예정",
  },
];

export function DriverLogSummaryView({
  currentDriver,
  currentRound,
  safetyCheckDone,
}: DriverLogSummaryViewProps) {
  // 다차원 필터 상태
  const [periodFilter, setPeriodFilter] = useState<"today" | "yesterday" | "week" | "all">("today");
  const [directionFilter, setDirectionFilter] = useState<"all" | "outbound" | "inbound">("all");
  const [roundFilter, setRoundFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "scheduled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 다차원 필터 적용
  const filteredRecords = useMemo(() => {
    return MOCK_LOG_RECORDS.filter((r) => {
      // 1. 노선 방향 필터
      if (directionFilter !== "all" && r.direction !== directionFilter) return false;
      // 2. 회차 필터
      if (roundFilter !== "all" && r.round !== roundFilter) return false;
      // 3. 상태 필터
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      // 4. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          r.route.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.vehicle.toLowerCase().includes(q) ||
          `${r.round}회차`.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [directionFilter, roundFilter, statusFilter, searchQuery]);

  // 집계 KPI
  const completedCount = useMemo(
    () => MOCK_LOG_RECORDS.filter((r) => r.status === "completed").length,
    []
  );
  const totalRoundsCount = MOCK_LOG_RECORDS.length;
  const totalPax = useMemo(
    () => MOCK_LOG_RECORDS.reduce((sum, r) => sum + r.pax, 0),
    []
  );

  return (
    <div className="space-y-3.5 w-full break-keep animate-in fade-in duration-200">
      {/* 1. 당일 운행 실적 요약 KPI 카드 (4분할) */}
      <section aria-label="운행 실적 KPI 요약" className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
        {/* 누적 수송 인원 */}
        <div className="p-3.5 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>총 탑승객</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
              실시간
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
            {totalPax}
            <span className="text-xs font-normal ml-1 text-slate-500">명</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            금일 예약 총 인원
          </p>
        </div>

        {/* 운행 달성률 */}
        <div className="p-3.5 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>운행 완료</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              진행률
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
            {completedCount}/{totalRoundsCount}
            <span className="text-xs font-normal ml-1 text-slate-500">회</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            오늘 12회차 왕복 배차
          </p>
        </div>

        {/* 정시 운행률 */}
        <div className="p-3.5 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>정시 운행률</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
              우수
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
            100%
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            지연 및 결항 0건
          </p>
        </div>

        {/* 5대 안전점검 상태 */}
        <div className="p-3.5 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>5대 점검</span>
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                safetyCheckDone
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
              }`}
            >
              {safetyCheckDone ? "완료" : "필요"}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5 truncate">
            {safetyCheckDone ? "이상 없음 (양호)" : "미점검 상태"}
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate">
            {currentDriver.name} 서명 완료
          </p>
        </div>
      </section>

      {/* 2. 다차원 검색/분석 필터 패널 */}
      <section aria-label="다차원 운행일지 검색 및 분석 필터" className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
            <Filter className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>운행일지 다차원 필터링</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            검색 결과: <strong className="text-emerald-600 dark:text-emerald-400">{filteredRecords.length}</strong>건
          </span>
        </div>

        {/* 1열: 기간 퀵 필터 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">기간:</span>
          {(["today", "yesterday", "week", "all"] as const).map((period) => {
            const labels = {
              today: "오늘 (2026-10-09)",
              yesterday: "어제",
              week: "최근 7일",
              all: "전체 기간",
            };
            const isSelected = periodFilter === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setPeriodFilter(period)}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap squishy-btn border transition-all ${
                  isSelected
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>

        {/* 2열: 노선 방향 필터 & 운행 상태 필터 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* 노선 방향 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              노선 방향
            </label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">전체 노선 방향</option>
              <option value="outbound">아덴힐 ➔ 공항 (아덴힐발)</option>
              <option value="inbound">공항 ➔ 아덴힐 (공항발)</option>
            </select>
          </div>

          {/* 운행 상태 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              운행 상태
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">전체 상태</option>
              <option value="completed">운행 완료</option>
              <option value="scheduled">운행 예정</option>
            </select>
          </div>
        </div>

        {/* 3열: 1~6회차 퀵 세그먼트 버튼 & 검색창 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">회차:</span>
            <button
              type="button"
              onClick={() => setRoundFilter("all")}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] whitespace-nowrap squishy-btn border ${
                roundFilter === "all"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200"
              }`}
            >
              전체
            </button>
            {[1, 2, 3, 4, 5, 6].map((rnd) => (
              <button
                key={rnd}
                type="button"
                onClick={() => setRoundFilter(rnd)}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] whitespace-nowrap squishy-btn border ${
                  roundFilter === rnd
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200"
                }`}
              >
                {rnd}회차
              </button>
            ))}
          </div>

          {/* 검색어 인풋 */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="운행 구간, 차량, 비고 검색..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* 3. 상세 운행일지 리스트 */}
      <section aria-label="회차별 상세 운행일지" className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 w-full">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
              일일 운행일지 상세 내역
            </h4>
          </div>
        </div>

        <div className="space-y-2.5 w-full">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              조건에 일치하는 운행일지가 없습니다.
            </div>
          ) : (
            filteredRecords.map((r) => {
              const isCompleted = r.status === "completed";
              return (
                <div
                  key={r.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isCompleted
                      ? "bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/80"
                      : "bg-white dark:bg-[#171B22] border-slate-200/60 dark:border-slate-800/60 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shrink-0">
                        {r.round}회차
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {r.direction === "outbound" ? "아덴힐 ➔ 공항" : "공항 ➔ 아덴힐"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0 tabular-nums">
                        {r.scheduledTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                        {r.pax}명
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {isCompleted ? "운행 완료" : "운행 예정"}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                    <span className="truncate">{r.vehicle}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                      비고: {r.notes}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 하단 관리실 연동 안내 및 직통 통화 바 */}
        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="leading-snug">
              관리자 백오피스 종이 운행일지(A4)에 1:1 자동 바인딩 중입니다.
            </span>
          </div>
          <a
            href={`tel:${EMERGENCY_CONTACTS.admin.phone}`}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-700 shrink-0 flex items-center gap-1 squishy-btn shadow-xs"
          >
            <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">관리실 통화</span>
          </a>
        </div>
      </section>
    </div>
  );
}
