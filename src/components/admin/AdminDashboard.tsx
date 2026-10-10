"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarCheck2,
  CreditCard,
  SlidersHorizontal,
  Building,
  Megaphone,
  Bell,
  Smartphone,
  QrCode,
} from "lucide-react";
import { Language } from "@/types";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { MasterDataManager } from "@/components/admin/MasterDataManager";
import { OperationScheduleManager } from "@/components/admin/OperationScheduleManager";
import { CustomerSettlementHub } from "@/components/admin/CustomerSettlementHub";
import { NoticePublisherModal } from "@/components/admin/NoticePublisherModal";
import { VersionReleaseModal } from "@/components/VersionReleaseModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallAppButton } from "@/components/common/InstallAppButton";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import { ExitConfirmModal } from "@/components/common/ExitConfirmModal";
import { AppInstallQrModal } from "@/components/admin/AppInstallQrModal";

export type AdminTab = "overview" | "operations" | "customers" | "master";

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<Language>("KR");
  const isKr = lang === "KR";

  // URL 쿼리 ?tab= 파라미터 파싱 (?tab=operations, ?tab=customers 지원 및 하위호환)
  const getNormalizedTab = (raw: string | null): AdminTab => {
    if (raw === "operations" || raw === "schedule") return "operations";
    if (raw === "overview" || raw === "tower") return "overview";
    if (raw === "customers" || raw === "settlement") return "customers";
    if (raw === "master") return "master";
    return "operations"; // 셔틀운행계획을 기본 첫 번째 탭으로 지정
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    getNormalizedTab(searchParams.get("tab"))
  );
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isAppQrModalOpen, setIsAppQrModalOpen] = useState(false);

  // 탭 변경 시 URL 쿼리와 동기화 (?tab=...)
  const handleTabChange = (newTab: AdminTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", newTab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, "", newUrl);
  };

  // URL 파라미터 변경 감지 동기화
  useEffect(() => {
    const raw = searchParams.get("tab");
    const normalized = getNormalizedTab(raw);
    if (normalized !== activeTab) {
      setActiveTab(normalized);
    }
  }, [searchParams]);

  // 전 모듈 공통 모바일 뒤로 가기 제어 (홈: operations 또는 master)
  const { isExitModalOpen, closeExitModal, confirmExit } = useMobileBackHandler({
    isHome: activeTab === "operations" || activeTab === "master",
    hasOpenModal: isNoticeModalOpen,
    onCloseModal: () => setIsNoticeModalOpen(false),
    onGoHome: () => handleTabChange("operations"),
  });

  // 4대 메인 세그먼트 탭 정의 (1순위: 셔틀운행계획, 2순위: 통합관제)
  const tabs: { id: AdminTab; labelKr: string; labelCn: string; icon: any }[] = [
    {
      id: "operations",
      labelKr: "셔틀운행계획",
      labelCn: "班车运行计划",
      icon: CalendarCheck2,
    },
    {
      id: "overview",
      labelKr: "통합관제",
      labelCn: "综合监控",
      icon: LayoutDashboard,
    },
    {
      id: "customers",
      labelKr: "고객 관리 및 수납 장부",
      labelCn: "客户管理与财务账簿",
      icon: CreditCard,
    },
    {
      id: "master",
      labelKr: "기본 정책 및 마스터 관리",
      labelCn: "基础政策与主数据管理",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors overflow-x-hidden max-w-full overscroll-x-none touch-pan-y">
      {/* =========================================================================
          1. 관리자 상단 글로벌 헤더 (no-print)
      ========================================================================= */}
      <header className="no-print sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/85 dark:bg-[#0B0F17]/85 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl p-1 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shadow-md shadow-emerald-600/10 shrink-0">
            <img
              src="/images/logo-symbol.png"
              alt="아덴힐 스마트 셔틀 로고"
              className="h-full w-full object-contain drop-shadow-xs"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100">
                아덴힐 스마트 셔틀 ADMIN BACKOFFICE
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 text-[10px] sm:text-xs font-black uppercase">
                TOWER
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold hidden sm:block">
              {isKr
                ? "제주 아덴힐 리조트 스마트 셔틀 4대 종합 관제탑 백오피스"
                : "济州雅顿山度假村智能班车 4大综合管控制塔后台"}
            </p>
          </div>
        </div>

        {/* 우측 액션: 앱 설치, 공지 발행 콤팩트 버튼, 다크/라이트 모드 토글, [KR | CN] 언어 토글 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 홈 화면 앱 설치 버튼 */}
          <InstallAppButton appName="아덴힐 스마트 셔틀 관제탑" variant="header" />

          {/* [📱 앱 설치 QR] 이미지 저장/배포 버튼 */}
          <button
            type="button"
            onClick={() => setIsAppQrModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 squishy-btn shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
            title={isKr ? "고객용 및 기사용 앱 설치 QR코드 이미지 저장 및 배포" : "保存与分发App安装QR码"}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{isKr ? "앱 설치 QR" : "App QR"}</span>
          </button>

          {/* [📢 공지 발행] 콤팩트 버튼 (하단 긴급 센터에서 상단 헤더로 이관) */}
          <button
            type="button"
            onClick={() => setIsNoticeModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 squishy-btn shadow-xs shadow-rose-600/30 transition-all cursor-pointer"
            title={isKr ? "전체 승객 웹 한/중 긴급 팝업 발행" : "发布中韩双语紧急弹窗公告"}
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>{isKr ? "공지 발행" : "发布公告"}</span>
          </button>

          {/* [📱 모바일 기동] 원터치 이동 버튼 */}
          <Link
            href="/admin/mobile"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 squishy-btn shadow-xs transition-all"
            title={isKr ? "스마트폰 모바일 기동 관제탑 전환" : "切换至移动端机动控制台"}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isKr ? "모바일 기동" : "移动端"}</span>
          </Link>

          {/* 다크/라이트 모드 원터치 토글 */}
          <ThemeToggle />

          {/* KR | CN 언어 토글 */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setLang("KR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all squishy-btn ${
                lang === "KR"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              KR
            </button>
            <button
              type="button"
              onClick={() => setLang("CN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all squishy-btn ${
                lang === "CN"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              CN
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. 4대 메인 세그먼트 탭 바 레이아웃 (bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl)
      ========================================================================= */}
      <nav className="no-print w-full bg-slate-50/80 dark:bg-[#0B0F17]/80 border-b border-slate-200/60 dark:border-slate-800/80 sticky top-[69px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap squishy-btn transition-all duration-200 ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <span>{isKr ? tab.labelKr : tab.labelCn}</span>
                  {tab.id === "operations" && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold hidden md:inline">
                      Plan & Log
                    </span>
                  )}
                  {tab.id === "customers" && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-extrabold hidden md:inline">
                      Ledger
                    </span>
                  )}
                  {tab.id === "master" && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold hidden md:inline">
                      Master
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* =========================================================================
          3. 메인 콘텐츠 뷰 영역 (와이드 데스크탑 레이아웃)
      ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 pb-24 overflow-x-hidden">
        {/* [탭 1: 셔틀운행계획] */}
        {activeTab === "operations" && <OperationScheduleManager lang={lang} />}

        {/* [탭 2: 통합관제] */}
        {activeTab === "overview" && (
          <OverviewTab
            lang={lang}
            onOpenNoticeModal={() => setIsNoticeModalOpen(true)}
            onNavigateTab={handleTabChange}
          />
        )}

        {/* [탭 3: 고객 관리 및 수납 장부] */}
        {activeTab === "customers" && <CustomerSettlementHub lang={lang} />}

        {/* [탭 4: 기본 정책 및 마스터 관리] */}
        {activeTab === "master" && <MasterDataManager lang={lang} />}
      </main>

      {/* 4. 동적 긴급 공지 발행 모달 */}
      <NoticePublisherModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        lang={lang}
      />

      {/* 5. 시스템 버전 업데이트 안내 팝업 모달 */}
      <VersionReleaseModal lang={lang} />

      {/* 6. 모바일 뒤로 가기 관제 종료 확인 모달 */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={closeExitModal}
        onConfirm={confirmExit}
        title={isKr ? "아덴힐 관리자 관제를 종료하시겠습니까?" : "确定要退出雅顿山管理控制台吗？"}
        lang={lang}
      />

      {/* 앱 설치 QR코드 이미지 저장 및 배포 모달 */}
      <AppInstallQrModal
        isOpen={isAppQrModalOpen}
        onClose={() => setIsAppQrModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}

export function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F17]">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>관제탑 시스템을 불러오는 중입니다...</span>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
