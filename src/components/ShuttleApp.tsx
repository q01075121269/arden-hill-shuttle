"use client";

import React, { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Language, Notice, Reservation } from "@/types";
import { Header } from "@/components/Header";
import { MainNavigation, TabType } from "@/components/MainNavigation";
import { NoticeModal } from "@/components/NoticeModal";
import { VersionReleaseModal } from "@/components/VersionReleaseModal";
import { ExitConfirmModal } from "@/components/common/ExitConfirmModal";
import { ReservationTab } from "@/components/tabs/ReservationTab";
import { ShuttleTrackingTab } from "@/components/tabs/ShuttleTrackingTab";
import { FareHistoryTab } from "@/components/tabs/FareHistoryTab";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import { PassengerFeedbackModal } from "@/components/passenger/PassengerFeedbackModal";
import { InstallAppButton } from "@/components/common/InstallAppButton";

interface ShuttleAppProps {
  initialNotice: Notice;
  initialReservations: Reservation[];
}

export function ShuttleApp({
  initialNotice,
  initialReservations,
}: ShuttleAppProps) {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Language>("KR");

  // URL 파라미터에서 초기 탭 및 모달 상태 동기화
  const initialTab = (searchParams.get("tab") as TabType) || "schedule";
  const initialModal = searchParams.get("modal");

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isNoticeOpen, setIsNoticeOpen] = useState(initialModal === "notice");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);

  // 1. 탭 전환 시 URL 쿼리 및 히스토리 스택 동기화
  const handleTabChange = useCallback((newTab: TabType) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    if (newTab === "schedule") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const query = params.toString();
    const newUrl = query ? `?${query}` : window.location.pathname;
    window.history.pushState(null, "", newUrl);
  }, []);

  // 2. 공지사항 모달 오픈/닫기
  const handleOpenNotice = useCallback(() => {
    setIsNoticeOpen(true);
    const params = new URLSearchParams(window.location.search);
    params.set("modal", "notice");
    window.history.pushState({ modal: "notice" }, "", `?${params.toString()}`);
  }, []);

  const handleCloseNotice = useCallback(() => {
    setIsNoticeOpen(false);
    const params = new URLSearchParams(window.location.search);
    if (params.get("modal") === "notice") {
      params.delete("modal");
      const query = params.toString();
      const newUrl = query ? `?${query}` : window.location.pathname;
      window.history.pushState(null, "", newUrl);
    }
  }, []);

  // 3. 상단 브랜드 로고 클릭 시 첫 화면 즉시 초기화 (홈 리셋)
  const handleResetHome = useCallback(() => {
    setIsNoticeOpen(false);
    setActiveTab("schedule");
    window.history.pushState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // 4. 전 모듈 공통 모바일 뒤로 가기 제어 훅 바인딩
  // [실시간 위치/요금 검색 ➔ 운행 시간표 복귀] ➔ [운행 시간표에서 뒤로 가기 시 종료 확인 모달 표출]
  const { isExitModalOpen, closeExitModal, confirmExit } = useMobileBackHandler({
    isHome: activeTab === "schedule",
    hasOpenModal: isNoticeOpen,
    onCloseModal: handleCloseNotice,
    onGoHome: () => handleTabChange("schedule"),
  });

  // 예약 추가 핸들러
  const handleReservationAdded = (newRes: Reservation) => {
    setReservations((prev) => [newRes, ...prev]);
  };

  // 예약 수정 핸들러
  const handleReservationUpdated = (updatedRes: Reservation) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === updatedRes.id ? updatedRes : r))
    );
  };

  // 예약 취소 핸들러
  const handleReservationCancelled = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, boardingStatus: "cancelled" } : r))
    );
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden box-border min-h-screen bg-slate-50 dark:bg-[#111318] flex flex-col transition-colors">
      {/* 1. 상단 헤더: 관리자 링크 완전 배제, 다크/라이트 모드, KR|CN 토글, 로고 클릭 시 홈 리셋 */}
      <Header
        currentLang={lang}
        onLanguageChange={setLang}
        onOpenNotice={handleOpenNotice}
        onLogoClick={handleResetHome}
      />

      {/* 2. 대형 터치 메인 네비게이션 (모바일 3등분 그리드, 말줄임표 박멸) */}
      <MainNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        lang={lang}
      />

      {/* 3. 메인 콘텐츠 뷰 영역 (모바일 중앙 정렬 컨테이너: max-w-md mx-auto w-full px-4 py-3) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-3 pb-24 box-border">
        {activeTab === "schedule" && (
          <ReservationTab
            lang={lang}
            reservations={reservations}
            onReservationAdded={handleReservationAdded}
            onReservationUpdated={handleReservationUpdated}
            onReservationCancelled={handleReservationCancelled}
          />
        )}

        {activeTab === "tracking" && <ShuttleTrackingTab lang={lang} />}

        {activeTab === "history" && (
          <FareHistoryTab lang={lang} reservations={reservations} />
        )}

        {/* [✍️ 관리소에 건의·애로사항 남기기] 간편 아코디언/버튼 */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-emerald-300/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs shadow-xs hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 flex items-center justify-between squishy-btn transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">✍️</span>
              <span>{lang === "KR" ? "관리소에 건의·애로사항 남기기" : "向管理处提交意见与建议"}</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black">
              {lang === "KR" ? "접수하기 ➔" : "立即提交 ➔"}
            </span>
          </button>

          {/* 스마트폰 홈 화면 앱 설치 배너 */}
          <InstallAppButton variant="card" className="mt-2.5" />
        </div>
      </main>

      {/* 승객 건의사항 등록 모달 */}
      <PassengerFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        lang={lang}
      />

      {/* 4. 긴급 공지사항 팝업 모달 */}
      <NoticeModal
        isOpen={isNoticeOpen}
        onClose={handleCloseNotice}
        notice={initialNotice}
        lang={lang}
      />

      {/* 5. 시스템 버전 업데이트 안내 팝업 모달 */}
      <VersionReleaseModal lang={lang} />

      {/* 6. 전 모듈 공통 모바일 뒤로 가기 앱 종료 확인 모달 */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={closeExitModal}
        onConfirm={confirmExit}
        lang={lang}
      />
    </div>
  );
}
