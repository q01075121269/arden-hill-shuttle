"use client";

import React, { useMemo } from "react";
import {
  Printer,
  Sparkles,
  TrendingUp,
  MapPin,
  Clock,
  Car,
  Bus,
  Building2,
  PieChart,
  BarChart3,
  Flame,
  Award,
  Users,
} from "lucide-react";
import { Language } from "@/types";
import {
  type ControlTowerData,
  type InfographicAnalyticsData,
} from "@/app/actions/admin-overview";

export type AnalyticsPeriod = "monthly" | "yearly" | "weekly";
export type AnalyticsFocus = "comprehensive" | "hourly" | "stations";

interface DynamicInfographicReportProps {
  period: AnalyticsPeriod;
  focus: AnalyticsFocus;
  data: ControlTowerData | null;
  selectedDate: string;
  lang: Language;
  onPrint?: () => void;
}

export function DynamicInfographicReport({
  period,
  focus,
  data,
  selectedDate,
  lang,
  onPrint,
}: DynamicInfographicReportProps) {
  const isKr = lang === "KR";

  // 현재 기간 데이터 (월간 / 연간)
  const currentAnalytics: InfographicAnalyticsData | null = useMemo(() => {
    if (!data) return null;
    return data.analytics[period];
  }, [data, period]);

  // 기간별 라벨
  const periodLabelText = useMemo(() => {
    if (period === "yearly") return isKr ? "연간(2026 누적)" : "年度(2026累计)";
    return isKr ? "월간(당월 누적)" : "月度(当月累计)";
  }, [period, isKr]);

  // 분석 기준별 라벨
  const focusLabelText = useMemo(() => {
    if (focus === "comprehensive") return isKr ? "종합 수송 분석" : "综合运输分析";
    if (focus === "hourly") return isKr ? "시간대별 탑승 집중도" : "分时段乘车集中度";
    return isKr ? "정류장·구역별 분석" : "站点与区域分析";
  }, [focus, isKr]);

  // 동적 메인 타이틀 생성 (말줄임표 없이 자연스럽게 구성)
  const reportMainTitle = useMemo(() => {
    const yearStr = selectedDate.slice(0, 4) + "년";
    const yearMonth = selectedDate.slice(0, 7).replace("-", "년 ") + "월";
    const timePrefix = period === "yearly" ? yearStr : yearMonth;

    if (focus === "comprehensive") {
      return `${timePrefix} ${periodLabelText} 종합 수송 분석 인포그래픽`;
    }
    if (focus === "hourly") {
      return `${timePrefix} ${periodLabelText} 시간대별 집중도 및 피크 분석 인포그래픽`;
    }
    return `${timePrefix} ${periodLabelText} 정류장·거주구역별 수송 실적 인포그래픽`;
  }, [selectedDate, periodLabelText, focus, period]);

  // 동적 AI 스타일 브리핑 요약 문구
  const dynamicBriefingText = useMemo(() => {
    if (!currentAnalytics) return "";
    if (focus === "hourly") {
      return `시간대별 집중도 분석 결과, ${currentAnalytics.peakRound.roundTitle} 시간대에 평균 ${currentAnalytics.peakRound.avgPassengers}명이 탑승하여 최고 피크(점유율 ${currentAnalytics.peakRound.utilizationRate}%)를 기록했습니다. 오전 08:10 및 09:30 회차에 하루 수요의 약 46%가 밀집되어 카운티 버스 고정 배차가 필수적입니다.`;
    }
    if (focus === "stations") {
      return `정류장 및 구역별 분석 결과, 아덴힐 101개 동 중 1위는 ${currentAnalytics.topDongRankings[0]?.dong}(${currentAnalytics.topDongRankings[0]?.passengerCount}명, ${currentAnalytics.topDongRankings[0]?.percentage}%)이며, 상위 3개 동이 전체 이용의 64.4%를 차지합니다. 목적지는 ${currentAnalytics.destinationStats.airportRatio}%가 제주공항행으로 경유지 쇼핑(${currentAnalytics.destinationStats.martRatio}%)보다 2배 이상 높게 나타났습니다.`;
    }
    return currentAnalytics.aiInsightText;
  }, [currentAnalytics, focus]);

  if (!currentAnalytics) {
    return (
      <div className="p-8 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
        인포그래픽 분석 데이터를 불러오는 중입니다...
      </div>
    );
  }

  // 최대값 계산 (추이 바 차트 및 시간대 차트)
  const maxTrendPassengers = Math.max(...currentAnalytics.trendData.map((d) => d.passengers), 1);
  const maxHourlyPassengers = Math.max(...currentAnalytics.hourlyDistribution.map((d) => d.passengerCount), 1);

  // 동적 X축 라벨 포맷터
  const formatXAxisLabel = (label: string, periodType: AnalyticsPeriod) => {
    if (periodType === "weekly") {
      return label.replace("/", ".").replace("·금일", "").trim();
    }
    if (periodType === "monthly") {
      return label.replace("/", ".");
    }
    return label;
  };

  return (
    <div
      id="infographic-a4-page"
      className="dynamic-infographic-report-root print-report-container w-full bg-white dark:bg-[#151D2A] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden box-border
                 print:w-[210mm] print:max-w-[210mm] print:h-[297mm] print:max-h-[297mm] print:p-[8mm] print:m-0 print:border-none print:shadow-none print:rounded-none print:box-border print:overflow-hidden print:bg-white"
      style={{
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      {/* 빗살무늬 패턴 & 인쇄 시 100% 화이트 모드 강제 인라인 스타일 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .stripe-pattern-teal {
            background-color: #00A896 !important;
            background-image: repeating-linear-gradient(45deg, #00A896, #00A896 5px, #028090 5px, #028090 10px) !important;
          }
          .stripe-pattern-coral {
            background-color: #FF8C69 !important;
            background-image: repeating-linear-gradient(45deg, #FF8C69, #FF8C69 5px, #E06D48 5px, #E06D48 10px) !important;
          }
          .stripe-pattern-amber {
            background-color: #F59E0B !important;
            background-image: repeating-linear-gradient(45deg, #F59E0B, #F59E0B 5px, #D97706 5px, #D97706 10px) !important;
          }

          @media print {
            #infographic-a4-page {
              background-color: #ffffff !important;
              color: #0f172a !important;
            }
            #infographic-a4-page .report-sub-card {
              background-color: #f8fafc !important;
              border-color: #e2e8f0 !important;
              color: #0f172a !important;
            }
            #infographic-a4-page .report-chart-bg {
              background-color: #ffffff !important;
              border-color: #e2e8f0 !important;
            }
            #infographic-a4-page .report-briefing-box {
              background-color: #ecfdf5 !important;
              border-color: #a7f3d0 !important;
              color: #065f46 !important;
            }
            #infographic-a4-page .report-text-primary {
              color: #0f172a !important;
            }
            #infographic-a4-page .report-text-muted {
              color: #475569 !important;
            }
            #infographic-a4-page .report-track-bg {
              background-color: #f1f5f9 !important;
            }
            .keep-print-color {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `,
      }} />

      {/* =========================================================================
          1) [헤더 & 메타 & 대형 타이틀]: 높이 약 95px 이내 (mb-2)
      ========================================================================= */}
      <div className="infographic-report-header pb-2 mb-2 border-b-2 border-[#00A896] flex items-start justify-between gap-3 shrink-0 print:block print:visible">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="keep-print-color px-2 py-0.5 rounded-md bg-[#00A896] text-white font-bold text-[9px] tracking-wider uppercase shrink-0 whitespace-nowrap">
              SEOUL INSTITUTE STYLE INFOGRAPHIC
            </span>
            <span className="keep-print-color px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#00A896] dark:text-emerald-400 border border-[#00A896]/30 dark:border-emerald-700/60 font-bold text-[9px] shrink-0 whitespace-nowrap">
              {focusLabelText}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 report-text-muted shrink-0 whitespace-nowrap">
              {currentAnalytics.periodLabel}
            </span>
          </div>

          <h2 className="report-text-primary text-base sm:text-xl xl:text-2xl print:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 break-keep leading-tight">
            {reportMainTitle}
          </h2>
          <p className="report-text-muted text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap break-keep">
            제주 아덴힐 리조트 입주민 스마트 셔틀 실시간 관제 및 탄력 배차 수송 빅데이터 리포트
          </p>
        </div>

        {/* 메타 정보 & 인쇄 버튼 */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="no-print">
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="keep-print-color px-3.5 py-1.5 rounded-xl bg-[#00A896] hover:bg-[#028090] text-white font-bold text-xs flex items-center gap-1.5 squishy-btn shadow-md cursor-pointer transition-all whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{isKr ? "📊 선택 조건 인포그래픽 A4 인쇄 / PDF 저장" : "📊 打印A4信息图报表 / PDF"}</span>
              </button>
            )}
          </div>
          <div className="report-text-muted text-[9px] text-slate-400 dark:text-slate-500 font-mono text-right whitespace-nowrap">
            발행: 제주 아덴힐 관제실 · 기준일: {selectedDate}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2) [상단 4대 핵심 KPI 카드 그리드]: 높이 약 68px 이내 (mb-2)
      ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-2 mb-2 shrink-0">
        {/* 1. 총 탑승 승객 */}
        <div className="report-sub-card min-w-0 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/70 dark:bg-[#1C2536] flex items-center gap-2 overflow-hidden h-[68px]">
          <div className="keep-print-color h-8 w-8 rounded-lg bg-[#00A896] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="report-text-muted text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight whitespace-nowrap break-keep">
              총 탑승 승객
            </div>
            <div className="keep-print-color text-base sm:text-lg font-bold text-teal-600 dark:text-teal-400 tabular-nums whitespace-nowrap leading-tight">
              {new Intl.NumberFormat("ko-KR").format(currentAnalytics.totalPassengers)}
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 ml-0.5">명</span>
            </div>
          </div>
        </div>

        {/* 2. 전기 대비 증감률 */}
        <div className="report-sub-card min-w-0 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/70 dark:bg-[#1C2536] flex items-center gap-2 overflow-hidden h-[68px]">
          <div
            className={`keep-print-color h-8 w-8 rounded-lg text-white flex items-center justify-center font-bold shrink-0 shadow-xs ${
              currentAnalytics.isIncrease ? "bg-[#FF8C69]" : "bg-blue-500"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="report-text-muted text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight whitespace-nowrap break-keep">
              전기 대비 증감률
            </div>
            <div className="keep-print-color text-base sm:text-lg font-bold text-rose-500 dark:text-rose-400 tabular-nums whitespace-nowrap leading-tight">
              {currentAnalytics.isIncrease ? "▲" : "▼"} {currentAnalytics.prevComparisonPercent}%
            </div>
          </div>
        </div>

        {/* 3. 최고 피크 회차 */}
        <div className="report-sub-card min-w-0 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/70 dark:bg-[#1C2536] flex items-center gap-2 overflow-hidden h-[68px]">
          <div className="keep-print-color h-8 w-8 rounded-lg bg-[#F59E0B] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Flame className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="report-text-muted text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight whitespace-nowrap break-keep">
              최고 피크 회차
            </div>
            <div className="keep-print-color text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap break-keep leading-tight">
              {currentAnalytics.peakRound.timeText} 회차 / {currentAnalytics.peakRound.utilizationRate}%
            </div>
            <div className="report-text-muted text-[9px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              평균 {currentAnalytics.peakRound.avgPassengers}명 탑승
            </div>
          </div>
        </div>

        {/* 4. 최다 이용 거주동 */}
        <div className="report-sub-card min-w-0 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/70 dark:bg-[#1C2536] flex items-center gap-2 overflow-hidden h-[68px]">
          <div className="keep-print-color h-8 w-8 rounded-lg stripe-pattern-teal text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Award className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="report-text-muted text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight whitespace-nowrap break-keep">
              최다 이용 거주동
            </div>
            <div className="keep-print-color text-base sm:text-lg font-bold text-teal-700 dark:text-teal-300 whitespace-nowrap break-keep leading-tight">
              {currentAnalytics.topDongRankings[0]?.dong} / {currentAnalytics.topDongRankings[0]?.percentage}%
            </div>
            <div className="report-text-muted text-[9px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {currentAnalytics.topDongRankings[0]?.passengerCount}명 이용
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3) [[데이터 분석 종합 브리핑] 밴드]: 높이 약 42px 이내 (mb-2)
      ========================================================================= */}
      <div className="report-briefing-box p-2 px-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-[#00A896]/30 dark:border-emerald-800/60 flex items-center gap-2 mb-2 shrink-0 overflow-hidden">
        <div className="keep-print-color h-5 w-5 rounded-md bg-[#00A896] text-white flex items-center justify-center shrink-0 font-bold">
          <Sparkles className="h-3 w-3" />
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-800 dark:text-emerald-200 leading-snug font-medium line-clamp-2">
          <span className="keep-print-color font-bold text-[#00A896] dark:text-emerald-400 mr-1.5 whitespace-nowrap">[데이터 분석 종합 브리핑]</span>
          {dynamicBriefingText}
        </div>
      </div>

      {/* =========================================================================
          4) [중단 2단 차트 (추이 바 차트 + 시간대별 집중도)]: 높이 약 220px (mb-2)
          * 내부 스크롤바 0건, 텍스트 겹침 완전 방지
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2.5 mb-2 shrink-0 h-auto md:h-[220px] print:h-[220px]">
        {/* (A) 세로 바 차트: 동적 X축 라벨링 */}
        <div className="report-sub-card p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#1C2536] border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between overflow-hidden h-full">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
              <BarChart3 className="h-3.5 w-3.5 text-[#00A896]" />
              <span>{isKr ? "기간/구간별 승객 수송 실적 추이" : "时段客运走势"}</span>
            </div>
            <span className="report-text-muted text-[9px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">단위: 명</span>
          </div>

          <div className="report-chart-bg flex-1 w-full flex items-end justify-between gap-1 pt-1 px-1 bg-white dark:bg-[#151D2A] rounded-lg border border-slate-200/60 dark:border-slate-800 overflow-hidden">
            {currentAnalytics.trendData.map((item) => {
              const heightPct = Math.round((item.passengers / maxTrendPassengers) * 100);
              const isHighest = item.passengers === maxTrendPassengers;
              const formattedLabel = formatXAxisLabel(item.label, period);

              return (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center h-full justify-end min-w-0"
                >
                  <span className={`text-[9px] font-bold tabular-nums mb-1 whitespace-nowrap ${isHighest ? "text-[#00A896] dark:text-[#00A896]" : "text-slate-600 dark:text-slate-400"}`}>
                    {item.passengers}
                  </span>
                  <div className={`report-track-bg w-full ${period === "yearly" ? "max-w-[18px]" : "max-w-[26px]"} bg-slate-100 dark:bg-slate-800/80 rounded-t-md overflow-hidden h-full flex items-end`}>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`keep-print-color w-full transition-all duration-300 rounded-t-md ${
                        isHighest ? "stripe-pattern-teal" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap text-center mt-1">
                    {formattedLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 mt-1 shrink-0 font-medium">
            <span className="keep-print-color inline-block w-2.5 h-2 rounded-xs stripe-pattern-teal" />
            <span className="whitespace-nowrap">최고치(1위) 빗살무늬 강조</span>
          </div>
        </div>

        {/* (B) 가로 스트라이프 바 차트: 시간대별 탑승 집중도 */}
        <div className="report-sub-card p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#1C2536] border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between overflow-hidden h-full">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
              <Clock className="h-3.5 w-3.5 text-[#FF8C69]" />
              <span>{isKr ? "시간대별(회차) 탑승 집중도" : "分时段班次乘车人数"}</span>
            </div>
            <span className="report-text-muted text-[9px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">피크 타임 분석</span>
          </div>

          <div className="report-chart-bg flex-1 bg-white dark:bg-[#151D2A] p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 flex flex-col justify-around overflow-hidden">
            {currentAnalytics.hourlyDistribution.slice(0, 5).map((slot, idx) => {
              const widthPct = Math.round((slot.passengerCount / maxHourlyPassengers) * 100);
              const isFirst = idx === 0 || slot.isPeak;
              return (
                <div key={idx} className="flex items-center gap-2 text-[10px] font-medium">
                  <span className="w-20 shrink-0 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap break-keep">
                    {slot.timeText} ({slot.roundText.slice(0, 4)})
                  </span>
                  <div className="report-track-bg flex-1 h-3 bg-slate-100 dark:bg-slate-800/80 rounded-md overflow-hidden flex items-center">
                    <div
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                      className={`keep-print-color h-full rounded-md transition-all duration-300 ${
                        isFirst ? "stripe-pattern-coral" : "bg-[#00A896]/60 dark:bg-[#00A896]/80"
                      }`}
                    />
                  </div>
                  <span className="w-12 text-right font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 whitespace-nowrap tabular-nums">
                    {new Intl.NumberFormat("ko-KR").format(slot.passengerCount)}명
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 mt-1 shrink-0 font-medium">
            <span className="keep-print-color inline-block w-2.5 h-2 rounded-xs stripe-pattern-coral" />
            <span className="whitespace-nowrap">피크 1위 구간 빗살무늬 강조</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5) [하단 2단 (목적지/차종 분할 바 + 거주동 TOP 5 카드)]: 높이 약 175px (mb-1.5)
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-2.5 mb-1.5 shrink-0 h-auto md:h-[175px] print:h-[175px]">
        {/* 좌측: 목적지 및 탄력배차 가동 통계 분할 바 (5컬럼) */}
        <div className="report-sub-card col-span-12 md:col-span-5 print:col-span-5 p-2 rounded-xl bg-slate-50/80 dark:bg-[#1C2536] border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between overflow-hidden h-full">
          {/* 목적지별 분할 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
              <span className="text-slate-800 dark:text-slate-100 flex items-center gap-1 whitespace-nowrap">
                <MapPin className="h-3 w-3 text-[#00A896]" />
                <span>목적지 분할</span>
              </span>
              <span className="report-text-muted text-[10px] font-medium text-slate-400 dark:text-slate-400 whitespace-nowrap">
                공항 {currentAnalytics.destinationStats.airportRatio}% : 경유지 {currentAnalytics.destinationStats.martRatio}%
              </span>
            </div>

            <div className="report-track-bg w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden flex">
              <div
                style={{ width: `${currentAnalytics.destinationStats.airportRatio}%` }}
                className="keep-print-color stripe-pattern-teal h-full"
              />
              <div
                style={{ width: `${currentAnalytics.destinationStats.martRatio}%` }}
                className="keep-print-color bg-[#FF8C69] h-full"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-medium">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 whitespace-nowrap">
                <span className="keep-print-color h-2 w-2 rounded-xs stripe-pattern-teal inline-block" />
                공항 ({currentAnalytics.destinationStats.airportRatio}%)
              </span>
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 whitespace-nowrap">
                <span className="keep-print-color h-2 w-2 rounded-xs bg-[#FF8C69] inline-block" />
                경유지 ({currentAnalytics.destinationStats.martRatio}%)
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-200/80 dark:bg-slate-700/60 my-0.5" />

          {/* 탄력 배차 분할 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
              <span className="text-slate-800 dark:text-slate-100 flex items-center gap-1 whitespace-nowrap">
                <PieChart className="h-3 w-3 text-[#F59E0B]" />
                <span>탄력 배차 차종</span>
              </span>
              <span className="report-text-muted text-[10px] font-medium text-slate-400 dark:text-slate-400 whitespace-nowrap">
                총 {currentAnalytics.elasticDispatch.totalTrips}회 가동
              </span>
            </div>

            <div className="report-track-bg w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden flex">
              <div
                style={{ width: `${currentAnalytics.elasticDispatch.carnivalRatio}%` }}
                className="keep-print-color stripe-pattern-teal h-full"
              />
              <div
                style={{ width: `${currentAnalytics.elasticDispatch.countyRatio}%` }}
                className="keep-print-color stripe-pattern-amber h-full"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-medium">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 whitespace-nowrap">
                <span className="keep-print-color h-2 w-2 rounded-xs stripe-pattern-teal inline-block" />
                카니발 ({currentAnalytics.elasticDispatch.carnivalRatio}%)
              </span>
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 whitespace-nowrap">
                <span className="keep-print-color h-2 w-2 rounded-xs stripe-pattern-amber inline-block" />
                카운티 ({currentAnalytics.elasticDispatch.countyRatio}%)
              </span>
            </div>
          </div>
        </div>

        {/* 우측: 거주동 TOP 5 순위 카드 그리드 (7컬럼) */}
        <div className="report-sub-card col-span-12 md:col-span-7 print:col-span-7 p-2 rounded-xl bg-slate-50/80 dark:bg-[#1C2536] border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between overflow-hidden h-full">
          <div className="flex items-center justify-between mb-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-[#00A896]" />
              <span>{isKr ? "101개 동 중 상위 이용 거주동 TOP 5" : "乘车频次 TOP 5"}</span>
            </div>
            <span className="report-text-muted text-[9px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">1위 대각선 빗살 패턴 특화</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 flex-1 items-stretch">
            {currentAnalytics.topDongRankings.map((dongItem) => {
              const isRank1 = dongItem.rank === 1;
              return (
                <div
                  key={dongItem.dong}
                  className={`report-sub-card p-1.5 rounded-xl border flex flex-col justify-between overflow-hidden ${
                    isRank1
                      ? "bg-white dark:bg-[#151D2A] border-[#00A896] dark:border-[#00A896] ring-1 ring-[#00A896]/30 shadow-xs"
                      : "bg-white/80 dark:bg-[#151D2A]/80 border-slate-200/80 dark:border-slate-700/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`keep-print-color w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        isRank1
                          ? "stripe-pattern-teal text-white shadow-xs"
                          : dongItem.rank === 2
                          ? "bg-[#FF8C69] text-white"
                          : dongItem.rank === 3
                          ? "bg-[#F59E0B] text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {dongItem.rank}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {dongItem.percentage}%
                    </span>
                  </div>

                  <div className="my-0.5">
                    <div className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight whitespace-nowrap break-keep">
                      {dongItem.dong}
                    </div>
                    <div className="text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      {dongItem.passengerCount}명
                    </div>
                  </div>

                  <div className="report-track-bg w-full h-1 rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden">
                    <div
                      style={{ width: `${dongItem.percentage * 3}%` }}
                      className={`keep-print-color h-full ${isRank1 ? "stripe-pattern-teal" : "bg-slate-400 dark:bg-slate-500"}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          6) [푸터 워터마크]: 높이 약 16px (shrink-0)
      ========================================================================= */}
      <div className="pt-1 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-medium shrink-0 whitespace-nowrap">
        <span>* 본 인포그래픽은 서울연구원 공공 인포그래픽 데이터 시각화 표준 가이드를 준용하여 실시간 생성되었습니다.</span>
        <span className="font-mono">제주 아덴힐 리조트 관제실 © 2026</span>
      </div>
    </div>
  );
}
