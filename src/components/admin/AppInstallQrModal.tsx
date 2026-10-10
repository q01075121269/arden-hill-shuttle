"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Download,
  Users,
  Bus,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { exportElementToImage } from "@/lib/export-utils";

interface AppInstallQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "KR" | "CN";
}

export function AppInstallQrModal({ isOpen, onClose, lang = "KR" }: AppInstallQrModalProps) {
  const isKr = lang === "KR";
  const [activeTab, setActiveTab] = useState<"passenger" | "driver">("passenger");

  const [passengerQrDataUrl, setPassengerQrDataUrl] = useState<string>("");
  const [driverQrDataUrl, setDriverQrDataUrl] = useState<string>("");

  const passengerCardRef = useRef<HTMLDivElement>(null);
  const driverCardRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // 기본 배포 URL 설정
  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://arden-hill-shuttle.vercel.app";

  const passengerAppUrl = `${baseUrl}/`;
  const driverAppUrl = `${baseUrl}/driver`;

  // QR코드 생성
  useEffect(() => {
    if (!isOpen) return;

    // 고객용 QR코드 생성 (고해상도 600px)
    QRCode.toDataURL(passengerAppUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: "#0F172A", // 딥 슬레이트
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setPassengerQrDataUrl(url))
      .catch((err) => console.error("고객용 QR 생성 실패:", err));

    // 기사용 QR코드 생성 (고해상도 600px)
    QRCode.toDataURL(driverAppUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setDriverQrDataUrl(url))
      .catch((err) => console.error("기사용 QR 생성 실패:", err));
  }, [isOpen, passengerAppUrl, driverAppUrl]);

  if (!isOpen) return null;

  // 1. 순수 QR코드 이미지(PNG) 다운로드
  const handleDownloadRawQr = (type: "passenger" | "driver") => {
    const dataUrl = type === "passenger" ? passengerQrDataUrl : driverQrDataUrl;
    const filename =
      type === "passenger"
        ? "아덴힐_고객용_셔틀예약앱_설치_QR코드.png"
        : "아덴힐_기사용_셔틀운행앱_설치_QR코드.png";

    if (!dataUrl) return;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopyFeedback(
      isKr
        ? `${type === "passenger" ? "고객용" : "기사용"} 순수 QR 이미지가 저장되었습니다.`
        : "QR图片已保存。"
    );
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // 2. 배포/인쇄용 안내 포스터 카드 전체 이미지(PNG) 다운로드
  const handleDownloadPosterCard = async (type: "passenger" | "driver") => {
    const cardEl = type === "passenger" ? passengerCardRef.current : driverCardRef.current;
    if (!cardEl) return;

    setIsExporting(true);
    try {
      const filename =
        type === "passenger"
          ? "아덴힐_고객용_앱설치_배포용_포스터.png"
          : "아덴힐_기사용_앱설치_배포용_포스터.png";

      await exportElementToImage(cardEl, filename, { scale: 3, backgroundColor: "#ffffff" });

      setCopyFeedback(
        isKr
          ? `${type === "passenger" ? "고객용" : "기사용"} 배포용 안내 포스터 이미지가 저장되었습니다.`
          : "宣传海报图片已保存。"
      );
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (e) {
      alert(isKr ? "이미지 저장에 실패했습니다." : "保存失败。");
    } finally {
      setIsExporting(false);
    }
  };

  // URL 복사
  const handleCopyUrl = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopyFeedback(isKr ? `${label} 접속 주소가 복사되었습니다.` : "网址已复制。");
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151D2A] w-full max-w-xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {isKr ? "앱 설치용 QR코드 이미지 저장 및 배포" : "保存与分发App安装QR码"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isKr
                  ? "안내문 인쇄나 단지 게시판 배포를 위해 QR코드 이미지를 파일로 저장합니다."
                  : "保存高清二维码图片，以便打印并张贴在小区或车辆内部。"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold squishy-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 탭 스위처: [고객용 앱 QR코드] vs [기사용 앱 QR코드] */}
        <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 my-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("passenger")}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all squishy-btn ${
              activeTab === "passenger"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>고객용 앱 설치 QR (입주민용)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("driver")}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all squishy-btn ${
              activeTab === "driver"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Bus className="h-4 w-4" />
            <span>기사용 앱 설치 QR (승무원용)</span>
          </button>
        </div>

        {/* 복사 / 저장 알림 토스트 */}
        {copyFeedback && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{copyFeedback}</span>
          </div>
        )}

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* =========================================================================
              탭 1: 고객용 앱 QR코드
          ========================================================================= */}
          {activeTab === "passenger" && (
            <div className="space-y-4">
              {/* (A) 배포용 안내 포스터 카드 (이미지 저장 대상: passengerCardRef) */}
              <div
                ref={passengerCardRef}
                className="bg-gradient-to-b from-slate-50 to-white dark:from-[#111622] dark:to-[#181F2E] p-6 rounded-3xl border-2 border-emerald-500/30 text-center space-y-3.5 shadow-sm"
              >
                {/* 로고 & 타이틀 */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-7 w-7 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <img src="/images/logo-symbol.png" alt="로고" className="h-full w-full object-contain" />
                  </div>
                  <span className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100">
                    아덴힐 리조트 스마트 셔틀
                  </span>
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black uppercase">
                    입주민 & 회원 전용 셔틀 예약
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">
                    스마트폰 카메라로 스캔하여 앱 열기
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    별도의 앱스토어 설치 없이 카메라로 비추면 즉시 셔틀 예약 화면으로 연결됩니다.
                  </p>
                </div>

                {/* QR코드 이미지 렌더링 박스 */}
                <div className="inline-block p-4 rounded-3xl bg-white shadow-md border border-slate-200">
                  {passengerQrDataUrl ? (
                    <img
                      src={passengerQrDataUrl}
                      alt="고객용 앱 설치 QR코드"
                      className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs font-bold">
                      QR코드 생성 중...
                    </div>
                  )}
                </div>

                {/* 간편 설치 안내 가이드 */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs font-bold text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-emerald-800 dark:text-emerald-300">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>홈 화면에 바로가기 앱 추가 방법:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium pl-5">
                    • <strong>아이폰:</strong> 사파리 브라우저 하단 [공유 아이콘 ⬆️] ➔ [홈 화면에 추가] 클릭<br />
                    • <strong>갤럭시:</strong> 크롬/삼성인터넷 브라우저 [설정 ⋮] ➔ [앱 설치] 또는 [홈 화면에 추가] 클릭
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 font-semibold">
                  접속 링크: {passengerAppUrl}
                </div>
              </div>

              {/* (B) 2가지 이미지 저장 버튼 그룹 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 버튼 1: 배포용 안내 포스터 이미지 저장 */}
                <button
                  type="button"
                  onClick={() => handleDownloadPosterCard("passenger")}
                  disabled={isExporting}
                  className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 squishy-btn cursor-pointer transition-all"
                  title="게시판 부착용 안내 포스터 카드 전체를 이미지로 저장"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? "저장 중..." : "💾 안내 포스터 이미지 저장 (PNG)"}</span>
                </button>

                {/* 버튼 2: 순수 QR코드 이미지 단독 저장 */}
                <button
                  type="button"
                  onClick={() => handleDownloadRawQr("passenger")}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md squishy-btn cursor-pointer transition-all"
                  title="디자인 편집용 단독 QR코드 이미지 파일 저장"
                >
                  <QrCode className="h-4 w-4" />
                  <span>💾 순수 QR코드 단독 저장 (PNG)</span>
                </button>
              </div>

              {/* 링크 복사 버튼 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-mono text-slate-600 dark:text-slate-300 truncate mr-2">
                  {passengerAppUrl}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(passengerAppUrl, "고객용 앱")}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 shadow-2xs hover:bg-slate-50 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>주소 복사</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              탭 2: 기사용 앱 QR코드
          ========================================================================= */}
          {activeTab === "driver" && (
            <div className="space-y-4">
              {/* (A) 배포용 안내 포스터 카드 (이미지 저장 대상: driverCardRef) */}
              <div
                ref={driverCardRef}
                className="bg-gradient-to-b from-slate-50 to-white dark:from-[#111622] dark:to-[#181F2E] p-6 rounded-3xl border-2 border-sky-500/30 text-center space-y-3.5 shadow-sm"
              >
                {/* 로고 & 타이틀 */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-7 w-7 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <img src="/images/logo-symbol.png" alt="로고" className="h-full w-full object-contain" />
                  </div>
                  <span className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100">
                    아덴힐 리조트 스마트 셔틀
                  </span>
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[11px] font-black uppercase">
                    승무원 전용 스마트 운행 관리
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">
                    기사용 앱 설치 QR코드
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    운행 기사님이 스마트폰으로 스캔하시면 안전점검 및 실시간 탑승자 관리 화면으로 이동합니다.
                  </p>
                </div>

                {/* QR코드 이미지 렌더링 박스 */}
                <div className="inline-block p-4 rounded-3xl bg-white shadow-md border border-slate-200">
                  {driverQrDataUrl ? (
                    <img
                      src={driverQrDataUrl}
                      alt="기사용 앱 설치 QR코드"
                      className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs font-bold">
                      QR코드 생성 중...
                    </div>
                  )}
                </div>

                {/* 기사 전용 안내 가이드 */}
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-900 dark:text-sky-200 text-xs font-bold text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-sky-800 dark:text-sky-300">
                    <Bus className="h-3.5 w-3.5" />
                    <span>기사님 주요 이용 기능:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium pl-5">
                    • 운행 전 5대 일일 안전점검 원터치 서명<br />
                    • 실시간 회차별 탑승자 명단 확인 및 승차 확인 체크<br />
                    • 기사용 스마트폰 홈 화면에 바로가기 앱으로 설치 가능
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 font-semibold">
                  접속 링크: {driverAppUrl}
                </div>
              </div>

              {/* (B) 2가지 이미지 저장 버튼 그룹 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 버튼 1: 배포용 안내 포스터 이미지 저장 */}
                <button
                  type="button"
                  onClick={() => handleDownloadPosterCard("driver")}
                  disabled={isExporting}
                  className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 squishy-btn cursor-pointer transition-all"
                  title="기사실 부착용 안내 포스터 카드 전체를 이미지로 저장"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? "저장 중..." : "💾 안내 포스터 이미지 저장 (PNG)"}</span>
                </button>

                {/* 버튼 2: 순수 QR코드 이미지 단독 저장 */}
                <button
                  type="button"
                  onClick={() => handleDownloadRawQr("driver")}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md squishy-btn cursor-pointer transition-all"
                  title="디자인 편집용 단독 QR코드 이미지 파일 저장"
                >
                  <QrCode className="h-4 w-4" />
                  <span>💾 순수 QR코드 단독 저장 (PNG)</span>
                </button>
              </div>

              {/* 링크 복사 버튼 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-mono text-slate-600 dark:text-slate-300 truncate mr-2">
                  {driverAppUrl}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(driverAppUrl, "기사용 앱")}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 shadow-2xs hover:bg-slate-50 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>주소 복사</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
