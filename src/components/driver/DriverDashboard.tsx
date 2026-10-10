"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  ShieldCheck,
  AlertOctagon,
  PhoneCall,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  SafetyCheckModal,
  REGISTERED_DRIVERS,
  DriverProfile,
} from "@/components/driver/SafetyCheckModal";
import { ShuttleDirection } from "@/components/driver/TripControlPanel";
import { QuickTripReportPanel } from "@/components/driver/QuickTripReportPanel";
import { CurrentTripStatusCard } from "@/components/driver/CurrentTripStatusCard";
import { ShuttleTimetableSelector } from "@/components/driver/ShuttleTimetableSelector";
import { PassengerBoardingList } from "@/components/driver/PassengerBoardingList";
import { DriverLogSummaryView } from "@/components/driver/DriverLogSummaryView";
import { VersionReleaseModal } from "@/components/VersionReleaseModal";
import { ExitConfirmModal } from "@/components/common/ExitConfirmModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthHeaderProfile } from "@/components/auth/AuthHeaderProfile";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import { EMERGENCY_CONTACTS } from "@/lib/constants";

type DriverTabType = "operation" | "records";

export function DriverDashboard() {
  // 오늘 날짜 기반 당일 1회 한정 안전점검 확인 키
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const SAFETY_STORAGE_KEY = `AH_SAFETY_CHECKED_${todayDateStr}`;
  const DRIVER_STORAGE_KEY = "AH_SELECTED_DRIVER_ID";

  // 선택된 기사 프로필
  const [currentDriver, setCurrentDriver] = useState<DriverProfile>(REGISTERED_DRIVERS[0]);

  // 안전점검 모달 상태
  const [isSafetyCheckOpen, setIsSafetyCheckOpen] = useState(false);
  const [safetyCheckDone, setSafetyCheckDone] = useState(false);

  // 긴급 차량/운행 알림 모달 상태
  const [isEmergencyAlertOpen, setIsEmergencyAlertOpen] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);

  // [순서 2] 메인 2개 탭: operation(오늘 운행 & 승차) vs records(운행 실적 & 일지)
  const [activeTab, setActiveTab] = useState<DriverTabType>("operation");

  // [순서 5] 노선 방향: "outbound"(아덴힐 ➔ 공항) vs "inbound"(공항 ➔ 아덴힐)
  const [direction, setDirection] = useState<ShuttleDirection>("outbound");

  // [순서 5] 현재 선택된 운행 회차 (1~6회차)
  const [currentRound, setCurrentRound] = useState(1);

  // [순서 4] 실시간 운행 상태 배너
  const [currentStatusBanner, setCurrentStatusBanner] = useState<string>(
    "아덴힐발 1회차 | 출발 준비 (승차 대기 중)"
  );

  // 방향 변경 시 상태 배너 자동 연동
  const handleDirectionChange = (newDir: ShuttleDirection) => {
    setDirection(newDir);
    const dirText = newDir === "outbound" ? "아덴힐발" : "공항발";
    setCurrentStatusBanner(`${dirText} ${currentRound}회차 | 출발 준비 (승차 대기 중)`);
  };

  // 회차 변경 시 상태 배너 자동 연동
  const handleRoundChange = (newRound: number) => {
    setCurrentRound(newRound);
    const dirText = direction === "outbound" ? "아덴힐발" : "공항발";
    setCurrentStatusBanner(`${dirText} ${newRound}회차 | 출발 준비 (승차 대기 중)`);
  };

  // 초기 로컬스토리지 복원
  useEffect(() => {
    try {
      const savedDriverId = localStorage.getItem(DRIVER_STORAGE_KEY);
      if (savedDriverId) {
        const found = REGISTERED_DRIVERS.find((d) => d.id === savedDriverId);
        if (found) setCurrentDriver(found);
      }

      const checked = localStorage.getItem(SAFETY_STORAGE_KEY);
      if (checked) {
        setIsSafetyCheckOpen(false);
        setSafetyCheckDone(true);
      } else {
        setIsSafetyCheckOpen(true);
      }
    } catch {
      setIsSafetyCheckOpen(true);
    }
  }, [SAFETY_STORAGE_KEY]);

  // 안전점검 완료 처리
  const handleSafetyCheckCompleted = (data: {
    logId: string;
    checkedAt: string;
    driver: DriverProfile;
  }) => {
    try {
      localStorage.setItem(SAFETY_STORAGE_KEY, "true");
      localStorage.setItem(DRIVER_STORAGE_KEY, data.driver.id);
    } catch (e) {
      console.error(e);
    }
    setCurrentDriver(data.driver);
    setSafetyCheckDone(true);
    setIsSafetyCheckOpen(false);
  };

  // 모바일 뒤로 가기 훅 연동
  const { isExitModalOpen, closeExitModal, confirmExit } = useMobileBackHandler({
    isHome: activeTab === "operation",
    hasOpenModal: isSafetyCheckOpen || isEmergencyAlertOpen,
    onCloseModal: () => {
      if (isEmergencyAlertOpen) setIsEmergencyAlertOpen(false);
    },
    onGoHome: () => setActiveTab("operation"),
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden box-border min-h-screen bg-slate-50 dark:bg-[#111318] text-slate-900 dark:text-slate-100 flex flex-col transition-colors break-keep">
      {/* =========================================================================
          [순서 1] 상단 헤더 & 기사 프로필
          ========================================================================= */}
      {/* 1-1. 상단 헤더 */}
      <header className="sticky top-0 z-40 w-full h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md px-3.5 sm:px-4 flex items-center justify-between transition-colors box-border">
        {/* 좌측: 셔틀 아이콘 + '아덴힐 드라이버' (단일 행 표출) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Bus className="h-5 w-5" />
          </div>
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            아덴힐 드라이버
          </span>
        </div>

        {/* 우측: [긴급 차량/운행 알림] 버튼 + [테마 토글] */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsEmergencyAlertOpen(true)}
            className="h-9 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 font-black text-xs sm:text-sm flex items-center gap-1.5 squishy-btn shadow-xs hover:bg-rose-100 dark:hover:bg-rose-900/50"
            title="긴급 차량/운행 알림"
          >
            <AlertOctagon className="h-4 w-4 text-rose-600" />
            <span className="whitespace-nowrap">긴급 알림</span>
          </button>
          <ThemeToggle />
          <AuthHeaderProfile />
        </div>
      </header>

      {/* 1-2. 기사 프로필 & 점검 상태 바 (헤더 바로 아래 한 줄 카드 형태) */}
      <div className="w-full bg-white dark:bg-[#171B22] border-b border-slate-200/80 dark:border-slate-800 px-3.5 sm:px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 text-xs">
          {/* 기사 성함 및 연락처 */}
          <div className="flex items-center gap-2 truncate">
            <span className="font-black text-slate-900 dark:text-white truncate text-xs sm:text-sm">
              {currentDriver.name}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-bold tabular-nums text-xs">
              ({currentDriver.phone})
            </span>
            <span className="hidden sm:inline-block text-slate-400 dark:text-slate-600">·</span>
            <span className="hidden sm:inline-block text-slate-600 dark:text-slate-300 font-bold">
              {currentDriver.vehiclePlate}
            </span>
          </div>

          {/* [점검 완료] 배지 & 점검표 버튼 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 border ${
                safetyCheckDone
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>{safetyCheckDone ? "점검 완료" : "점검 필요"}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsSafetyCheckOpen(true)}
              className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 squishy-btn border border-slate-200/60 dark:border-slate-700"
            >
              점검표 보기
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          [순서 2] 메인 2개 탭 네비게이션 바
          ========================================================================= */}
      <nav aria-label="메인 탭" className="w-full bg-slate-50 dark:bg-[#111318] border-b border-slate-200/80 dark:border-slate-800 box-border">
        <div className="max-w-md mx-auto px-3.5 sm:px-4 py-2">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setActiveTab("operation")}
              className={`min-h-[42px] py-1.5 px-2 rounded-xl text-center font-black text-xs sm:text-sm squishy-btn transition-all ${
                activeTab === "operation"
                  ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              오늘 운행 & 승차
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("records")}
              className={`min-h-[42px] py-1.5 px-2 rounded-xl text-center font-black text-xs sm:text-sm squishy-btn transition-all ${
                activeTab === "records"
                  ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              운행 실적 & 일지
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          메인 콘텐츠 영역 (max-w-md 정렬)
          ========================================================================= */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 sm:px-4 py-3 pb-24 box-border space-y-3.5">
        {activeTab === "operation" ? (
          <>
            {/* [1순위 (상단)]: '실시간 관제 연동 / 현재 운행 회차 상태 카드' */}
            <CurrentTripStatusCard
              currentStatusBanner={currentStatusBanner}
              currentRound={currentRound}
              vehiclePlate={currentDriver.vehiclePlate}
              vehicleType={currentDriver.vehicleType}
            />

            {/* [2순위 (바로 밑)]: '원터치 운행 구간 보고' 패널 */}
            <QuickTripReportPanel
              vehicleNumber={`${currentDriver.vehiclePlate} (${currentDriver.vehicleType === "carnival" ? "카니발" : "카운티"})`}
              driverName={currentDriver.name}
              direction={direction}
              currentRound={currentRound}
              onStatusUpdated={setCurrentStatusBanner}
            />

            {/* [3순위]: '정규 셔틀 운행 시간표 & 회차 선택' 리스트 */}
            <ShuttleTimetableSelector
              direction={direction}
              onDirectionChange={handleDirectionChange}
              currentRound={currentRound}
              onRoundChange={handleRoundChange}
            />

            {/* [4순위]: '선택된 회차의 탑승자 명단 & 승차 체크 패널' (화면 최하단) */}
            <PassengerBoardingList
              currentRound={currentRound}
              direction={direction}
            />
          </>
        ) : (
          /* [운행 실적 & 일지] 탭: 다차원 검색/분석 필터 뷰 */
          <DriverLogSummaryView
            currentDriver={currentDriver}
            currentRound={currentRound}
            safetyCheckDone={safetyCheckDone}
          />
        )}
      </main>

      {/* 5대+1 안전점검 모달 */}
      <SafetyCheckModal
        isOpen={isSafetyCheckOpen}
        selectedDriverId={currentDriver.id}
        onCompleted={handleSafetyCheckCompleted}
        onClose={() => setIsSafetyCheckOpen(false)}
      />

      {/* 긴급 차량/운행 알림 모달 */}
      {isEmergencyAlertOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 dark:bg-black/75 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xl space-y-4 break-keep animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 flex items-center justify-center shadow-xs">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsEmergencyAlertOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 squishy-btn"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                긴급 차량 및 운행 상황 전파
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                차량 고장, 폭설/기상 악화, 접촉 사고 등 긴급 상황 발생 시 관리실에 즉시 연결됩니다.
              </p>
            </div>

            {emergencySent ? (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>관리실에 비상 알림이 정상 전송되었습니다.</span>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <a
                  href={`tel:${EMERGENCY_CONTACTS.admin.phone}`}
                  className="min-h-[46px] w-full px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm squishy-btn shadow-md flex items-center justify-center gap-2"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>운영 관리실 긴급 전화 통화</span>
                </a>
                <button
                  type="button"
                  onClick={() => setEmergencySent(true)}
                  className="min-h-[42px] w-full px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs squishy-btn hover:bg-slate-200"
                >
                  비상 상황 시스템 전송
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 시스템 버전 안내 모달 */}
      <VersionReleaseModal />

      {/* 전 모듈 공통 모바일 뒤로 가기 기사 관제 종료 확인 모달 */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={closeExitModal}
        onConfirm={confirmExit}
        title="아덴힐 기사 관제를 종료하시겠습니까?"
        lang="KR"
      />
    </div>
  );
}
