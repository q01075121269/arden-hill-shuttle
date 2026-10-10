"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  Building2,
  Calendar,
  Filter,
  RotateCcw,
  Search,
} from "lucide-react";
import { Language, Reservation } from "@/types";
import { I18N } from "@/lib/constants";

interface FareHistoryTabProps {
  lang: Language;
  reservations: Reservation[];
}

type QuickFilterPreset = "all" | "week" | "month";

export function FareHistoryTab({ lang, reservations }: FareHistoryTabProps) {
  const isKr = lang === "KR";
  const t = I18N[lang];

  // 오늘 날짜 계산 유틸
  const getFormattedDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const todayStr = useMemo(() => getFormattedDate(new Date()), []);

  // 1개월 전 기본 날짜
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return getFormattedDate(d);
  }, []);

  // 필터 상태: 시작일, 종료일, 빠른 프리셋
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(todayStr);
  const [quickFilter, setQuickFilter] = useState<QuickFilterPreset>("month");

  // 빠른 기간 선택 핸들러
  const handleQuickPreset = (preset: QuickFilterPreset) => {
    setQuickFilter(preset);
    const today = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    const start = new Date();
    if (preset === "week") {
      start.setDate(today.getDate() - 7);
    } else if (preset === "month") {
      start.setMonth(today.getMonth() - 1);
    }

    setStartDate(getFormattedDate(start));
    setEndDate(getFormattedDate(today));
  };

  // 날짜 수기 입력 시 프리셋 동기화
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
  };

  // 기간 필터링된 예약 목록
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const depDate = r.departureDate;
      if (startDate && depDate < startDate) return false;
      if (endDate && depDate > endDate) return false;
      return true;
    });
  }, [reservations, startDate, endDate]);

  // 필터된 기간 기준 총 미납 금액 및 완납 금액 계산
  const unpaidTotal = useMemo(() => {
    return filteredReservations
      .filter((r) => r.paymentStatus === "unpaid" && r.boardingStatus !== "cancelled")
      .reduce((sum, r) => sum + r.fareAmount, 0);
  }, [filteredReservations]);

  const paidTotal = useMemo(() => {
    return filteredReservations
      .filter((r) => r.paymentStatus === "paid")
      .reduce((sum, r) => sum + r.fareAmount, 0);
  }, [filteredReservations]);

  const currencyUnit = isKr ? "원" : "韩元";

  return (
    <div className="space-y-4 w-full break-keep">
      {/* 1. 요금 정책 안내 카드 (2분할 컴팩트) */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* 입주민 우대 요금 카드 */}
        <div className="p-4 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>{isKr ? "입주민" : "业主"}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white whitespace-nowrap">
              {isKr ? "전액 무료" : "全免"}
            </span>
          </div>
          <div className="text-lg font-bold text-emerald-900 dark:text-emerald-200 tracking-tight tabular-nums">
            0{currencyUnit}
          </div>
          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-normal leading-tight">
            {isKr ? "동/호수 확인 시 무료" : "确认栋/房号免费"}
          </p>
        </div>

        {/* 투숙객 / 일반 방문객 요금 카드 */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-slate-500" />
              <span>{isKr ? "투숙객" : "住客"}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {isKr ? "편도 기준" : "单程"}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            5,000{currencyUnit}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight">
            {isKr ? "성인 1인 편도 기준" : "成人单程/人"}
          </p>
        </div>
      </div>

      {/* 
        ========================================================================
        2. 기간 검색 및 퀵 필터 바 (모바일 최적화)
        ========================================================================
      */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 w-full">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isKr ? "기간별 요금 검색" : "按期间查询费用"}</span>
          </span>
          <button
            type="button"
            onClick={() => handleQuickPreset("all")}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 squishy-btn"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{isKr ? "초기화" : "重置"}</span>
          </button>
        </div>

        {/* 퀵 필터 3분할 버튼: [최근 1주일 | 최근 1개월 | 전체] */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/40 dark:border-slate-700/50 w-full">
          <button
            type="button"
            onClick={() => handleQuickPreset("week")}
            className={`min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all squishy-btn ${
              quickFilter === "week"
                ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {isKr ? "최근 1주일" : "最近1周"}
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset("month")}
            className={`min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all squishy-btn ${
              quickFilter === "month"
                ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {isKr ? "최근 1개월" : "最近1月"}
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset("all")}
            className={`min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all squishy-btn ${
              quickFilter === "all"
                ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {isKr ? "전체" : "全部"}
          </button>
        </div>

        {/* 날짜 범위 직접 선택 (시작일 ~ 종료일) */}
        <div className="grid grid-cols-2 gap-2 pt-1 w-full">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>{isKr ? "시작일" : "开始日"}</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>{isKr ? "종료일" : "结束日"}</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 3. 수납 요약 카드 (미수금 vs 완납금) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs w-full">
        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isKr ? "미납 금액 (확인 대기)" : "待收金额 (未结算)"}
          </div>
          <div className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-400 mt-0.5">
            {unpaidTotal.toLocaleString()}{currencyUnit}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isKr ? "완납 처리 합계" : "已付金额 (已核销)"}
          </div>
          <div className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
            {paidTotal.toLocaleString()}{currencyUnit}
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        4. 모바일 통장 내역 형태의 탑승 내역 리스트 (테이블 가로 넘침 완벽 제거)
        ========================================================================
      */}
      <div className="rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3 w-full">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {isKr ? "탑승 및 정산 내역" : "乘车与结算明细"}
          </h4>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            {isKr ? `총 ${filteredReservations.length}건` : `共 ${filteredReservations.length}条`}
          </span>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-bold space-y-2">
            <p>{t.fareAndHistory.emptyHistory}</p>
            <button
              type="button"
              onClick={() => handleQuickPreset("all")}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 squishy-btn"
            >
              {isKr ? "전체 기간 내역 보기" : "查看全部期间记录"}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 w-full">
            {filteredReservations.map((res) => {
              const isPaid = res.paymentStatus === "paid";
              const isCancelled = res.boardingStatus === "cancelled";

              return (
                <div
                  key={res.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2.5 w-full break-keep"
                >
                  {/* 좌측: 탑승 일시 및 구간 */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                        {res.departureDate} {res.departureTime}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {res.passengerCount}{isKr ? "명" : "人"}
                      </span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {res.pickupLocation} ➔ {res.dropoffLocation}
                    </div>
                  </div>

                  {/* 우측: 요금 및 결제 상태 뱃지 */}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm sm:text-base tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                      {res.fareAmount.toLocaleString()}{currencyUnit}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${
                        isCancelled
                          ? "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50"
                          : isPaid
                          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50"
                          : "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50"
                      }`}
                    >
                      {isCancelled
                        ? (isKr ? "취소 완료" : "已取消")
                        : isPaid
                        ? t.fareAndHistory.statusPaid
                        : t.fareAndHistory.statusUnpaid}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
