"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface MobileBackHandlerOptions {
  /** 현재 최상위 홈 화면 상태인지 여부 (승객: 시간표 탭, 기사: 관제 탭, 관리자: 대시보드 탭) */
  isHome: boolean;
  /** 현재 열려 있는 팝업 모달이 있는지 여부 */
  hasOpenModal?: boolean;
  /** 뒤로 가기 시 열려 있는 모달을 먼저 닫는 콜백 */
  onCloseModal?: () => void;
  /** 서브 탭 등에서 홈 화면으로 복귀시키는 콜백 */
  onGoHome?: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

/**
 * 전 모듈 공통 모바일 뒤로 가기(Back Button) 이탈 방지 및 종료 모달 연동 훅
 * History Trap 패턴을 사용하여 모바일 뒤로 가기 시 앱 이탈을 방지하고,
 * 서브 모달 닫기 ➔ 서브 탭 홈 복귀 ➔ 종료 확인 모달 노출 순으로 제어합니다.
 */
export function useMobileBackHandler({
  isHome,
  hasOpenModal = false,
  onCloseModal,
  onGoHome,
  disabled = false,
}: MobileBackHandlerOptions) {
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const isPushedRef = useRef(false);

  // 최신 props 동기화
  const optionsRef = useRef({ isHome, hasOpenModal, onCloseModal, onGoHome, disabled });
  optionsRef.current = { isHome, hasOpenModal, onCloseModal, onGoHome, disabled };

  // 1. History Trap 스택 관리: 홈 상태 진입 시 브라우저 히스토리에 1스택 푸시
  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    if (isHome && !isPushedRef.current) {
      window.history.pushState({ trap: true }, "", window.location.href);
      isPushedRef.current = true;
    } else if (!isHome) {
      isPushedRef.current = false;
    }
  }, [isHome, disabled]);

  // 2. popstate 이벤트 핸들러
  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    const handlePopState = () => {
      const {
        isHome: currentIsHome,
        hasOpenModal: currentHasModal,
        onCloseModal: handleClose,
        onGoHome: handleGoHome,
      } = optionsRef.current;

      // 1) 이미 종료 확인 모달이 열려 있는 상태에서 뒤로 가기 ➔ 모달 닫기
      if (isExitModalOpen) {
        setIsExitModalOpen(false);
        window.history.pushState({ trap: true }, "", window.location.href);
        return;
      }

      // 2) 서브 모달(예약 수정, 안전점검, 공지 등)이 열려 있다면 ➔ 모달 먼저 닫기
      if (currentHasModal && handleClose) {
        handleClose();
        window.history.pushState({ trap: true }, "", window.location.href);
        return;
      }

      // 3) 서브 탭(실시간 위치, 요금 검색 등)에 있다면 ➔ 홈 탭(운행 시간표)으로 복귀
      if (!currentIsHome && handleGoHome) {
        handleGoHome();
        window.history.pushState({ trap: true }, "", window.location.href);
        return;
      }

      // 4) 이미 최상위 홈 화면에 있다면 ➔ 앱 종료 확인 모달 팝업 표출
      if (currentIsHome) {
        setIsExitModalOpen(true);
        // 트랩 유지하여 브라우저 강제 종료 방지
        window.history.pushState({ trap: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [disabled, isExitModalOpen]);

  // 모달 닫기 핸들러 (계속 이용하기)
  const closeExitModal = useCallback(() => {
    setIsExitModalOpen(false);
  }, []);

  // 종료 확정 핸들러
  const confirmExit = useCallback(() => {
    setIsExitModalOpen(false);
    try {
      window.close();
    } catch {
      // window.close() 실패 시 대비
    }
    // 일반 모바일 브라우저 탭의 경우 이전 히스토리로 이탈
    if (typeof window !== "undefined") {
      window.history.go(-2);
    }
  }, []);

  return {
    isExitModalOpen,
    setIsExitModalOpen,
    closeExitModal,
    confirmExit,
  };
}
