"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  Share2,
  PlusSquare,
  Smartphone,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Monitor,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
}

export function AppInstallModal({
  isOpen,
  onClose,
  appName = "아덴힐 스마트 셔틀",
}: AppInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // iOS 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 이미 홈 화면 PWA로 실행 중인지 확인
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // beforeinstallprompt 이벤트 캡처 (Chrome, Edge, Samsung Internet 등)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  // 원클릭 설치 실행
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setTimeout(() => onClose(), 1500);
      }
      setDeferredPrompt(null);
    } else {
      // 프롬프트가 지원되지 않는 경우
      alert("스마트폰 브라우저 메뉴의 [홈 화면에 추가] 또는 주소창 우측 [설치]를 눌러주세요.");
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-none animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm max-h-[92dvh] overflow-y-auto overscroll-contain bg-white dark:bg-[#151D2A] rounded-3xl p-5 shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-4 my-auto animate-in zoom-in-95 duration-150 cursor-default"
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <img
                src="/images/logo-symbol.png"
                alt="아덴힐 로고"
                className="h-full w-full object-contain drop-shadow-xs"
              />
            </div>
            <span className="font-black text-sm text-slate-900 dark:text-slate-100">
              홈 화면에 앱 설치하기
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 상태 배너 */}
        {isStandalone || isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-100">
              이미 앱으로 실행 중입니다!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              스마트폰 홈 화면에서 아이콘을 터치하여 언제든지 편리하게 사용하실 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 앱 아이콘 소개 카드 */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-900 dark:to-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md shadow-emerald-600/10 shrink-0">
                <img
                  src="/images/logo-symbol.png"
                  alt="아덴힐 로고"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">
                  {appName}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  앱스토어 다운로드 없이 즉시 홈 화면 설치
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                    초고속 실행
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                    알림 지원
                  </span>
                </div>
              </div>
            </div>

            {/* 원클릭 설치 버튼 (안드로이드 크롬, Edge 등) */}
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 squishy-btn shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>스마트폰에 앱 즉시 설치하기</span>
              </button>
            )}

            {/* iOS 아이폰 / 아이패드 사파리 가이드 */}
            {isIOS && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 space-y-2.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-300">
                  <Smartphone className="h-4 w-4 shrink-0" />
                  <span>아이폰(iOS) 사파리 간편 설치 방법</span>
                </div>
                <ol className="space-y-2 pl-1 font-medium leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      사파리 브라우저 화면 하단의 <strong>[공유]</strong> 버튼(네모 상자 위로 화살표 아이콘 <Share2 className="h-3.5 w-3.5 inline mx-0.5" />)을 누릅니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      메뉴를 살짝 아래로 내려 <strong>[홈 화면에 추가]</strong>(<PlusSquare className="h-3.5 w-3.5 inline mx-0.5" />)를 터치합니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      우측 상단의 <strong>[추가]</strong>를 누르면 바탕화면에 바로가기 앱 아이콘이 생성됩니다!
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {/* 안드로이드 일반 / PC 브라우저 가이드 */}
            {!isIOS && !deferredPrompt && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-slate-100">
                  <Monitor className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>스마트폰 및 PC 설치 안내</span>
                </div>
                <p className="font-medium leading-relaxed text-[11px]">
                  브라우저 우측 상단의 <strong>[메뉴(점 3개)]</strong>를 누르고 <strong>[홈 화면에 추가]</strong> 또는 <strong>[앱 설치]</strong>를 선택하시면 바탕화면에 설치됩니다.
                </p>
              </div>
            )}

            {/* 혜택 안내 */}
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>앱 설치 시 편리한 장점</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 pl-1">
                <li>인터넷 주소창 없이 실제 스마트폰 앱처럼 시원하게 이용</li>
                <li>예약 시간 5분 전 실시간 탑승 알람음 수신</li>
                <li>한 번의 터치로 원클릭 즉시 접속</li>
              </ul>
            </div>
          </div>
        )}

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-colors cursor-pointer"
        >
          창 닫기
        </button>
      </div>
    </div>,
    document.body
  );
}
