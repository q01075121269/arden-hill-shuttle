"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserCheck,
  FileText,
  Car,
  Phone,
  X,
} from "lucide-react";
import { submitSafetyCheckAction } from "@/app/actions/driver";

type CheckStatus = "good" | "fair" | "poor";

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: "carnival" | "county";
}

export const REGISTERED_DRIVERS: DriverProfile[] = [
  {
    id: "DRV-01",
    name: "김철수 기사님",
    phone: "010-8921-4421",
    vehiclePlate: "제주 70가 1142",
    vehicleType: "carnival",
  },
  {
    id: "DRV-02",
    name: "박영진 기사님",
    phone: "010-4421-9981",
    vehiclePlate: "제주 72바 5501",
    vehicleType: "county",
  },
  {
    id: "DRV-03",
    name: "이민우 기사님",
    phone: "010-7712-3344",
    vehiclePlate: "제주 70가 1142",
    vehicleType: "carnival",
  },
];

interface SafetyCheckItem {
  key: "checkTire" | "checkLights" | "checkLeakage" | "checkCleanliness" | "checkBrakes";
  title: string;
  description: string;
}

const CHECK_ITEMS: SafetyCheckItem[] = [
  {
    key: "checkTire",
    title: "1. 타이어 점검",
    description: "타이어 적정 공기압 및 마모 상태 확인, 이물질 유무",
  },
  {
    key: "checkLights",
    title: "2. 등화 장치 점검",
    description: "전조등, 방향지시등, 브레이크등, 비상등 작동 확인",
  },
  {
    key: "checkLeakage",
    title: "3. 누유 / 누수 확인",
    description: "하부 바닥에 오일, 미션오일, 냉각수 등이 샌 흔적",
  },
  {
    key: "checkCleanliness",
    title: "4. 좌석 청결도",
    description: "VIP 좌석 가죽 상태 확인 및 실내 이물질 제거 완료",
  },
  {
    key: "checkBrakes",
    title: "5. 브레이크 제동 상태",
    description: "시동 후 페달 답력, 제동 시 밀림 현상이나 소음 유무",
  },
];

interface SafetyCheckModalProps {
  isOpen: boolean;
  selectedDriverId?: string;
  onDriverChange?: (driver: DriverProfile) => void;
  onCompleted: (data: { logId: string; checkedAt: string; driver: DriverProfile }) => void;
  onClose?: () => void;
}

export function SafetyCheckModal({
  isOpen,
  selectedDriverId = "DRV-01",
  onDriverChange,
  onCompleted,
  onClose,
}: SafetyCheckModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 기사 선택 상태 (초기값: selectedDriverId 또는 1번째 기사)
  const [activeDriverId, setActiveDriverId] = useState<string>(selectedDriverId);
  const currentDriver =
    REGISTERED_DRIVERS.find((d) => d.id === activeDriverId) || REGISTERED_DRIVERS[0];

  // 5대 항목 상태 (기본 양호)
  const [checks, setChecks] = useState<Record<string, CheckStatus>>({
    checkTire: "good",
    checkLights: "good",
    checkLeakage: "good",
    checkCleanliness: "good",
    checkBrakes: "good",
  });

  // 6번 특이사항 (신설)
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const handleSelectDriver = (driver: DriverProfile) => {
    setActiveDriverId(driver.id);
    if (onDriverChange) {
      onDriverChange(driver);
    }
  };

  const handleStatusSelect = (key: string, status: CheckStatus) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    setChecks((prev) => ({ ...prev, [key]: status }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    startTransition(async () => {
      const result = await submitSafetyCheckAction({
        driverName: currentDriver.name,
        phone: currentDriver.phone,
        vehicleNumber: `${currentDriver.vehiclePlate} (${currentDriver.vehicleType === "carnival" ? "카니발" : "카운티"})`,
        checkTire: checks.checkTire,
        checkLights: checks.checkLights,
        checkLeakage: checks.checkLeakage,
        checkCleanliness: checks.checkCleanliness,
        checkBrakes: checks.checkBrakes,
        notes: notes.trim() || undefined,
        signature: currentDriver.name,
      });

      if (!result.success) {
        setErrorMsg(result.error);
        return;
      }

      onCompleted({
        logId: result.data.logId,
        checkedAt: result.data.checkedAt,
        driver: currentDriver,
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md bg-slate-900/50 dark:bg-black/70 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[94vh] flex flex-col rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden break-keep">
        {/* 헤더 */}
        <div className="px-5 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                운행 전 필수 절차 (Mandatory Safety Check)
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                당일 5대+1 안전점검표 작성
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400">{currentDriver.vehiclePlate}</div>
              <div className="text-[11px] font-medium text-slate-400">{currentDriver.name}</div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white squishy-btn"
                title="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 안내 배너 */}
        <div className="bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800/60 px-5 py-2.5 text-xs text-rose-800 dark:text-rose-300 font-medium flex items-center gap-2 shrink-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>승객의 안전을 위해 기사를 확인하고 5대 항목을 모두 체크해야 관제 화면으로 진입합니다.</span>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200/60 dark:border-rose-800/60">
              {errorMsg}
            </div>
          )}

          {/* 기사 선택 및 자동 바인딩 카드 (텍스트 수기 입력 폐지) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>운행 기사 선택 및 본인 확인</span>
              </label>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                자동 바인딩 완료
              </span>
            </div>

            {/* 기사 선택 3분할 칩 */}
            <div className="grid grid-cols-3 gap-1.5 w-full">
              {REGISTERED_DRIVERS.map((driver) => {
                const isSelected = activeDriverId === driver.id;
                return (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => handleSelectDriver(driver)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all squishy-btn flex flex-col items-center justify-center text-center ${
                      isSelected
                        ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white border-emerald-500 shadow-xs"
                        : "bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-transparent hover:bg-white/60 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{driver.name.replace(" 기사님", "")}</span>
                    <span className="text-[10px] font-normal text-slate-400 truncate">
                      {driver.vehiclePlate.split(" ").slice(-1)[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 바인딩된 상세 정보 미리보기 */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200 truncate">
                  {currentDriver.phone}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Car className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {currentDriver.vehiclePlate} ({currentDriver.vehicleType === "carnival" ? "카니발" : "카운티"})
                </span>
              </div>
            </div>
          </div>

          {/* 5대 점검 항목 리스트 */}
          <div className="space-y-3">
            {CHECK_ITEMS.map((item) => {
              const currentVal = checks[item.key];
              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-2.5"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      {item.description}
                    </div>
                  </div>

                  {/* 3단계 파스텔 틴트 세그먼트 버튼 (최소 48px 높이) */}
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleStatusSelect(item.key, "good")}
                      className={`min-h-[46px] py-2 px-1 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 squishy-btn border transition-all ${
                        currentVal === "good"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-xs"
                          : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>양호</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusSelect(item.key, "fair")}
                      className={`min-h-[46px] py-2 px-1 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 squishy-btn border transition-all ${
                        currentVal === "fair"
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs"
                          : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>보통</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusSelect(item.key, "poor")}
                      className={`min-h-[46px] py-2 px-1 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 squishy-btn border transition-all ${
                        currentVal === "poor"
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 shadow-xs"
                          : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>불량</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. 기타 특이사항 (신설: 차량 흠집, 에어컨/히터 상태, 기상/도로 특이사항 등) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>6. 기타 특이사항 (신설)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">선택 입력</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="차량 외관 흠집, 에어컨/히터 필터, 당일 도로/기상 특이사항 등을 자유롭게 기재하세요."
              className="w-full p-3 rounded-xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 resize-none"
            />
          </div>

          {/* 하단 점검 완료 및 운행 시작 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base hover:opacity-95 disabled:opacity-50 squishy-btn shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <span>점검 완료 및 본인 서명 ({currentDriver.name})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
