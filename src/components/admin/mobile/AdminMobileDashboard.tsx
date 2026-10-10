"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Bus,
  Users,
  CreditCard,
  Car,
  Phone,
  PhoneCall,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  X,
  Megaphone,
  Monitor,
  Check,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Language } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthHeaderProfile } from "@/components/auth/AuthHeaderProfile";
import { InstallAppButton } from "@/components/common/InstallAppButton";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import { ExitConfirmModal } from "@/components/common/ExitConfirmModal";
import { NoticePublisherModal } from "@/components/admin/NoticePublisherModal";

// Auth Actions & Types
import {
  getCurrentUserAction,
  getPendingResidentsAction,
  approveResidentAction,
  rejectResidentAction,
  type ResidentAccount,
  type AuthUser,
} from "@/app/actions/auth";

// Server Actions
import {
  getDailyOperationDataAction,
  upsertReservationByAdminAction,
  deleteReservationByAdminAction,
  setAlternativeRouteAction,
  toggleReservationBoardedAction,
  type DailyOperationData,
  type OperationRoundSummary,
  type OperationReservationItem,
} from "@/app/actions/admin-operations";
import {
  getResidentsAction,
  upsertResidentAction,
  deleteResidentAction,
  type ResidentItem,
  type ResidentInput,
} from "@/app/actions/admin-customers";
import {
  getSettlementLedgerAction,
  markAsPaidAction,
  type SettlementLedgerItem,
  type SettlementKPIData,
} from "@/app/actions/admin-settlement";
import {
  getAdminMasterData,
  upsertVehicleAction,
  type VehicleMasterItem,
  type DriverMasterItem,
} from "@/app/actions/admin-master";

export type MobileTab = "operations" | "tower" | "residents" | "settlement" | "fleet";

export function AdminMobileDashboard() {
  const [lang, setLang] = useState<Language>("KR");
  const isKr = lang === "KR";
  const [activeTab, setActiveTab] = useState<MobileTab>("operations");
  const [isPending, startTransition] = useTransition();

  // 날짜 선택기
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-09");

  // 모달 상태들
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isStopoverSheetOpen, setIsStopoverSheetOpen] = useState(false);
  const [selectedRoundForPax, setSelectedRoundForPax] = useState<OperationRoundSummary | null>(null);
  const [expandedRoundKey, setExpandedRoundKey] = useState<string | null>("outbound-1");
  const [isAddRsvModalOpen, setIsAddRsvModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<OperationReservationItem | null>(null);
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<ResidentItem | null>(null);

  // 승차 상태 원터치 토글 핸들러
  const handleToggleBoarded = (rsvId: string) => {
    startTransition(async () => {
      const res = await toggleReservationBoardedAction(rsvId);
      if (res.success && res.data.daily) {
        setOperationsData(res.data.daily);
        if (selectedRoundForPax) {
          const matched = [...res.data.daily.outboundRounds, ...res.data.daily.inboundRounds].find(
            (r) => r.direction === selectedRoundForPax.direction && r.roundNumber === selectedRoundForPax.roundNumber
          );
          if (matched) setSelectedRoundForPax(matched);
        }
      }
    });
  };

  // 1. [운행·예약] 상태
  const [operationsData, setOperationsData] = useState<DailyOperationData | null>(null);
  const [directionFilter, setDirectionFilter] = useState<"all" | "outbound" | "inbound">("all");

  // 2. [입주민] 상태
  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [residentSearchQuery, setResidentSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [residentSubTab, setResidentSubTab] = useState<"approved" | "pending">("approved");
  const [pendingResidents, setPendingResidents] = useState<ResidentAccount[]>([]);

  // 3. [수납] 상태
  const [settlementList, setSettlementList] = useState<SettlementLedgerItem[]>([]);
  const [settlementKpi, setSettlementKpi] = useState<SettlementKPIData | null>(null);

  // 4. [기사·차량] 상태
  const [vehicles, setVehicles] = useState<VehicleMasterItem[]>([]);
  const [drivers, setDrivers] = useState<DriverMasterItem[]>([]);

  // 모바일 뒤로 가기 훅
  const hasOpenSubModal =
    isNoticeModalOpen ||
    isStopoverSheetOpen ||
    Boolean(selectedRoundForPax) ||
    isAddRsvModalOpen ||
    Boolean(editingReservation) ||
    isAddResidentModalOpen ||
    Boolean(editingResident);

  const closeTopModal = () => {
    if (editingReservation) setEditingReservation(null);
    else if (isAddRsvModalOpen) setIsAddRsvModalOpen(false);
    else if (selectedRoundForPax) setSelectedRoundForPax(null);
    else if (isStopoverSheetOpen) setIsStopoverSheetOpen(false);
    else if (editingResident) setEditingResident(null);
    else if (isAddResidentModalOpen) setIsAddResidentModalOpen(false);
    else if (isNoticeModalOpen) setIsNoticeModalOpen(false);
  };

  const { isExitModalOpen, closeExitModal, confirmExit } = useMobileBackHandler({
    isHome: activeTab === "operations" && !hasOpenSubModal,
    hasOpenModal: hasOpenSubModal,
    onCloseModal: closeTopModal,
    onGoHome: () => setActiveTab("operations"),
  });

  // 데이터 로드
  const loadOperations = async (date: string) => {
    const res = await getDailyOperationDataAction(date);
    if (res.success && res.data) {
      setOperationsData(res.data);
    }
  };

  const loadResidents = async (query = "") => {
    const res = await getResidentsAction(query);
    if (res.success && res.data) {
      setResidents(res.data.residents);
    }
  };

  const loadSettlement = async () => {
    const res = await getSettlementLedgerAction({ paymentStatus: "unpaid" });
    if (res.success && res.data) {
      setSettlementList(res.data.records);
      setSettlementKpi(res.data.kpi);
    }
  };

  const loadFleet = async () => {
    const res = await getAdminMasterData();
    if (res.success && res.data) {
      setVehicles(res.data.vehicles);
      setDrivers(res.data.drivers);
    }
  };

  const loadAuthAndPending = async () => {
    const user = await getCurrentUserAction();
    setCurrentUser(user);
    const pendings = await getPendingResidentsAction();
    setPendingResidents(pendings);
  };

  useEffect(() => {
    loadOperations(selectedDate);
    loadAuthAndPending();
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === "residents") {
      loadResidents(residentSearchQuery);
      loadAuthAndPending();
    }
    if (activeTab === "settlement") loadSettlement();
    if (activeTab === "fleet") loadFleet();
  }, [activeTab]);

  // 가입 승인 처리
  const handleApproveResident = (resId: string, name: string) => {
    if (!window.confirm(`${name} 님의 입주민 가입 신청을 정식 승인하시겠습니까?`)) return;
    startTransition(async () => {
      const res = await approveResidentAction(resId);
      if (res.success) {
        alert(res.message);
        await loadAuthAndPending();
        await loadResidents();
      } else {
        alert(res.error);
      }
    });
  };

  // 가입 반려 처리
  const handleRejectResident = (resId: string, name: string) => {
    if (!window.confirm(`${name} 님의 가입 신청을 반려하시겠습니까?`)) return;
    startTransition(async () => {
      const res = await rejectResidentAction(resId);
      if (res.success) {
        alert(res.message);
        await loadAuthAndPending();
      } else {
        alert(res.error);
      }
    });
  };

  // 날짜 이동
  const handleShiftDate = (offsetDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // 경유지 즉시 변경
  const handleSelectStopover = async (newStopover: string) => {
    setIsStopoverSheetOpen(false);
    startTransition(async () => {
      const res = await setAlternativeRouteAction(selectedDate, newStopover);
      if (res.success) {
        await loadOperations(selectedDate);
      }
    });
  };

  // 예약 소프트 딜리트
  const handleDeleteReservation = (rsvId: string) => {
    if (!window.confirm("해당 탑승 예약을 취소하시겠습니까? (소프트 딜리트 처리됩니다)")) return;
    startTransition(async () => {
      const res = await deleteReservationByAdminAction(rsvId, selectedDate);
      if (res.success) {
        await loadOperations(selectedDate);
        if (selectedRoundForPax) {
          const updatedRounds = [
            ...(res.data.daily.outboundRounds || []),
            ...(res.data.daily.inboundRounds || []),
          ];
          const matched = updatedRounds.find(
            (r) =>
              r.direction === selectedRoundForPax.direction &&
              r.roundNumber === selectedRoundForPax.roundNumber
          );
          if (matched) setSelectedRoundForPax(matched);
        }
      }
    });
  };

  // 완납 즉시 처리
  const handleSettlePayment = (recordId: string, name: string) => {
    if (!window.confirm(`${name} 님의 미납 건을 완납(PAID) 처리하시겠습니까?`)) return;
    startTransition(async () => {
      const res = await markAsPaidAction(recordId);
      if (res.success) {
        await loadSettlement();
      }
    });
  };

  // 차량 상태 원터치 토글
  const handleToggleVehicleStatus = (vehicle: VehicleMasterItem) => {
    const nextStatus = vehicle.status === "operational" ? "maintenance" : "operational";
    startTransition(async () => {
      const res = await upsertVehicleAction({
        id: vehicle.id,
        type: vehicle.type,
        plateNumber: vehicle.plateNumber,
        capacity: vehicle.capacity,
        status: nextStatus,
        isActive: true,
      });
      if (res.success) {
        await loadFleet();
      }
    });
  };

  // 회차 목록 필터링
  const displayedRounds = useMemo(() => {
    if (!operationsData) return [];
    let list: OperationRoundSummary[] = [];
    if (directionFilter === "all" || directionFilter === "outbound") {
      list = [...list, ...operationsData.outboundRounds];
    }
    if (directionFilter === "all" || directionFilter === "inbound") {
      list = [...list, ...operationsData.inboundRounds];
    }
    return list;
  }, [operationsData, directionFilter]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen pb-20 bg-slate-50 dark:bg-[#111318] text-slate-900 dark:text-slate-100 overflow-x-hidden relative flex flex-col font-sans select-none overscroll-x-none touch-pan-y">
      {/* =========================================================================
          1. 상단 모바일 슬림 헤더
      ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#151D2A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-2xs overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-xl p-0.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shadow-xs shrink-0">
            <img
              src="/images/logo-symbol.png"
              alt="아덴힐 스마트 셔틀 로고"
              className="h-full w-full object-contain drop-shadow-xs"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">
                아덴힐 관리자
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase shrink-0">
                MOBILE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">현장 긴급 기동 관제탑</p>
          </div>
        </div>

        {/* 우측 빠른 액션 */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 홈 화면 앱 설치 버튼 */}
          <InstallAppButton appName="아덴힐 관리자 모바일" variant="compact" />

          {/* 긴급 공지 발송 버튼 */}
          <button
            type="button"
            onClick={() => setIsNoticeModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 squishy-btn shadow-2xs"
            title="전 승객 긴급 공지 발송"
          >
            <Megaphone className="h-3 w-3" />
            <span>긴급</span>
          </button>

          {/* 테마 토글 */}
          <ThemeToggle />

          {/* PC 관제탑 복귀 링크 */}
          <Link
            href="/admin"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="PC 관제탑 전환"
          >
            <Monitor className="h-4 w-4" />
          </Link>

          {/* 간편 인증 프로필 및 원터치 로그인/로그아웃 모달 */}
          <AuthHeaderProfile />
        </div>
      </header>

      {/* =========================================================================
          2. 모바일 상단 탭: [1. 셔틀운행계획] ↔ [2. 통합관제]
      ========================================================================= */}
      <div className="px-3.5 pt-2.5 pb-0.5">
        <div className="flex gap-1 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab("operations")}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all squishy-btn min-w-0 ${
              activeTab === "operations"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">셔틀운행계획</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tower")}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all squishy-btn min-w-0 ${
              activeTab === "tower"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Bus className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">통합관제</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          3. 메인 뷰포트 바디 (선택된 탭)
      ========================================================================= */}
      <main className="flex-1 p-3.5 space-y-3.5 overflow-x-hidden">
        {/* =======================================================================
            [탭 1] 운행·예약 (현장 긴급 통제 센터)
        ======================================================================= */}
        {activeTab === "operations" && (
          <div className="space-y-3">
            {/* (A) 상단 날짜 및 경유지 스위처 */}
            <div className="bg-white dark:bg-[#151D2A] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleShiftDate(-1)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 squishy-btn"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleShiftDate(1)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 squishy-btn"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate("2026-10-09")}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                >
                  오늘
                </button>
              </div>

              {/* 경유지 긴급 스위칭 배지 */}
              <button
                type="button"
                onClick={() => setIsStopoverSheetOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-between text-amber-700 dark:text-amber-400 squishy-btn transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  <span>오늘의 경유지:</span>
                  <span className="underline decoration-dashed font-extrabold">
                    {operationsData?.stopoverName || "이마트 (정상 운행)"}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  변경 ➔
                </span>
              </button>
            </div>

            {/* 노선 방향 세그먼트 필터 (가로 밀림 방지 min-w-0 truncate 적용) */}
            <div className="flex rounded-xl bg-slate-200/60 dark:bg-slate-800/60 p-1 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setDirectionFilter("all")}
                className={`flex-1 min-w-0 py-1.5 px-1 rounded-lg transition-all squishy-btn text-center truncate ${
                  directionFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                전체 ({operationsData ? operationsData.outboundRounds.length + operationsData.inboundRounds.length : 0})
              </button>
              <button
                type="button"
                onClick={() => setDirectionFilter("outbound")}
                className={`flex-1 min-w-0 py-1.5 px-1 rounded-lg transition-all squishy-btn text-center truncate ${
                  directionFilter === "outbound"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                하행(공항행)
              </button>
              <button
                type="button"
                onClick={() => setDirectionFilter("inbound")}
                className={`flex-1 min-w-0 py-1.5 px-1 rounded-lg transition-all squishy-btn text-center truncate ${
                  directionFilter === "inbound"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                상행(리조트행)
              </button>
            </div>

            {/* 회차별 요약 카드 리스트 */}
            <div className="space-y-2">
              {displayedRounds.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-bold bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200 dark:border-slate-800">
                  선택한 일자의 회차 정보가 없습니다.
                </div>
              ) : (
                displayedRounds.map((round) => {
                  const roundKey = `${round.direction}-${round.roundNumber}`;
                  const isExpanded = expandedRoundKey === roundKey;
                  const isOutbound = round.direction === "outbound";
                  const isCounty = round.totalPax >= 6;
                  return (
                    <div
                      key={roundKey}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isExpanded
                          ? "bg-white dark:bg-[#151D2A] border-emerald-500 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                          : "bg-white dark:bg-[#151D2A] border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300"
                      }`}
                    >
                      {/* 회차 카드 헤더 (터치 시 바로 밑으로 탑승자 명단 아코디언 토글) */}
                      <div
                        onClick={() => setExpandedRoundKey((prev) => (prev === roundKey ? null : roundKey))}
                        className="p-3 cursor-pointer squishy-btn"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                                isOutbound
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800"
                                  : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800"
                              }`}
                            >
                              {isOutbound ? "하행" : "상행"} {round.roundNumber}회차
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1 truncate">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {round.timeText} 출발
                            </span>
                          </div>

                          {/* 탄력 배차 배지 & 아코디언 아이콘 */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                isCounty
                                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isCounty ? <Bus className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                              {isCounty ? "29인승 카운티" : "카니발"}
                            </span>
                            <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        </div>

                        {/* 예약 요약 및 안내 */}
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="font-bold text-slate-600 dark:text-slate-300 truncate">
                            예약: <span className="font-black text-emerald-600 dark:text-emerald-400">{round.totalPax}명</span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              (승차 {round.boardedPax}/{round.totalPax}명)
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                            {isExpanded ? "명단 접기 ▴" : "명단 보기 & 승차 확인 ▾"}
                          </span>
                        </div>
                      </div>

                      {/* =========================================================================
                          [핵심] 해당 시간 바로 밑으로 인라인 노출되는 탑승자 명단 & 승차 버튼
                          ========================================================================= */}
                      {isExpanded && (
                        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              탑승자 명단 ({round.reservations.length}개 팀)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRoundForPax(round);
                                setIsAddRsvModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 squishy-btn"
                            >
                              <Plus className="h-3 w-3" />
                              <span>예약 수기 추가</span>
                            </button>
                          </div>

                          {round.reservations.length === 0 ? (
                            <div className="py-5 text-center text-xs font-bold text-slate-400 bg-white dark:bg-[#151D2A] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                              해당 회차에 예약된 승객이 없습니다.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {round.reservations.map((rsv) => {
                                const isBoarded = rsv.boardedStatus === "boarded";

                                return (
                                  <div
                                    key={rsv.id}
                                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                                      isBoarded
                                        ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80"
                                        : "bg-white dark:bg-[#151D2A] border-slate-200/80 dark:border-slate-800 shadow-2xs"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black shrink-0">
                                            {rsv.pickupLocation}
                                          </span>
                                          <span
                                            className={`font-black text-sm ${
                                              isBoarded ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"
                                            }`}
                                          >
                                            {rsv.passengerName} ({rsv.passengerCount}명)
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                          하차: {rsv.dropoffLocation}
                                        </p>
                                      </div>

                                      {/* 원터치 [승차 완료 / 승차] 토글 버튼 */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleBoarded(rsv.id);
                                        }}
                                        className={`h-9 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1 squishy-btn border transition-all shrink-0 cursor-pointer ${
                                          isBoarded
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20"
                                            : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50"
                                        }`}
                                      >
                                        <Check className={`h-3.5 w-3.5 ${isBoarded ? "text-white" : "text-emerald-600"}`} />
                                        <span>{isBoarded ? "승차 완료" : "승차"}</span>
                                      </button>
                                    </div>

                                    {/* 하단 전화 및 수정/취소 버튼 */}
                                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                                      <a
                                        href={`tel:${rsv.phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1 hover:underline"
                                      >
                                        <PhoneCall className="h-3 w-3" />
                                        <span>{rsv.phone}</span>
                                      </a>

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingReservation(rsv);
                                          }}
                                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-200"
                                        >
                                          수정
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteReservation(rsv.id);
                                          }}
                                          className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold hover:bg-rose-100"
                                        >
                                          취소
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =======================================================================
            [탭 2] 통합관제 (모바일 실시간 관제 종합상황실)
        ======================================================================= */}
        {activeTab === "tower" && (
          <div className="space-y-3">
            {/* 1. 오늘의 종합 운행 관제 KPI */}
            <div className="bg-white dark:bg-[#151D2A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    <Bus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                      실시간 셔틀 운행 현황
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      기준 일자: {selectedDate}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                  정상 가동 중
                </span>
              </div>

              {/* 핵심 지표 4개 그리드 */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">총 운행 회차</span>
                  <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    14회 <span className="text-[10px] text-slate-400 font-normal">(왕복 7회)</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">총 예약 승객</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {operationsData?.grandTotalPax || 0}명
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">하행(공항행)</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {operationsData?.totalOutboundPax || 0}명
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">상행(리조트행)</span>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {operationsData?.totalInboundPax || 0}명
                  </div>
                </div>
              </div>

              {/* 오늘의 경유지 표시 */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                  <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>오늘의 경유지:</span>
                  <span className="font-black underline decoration-dashed">
                    {operationsData?.stopoverName || "이마트 (정상 운행)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStopoverSheetOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] font-black"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 2. 실시간 현장 배차 셔틀 및 기사 연락망 */}
            <div className="bg-white dark:bg-[#151D2A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                  <span>현장 셔틀 기사 실시간 연락망</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">2대 정상 가동</span>
              </div>

              <div className="space-y-2">
                {/* 1호차 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                        1호차
                      </span>
                      <span className="font-black text-xs text-slate-900 dark:text-slate-100 truncate">
                        쏠라티 15인승
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">(제주 70가 1142)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                      담당: 박기사님 (010-1234-5678)
                    </div>
                  </div>
                  <a
                    href="tel:010-1234-5678"
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1 squishy-btn shrink-0 shadow-xs"
                  >
                    <PhoneCall className="h-3 w-3" />
                    <span>통화</span>
                  </a>
                </div>

                {/* 2호차 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-black">
                        2호차
                      </span>
                      <span className="font-black text-xs text-slate-900 dark:text-slate-100 truncate">
                        스타리아 11인승
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">(제주 72바 5501)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                      담당: 김기사님 (010-9876-5432)
                    </div>
                  </div>
                  <a
                    href="tel:010-9876-5432"
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-1 squishy-btn shrink-0 shadow-xs"
                  >
                    <PhoneCall className="h-3 w-3" />
                    <span>통화</span>
                  </a>
                </div>
              </div>
            </div>

            {/* 3. 모바일 비상 액션 및 관제 링크 */}
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>리조트 관제실 유선 직통</span>
                <a href="tel:064-793-0000" className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                  <Phone className="h-3 w-3" /> 064-793-0000
                </a>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(true)}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-1.5 squishy-btn"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>긴급 공지 발송</span>
                </button>
                <Link
                  href="/admin?tab=overview"
                  className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-black flex items-center justify-center gap-1.5 squishy-btn text-center"
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>PC 대화면 관제</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================================
            [탭 2] 입주민 (고객 DB 및 회원 관리)
        ======================================================================= */}
        {activeTab === "residents" && (
          <div className="space-y-3">
            {/* 서브 세그먼트: [전체 입주민] vs [가입 승인 대기] */}
            <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl border border-slate-300/50 dark:border-slate-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setResidentSubTab("approved")}
                className={`flex-1 py-1.5 rounded-lg transition-all squishy-btn flex items-center justify-center gap-1.5 ${
                  residentSubTab === "approved"
                    ? "bg-white dark:bg-[#151D2A] text-slate-900 dark:text-white shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>등록 입주민</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 font-mono">
                  {residents.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setResidentSubTab("pending")}
                className={`flex-1 py-1.5 rounded-lg transition-all squishy-btn flex items-center justify-center gap-1.5 ${
                  residentSubTab === "pending"
                    ? "bg-white dark:bg-[#151D2A] text-rose-600 dark:text-rose-400 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>가입 승인 대기</span>
                {pendingResidents.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono animate-pulse">
                    {pendingResidents.length}
                  </span>
                )}
              </button>
            </div>

            {/* 가입 승인 대기 탭 */}
            {residentSubTab === "pending" && (
              <div className="space-y-2.5">
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-black">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>신규 승객 4자리 PIN 간편 가입 승인 통제</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                    승인 권한은 <strong className="font-bold underline">개발자</strong> 및 <strong className="font-bold underline">관리과장</strong> 계정에만 부여됩니다.
                  </p>
                </div>

                {pendingResidents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-bold bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200 dark:border-slate-800">
                    현재 승인 대기 중인 신규 가입 신청자가 없습니다.
                  </div>
                ) : (
                  pendingResidents.map((pending) => (
                    <div
                      key={pending.id}
                      className="p-3.5 bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-black text-xs border border-amber-300 dark:border-amber-700">
                              {pending.building}
                            </span>
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {pending.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              승인 대기
                            </span>
                          </div>
                          <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 mt-1">
                            {pending.phone}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            신청일시: {new Date(pending.createdAt).toLocaleString("ko-KR")}
                          </div>
                        </div>

                        {/* 통화 바로가기 */}
                        <a
                          href={`tel:${pending.phone}`}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 squishy-btn"
                          title="신청자 확인 통화"
                        >
                          <PhoneCall className="h-4 w-4" />
                        </a>
                      </div>

                      {/* 하단 원클릭 승인 / 반려 버튼 */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                        {currentUser?.canApproveResident ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRejectResident(pending.id, pending.name)}
                              disabled={isPending}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold squishy-btn disabled:opacity-50"
                            >
                              ✕ 반려
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveResident(pending.id, pending.name)}
                              disabled={isPending}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black squishy-btn shadow-xs disabled:opacity-50 flex items-center gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>✓ 즉시 승인</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            승인 권한 없음 (개발자/관리과장 전용)
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 등록 입주민 탭 */}
            {residentSubTab === "approved" && (
              <>
                {/* 상단 검색 & 신규 등록 FAB 버튼 */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="동호수(102동), 성함, 연락처 검색"
                      value={residentSearchQuery}
                      onChange={(e) => {
                        setResidentSearchQuery(e.target.value);
                        loadResidents(e.target.value);
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold placeholder:text-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddResidentModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 squishy-btn shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>등록</span>
                  </button>
                </div>

            {/* 입주민 카드 리스트 */}
            <div className="space-y-2">
              {residents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-bold bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200 dark:border-slate-800">
                  등록된 입주민이 없거나 검색 결과가 없습니다.
                </div>
              ) : (
                residents.map((resident) => (
                  <div
                    key={resident.id}
                    className="p-3 bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800">
                            {resident.building}
                          </span>
                          <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                            {resident.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            탑승 {resident.rideCount}회
                          </span>
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-1">
                          {resident.phone}
                        </div>
                      </div>

                      {/* 원터치 바로 통화 버튼 */}
                      <a
                        href={`tel:${resident.phone}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 squishy-btn shadow-xs hover:bg-emerald-700"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>통화</span>
                      </a>
                    </div>

                    {/* 하단 관리 버튼 */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                        {resident.memo || "특이사항 없음"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingResident(resident)}
                          className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`${resident.name} 입주민을 비활성화(삭제)하시겠습니까?`)) {
                              startTransition(async () => {
                                await deleteResidentAction(resident.id);
                                loadResidents(residentSearchQuery);
                              });
                            }
                          }}
                          className="px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-[10px]"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    )}

        {/* =======================================================================
            [탭 3] 수납 (모바일 간편 정산 장부)
        ======================================================================= */}
        {activeTab === "settlement" && (
          <div className="space-y-3">
            {/* 상단 미납액 요약 카드 */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                현재 총 미납액 (수납 대기)
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black tabular-nums">
                  ₩{new Intl.NumberFormat("ko-KR").format(settlementKpi?.totalUnpaidAmount || 45000)}
                </div>
                <div className="text-xs font-bold">
                  총 {settlementList.length}건 미납 대기
                </div>
              </div>
            </div>

            {/* 미납자 리스트 */}
            <div className="space-y-2">
              {settlementList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-bold bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200 dark:border-slate-800">
                  미납 내역이 없습니다. (모두 완납되었습니다)
                </div>
              ) : (
                settlementList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            {item.building}
                          </span>
                          <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                            {item.passengerName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.date} · {item.time} ({item.route})
                        </div>
                        <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                          ₩{new Intl.NumberFormat("ko-KR").format(item.fareAmount)}
                        </div>
                      </div>

                      {/* 대형 완납 처리 버튼 */}
                      <button
                        type="button"
                        onClick={() => handleSettlePayment(item.id, item.passengerName)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 squishy-btn shadow-xs"
                      >
                        <Check className="h-4 w-4" />
                        <span>완납 처리</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>연락처: {item.phone}</span>
                      <a href={`tel:${item.phone}`} className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        <Phone className="h-3 w-3" /> 통화
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =======================================================================
            [탭 4] 기사·차량 (현장 인력/차량 통제)
        ======================================================================= */}
        {activeTab === "fleet" && (
          <div className="space-y-3">
            {/* 1. 오늘 운행 기사 카드 */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                오늘 운행 담당 기사
              </div>
              <div className="space-y-2">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-3 bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {driver.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {driver.phone}
                      </div>
                    </div>

                    <a
                      href={`tel:${driver.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 squishy-btn shadow-xs"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      <span>기사님께 통화</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 셔틀 차량 운행 가능 ↔ 점검 중 원터치 토글 */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                셔틀 차량 정비/운행 상태 토글
              </div>
              <div className="space-y-2">
                {vehicles.map((veh) => {
                  const isOperational = veh.status === "operational";
                  return (
                    <div
                      key={veh.id}
                      className="p-3 bg-white dark:bg-[#151D2A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                            {veh.type === "carnival" ? "카니발 리무진" : "29인승 카운티"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            ({veh.plateNumber})
                          </span>
                        </div>
                        <div className="text-[11px] font-bold mt-0.5">
                          {isOperational ? (
                            <span className="text-emerald-600 dark:text-emerald-400">● 운행 가능 (정상)</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400">▲ 정비 점검 중 (배차 제한)</span>
                          )}
                        </div>
                      </div>

                      {/* 상태 토글 스위치 버튼 */}
                      <button
                        type="button"
                        onClick={() => handleToggleVehicleStatus(veh)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs squishy-btn transition-colors ${
                          isOperational
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {isOperational ? "점검으로 전환" : "운행 가능 복귀"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          3. 하단 고정 바텀 탭 네비게이션 (높이 60px, 모바일 가로 밀림 방지)
      ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white/95 dark:bg-[#151D2A]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 h-[60px] flex items-center justify-around px-1.5 shadow-lg overscroll-none">
        <button
          type="button"
          onClick={() => setActiveTab("operations")}
          className={`flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === "operations"
              ? "text-emerald-600 dark:text-emerald-400 font-black"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          }`}
          title="셔틀운행계획"
        >
          <Calendar className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">운행계획</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tower")}
          className={`flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === "tower"
              ? "text-emerald-600 dark:text-emerald-400 font-black"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          }`}
          title="통합관제"
        >
          <Bus className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">통합관제</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("residents")}
          className={`flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === "residents"
              ? "text-emerald-600 dark:text-emerald-400 font-black"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          }`}
          title="입주민"
        >
          <Users className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">입주민</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settlement")}
          className={`flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === "settlement"
              ? "text-emerald-600 dark:text-emerald-400 font-black"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          }`}
          title="수납"
        >
          <CreditCard className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">수납</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("fleet")}
          className={`flex-1 min-w-0 py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === "fleet"
              ? "text-emerald-600 dark:text-emerald-400 font-black"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          }`}
          title="기사·차량"
        >
          <Car className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] truncate max-w-full">차량</span>
        </button>
      </nav>

      {/* =========================================================================
          4. 모달: 경유지 긴급 스위칭 바텀시트
      ========================================================================= */}
      {isStopoverSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md bg-white dark:bg-[#151D2A] rounded-t-3xl p-5 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-500" />
                <span>오늘의 경유지 즉시 변경</span>
              </div>
              <button
                type="button"
                onClick={() => setIsStopoverSheetOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { name: "이마트 (정상 운행)", badge: "기본 노선" },
                { name: "제주민속오일장", badge: "2·7일 장날" },
                { name: "동문재래시장", badge: "대체 쇼핑" },
                { name: "직통 (경유 없음)", badge: "공항 직통" },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleSelectStopover(item.name)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-left space-y-1 squishy-btn bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    {item.badge}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. 모달: 회차별 탑승자 명단 바텀시트
      ========================================================================= */}
      {selectedRoundForPax && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md max-h-[85vh] bg-white dark:bg-[#151D2A] rounded-t-3xl p-4 flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <div className="font-black text-sm text-slate-900 dark:text-slate-100">
                  {selectedRoundForPax.direction === "outbound" ? "하행" : "상행"}{" "}
                  {selectedRoundForPax.roundNumber}회차 ({selectedRoundForPax.timeText})
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  총 예약 승객: {selectedRoundForPax.totalPax}명
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRsvModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 squishy-btn shadow-xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>예약 추가</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoundForPax(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 승객 목록 */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {selectedRoundForPax.reservations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-bold">
                  해당 회차에 예약된 승객이 없습니다.
                </div>
              ) : (
                selectedRoundForPax.reservations.map((rsv) => (
                  <div
                    key={rsv.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            {rsv.pickupLocation}
                          </span>
                          <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                            {rsv.passengerName} ({rsv.passengerCount}명)
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          하차: {rsv.dropoffLocation}
                        </div>
                      </div>

                      {/* 원터치 전화 걸기 버튼 */}
                      <a
                        href={`tel:${rsv.phone}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 squishy-btn shadow-xs"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>전화</span>
                      </a>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 text-[11px]">{rsv.phone}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingReservation(rsv)}
                          className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReservation(rsv.id)}
                          className="px-2 py-1 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-bold"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. 모달: 예약 수기 추가 모달 (현장/전화 즉시 접수)
      ========================================================================= */}
      {isAddRsvModalOpen && selectedRoundForPax && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#151D2A] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="font-black text-sm text-slate-900 dark:text-slate-100">
                예약 수기 추가 ({selectedRoundForPax.roundNumber}회차)
              </div>
              <button
                type="button"
                onClick={() => setIsAddRsvModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem("name") as HTMLInputElement).value;
                const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
                const count = parseInt((form.elements.namedItem("count") as HTMLInputElement).value, 10);
                const pickup = (form.elements.namedItem("pickup") as HTMLInputElement).value;
                const dropoff = (form.elements.namedItem("dropoff") as HTMLInputElement).value;

                startTransition(async () => {
                  const res = await upsertReservationByAdminAction({
                    date: selectedDate,
                    direction: selectedRoundForPax.direction,
                    roundNumber: selectedRoundForPax.roundNumber,
                    timeText: selectedRoundForPax.timeText,
                    passengerName: name,
                    phone,
                    passengerCount: count,
                    pickupLocation: pickup,
                    dropoffLocation: dropoff,
                    paymentStatus: "paid",
                    boardedStatus: "waiting",
                    notes: "모바일 현장 수기 등록",
                  });
                  if (res.success) {
                    setIsAddRsvModalOpen(false);
                    await loadOperations(selectedDate);
                    setSelectedRoundForPax(null);
                  }
                });
              }}
              className="space-y-2.5 text-xs font-bold"
            >
              <div>
                <label className="text-slate-500">승객 성함</label>
                <input
                  name="name"
                  required
                  placeholder="예: 홍길동"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500">연락처</label>
                <input
                  name="phone"
                  required
                  placeholder="010-0000-0000"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500">탑승 인원</label>
                  <input
                    name="count"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-500">승차 위치 (동수)</label>
                  <input
                    name="pickup"
                    required
                    defaultValue="102동 앞"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-500">하차 희망지</label>
                <input
                  name="dropoff"
                  required
                  defaultValue={selectedRoundForPax.direction === "outbound" ? "제주공항 3층" : "아덴힐 102동"}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRsvModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  {isPending ? "저장 중..." : "즉시 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. 모달: 신규 입주민 등록 모달
      ========================================================================= */}
      {isAddResidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#151D2A] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="font-black text-sm text-slate-900 dark:text-slate-100">
                신규 입주민 직접 등록
              </div>
              <button
                type="button"
                onClick={() => setIsAddResidentModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const building = (form.elements.namedItem("building") as HTMLInputElement).value;
                const name = (form.elements.namedItem("name") as HTMLInputElement).value;
                const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
                const memo = (form.elements.namedItem("memo") as HTMLInputElement).value;

                startTransition(async () => {
                  const res = await upsertResidentAction({
                    building,
                    name,
                    phone,
                    memo,
                    registerType: "manual",
                  });
                  if (res.success) {
                    setIsAddResidentModalOpen(false);
                    loadResidents(residentSearchQuery);
                  }
                });
              }}
              className="space-y-2.5 text-xs font-bold"
            >
              <div>
                <label className="text-slate-500">동/호수</label>
                <input
                  name="building"
                  required
                  placeholder="예: 112동 또는 112동 301호"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500">고객 성함</label>
                <input
                  name="name"
                  required
                  placeholder="예: 박서연"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500">연락처</label>
                <input
                  name="phone"
                  required
                  placeholder="010-0000-0000"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500">특이사항/메모</label>
                <input
                  name="memo"
                  placeholder="예: 출퇴근 단골, 골프백 이용"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-1"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddResidentModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  {isPending ? "등록 중..." : "등록 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. 공통 모달: 긴급 공지 발행 모달
      ========================================================================= */}
      <NoticePublisherModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        lang={lang}
      />

      {/* =========================================================================
          9. 공통 모달: 모바일 이탈 확인 모달
      ========================================================================= */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={closeExitModal}
        onConfirm={confirmExit}
        title="관리자 기동 관제를 종료하시겠습니까?"
        lang={lang}
      />
    </div>
  );
}
