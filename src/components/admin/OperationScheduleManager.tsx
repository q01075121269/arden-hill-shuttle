"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Calendar,
  Clock,
  Printer,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Bus,
  Car,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Store,
  Sparkles,
  ArrowRight,
  X,
  RefreshCw,
  Check,
  Settings2,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import { Language } from "@/types";
import {
  getDailyOperationDataAction,
  upsertReservationByAdminAction,
  deleteReservationByAdminAction,
  setAlternativeRouteAction,
  getMonthlyRouteScheduleAction,
  toggleReservationBoardedAction,
  updateOperationRoundAction,
  addOperationRoundAction,
  deleteOperationRoundAction,
  type DailyOperationData,
  type OperationRoundSummary,
  type OperationReservationItem,
} from "@/app/actions/admin-operations";
import { DailyLogPrint } from "@/components/admin/DailyLogPrint";

interface OperationScheduleManagerProps {
  lang: Language;
}

type SubTab = "daily" | "monthly";

export function OperationScheduleManager({ lang }: OperationScheduleManagerProps) {
  const isKr = lang === "KR";
  const [subTab, setSubTab] = useState<SubTab>("daily");
  const [isPending, startTransition] = useTransition();

  // 1. 날짜 상태 (기본값: 오늘 2026-10-09)
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-09");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2. 일일 운행 데이터 상태
  const [dailyData, setDailyData] = useState<DailyOperationData | null>(null);
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({
    "outbound-1": true,
    "outbound-2": true,
    "inbound-1": true,
  });

  // 3. 예약 수기 추가/수정 모달 상태
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<OperationReservationItem | null>(null);
  const [reservationForm, setReservationForm] = useState<{
    id?: string;
    date: string;
    direction: "outbound" | "inbound";
    roundNumber: number;
    timeText: string;
    pickupLocation: string;
    dropoffLocation: string;
    passengerName: string;
    phone: string;
    passengerCount: number;
    paymentStatus: "paid" | "unpaid";
    boardedStatus: "boarded" | "waiting";
    notes?: string;
  }>({
    date: "2026-10-09",
    direction: "outbound",
    roundNumber: 1,
    timeText: "08:10",
    pickupLocation: "102동 앞",
    dropoffLocation: "제주공항 3층",
    passengerName: "",
    phone: "",
    passengerCount: 1,
    paymentStatus: "unpaid",
    boardedStatus: "waiting",
    notes: "",
  });

  // 4. 예약 소프트 딜리트 확인 모달 상태
  const [deleteTargetReservation, setDeleteTargetReservation] = useState<OperationReservationItem | null>(null);

  // 5. 월간 대체 노선 상태 및 모달
  const [monthlyRoutes, setMonthlyRoutes] = useState<Record<string, string>>({});
  const [routeModalDate, setRouteModalDate] = useState<string | null>(null);
  const [selectedRouteName, setSelectedRouteName] = useState<string>("이마트 (기본)");

  // 6. [우발상황] 회차 배차 및 시간 수정 모달 상태
  const [isEditRoundModalOpen, setIsEditRoundModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<{
    direction: "outbound" | "inbound";
    roundNumber: number;
    timeText: string;
    allocatedVehicleType: "carnival" | "county" | "large_bus";
    vehiclePlate: string;
    overrideReason: string;
  } | null>(null);

  // 7. [우발상황] 임시 증편 회차 추가 모달 상태
  const [isAddRoundModalOpen, setIsAddRoundModalOpen] = useState(false);
  const [newRoundForm, setNewRoundForm] = useState<{
    direction: "outbound" | "inbound";
    timeText: string;
    allocatedVehicleType: "carnival" | "county" | "large_bus";
    vehiclePlate: string;
    overrideReason: string;
  }>({
    direction: "outbound",
    timeText: "21:30",
    allocatedVehicleType: "carnival",
    vehiclePlate: "제주 70가 1142 (카니발)",
    overrideReason: "우발상황/비상 임시 증편",
  });

  // 8. [우발상황] 회차 삭제/운행 취소 확인 모달 상태
  const [deleteTargetRound, setDeleteTargetRound] = useState<{
    direction: "outbound" | "inbound";
    roundNumber: number;
    timeText: string;
  } | null>(null);

  // 데이터 로딩
  const loadDailyData = async (date: string) => {
    const res = await getDailyOperationDataAction(date);
    if (res.success && res.data) {
      setDailyData(res.data);
    }
  };

  const loadMonthlySchedule = async () => {
    const res = await getMonthlyRouteScheduleAction("2026-10");
    if (res.success && res.data) {
      setMonthlyRoutes(res.data.routes);
    }
  };

  useEffect(() => {
    loadDailyData(selectedDate);
    loadMonthlySchedule();
  }, [selectedDate]);

  // 피드백 타이머
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // 전화번호 포맷터
  const formatPhoneNumber = (value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    if (clean.length < 4) return clean;
    if (clean.length < 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    if (clean.length < 11) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
  };

  // 날짜 퀵 버튼 핸들러
  const handleQuickDate = (offset: number) => {
    const base = new Date(selectedDate);
    base.setDate(base.getDate() + offset);
    const newDateStr = base.toISOString().slice(0, 10);
    setSelectedDate(newDateStr);
  };

  // 회차 펼침/접힘 토글
  const toggleRoundExpand = (key: string) => {
    setExpandedRounds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // =========================================================================
  // 서브 탭 A: 예약 등록 및 수정 핸들러
  // =========================================================================
  const openNewReservationModal = (direction: "outbound" | "inbound", roundNum: number, timeStr: string) => {
    setEditingReservation(null);
    setReservationForm({
      date: selectedDate,
      direction,
      roundNumber: roundNum,
      timeText: timeStr,
      pickupLocation: direction === "outbound" ? "102동 앞" : "제주공항 3층 5번 게이트",
      dropoffLocation: direction === "outbound" ? "제주공항 3층" : "아덴힐 커뮤니티 센터",
      passengerName: "",
      phone: "",
      passengerCount: 1,
      paymentStatus: "unpaid",
      boardedStatus: "waiting",
      notes: "관리자 유선 수기 접수",
    });
    setIsReservationModalOpen(true);
  };

  const openEditReservationModal = (item: OperationReservationItem) => {
    setEditingReservation(item);
    setReservationForm({
      id: item.id,
      date: item.date,
      direction: item.direction,
      roundNumber: item.roundNumber,
      timeText: item.timeText,
      pickupLocation: item.pickupLocation,
      dropoffLocation: item.dropoffLocation,
      passengerName: item.passengerName,
      phone: item.phone,
      passengerCount: item.passengerCount,
      paymentStatus: item.paymentStatus,
      boardedStatus: item.boardedStatus,
      notes: item.notes || "",
    });
    setIsReservationModalOpen(true);
  };

  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationForm.passengerName.trim() || !reservationForm.phone.trim()) {
      setFeedback({ type: "error", text: isKr ? "승객 성함과 연락처를 입력해주세요." : "请填写姓名和电话。" });
      return;
    }

    startTransition(async () => {
      const res = await upsertReservationByAdminAction({
        ...reservationForm,
        passengerCount: Number(reservationForm.passengerCount),
        isActive: true,
      });

      if (res.success) {
        setDailyData(res.data.daily);
        setIsReservationModalOpen(false);
        setFeedback({
          type: "success",
          text: isKr
            ? `${reservationForm.passengerName} 님의 예약이 저장되고 탄력 배차가 자동 갱신되었습니다.`
            : "预订已更新并同步弹性排班。",
        });
      } else {
        setFeedback({ type: "error", text: res.error || "예약 저장 실패" });
      }
    });
  };

  // 예약 소프트 딜리트 핸들러
  const handleConfirmDeleteReservation = () => {
    if (!deleteTargetReservation) return;

    startTransition(async () => {
      const res = await deleteReservationByAdminAction(deleteTargetReservation.id, selectedDate);
      if (res.success) {
        setDailyData(res.data.daily);
        setFeedback({
          type: "success",
          text: isKr
            ? `${deleteTargetReservation.passengerName} 님의 예약이 취소(소프트 딜리트)되었습니다.`
            : "预订已取消并记录审计日志。",
        });
      } else {
        setFeedback({ type: "error", text: res.error || "취소 실패" });
      }
      setDeleteTargetReservation(null);
    });
  };

  // 예약 승차 상태 원터치 토글 핸들러
  const handleToggleBoarded = (reservationId: string) => {
    startTransition(async () => {
      const res = await toggleReservationBoardedAction(reservationId);
      if (res.success) {
        if (res.data.daily) {
          setDailyData(res.data.daily);
        }
        setFeedback({
          type: "success",
          text: isKr ? "탑승 승차 상태가 성공적으로 변경되었습니다." : "乘车状态已更新。",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || (isKr ? "승차 상태 변경 실패" : "更新失败"),
        });
      }
    });
  };

  // =========================================================================
  // 서브 탭 A-1: 우발상황 대응 - 회차 수정, 추가, 삭제 핸들러
  // =========================================================================
  const openEditRoundModal = (round: OperationRoundSummary) => {
    setEditingRound({
      direction: round.direction,
      roundNumber: round.roundNumber,
      timeText: round.timeText,
      allocatedVehicleType: round.allocatedVehicleType,
      vehiclePlate: round.vehiclePlate,
      overrideReason: round.overrideReason || "",
    });
    setIsEditRoundModalOpen(true);
  };

  const handleSaveRoundEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRound) return;

    startTransition(async () => {
      const res = await updateOperationRoundAction({
        date: selectedDate,
        ...editingRound,
      });
      if (res.success) {
        setDailyData(res.data.daily);
        setIsEditRoundModalOpen(false);
        setFeedback({
          type: "success",
          text: isKr
            ? `${editingRound.roundNumber}회차 운행 정보(시간: ${editingRound.timeText}, 차종)가 성공적으로 수정되었습니다.`
            : "班次信息已更新。",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || (isKr ? "회차 수정 실패" : "更新失败"),
        });
      }
    });
  };

  const openAddRoundModal = (direction: "outbound" | "inbound") => {
    setNewRoundForm({
      direction,
      timeText: direction === "outbound" ? "21:30" : "20:30",
      allocatedVehicleType: "carnival",
      vehiclePlate: "제주 70가 1142 (카니발)",
      overrideReason: "우발상황/비상 임시 증편",
    });
    setIsAddRoundModalOpen(true);
  };

  const handleSaveNewRound = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addOperationRoundAction({
        date: selectedDate,
        ...newRoundForm,
      });
      if (res.success) {
        setDailyData(res.data.daily);
        setIsAddRoundModalOpen(false);
        setFeedback({
          type: "success",
          text: isKr
            ? `[${newRoundForm.direction === "outbound" ? "하행" : "상행"}] ${res.data.addedRoundNumber}회차(${newRoundForm.timeText}) 임시 증편이 완료되었습니다.`
            : "临时班次已新增。",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || (isKr ? "회차 추가 실패" : "添加失败"),
        });
      }
    });
  };

  const handleConfirmDeleteRound = () => {
    if (!deleteTargetRound) return;
    startTransition(async () => {
      const res = await deleteOperationRoundAction({
        date: selectedDate,
        direction: deleteTargetRound.direction,
        roundNumber: deleteTargetRound.roundNumber,
      });
      if (res.success) {
        setDailyData(res.data.daily);
        setDeleteTargetRound(null);
        setFeedback({
          type: "success",
          text: isKr
            ? `${deleteTargetRound.roundNumber}회차 운행이 취소/삭제되었습니다.`
            : "班次已取消/삭제。",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || (isKr ? "회차 삭제 실패" : "删除失败"),
        });
      }
    });
  };

  // =========================================================================
  // 서브 탭 B: 대체 노선 설정 핸들러
  // =========================================================================
  const openRouteModal = (dateStr: string) => {
    setRouteModalDate(dateStr);
    setSelectedRouteName(monthlyRoutes[dateStr] || "이마트 (기본)");
  };

  const handleSaveAlternativeRoute = () => {
    if (!routeModalDate) return;

    startTransition(async () => {
      const res = await setAlternativeRouteAction(routeModalDate, selectedRouteName);
      if (res.success) {
        await loadMonthlySchedule();
        if (routeModalDate === selectedDate) {
          await loadDailyData(selectedDate);
        }
        setFeedback({
          type: "success",
          text: isKr
            ? `${routeModalDate} 경유지가 [${selectedRouteName}] (으)로 변경되었습니다.`
            : "经停站点已更新并实时同步。",
        });
      } else {
        setFeedback({ type: "error", text: res.error || "경유지 변경 실패" });
      }
      setRouteModalDate(null);
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 상단 알림 배너 */}
      {feedback && (
        <div
          className={`no-print p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-bold">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 헤더 섹션 정보 카드 (no-print) */}
      <div className="no-print bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider">
                OPERATIONS & SCHEDULE
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Store className="h-3.5 w-3.5 text-emerald-500" />
                {isKr ? "오늘의 경유지" : "今日经停"}:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {dailyData?.stopoverName || "이마트 (정상 운행)"}
                </strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isKr ? "운행 계획 및 예약·일지 관리" : "运行计划与预订·日志管理"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
              {isKr
                ? "일일 회차별 실시간 탄력 배차(카니발/카운티), 예약 인라인 수정, 공식 A4 운행일지 출력 및 월간 대체 노선을 관리합니다."
                : "管理各班次弹性排班、预约名单维护、官方A4运行日志输出及月度替代线路。"}
            </p>
          </div>

          {/* 서브 탭 A / B 스위처 (Bento Grid 세그먼트 컨트롤) */}
          <div className="flex p-1.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSubTab("daily")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all squishy-btn ${
                subTab === "daily"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{isKr ? "서브 탭 A: 1일 배차 & 예약 일지" : "日排班·预订日志"}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab("monthly")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all squishy-btn ${
                subTab === "monthly"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{isKr ? "서브 탭 B: 월간 노선 캘린더" : "月度路线日历"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          서브 탭 A: [1일 운행 배차 & 탑승 예약 관리 (A4 일지 인쇄 포함)]
      ========================================================================= */}
      {subTab === "daily" && (
        <div className="space-y-8">
          {/* (1) 상단 날짜 선택 바 & A4 인쇄 액션 바 (no-print) */}
          <div className="no-print bg-white dark:bg-[#111622] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  {isKr ? "운행 기준 일자" : "运营基准日"}
                </span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {/* 퀵 날짜 버튼 */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleQuickDate(-1)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                >
                  {isKr ? "어제" : "昨日"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate("2026-10-09")}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs"
                >
                  {isKr ? "오늘" : "今日"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(1)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                >
                  {isKr ? "내일" : "明日"}
                </button>
              </div>

              {/* 당일 대체 경유지 현황 뱃지 */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-black">
                <Store className="h-3.5 w-3.5" />
                <span>
                  오늘의 경유지: <strong>[{dailyData?.stopoverName || "이마트 (정상 운행)"}]</strong>
                </span>
              </div>
            </div>

            {/* 우측 상단 대형 고대비 A4 인쇄 버튼 */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all squishy-btn shrink-0"
            >
              <Printer className="h-5 w-5" />
              <span>{isKr ? "🖨️ 공식 일일 운행일지 A4 인쇄 / PDF 저장" : "🖨️ 打印标准A4日志 / 导出PDF"}</span>
            </button>
          </div>

          {/* (2) 양방향 1일 시간표 & 회차별 승객 인라인 CRUD (no-print) */}
          <div className="no-print space-y-6">
            {/* 섹션 1: 아덴힐 ➔ 제주공항 방면 (하행 1~6회차) */}
            <div className="bg-white dark:bg-[#111622] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {isKr ? "아덴힐 리조트 ➔ 제주공항 방면 (하행 1~6회차)" : "雅顿山度假村 ➔ 济州机场 (下行 1~6班次)"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      5인 이하 [카니발] / 6인 이상 [29인승 카운티] 탄력 배차 자동 적용
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                    총 예약 {dailyData?.totalOutboundPax || 0}명
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddRoundModal("outbound")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs squishy-btn"
                    title="우발상황/단체 긴급 임시 증편 회차 추가"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isKr ? "+ 임시/우발 회차 증편" : "+ 增开临时班次"}</span>
                  </button>
                </div>
              </div>

              {/* 회차 리스트 그리드 */}
              <div className="space-y-3">
                {dailyData?.outboundRounds.map((round) => {
                  const key = `outbound-${round.roundNumber}`;
                  const isExpanded = !!expandedRounds[key];
                  const isCounty = round.allocatedVehicleType === "county";
                  const isLargeBus = round.allocatedVehicleType === "large_bus";
                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 overflow-hidden"
                    >
                      {/* 회차 헤더 요약 바 (시간/행 클릭 시 바로 밑으로 탑승자 명단 펼침) */}
                      <div
                        onClick={() => toggleRoundExpand(key)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRoundExpand(key);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title={isExpanded ? "명단 접기" : "명단 펼치기"}
                          >
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </button>
                          <div className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5 flex-wrap">
                            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{round.roundNumber}회차 ({round.timeText})</span>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              {isExpanded ? "명단 접기 ▴" : "클릭 시 탑승자 명단 & 승차 버튼 보기 ▾"}
                            </span>
                          </div>

                          {/* 차종 배지 */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${
                              isLargeBus
                                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                : isCounty
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            }`}
                          >
                            {isLargeBus ? <Bus className="h-3.5 w-3.5" /> : isCounty ? <Bus className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
                            <span>
                              {isLargeBus ? "🚍 45인승 대형 배정" : isCounty ? "🚌 29인승 카운티 배정" : "🚗 카니발 배정"}
                            </span>
                          </span>

                          {/* 관리자 수동 변경 또는 임시 증편 뱃지 */}
                          {round.isManualOverride && (
                            <span
                              className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black"
                              title={round.overrideReason || "관리자 수동 변경"}
                            >
                              ⚙️ 우발 수동 지정 {round.overrideReason ? `(${round.overrideReason})` : ""}
                            </span>
                          )}
                          {round.isCustomAdded && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-black">
                              ⚡ 임시 증편
                            </span>
                          )}
                        </div>

                        {/* 우측 관리 액션 버튼들 (우발상황 수정 / 예약 추가 / 회차 삭제) */}
                        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">
                            예약 <strong>{round.totalPax}명</strong> (탑승 완료 {round.boardedPax}명)
                          </span>

                          {/* 1. 우발상황 시간/차종 변경 버튼 */}
                          <button
                            type="button"
                            onClick={() => openEditRoundModal(round)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs squishy-btn border border-slate-200 dark:border-slate-700"
                            title="출발 시간 및 차종 변경 (우발상황 대응)"
                          >
                            <Settings2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>{isKr ? "시간·차종 변경" : "调整时间/车型"}</span>
                          </button>

                          {/* 2. 예약 수기 추가 버튼 */}
                          <button
                            type="button"
                            onClick={() => openNewReservationModal("outbound", round.roundNumber, round.timeText)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs squishy-btn"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isKr ? "예약 수기 추가" : "人工添加"}</span>
                          </button>

                          {/* 3. 회차 삭제 버튼 */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetRound(round)}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 squishy-btn"
                            title={isKr ? "회차 운행 취소/삭제" : "删除班次"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 펼쳐진 승객 명단 인라인 테이블 */}
                      {isExpanded && (
                        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800 overflow-x-auto bg-slate-50/70 dark:bg-slate-900/60">
                          {round.reservations.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              {isKr ? "현재 등록된 예약 승객이 없습니다." : "当前无预约乘客。"}
                            </div>
                          ) : (
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                                  <th className="py-2 px-3">{isKr ? "승차 위치(동수)" : "乘车位置"}</th>
                                  <th className="py-2 px-3">{isKr ? "고객 성함" : "姓名"}</th>
                                  <th className="py-2 px-3">{isKr ? "연락처" : "电话"}</th>
                                  <th className="py-2 px-3 text-center">{isKr ? "인원" : "人数"}</th>
                                  <th className="py-2 px-3">{isKr ? "하차 희망지" : "下车地点"}</th>
                                  <th className="py-2 px-3 text-center">{isKr ? "수납 상태" : "支付"}</th>
                                  <th className="py-2 px-3 text-center">{isKr ? "원터치 승차 버튼" : "登车操作"}</th>
                                  <th className="py-2 px-3 text-right">{isKr ? "관리 액션" : "操作"}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                                {round.reservations.map((res) => {
                                  const isBoarded = res.boardedStatus === "boarded";
                                  return (
                                    <tr
                                      key={res.id}
                                      className={`transition-colors ${
                                        isBoarded
                                          ? "bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                          : "hover:bg-white dark:hover:bg-slate-800/40"
                                      }`}
                                    >
                                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black">
                                          {res.pickupLocation}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 font-black text-slate-800 dark:text-slate-200">
                                        <span className={isBoarded ? "line-through text-slate-400" : ""}>
                                          {res.passengerName}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-500">
                                        {res.phone}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-bold">
                                        {res.passengerCount}명
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                        {res.dropoffLocation}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                            res.paymentStatus === "paid"
                                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                              : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                                          }`}
                                        >
                                          {res.paymentStatus === "paid" ? "완납" : "미납"}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        {/* 원터치 [승차 완료 / 승차] 토글 버튼 */}
                                        <button
                                          type="button"
                                          disabled={isPending}
                                          onClick={() => handleToggleBoarded(res.id)}
                                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all squishy-btn border shadow-2xs cursor-pointer ${
                                            isBoarded
                                              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                              : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                          }`}
                                          title={
                                            isBoarded
                                              ? "클릭 시 승차 취소 (대기 상태로 변경)"
                                              : "클릭 시 즉시 승차 완료 처리"
                                          }
                                        >
                                          <Check className={`h-3.5 w-3.5 ${isBoarded ? "text-white stroke-[3]" : "text-emerald-600"}`} />
                                          <span>{isBoarded ? "승차 완료" : "승차"}</span>
                                        </button>
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() => openEditReservationModal(res)}
                                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                            title={isKr ? "예약 수정" : "修改"}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteTargetReservation(res)}
                                            className="p-1 rounded-md text-rose-400 hover:text-rose-600"
                                            title={isKr ? "예약 삭제" : "删除"}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 섹션 2: 제주공항 ➔ 아덴힐 리조트 방면 (상행 1~5회차) */}
            <div className="bg-white dark:bg-[#111622] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                    <ArrowRight className="h-5 w-5 rotate-180" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {isKr ? "제주공항 ➔ 아덴힐 리조트 방면 (상행 1~5회차)" : "济州机场 ➔ 雅顿山度假村 (上行 1~5班次)"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      공항 3층 5번 게이트 앞 탑승 인원 집계 및 탄력 배차 자동 적용
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-sky-600 dark:text-sky-400 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800">
                    총 예약 {dailyData?.totalInboundPax || 0}명
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddRoundModal("inbound")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-xs squishy-btn"
                    title="우발상황/단체 긴급 임시 증편 회차 추가"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isKr ? "+ 임시/우발 회차 증편" : "+ 增开临时班次"}</span>
                  </button>
                </div>
              </div>

              {/* 회차 리스트 그리드 */}
              <div className="space-y-3">
                {dailyData?.inboundRounds.map((round) => {
                  const key = `inbound-${round.roundNumber}`;
                  const isExpanded = !!expandedRounds[key];
                  const isCounty = round.allocatedVehicleType === "county";
                  const isLargeBus = round.allocatedVehicleType === "large_bus";
                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 overflow-hidden"
                    >
                      {/* 회차 헤더 요약 바 (시간/행 클릭 시 바로 밑으로 탑승자 명단 펼침) */}
                      <div
                        onClick={() => toggleRoundExpand(key)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRoundExpand(key);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title={isExpanded ? "명단 접기" : "명단 펼치기"}
                          >
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </button>
                          <div className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5 flex-wrap">
                            <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            <span>{round.roundNumber}회차 ({round.timeText})</span>
                            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                              {isExpanded ? "명단 접기 ▴" : "클릭 시 탑승자 명단 & 승차 버튼 보기 ▾"}
                            </span>
                          </div>

                          {/* 차종 배지 */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${
                              isLargeBus
                                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                : isCounty
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                            }`}
                          >
                            {isLargeBus ? <Bus className="h-3.5 w-3.5" /> : isCounty ? <Bus className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
                            <span>
                              {isLargeBus ? "🚍 45인승 대형 배정" : isCounty ? "🚌 29인승 카운티 배정" : "🚗 카니발 배정"}
                            </span>
                          </span>

                          {/* 관리자 수동 변경 또는 임시 증편 뱃지 */}
                          {round.isManualOverride && (
                            <span
                              className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black"
                              title={round.overrideReason || "관리자 수동 변경"}
                            >
                              ⚙️ 우발 수동 지정 {round.overrideReason ? `(${round.overrideReason})` : ""}
                            </span>
                          )}
                          {round.isCustomAdded && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-black">
                              ⚡ 임시 증편
                            </span>
                          )}
                        </div>

                        {/* 우측 관리 액션 버튼들 */}
                        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">
                            예약 <strong>{round.totalPax}명</strong> (탑승 완료 {round.boardedPax}명)
                          </span>

                          {/* 1. 우발상황 시간/차종 변경 버튼 */}
                          <button
                            type="button"
                            onClick={() => openEditRoundModal(round)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs squishy-btn border border-slate-200 dark:border-slate-700"
                            title="출발 시간 및 차종 변경 (우발상황 대응)"
                          >
                            <Settings2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>{isKr ? "시간·차종 변경" : "调整时间/车型"}</span>
                          </button>

                          {/* 2. 예약 수기 추가 버튼 */}
                          <button
                            type="button"
                            onClick={() => openNewReservationModal("inbound", round.roundNumber, round.timeText)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs squishy-btn"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isKr ? "예약 수기 추가" : "人工添加"}</span>
                          </button>

                          {/* 3. 회차 삭제 버튼 */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetRound(round)}
                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 squishy-btn"
                            title={isKr ? "회차 운행 취소/삭제" : "删除班次"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 펼쳐진 승객 명단 인라인 테이블 */}
                      {isExpanded && (
                        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800 overflow-x-auto bg-slate-50/70 dark:bg-slate-900/60">
                          {round.reservations.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              {isKr ? "현재 등록된 예약 승객이 없습니다." : "当前无预约乘客。"}
                            </div>
                          ) : (
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                                  <th className="py-2 px-3">{isKr ? "승차 위치" : "乘车位置"}</th>
                                  <th className="py-2 px-3">{isKr ? "고객 성함" : "姓名"}</th>
                                  <th className="py-2 px-3">{isKr ? "연락처" : "电话"}</th>
                                  <th className="py-2 px-3 text-center">{isKr ? "인원" : "人数"}</th>
                                  <th className="py-2 px-3">{isKr ? "하차 희망지(동수)" : "下车地点"}</th>
                                  <th className="py-2 px-3 text-center">{isKr ? "수납 상태" : "支付"}</th>
                                  <th className="py-2 px-3 text-center">{isKr ? "원터치 승차 버튼" : "登车操作"}</th>
                                  <th className="py-2 px-3 text-right">{isKr ? "관리 액션" : "操作"}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                                {round.reservations.map((res) => {
                                  const isBoarded = res.boardedStatus === "boarded";
                                  return (
                                    <tr
                                      key={res.id}
                                      className={`transition-colors ${
                                        isBoarded
                                          ? "bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                          : "hover:bg-white dark:hover:bg-slate-800/40"
                                      }`}
                                    >
                                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[11px] font-black">
                                          {res.pickupLocation}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 font-black text-slate-800 dark:text-slate-200">
                                        <span className={isBoarded ? "line-through text-slate-400" : ""}>
                                          {res.passengerName}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-500">
                                        {res.phone}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-bold">
                                        {res.passengerCount}명
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                        {res.dropoffLocation}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                            res.paymentStatus === "paid"
                                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                              : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                                          }`}
                                        >
                                          {res.paymentStatus === "paid" ? "완납" : "미납"}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        {/* 원터치 [승차 완료 / 승차] 토글 버튼 */}
                                        <button
                                          type="button"
                                          disabled={isPending}
                                          onClick={() => handleToggleBoarded(res.id)}
                                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all squishy-btn border shadow-2xs cursor-pointer ${
                                            isBoarded
                                              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                              : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                          }`}
                                          title={
                                            isBoarded
                                              ? "클릭 시 승차 취소 (대기 상태로 변경)"
                                              : "클릭 시 즉시 승차 완료 처리"
                                          }
                                        >
                                          <Check className={`h-3.5 w-3.5 ${isBoarded ? "text-white stroke-[3]" : "text-emerald-600"}`} />
                                          <span>{isBoarded ? "승차 완료" : "승차"}</span>
                                        </button>
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            type="button"
                                            onClick={() => openEditReservationModal(res)}
                                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                            title={isKr ? "예약 수정" : "修改"}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteTargetReservation(res)}
                                            className="p-1 rounded-md text-rose-400 hover:text-rose-600"
                                            title={isKr ? "예약 삭제" : "删除"}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* (3) 공식 종이 서식 A4 100% 동일 인쇄 엔진 미리보기/인쇄 뷰 */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <DailyLogPrint
              lang={lang}
              date={selectedDate}
              data={dailyData || undefined}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          서브 탭 B: [월간 노선 캘린더 & 대체 노선 설정] 화면
      ========================================================================= */}
      {subTab === "monthly" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111622] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-sky-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isKr ? "2026년 10월 노선 경유지 캘린더" : "2026年10月 经停路线日历"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    대형마트 의무 휴무일(둘째/넷째 주 일요일 등) 클릭 시 대체 시장으로 원클릭 스위칭됩니다.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  이마트 (기본)
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  대체 경유지
                </span>
              </div>
            </div>

            {/* 31일 달력 그리드 */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                <div
                  key={day}
                  className={`py-2 font-black ${
                    idx === 0 ? "text-rose-500" : idx === 6 ? "text-sky-500" : "text-slate-500"
                  }`}
                >
                  {day}
                </div>
              ))}

              {/* 2026-10-01은 목요일이므로 앞 4칸 빈자리 (일, 월, 화, 수) */}
              {[...Array(4)].map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[72px] rounded-2xl bg-slate-50/40 dark:bg-slate-900/20" />
              ))}

              {/* 1일부터 31일까지 렌더링 */}
              {[...Array(31)].map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `2026-10-${String(dayNum).padStart(2, "0")}`;
                const routeName = monthlyRoutes[dateStr] || "이마트";
                const isAlternative = routeName !== "이마트";
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => openRouteModal(dateStr)}
                    className={`min-h-[80px] p-2 rounded-2xl border text-left transition-all squishy-btn flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {dayNum}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          오늘
                        </span>
                      )}
                    </div>

                    <div className="w-full">
                      <span
                        className={`block truncate px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                          isAlternative
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {routeName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 1: 예약 수기 등록/수정 모달
      ========================================================================= */}
      {isReservationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-500" />
                <span>
                  {editingReservation
                    ? (isKr ? "예약 정보 수정" : "修改预订信息")
                    : (isKr ? "신규 예약 수기 등록" : "人工添加新预订")}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReservationModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReservation} className="space-y-3.5 text-xs">
              {/* 회차 및 시간 표시 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between font-bold">
                <span className="text-slate-500">
                  {reservationForm.direction === "outbound" ? "아덴힐 ➔ 공항" : "공항 ➔ 아덴힐"}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  {reservationForm.roundNumber}회차 ({reservationForm.timeText})
                </span>
              </div>

              {/* 승차 위치 */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "승차 위치 (동수 또는 공항 게이트)" : "乘车地点"}
                </label>
                <input
                  type="text"
                  required
                  value={reservationForm.pickupLocation}
                  onChange={(e) => setReservationForm((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  placeholder="예: 105동 앞 또는 공항 3층 5번 게이트"
                />
              </div>

              {/* 하차 희망지 */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "하차 희망지" : "下车地点"}
                </label>
                <input
                  type="text"
                  required
                  value={reservationForm.dropoffLocation}
                  onChange={(e) => setReservationForm((prev) => ({ ...prev, dropoffLocation: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  placeholder="예: 제주공항, 이마트, 112동 앞"
                />
              </div>

              {/* 승객 성함 & 연락처 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isKr ? "고객 성함" : "姓名"}
                  </label>
                  <input
                    type="text"
                    required
                    value={reservationForm.passengerName}
                    onChange={(e) => setReservationForm((prev) => ({ ...prev, passengerName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isKr ? "연락처" : "电话"}
                  </label>
                  <input
                    type="text"
                    required
                    value={reservationForm.phone}
                    onChange={(e) =>
                      setReservationForm((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {/* 탑승 인원 (변경 시 카니발/카운티 자동 배차 기준) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "탑승 인원 (명)" : "乘车人数"}
                </label>
                <input
                  type="number"
                  min={1}
                  max={29}
                  required
                  value={reservationForm.passengerCount}
                  onChange={(e) => setReservationForm((prev) => ({ ...prev, passengerCount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  * 5인 이하 카니발, 6인 이상 카운티로 자동 배차됩니다.
                </span>
              </div>

              {/* 수납 상태 & 승차 상태 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isKr ? "수납 상태" : "支付状态"}
                  </label>
                  <select
                    value={reservationForm.paymentStatus}
                    onChange={(e) =>
                      setReservationForm((prev) => ({ ...prev, paymentStatus: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="unpaid">{isKr ? "미납" : "未支付"}</option>
                    <option value="paid">{isKr ? "완납" : "已支付"}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isKr ? "승차 체크" : "登车状态"}
                  </label>
                  <select
                    value={reservationForm.boardedStatus}
                    onChange={(e) =>
                      setReservationForm((prev) => ({ ...prev, boardedStatus: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="waiting">{isKr ? "대기 중" : "等待"}</option>
                    <option value="boarded">{isKr ? "승차 완료" : "已登车"}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReservationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {isKr ? "취소" : "取消"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/20"
                >
                  {editingReservation ? (isKr ? "수정 저장" : "保存修改") : (isKr ? "등록 확정" : "确认添加")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 2: 예약 소프트 딜리트 확인 모달
      ========================================================================= */}
      {deleteTargetReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {isKr ? "예약 취소 (소프트 딜리트)" : "取消预订确认"}
                </h4>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  {isKr ? "물리 삭제 없이 이력이 보존됩니다." : "数据永久保留于审计库。"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <strong className="text-slate-900 dark:text-white font-black">
                {deleteTargetReservation.passengerName} ({deleteTargetReservation.timeText}, {deleteTargetReservation.passengerCount}명)
              </strong>
              님의 예약을 취소하시겠습니까? 취소 시 회차 인원이 재계산되어 탄력 배차가 즉시 갱신됩니다.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetReservation(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                {isKr ? "닫기" : "关闭"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteReservation}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20"
              >
                {isKr ? "예약 취소 확정" : "确认取消"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 3: 월간 대체 경유지 원클릭 스위칭 모달
      ========================================================================= */}
      {routeModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-amber-500" />
                <span>{routeModalDate} 경유지 변경</span>
              </h3>
              <button
                type="button"
                onClick={() => setRouteModalDate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              대형마트 의무 휴무일 등 특이사항 발생 시 해당 일자의 경유지를 변경합니다.
            </p>

            <div className="space-y-2">
              {[
                { name: "이마트 (기본)", desc: "기본 정규 경유지" },
                { name: "제주민속오일장", desc: "오일장 개장일(2, 7일) 맞춤 경유" },
                { name: "동문재래시장", desc: "주말 야시장 및 전통시장 경유" },
                { name: "365마트", desc: "근거리 로컬 식자재 마트" },
                { name: "무경유 (직통)", desc: "공항 ↔ 리조트 무정차 직통" },
              ].map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setSelectedRouteName(opt.name)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedRouteName === opt.name
                      ? "bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div>
                    <div className="font-black text-xs">{opt.name}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                  {selectedRouteName === opt.name && <Check className="h-4 w-4 text-amber-600" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRouteModalDate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                {isKr ? "취소" : "取消"}
              </button>
              <button
                type="button"
                onClick={handleSaveAlternativeRoute}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20"
              >
                {isKr ? "경유지 적용" : "应用站点"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 C: [우발상황] 회차 배차 차종 및 출발 시간 수정 모달
          ========================================================================= */}
      {isEditRoundModalOpen && editingRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingRound.direction === "outbound" ? "하행" : "상행"} {editingRound.roundNumber}회차 배차·시간 변경
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    차량 고장, 기상 악화, 항공기 연착 등 우발상황 대응 수동 지정
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditRoundModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoundEdit} className="space-y-4 text-xs">
              {/* 출발 시간 변경 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>출발 시간 (우발상황 시간 변경)</span>
                </label>
                <input
                  type="text"
                  value={editingRound.timeText}
                  onChange={(e) => setEditingRound({ ...editingRound, timeText: e.target.value })}
                  placeholder="예: 08:30"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* 배정 차종 선택 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Bus className="h-3.5 w-3.5 text-indigo-500" />
                  <span>운행 예정 차량 종류 (차종 강제 지정)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "carnival" as const, label: "카니발 리무진", desc: "5인 이하 소형", icon: Car },
                    { type: "county" as const, label: "29인승 카운티", desc: "중형 버스", icon: Bus },
                    { type: "large_bus" as const, label: "45인승 대형", desc: "단체 특별 수송", icon: Bus },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() =>
                        setEditingRound({
                          ...editingRound,
                          allocatedVehicleType: item.type,
                          vehiclePlate:
                            item.type === "carnival"
                              ? "제주 70가 1142 (카니발)"
                              : item.type === "county"
                              ? "제주 72바 5501 (카운티)"
                              : "제주 75바 8820 (45인승 대형)",
                        })
                      }
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        editingRound.allocatedVehicleType === item.type
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 font-black"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <item.icon className="h-4 w-4 mx-auto mb-1 text-indigo-600 dark:text-indigo-400" />
                      <div className="font-bold text-[11px] leading-tight">{item.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 차량 번호판 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  차량 번호판 명시
                </label>
                <input
                  type="text"
                  value={editingRound.vehiclePlate}
                  onChange={(e) => setEditingRound({ ...editingRound, vehiclePlate: e.target.value })}
                  placeholder="예: 제주 70가 1142 (카니발)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* 우발상황 사유 및 퀵 칩 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    우발상황 변경 사유 (감사 일지 기록)
                  </label>
                  <span className="text-[10px] text-slate-400">선택 또는 직접 입력</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {[
                    "차량 정비로 인한 카운티 대차",
                    "항공기 연착(20분)에 따른 출발 지연",
                    "골프 단체 투숙객 특별 수송",
                    "기상 악화(폭설/안개) 서행 지연",
                    "탑승객 긴급 증차 요청",
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setEditingRound({ ...editingRound, overrideReason: reason })}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editingRound.overrideReason}
                  onChange={(e) => setEditingRound({ ...editingRound, overrideReason: e.target.value })}
                  placeholder="변경 사유를 입력하세요"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditRoundModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-600/20 squishy-btn"
                >
                  {isPending ? "저장 중..." : "우발상황 변경 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 D: [우발상황] 임시 증편 회차 추가 모달
          ========================================================================= */}
      {isAddRoundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    임시 / 우발상황 회차 긴급 증편
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    정규 시간표 외에 비상 운행 또는 단체 전용 회차를 새로 추가합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoundModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRound} className="space-y-4 text-xs">
              {/* 노선 방향 선택 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">노선 방향</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoundForm({ ...newRoundForm, direction: "outbound" })}
                    className={`p-2.5 rounded-xl border text-center font-black transition-all ${
                      newRoundForm.direction === "outbound"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                    }`}
                  >
                    아덴힐 ➔ 제주공항 (하행)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoundForm({ ...newRoundForm, direction: "inbound" })}
                    className={`p-2.5 rounded-xl border text-center font-black transition-all ${
                      newRoundForm.direction === "inbound"
                        ? "bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                    }`}
                  >
                    제주공항 ➔ 아덴힐 (상행)
                  </button>
                </div>
              </div>

              {/* 출발 시간 입력 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  <span>증편 출발 시간</span>
                </label>
                <input
                  type="text"
                  value={newRoundForm.timeText}
                  onChange={(e) => setNewRoundForm({ ...newRoundForm, timeText: e.target.value })}
                  placeholder="예: 21:30"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* 차종 선택 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">증편 투입 차종</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "carnival" as const, label: "카니발 리무진", icon: Car },
                    { type: "county" as const, label: "29인승 카운티", icon: Bus },
                    { type: "large_bus" as const, label: "45인승 대형", icon: Bus },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() =>
                        setNewRoundForm({
                          ...newRoundForm,
                          allocatedVehicleType: item.type,
                          vehiclePlate:
                            item.type === "carnival"
                              ? "제주 70가 1142 (카니발)"
                              : item.type === "county"
                              ? "제주 72바 5501 (카운티)"
                              : "제주 75바 8820 (45인승 대형)",
                        })
                      }
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        newRoundForm.allocatedVehicleType === item.type
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                      }`}
                    >
                      <item.icon className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                      <div className="font-bold text-[11px] leading-tight">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 증편 사유 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">증편 사유</label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {["야간 심야 임시 증편", "단체 투숙객 비상 배차", "골프 행사 특별 수송", "항공기 대규모 지연 증차"].map(
                    (r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewRoundForm({ ...newRoundForm, overrideReason: r })}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700"
                      >
                        {r}
                      </button>
                    )
                  )}
                </div>
                <input
                  type="text"
                  value={newRoundForm.overrideReason}
                  onChange={(e) => setNewRoundForm({ ...newRoundForm, overrideReason: e.target.value })}
                  placeholder="예: 야간 심야 특별 증편"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRoundModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/20 squishy-btn"
                >
                  {isPending ? "추가 중..." : "임시 회차 증편 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 E: [우발상황] 회차 운행 취소 / 삭제 확인 모달
          ========================================================================= */}
      {deleteTargetRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  회차 운행 취소 / 삭제
                </h3>
                <p className="text-xs text-slate-400">우발상황 비상 조치</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              [<strong>{deleteTargetRound.direction === "outbound" ? "하행" : "상행"} {deleteTargetRound.roundNumber}회차 ({deleteTargetRound.timeText})</strong>] 운행을 취소하고 목록에서 삭제하시겠습니까?
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-bold">
              ⚠️ 해당 회차에 예약된 승객이 있을 경우 예약도 자동으로 함께 취소 처리됩니다.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetRound(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDeleteRound}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 squishy-btn"
              >
                {isPending ? "삭제 중..." : "운행 취소 및 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
