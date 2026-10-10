"use client";

import React, { useState, useTransition } from "react";
import {
  Sliders,
  DollarSign,
  Clock,
  Phone,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Store,
} from "lucide-react";
import { Language } from "@/types";
import { updatePolicyAction, PolicyInput } from "@/app/actions/admin";

interface PolicyManagerProps {
  lang: Language;
}

export function PolicyManager({ lang }: PolicyManagerProps) {
  const isKr = lang === "KR";
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 정책 폼 상태
  const [fareAmount, setFareAmount] = useState<number>(5000);
  const [cutoffHour, setCutoffHour] = useState<number>(22);
  const [cutoffMinute, setCutoffMinute] = useState<number>(0);
  const [driverPhone, setDriverPhone] = useState<string>("010-8921-4421");
  const [adminPhone, setAdminPhone] = useState<string>("010-3342-9981");

  // 이마트 월간 휴무일 리스트 (매월 2째, 4째 주 금/토 등 선택 시뮬레이션)
  const [emartHolidays, setEmartHolidays] = useState<string[]>([
    "2026-10-11",
    "2026-10-25",
  ]);

  // 이마트 휴무 시 자동 전환될 대체 경유지
  const [alternativeRouteName, setAlternativeRouteName] = useState<string>("동문시장");

  // 10월 캘린더 날짜 생성 (1일~31일)
  const OCTOBER_DAYS = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dateStr = `2026-10-${day < 10 ? "0" + day : day}`;
    return { day, dateStr };
  });

  const toggleHoliday = (dateStr: string) => {
    setEmartHolidays((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);

    startTransition(async () => {
      const res = await updatePolicyAction({
        fareAmount,
        cutoffHour,
        cutoffMinute,
        driverPhone,
        adminPhone,
        emartHolidays,
        alternativeRouteName,
      });

      if (res.success) {
        setSaveMessage(res.message || "정책이 저장되었습니다.");
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            <span>{isKr ? "운영 정책 및 대체 노선 관리" : "运营政策与备用路线管理"}</span>
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            {isKr
              ? "탑승 요금, 예약 마감 기준, 이마트 휴무일 대체 경유지를 동적으로 제어합니다."
              : "动态管理乘车费用、预约截止时间及易买得休息日备选路线。"}
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 그리드: 요금 설정 & 마감 시간 & 비상 연락처 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. 편도 탑승 요금 설정 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 font-black text-base text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <span>{isKr ? "편도 탑승 요금 (하드코딩 금지)" : "单程票价 (动态设定)"}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {isKr
                ? "수정 즉시 승객 화면 및 신규 예약 건의 자동 요금 계산에 반영됩니다."
                : "保存后立即在乘客端及新建预约中生效。"}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min={0}
                step={500}
                value={fareAmount}
                onChange={(e) => setFareAmount(Number(e.target.value))}
                className="w-44 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 font-black text-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
              <span className="font-black text-sm text-slate-700 dark:text-slate-300">
                {isKr ? "원 (KRW)" : "韩元 (KRW)"}
              </span>
            </div>
          </div>

          {/* 2. 예약 마감 시간 설정 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 font-black text-base text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <span>{isKr ? "전일 예약 마감 시간 설정" : "前一日预约截止时间"}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {isKr
                ? "설정된 시간 이후에는 승객 웹의 예약 폼이 차단되고 긴급 연락처가 표출됩니다."
                : "超过此时间，乘客端表单将自动关闭并提示紧急联络人。"}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={cutoffHour}
                  onChange={(e) => setCutoffHour(Number(e.target.value))}
                  className="w-24 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 font-black text-lg text-slate-900 dark:text-slate-100 text-center focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">시</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={cutoffMinute}
                  onChange={(e) => setCutoffMinute(Number(e.target.value))}
                  className="w-24 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 font-black text-lg text-slate-900 dark:text-slate-100 text-center focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">분</span>
              </div>
            </div>
          </div>

          {/* 3. 긴급 문의 연락처 관리 */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 font-black text-base text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Phone className="h-5 w-5" />
              </div>
              <span>{isKr ? "비상 및 긴급 예약 직통 연락처" : "紧急预约联系专线"}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isKr ? "기사님 직통 전화" : "司机专线电话"}
                </label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isKr ? "관리실 직통 전화" : "物业管理处专线"}
                </label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. 이마트 월간 휴무일 관리 및 대체 노선 자동 전환 설정 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  {isKr ? "이마트 월간 휴무일 & 대체 노선 설정" : "易买得休息日与备选路线设置"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {isKr
                    ? "캘린더에서 휴무일을 클릭하면 해당 일자의 이마트 경유지가 대체 노선으로 자동 우회됩니다."
                    : "在日历中点击休息日，该日期的经由地将自动变更为备选路线。"}
                </p>
              </div>
            </div>

            {/* 대체 노선 선택 드롭다운 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isKr ? "휴무일 대체 노선:" : "替代路线:"}
              </span>
              <select
                value={alternativeRouteName}
                onChange={(e) => setAlternativeRouteName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 font-bold text-xs text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="동문시장">동문시장 (전통 재래시장)</option>
                <option value="오일장">제주민속오일장 (특정일)</option>
                <option value="365마트">365마트 (중산간 대형마트)</option>
                <option value="직통운행">경유지 없이 직통 운행</option>
              </select>
            </div>
          </div>

          {/* 10월 인터랙티브 캘린더 */}
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
              <span>2026년 10월 캘린더 (날짜를 클릭하여 휴무일 지정)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                지정된 휴무일: {emartHolidays.length}일
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {OCTOBER_DAYS.map((d) => {
                const isSelected = emartHolidays.includes(d.dateStr);
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => toggleHoliday(d.dateStr)}
                    className={`py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black squishy-btn border transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <span>{d.day}일</span>
                    <span
                      className={`text-[10px] font-semibold mt-0.5 ${
                        isSelected ? "text-white/90" : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {isSelected ? alternativeRouteName : "이마트"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 저장 제출 버튼 */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base squishy-btn shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{isKr ? "운영 정책 일괄 저장" : "保存所有运营政策"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
