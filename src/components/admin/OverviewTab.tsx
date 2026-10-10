"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Car,
  Bus,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  CreditCard,
  Store,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Printer,
  ChevronDown,
  ChevronUp,
  PieChart,
  BarChart3,
  Flame,
  Building2,
  RefreshCw,
  MapPin,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Check,
  RotateCcw,
  Eye,
  X,
  FileText,
} from "lucide-react";
import { Language } from "@/types";
import {
  getControlTowerDataAction,
  type ControlTowerData,
  type OverviewRoundItem,
  type OverviewPassengerItem,
  type InfographicAnalyticsData,
} from "@/app/actions/admin-overview";
import {
  getSuggestionsAction,
  toggleSuggestionStatusAction,
  type SuggestionItem,
} from "@/app/actions/feedback";
import {
  DynamicInfographicReport,
  type AnalyticsPeriod,
  type AnalyticsFocus,
} from "@/components/admin/DynamicInfographicReport";

interface OverviewTabProps {
  lang: Language;
  onOpenNoticeModal: () => void;
  onNavigateTab: (tabId: "overview" | "operations" | "customers" | "master") => void;
}

export function OverviewTab({
  lang,
  onNavigateTab,
}: OverviewTabProps) {
  const isKr = lang === "KR";

  // 1. 일자 컨트롤러 상태 (기본: 오늘 2026-10-09)
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-09");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 2. 실시간 검색 필터 (동호수 또는 승객명)
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 3. 노선 필터: 전체(all) / 하행(outbound) / 상행(inbound)
  const [directionFilter, setDirectionFilter] = useState<"all" | "outbound" | "inbound">("all");

  // 4. 인포그래픽 기간 선택 (월간 / 연간) & 분석 기준 선택 (종합 / 시간대별 / 정류장·구역별)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>("monthly");
  const [analyticsFocus, setAnalyticsFocus] = useState<AnalyticsFocus>("comprehensive");

  // 5. 회차 카드 펼침 상태
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({});

  // 6. 관제탑 메인 데이터
  const [data, setData] = useState<ControlTowerData | null>(null);

  // 7. 입주민 건의 및 애로사항 상태
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionItem | null>(null);

  // 8. 인쇄 모드 ("analytics" | "suggestions" | null)
  const [printMode, setPrintMode] = useState<"analytics" | "suggestions">("analytics");

  // 데이터 로드
  const loadData = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await getControlTowerDataAction(dateStr);
      if (res.success && res.data) {
        setData(res.data);
        const initialExpanded: Record<string, boolean> = {};
        res.data.rounds.forEach((r) => {
          initialExpanded[r.id] = true;
        });
        setExpandedRounds(initialExpanded);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 건의사항 목록 로드
  const loadSuggestions = async () => {
    const res = await getSuggestionsAction();
    if (res.success && res.data) {
      setSuggestions(res.data);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadSuggestions();
  }, []);

  // 날짜 전환 헬퍼 (◀ 어제, 오늘, 내일 ▶)
  const handleShiftDate = (offsetDays: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offsetDays);
    const newDateStr = current.toISOString().slice(0, 10);
    setSelectedDate(newDateStr);
  };

  const handleGoToday = () => {
    setSelectedDate("2026-10-09");
  };

  // 회차 토글
  const toggleRoundExpand = (roundId: string) => {
    setExpandedRounds((prev) => ({
      ...prev,
      [roundId]: !prev[roundId],
    }));
  };

  // 건의사항 처리 상태 토글
  const handleToggleSuggestionStatus = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = await toggleSuggestionStatusAction(id);
    if (res.success && res.data) {
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? res.data : s))
      );
      if (selectedSuggestion?.id === id) {
        setSelectedSuggestion(res.data);
      }
    }
  };

  // 검색어 일치 여부
  const isMatchQuery = (passenger: OverviewPassengerItem) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.trim().toLowerCase();
    return (
      passenger.passengerName.toLowerCase().includes(q) ||
      passenger.dongNumber.toLowerCase().includes(q) ||
      passenger.pickupLocation.toLowerCase().includes(q) ||
      passenger.dropoffLocation.toLowerCase().includes(q) ||
      passenger.phone.includes(q)
    );
  };

  // 필터링된 회차
  const displayedRounds = useMemo(() => {
    if (!data) return [];
    return data.rounds.filter((round) => {
      if (directionFilter === "all") return true;
      return round.direction === directionFilter;
    });
  }, [data, directionFilter]);

  // 검색어 일치 시 자동 확장
  useEffect(() => {
    if (!searchQuery.trim() || !data) return;
    const q = searchQuery.trim().toLowerCase();
    const newExpanded: Record<string, boolean> = { ...expandedRounds };
    let hasMatch = false;

    data.rounds.forEach((r) => {
      const roundMatches = r.passengers.some(
        (p) =>
          p.passengerName.toLowerCase().includes(q) ||
          p.dongNumber.toLowerCase().includes(q) ||
          p.pickupLocation.toLowerCase().includes(q)
      );
      if (roundMatches) {
        newExpanded[r.id] = true;
        hasMatch = true;
      }
    });

    if (hasMatch) {
      setExpandedRounds(newExpanded);
    }
  }, [searchQuery, data]);

  // 인쇄 실행
  const handlePrint = (mode: "analytics" | "suggestions") => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const currentAnalytics: InfographicAnalyticsData | null = useMemo(() => {
    if (!data) return null;
    return data.analytics[analyticsPeriod];
  }, [data, analyticsPeriod]);

  return (
    <div className="space-y-6">
      {/* =========================================================================
          인쇄 전용 스타일 태그 (@media print)
      ========================================================================= */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 0mm !important;
            }
            html, body {
              background: #ffffff !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              max-width: 210mm !important;
              max-height: 297mm !important;
              overflow: hidden !important;
            }
            .print-report-container {
              background-color: #ffffff !important;
              color: #0f172a !important;
            }
            .print-report-container .keep-print-color,
            .keep-print-color {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            nav, header, aside, .no-print {
              display: none !important;
            }
            main {
              padding: 0 !important;
              margin: 0 !important;
              max-width: none !important;
              width: 100% !important;
            }
            .grid {
              display: block !important;
            }
            .xl\\:col-span-5 {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            ${
              printMode === "analytics"
                ? `
                  .print-only-analytics {
                    display: block !important;
                    width: 210mm !important;
                    max-width: 210mm !important;
                    height: 297mm !important;
                    max-height: 297mm !important;
                    box-sizing: border-box !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                  .print-only-suggestions {
                    display: none !important;
                  }
                `
                : `
                  .print-only-suggestions {
                    display: block !important;
                    width: 210mm !important;
                    max-width: 210mm !important;
                    margin: 0 auto !important;
                    padding: 10mm !important;
                    box-sizing: border-box !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                  .print-only-analytics {
                    display: none !important;
                  }
                `
            }
          }
        `,
      }} />

      {/* =========================================================================
          1. 상단 기사 현황 슬림 배지 영역 (슬림화 & 컴팩트화)
      ========================================================================= */}
      <section className="no-print w-full bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isKr ? "실시간 차량 라이브 트래킹" : "车队实时在途定位"}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              {data?.stopoverName || "이마트 (정상 운행)"}
            </span>
          </div>

          {/* 슬림 배지 (카니발 & 카운티) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* [카니발 | 제주 70가 1142 | 김철수 기사님 | 이마트 이동 중] */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-emerald-300/70 dark:border-emerald-700/60 shadow-xs hover:border-emerald-500 transition-colors">
              <div className="h-6 w-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black">
                <Car className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                <span className="text-emerald-600 dark:text-emerald-400 font-black">카니발</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>제주 70가 1142</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>김철수 기사님</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black animate-pulse">
                  이마트 이동 중
                </span>
              </div>
            </div>

            {/* [카운티 | 제주 72바 5501 | 박영진 기사님 | 공항 5번 게이트 대기] */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-amber-300/70 dark:border-amber-700/60 shadow-xs hover:border-amber-500 transition-colors">
              <div className="h-6 w-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black">
                <Bus className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                <span className="text-amber-600 dark:text-amber-400 font-black">카운티</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>제주 72바 5501</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>박영진 기사님</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black">
                  공항 5번 게이트 대기
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. 상단 일정 컨트롤러 & 핵심 운행/미납 KPI 바
      ========================================================================= */}
      <section className="no-print bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* (A) 일자 전환 툴바: [◀ 어제] | [ 오늘 ] | [ 내일 ▶] + <input type="date"> */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1 squishy-btn"
              title="어제 일자 조회"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{isKr ? "어제" : "前一天"}</span>
            </button>
            <button
              type="button"
              onClick={handleGoToday}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all squishy-btn ${
                selectedDate === "2026-10-09"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isKr ? "오늘" : "今天"}
            </button>
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1 squishy-btn"
              title="내일 일자 조회"
            >
              <span>{isKr ? "내일" : "后一天"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 네이티브 날짜 선택기 바인딩 */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="bg-transparent text-xs font-black text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
            />
          </div>

          {isLoading && (
            <RefreshCw className="h-4 w-4 text-emerald-500 animate-spin" />
          )}
        </div>

        {/* (B) 핵심 KPI 요약 배지 바 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* 총 운행 현황 */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200">
            <div className="h-7 w-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                {isKr ? "총 운행 현황" : "班次运行进度"}
              </div>
              <div className="text-xs font-black">
                {isKr ? (
                  <>
                    총 <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{data?.kpi.totalRounds || 11}개</span> 회차 중{" "}
                    <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{data?.kpi.completedRounds || 4}회차</span> 완료{" "}
                    <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">({data?.kpi.operationRate || 36}%)</span>
                  </>
                ) : (
                  <>共 11 班中已完 4 班 (运行率 36%)</>
                )}
              </div>
            </div>
          </div>

          {/* 총 탑승 인원 */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200">
            <div className="h-7 w-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                {isKr ? "총 탑승 인원" : "总乘车人数"}
              </div>
              <div className="text-xs font-black">
                {isKr ? (
                  <>
                    총 <span className="font-extrabold text-blue-600 dark:text-blue-400">{data?.kpi.totalPassengers || 54}명</span>{" "}
                    <span className="text-[11px] text-slate-500 font-bold">
                      (완료 {data?.kpi.boardedPassengers || 34}명 / 대기 {data?.kpi.waitingPassengers || 20}명)
                    </span>
                  </>
                ) : (
                  <>总 54人 (乘完 34 / 待乘 20)</>
                )}
              </div>
            </div>
          </div>

          {/* 미납 요금 모니터 ➔ 클릭 시 [탭 3 수납 장부]로 이동 */}
          <button
            type="button"
            onClick={() => onNavigateTab("customers")}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/70 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all squishy-btn cursor-pointer group text-left"
            title="고객 관리 및 수납 장부로 이동"
          >
            <div className="h-7 w-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <span>{isKr ? "미납 요금 모니터" : "未结账款监控"}</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-xs font-black">
                {isKr ? (
                  <>
                    미납 요금{" "}
                    <span className="text-rose-600 dark:text-rose-400 font-extrabold font-mono">
                      ₩{new Intl.NumberFormat("ko-KR").format(data?.kpi.unpaidAmount || 45000)}
                    </span>{" "}
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                      ({data?.kpi.unpaidCount || 9}건 대기)
                    </span>
                  </>
                ) : (
                  <>未结 ₩45,000 (9笔)</>
                )}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* =========================================================================
          메인 바디 분할 뷰: (좌측) 일일 운행 계획 vs (우측) 인포그래픽 통계 & 주민 건의 창구
      ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            3. 메인 좌측 (7컬럼): [일일 운행 계획] 뷰 정돈 & 3단계 타임라인
        ========================================================================= */}
        <div className="xl:col-span-7 space-y-4 no-print">
          {/* 좌측 상단 헤더 & 컨트롤 */}
          <div className="bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {/* 타이틀 명칭 간소화: "일일 운행 계획" */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isKr ? "일일 운행 계획" : "日间运行计划"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {isKr
                    ? `${selectedDate} 기준 정류장별 도착 예정 시간 및 승객 승하차 명단`
                    : `${selectedDate} 站点预估到站时间与乘降人员明细`}
                </p>
              </div>

              {/* 노선 필터 버튼 (호버 시 글씨 꺼짐 버그 원천 해결: 고대비 클래스 적용) */}
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDirectionFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors squishy-btn ${
                    directionFilter === "all"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isKr ? "전체 (11개)" : "全部"}
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter("outbound")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors squishy-btn ${
                    directionFilter === "outbound"
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isKr ? "아덴힐 ➔ 공항 (6회)" : "去程 (6班)"}
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter("inbound")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors squishy-btn ${
                    directionFilter === "inbound"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isKr ? "공항 ➔ 아덴힐 (5회)" : "回程 (5班)"}
                </button>
              </div>
            </div>

            {/* 실시간 인라인 검색 필터 */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={isKr ? "동수(예: '102동', '112동') 또는 승객 성함으로 실시간 검색..." : "输入楼栋号(如 '102栋')或乘客姓名即时高亮..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 회차 타임라인 카드 목록 */}
          <div className="space-y-3">
            {displayedRounds.length === 0 ? (
              <div className="bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs font-bold">
                선택한 조건에 일치하는 회차가 없습니다.
              </div>
            ) : (
              displayedRounds.map((round) => {
                const isExpanded = !!expandedRounds[round.id];
                const isOutbound = round.direction === "outbound";
                const isCarnival = round.allocatedVehicleType === "carnival";

                const hasMatchingPassenger =
                  Boolean(searchQuery.trim()) &&
                  round.passengers.some((p) => isMatchQuery(p));

                let statusBadgeStyle = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
                if (round.status === "completed") {
                  statusBadgeStyle = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
                } else if (round.status === "in_transit") {
                  statusBadgeStyle = "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 ring-2 ring-blue-400/40";
                } else if (round.status === "waiting") {
                  statusBadgeStyle = "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
                } else if (round.status === "cancelled") {
                  statusBadgeStyle = "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
                }

                return (
                  <div
                    key={round.id}
                    className={`rounded-3xl bg-white dark:bg-[#151D2A] border transition-all duration-200 overflow-hidden shadow-xs ${
                      hasMatchingPassenger
                        ? "border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/30"
                        : "border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40"
                    }`}
                  >
                    {/* 회차 카드 헤더 */}
                    <div
                      onClick={() => toggleRoundExpand(round.id)}
                      className="p-4 sm:p-5 flex flex-col justify-between gap-3 cursor-pointer select-none bg-slate-50/40 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                              isOutbound
                                ? "bg-emerald-600 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            {round.roundNumber}회
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                                {round.directionLabel}
                              </span>
                              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                                {round.timeText} 출발
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                              <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                {isCarnival ? (
                                  <Car className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Bus className="h-3.5 w-3.5 text-amber-600" />
                                )}
                                <span>{isCarnival ? "카니발" : "카운티"} ({round.vehiclePlate})</span>
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              <span>{round.driverName}</span>
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              <span>
                                탑승 {round.boardedPax}명 / 예약 {round.totalPax}명
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span
                            className={`text-xs font-black px-3 py-1 rounded-full border shadow-xs flex items-center gap-1.5 ${statusBadgeStyle}`}
                          >
                            {round.status === "in_transit" && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                            )}
                            <span>{round.statusText}</span>
                          </span>

                          <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* (3) 정류장별(경유지) 도착 예정 시간 3단계 타임라인 배너 */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          {round.timeline.map((step, idx) => (
                            <React.Fragment key={idx}>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700">
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {step.stopName}
                                </span>
                                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black text-[11px]">
                                  [{step.timeText} {step.statusLabel}]
                                </span>
                              </span>
                              {idx < round.timeline.length - 1 && (
                                <span className="text-slate-400 font-bold">➔</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 회차별 승객 승·하차 인라인 테이블 */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#151D2A]">
                        {round.passengers.length === 0 ? (
                          <div className="py-6 text-center text-xs font-bold text-slate-400">
                            {isKr ? "해당 회차에 예약된 승객이 없습니다 (빈차 운행 또는 운행 완료)." : "本班次暂无预约乘客。"}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold text-[11px] uppercase tracking-wider">
                                  <th className="py-2.5 px-3">승객 성함</th>
                                  <th className="py-2.5 px-3">인원</th>
                                  <th className="py-2.5 px-3">승차 위치 (동수)</th>
                                  <th className="py-2.5 px-3">하차 희망 위치</th>
                                  <th className="py-2.5 px-3 text-center">승차 체크</th>
                                  <th className="py-2.5 px-3 text-center">수납</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-800 dark:text-slate-200">
                                {round.passengers.map((p) => {
                                  const isHighlight = isMatchQuery(p);
                                  return (
                                    <tr
                                      key={p.id}
                                      className={`transition-colors ${
                                        isHighlight
                                          ? "bg-amber-100/60 dark:bg-amber-950/40 font-bold"
                                          : "hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                                      }`}
                                    >
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                            {p.passengerName}
                                          </span>
                                          {isHighlight && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-black">
                                              매칭
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          {p.phone}
                                        </div>
                                      </td>
                                      <td className="py-3 px-3 font-bold">
                                        {p.passengerCount}명
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                                          <Building2 className="h-3 w-3 shrink-0" />
                                          <span>{p.pickupLocation}</span>
                                        </span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                                          <Store className="h-3 w-3 shrink-0 text-slate-400" />
                                          <span>{p.dropoffLocation}</span>
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-center">
                                        {p.boardedStatus === "boarded" ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                            ✓ 승차 완료
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                            ⏳ 탑승 대기
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-center">
                                        {p.paymentStatus === "paid" ? (
                                          <span className="text-[10px] font-bold text-slate-500">
                                            수납완료
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                                            미납
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            4. 메인 우측 (5컬럼): [다조건 동적 필터 & 인포그래픽 리포트 엔진] & [주민 건의 창구]
        ========================================================================= */}
        <div className="xl:col-span-5 space-y-6">
          {/* =========================================================================
              4-A. 조건별 동적 필터 툴바 (기간 & 분석 기준 세그먼트 버튼)
          ========================================================================= */}
          <div className="no-print bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#00A896]" />
                <span>{isKr ? "동적 인포그래픽 분석 조건 필터" : "动态信息图多条件筛选"}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {isKr ? "실시간 축 동적 전환" : "实时动态轴切换"}
              </span>
            </div>

            {/* (1) 기간 선택: [ 월간(당월 누적) ] | [ 연간(12개월) ] */}
            <div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>{isKr ? "1. 분석 기간" : "1. 分析周期"}</span>
                <span className="text-[#00A896] font-bold">
                  {analyticsPeriod === "monthly" ? "당월 누적" : "2026 연간"}
                </span>
              </div>
              <div className="inline-flex w-full rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod("monthly")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all squishy-btn ${
                    analyticsPeriod === "monthly"
                      ? "bg-[#00A896] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isKr ? "월간(당월 누적)" : "月度(当月累计)"}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod("yearly")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all squishy-btn ${
                    analyticsPeriod === "yearly"
                      ? "bg-[#00A896] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isKr ? "연간(12개월)" : "年度(12个月)"}
                </button>
              </div>
            </div>

            {/* (2) 분석 기준 선택: [ 종합 분석 ] | [ 시간대별 집중도 ] | [ 정류장·구역별 분석 ] */}
            <div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>{isKr ? "2. 분석 기준 축" : "2. 分析维度"}</span>
                <span className="text-[#FF8C69] font-bold">
                  {analyticsFocus === "comprehensive"
                    ? "종합 수송"
                    : analyticsFocus === "hourly"
                    ? "시간대 피크"
                    : "정류장/거주동"}
                </span>
              </div>
              <div className="inline-flex w-full rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAnalyticsFocus("comprehensive")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all squishy-btn ${
                    analyticsFocus === "comprehensive"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isKr ? "종합 분석" : "综合分析"}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsFocus("hourly")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all squishy-btn ${
                    analyticsFocus === "hourly"
                      ? "bg-[#FF8C69] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isKr ? "시간대별 집중도" : "分时段集中度"}
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsFocus("stations")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all squishy-btn ${
                    analyticsFocus === "stations"
                      ? "bg-[#F59E0B] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isKr ? "정류장·구역별 분석" : "站点·区域分析"}
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              4-B. 서울연구원 스타일 동적 A4 인포그래픽 리포트 엔진
          ========================================================================= */}
          <div className="print-only-analytics">
            <DynamicInfographicReport
              period={analyticsPeriod}
              focus={analyticsFocus}
              data={data}
              selectedDate={selectedDate}
              lang={lang}
              onPrint={() => handlePrint("analytics")}
            />
          </div>

          {/* =========================================================================
              4-B. [주민 건의 및 애로사항 종합] 카드 신설 (신규 핵심 기능)
          ========================================================================= */}
          <div className="bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 print-only-suggestions">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-xs">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {isKr ? "주민 건의 및 애로사항 종합 창구" : "住户意见与建议综合处理"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {isKr ? "승객 모바일 웹에서 실시간 등록된 건의사항 내역" : "乘客移动端实时提交的反馈"}
                  </p>
                </div>
              </div>

              {/* [📄 건의사항 내역 인쇄 / PDF 저장] 버튼 */}
              <button
                type="button"
                onClick={() => handlePrint("suggestions")}
                className="no-print self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 squishy-btn cursor-pointer transition-colors"
                title="관리단 회의 보고용 A4 건의사항 출력"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{isKr ? "📄 건의사항 인쇄 / PDF" : "📄 打印建议清单"}</span>
              </button>
            </div>

            {/* 건의사항 리스트 */}
            <div className="space-y-2.5">
              {suggestions.length === 0 ? (
                <div className="py-6 text-center text-xs font-bold text-slate-400">
                  {isKr ? "접수된 주민 건의사항이 없습니다." : "暂无已提交的住户反馈。"}
                </div>
              ) : (
                suggestions.map((item) => {
                  const isResolved = item.status === "resolved";
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSuggestion(item)}
                      className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 hover:border-purple-400/50 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">
                            {item.dongNumber}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                            {item.passengerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.createdAt}
                          </span>
                        </div>

                        {/* 처리 상태 토글 버튼 */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleSuggestionStatus(item.id, e)}
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                            isResolved
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          }`}
                        >
                          {isResolved ? "✓ 확인 완료" : "⏳ 접수 대기"}
                        </button>
                      </div>

                      {/* 건의 내용 요약 */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>

                      {item.adminMemo && (
                        <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                          <span className="text-emerald-600 font-bold">관리 메모:</span>
                          <span className="truncate">{item.adminMemo}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          건의사항 상세 팝업 모달
      ========================================================================= */}
      {selectedSuggestion && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#151D2A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setSelectedSuggestion(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {selectedSuggestion.dongNumber} {selectedSuggestion.passengerName} 님의 건의사항
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  접수일시: {selectedSuggestion.createdAt} {selectedSuggestion.contact && `| 연락처: ${selectedSuggestion.contact}`}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {selectedSuggestion.content}
            </div>

            {selectedSuggestion.adminMemo && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-bold">관리 처리 메모:</span> {selectedSuggestion.adminMemo}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleToggleSuggestionStatus(selectedSuggestion.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all squishy-btn ${
                  selectedSuggestion.status === "resolved"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    : "bg-emerald-600 text-white shadow-xs"
                }`}
              >
                {selectedSuggestion.status === "resolved" ? "접수 대기 상태로 변경" : "확인 완료 처리하기"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
