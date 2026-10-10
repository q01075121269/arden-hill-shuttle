"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Users,
  CreditCard,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Building2,
  X,
  RefreshCw,
  Phone,
  UserCheck,
  ShieldCheck,
  Coins,
  ArrowRight,
  Filter,
  Check,
  AlertCircle,
} from "lucide-react";
import { Language } from "@/types";
import {
  getResidentsAction,
  upsertResidentAction,
  deleteResidentAction,
  type ResidentItem,
} from "@/app/actions/admin-customers";
import {
  getSettlementLedgerAction,
  markAsPaidAction,
  type SettlementLedgerItem,
  type SettlementKPIData,
  type SettlementFilterParams,
} from "@/app/actions/admin-settlement";
import {
  getCurrentUserAction,
  getPendingResidentsAction,
  approveResidentAction,
  rejectResidentAction,
  type ResidentAccount,
  type AuthUser,
} from "@/app/actions/auth";

interface CustomerSettlementHubProps {
  lang: Language;
}

type SubTab = "residents" | "pending_approval" | "ledger";

export function CustomerSettlementHub({ lang }: CustomerSettlementHubProps) {
  const isKr = lang === "KR";
  const [subTab, setSubTab] = useState<SubTab>("residents");
  const [isPending, startTransition] = useTransition();

  // 피드백 토스트 상태
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // =========================================================================
  // 서브 탭 A: 입주민·고객 DB 상태
  // =========================================================================
  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [residentSearchQuery, setResidentSearchQuery] = useState("");
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<ResidentItem | null>(null);
  const [residentForm, setResidentForm] = useState<{
    id?: string;
    building: string;
    name: string;
    phone: string;
    registerType: "self" | "manual";
    memo?: string;
  }>({
    building: "101동",
    name: "",
    phone: "",
    registerType: "manual",
    memo: "",
  });

  // 고객 소프트 딜리트 확인 모달 상태
  const [deleteResidentTarget, setDeleteResidentTarget] = useState<{
    resident: ResidentItem;
    reason: string;
  } | null>(null);

  // =========================================================================
  // 서브 탭 B: 수납 및 정산 장부 상태
  // =========================================================================
  const [ledgerRecords, setLedgerRecords] = useState<SettlementLedgerItem[]>([]);
  const [kpi, setKpi] = useState<SettlementKPIData>({
    totalUnpaidAmount: 45000,
    unpaidPassengerCount: 3,
    monthPaidAmount: 30000,
  });

  // 다차원 필터 파라미터 상태
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterQuick, setFilterQuick] = useState<"today" | "week" | "month" | "all">("month");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<"all" | "unpaid" | "paid">("all");
  const [filterPassengerName, setFilterPassengerName] = useState("");

  // 완납 처리 컨펌 모달 상태
  const [payConfirmTarget, setPayConfirmTarget] = useState<SettlementLedgerItem | null>(null);

  // =========================================================================
  // 서브 탭 C: 가입 승인 대기 상태
  // =========================================================================
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [pendingResidents, setPendingResidents] = useState<ResidentAccount[]>([]);

  // 자동 피드백 제거
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

  // 101개 동 목록 생성 (101동 ~ 170동, 커뮤니티 센터, 클럽하우스 등)
  const buildingOptions = [
    "all",
    "101동", "102동", "103동", "104동", "105동", "106동", "107동", "108동", "109동", "110동",
    "111동", "112동", "113동", "114동", "115동", "120동", "130동", "140동", "150동", "160동",
    "168동", "170동", "커뮤니티 센터", "클럽하우스"
  ];

  // =========================================================================
  // 데이터 로딩 함수들
  // =========================================================================
  const loadResidents = async (query?: string) => {
    const res = await getResidentsAction(query);
    if (res.success && res.data) {
      setResidents(res.data.residents);
    }
  };

  const loadSettlementLedger = async (params?: SettlementFilterParams) => {
    const p: SettlementFilterParams = params || {
      startDate: filterStartDate,
      endDate: filterEndDate,
      quickFilter: filterQuick,
      building: filterBuilding,
      paymentStatus: filterPaymentStatus,
      passengerName: filterPassengerName,
    };
    const res = await getSettlementLedgerAction(p);
    if (res.success && res.data) {
      setLedgerRecords(res.data.records);
      setKpi(res.data.kpi);
    }
  };

  const loadPendingAndAuth = async () => {
    const user = await getCurrentUserAction();
    setCurrentUser(user);
    const pendings = await getPendingResidentsAction();
    setPendingResidents(pendings);
  };

  useEffect(() => {
    loadResidents();
    loadSettlementLedger({ quickFilter: "month" });
    loadPendingAndAuth();
  }, []);

  // 승객 가입 승인 처리
  const handleApprovePendingResident = (resId: string, name: string) => {
    if (!window.confirm(`${name} 님의 입주민 가입 신청을 정식 승인하시겠습니까?`)) return;

    startTransition(async () => {
      const res = await approveResidentAction(resId);
      if (res.success) {
        setFeedback({
          type: "success",
          text: isKr ? `${name} 님의 가입이 정상 승인되었습니다.` : "已成功批准住户加入申请。",
        });
        await loadPendingAndAuth();
        await loadResidents();
      } else {
        setFeedback({
          type: "error",
          text: res.error || "가입 승인 실패",
        });
      }
    });
  };

  // 승객 가입 반려 처리
  const handleRejectPendingResident = (resId: string, name: string) => {
    if (!window.confirm(`${name} 님의 입주민 가입 신청을 반려하시겠습니까?`)) return;

    startTransition(async () => {
      const res = await rejectResidentAction(resId);
      if (res.success) {
        setFeedback({
          type: "success",
          text: isKr ? `${name} 님의 신청이 반려되었습니다.` : "已驳回住户申请。",
        });
        await loadPendingAndAuth();
      } else {
        setFeedback({
          type: "error",
          text: res.error || "가입 반려 실패",
        });
      }
    });
  };

  // 검색 트리거
  const handleResidentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadResidents(residentSearchQuery);
  };

  const handleLedgerFilterApply = () => {
    loadSettlementLedger({
      startDate: filterStartDate,
      endDate: filterEndDate,
      quickFilter: filterQuick,
      building: filterBuilding,
      paymentStatus: filterPaymentStatus,
      passengerName: filterPassengerName,
    });
  };

  // 퀵 필터 변경
  const handleQuickFilterChange = (qf: "today" | "week" | "month" | "all") => {
    setFilterQuick(qf);
    loadSettlementLedger({
      quickFilter: qf,
      building: filterBuilding,
      paymentStatus: filterPaymentStatus,
      passengerName: filterPassengerName,
    });
  };

  // =========================================================================
  // 서브 탭 A: 입주민 모달 핸들러
  // =========================================================================
  const openNewResidentModal = () => {
    setEditingResident(null);
    setResidentForm({
      building: "101동",
      name: "",
      phone: "",
      registerType: "manual",
      memo: "",
    });
    setIsResidentModalOpen(true);
  };

  const openEditResidentModal = (res: ResidentItem) => {
    setEditingResident(res);
    setResidentForm({
      id: res.id,
      building: res.building,
      name: res.name,
      phone: res.phone,
      registerType: res.registerType,
      memo: res.memo || "",
    });
    setIsResidentModalOpen(true);
  };

  const handleSaveResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentForm.name.trim() || !residentForm.phone.trim()) {
      setFeedback({ type: "error", text: isKr ? "성함과 연락처를 모두 입력해주세요." : "请完整填写姓名和电话。" });
      return;
    }

    startTransition(async () => {
      const res = await upsertResidentAction({
        id: residentForm.id,
        building: residentForm.building.trim(),
        name: residentForm.name.trim(),
        phone: residentForm.phone.trim(),
        registerType: residentForm.registerType,
        memo: residentForm.memo?.trim(),
        isActive: true,
      });

      if (res.success) {
        setResidents(res.data.residents);
        setIsResidentModalOpen(false);
        setFeedback({
          type: "success",
          text: isKr ? "고객 정보가 성공적으로 저장되었습니다." : "客户信息已保存。",
        });
        await loadResidents();
      } else {
        setFeedback({ type: "error", text: res.error || "고객 저장 실패" });
      }
    });
  };

  // 고객 소프트 딜리트 실행
  const handleConfirmDeleteResident = () => {
    if (!deleteResidentTarget) return;

    startTransition(async () => {
      const res = await deleteResidentAction(
        deleteResidentTarget.resident.id,
        deleteResidentTarget.reason
      );
      if (res.success) {
        setResidents(res.data.residents);
        setFeedback({
          type: "success",
          text: isKr
            ? `${deleteResidentTarget.resident.name} 님이 비활성화(소프트 딜리트) 및 감사로그 기록 완료되었습니다.`
            : "客户已停用并记录审计日志。",
        });
      } else {
        setFeedback({ type: "error", text: res.error || "삭제 실패" });
      }
      setDeleteResidentTarget(null);
      await loadResidents();
    });
  };

  // =========================================================================
  // 서브 탭 B: 완납 처리 핸들러
  // =========================================================================
  const handleExecutePayment = () => {
    if (!payConfirmTarget) return;

    startTransition(async () => {
      const res = await markAsPaidAction(payConfirmTarget.id, payConfirmTarget.residentId);
      if (res.success) {
        setLedgerRecords(res.data.records);
        setKpi(res.data.kpi);
        setFeedback({
          type: "success",
          text: isKr
            ? `${payConfirmTarget.passengerName} 님의 ₩${new Intl.NumberFormat("ko-KR").format(payConfirmTarget.fareAmount)} 완납 처리가 완료되었습니다.`
            : "已成功确认收款。",
        });
        // 입주민 DB도 동기화 갱신
        await loadResidents();
      } else {
        setFeedback({ type: "error", text: res.error || "수납 처리 실패" });
      }
      setPayConfirmTarget(null);
    });
  };

  // =========================================================================
  // 서브 탭 B: 엑셀(CSV) 다운로드 핸들러 (UTF-8 BOM 한글 깨짐 방지)
  // =========================================================================
  const handleExportCSV = () => {
    if (ledgerRecords.length === 0) {
      setFeedback({ type: "error", text: isKr ? "내보낼 거래 데이터가 없습니다." : "没有可导出的交易数据。" });
      return;
    }

    // CSV 헤더 정의
    const headers = [
      "이용일자",
      "탑승회차/시간",
      "승객명",
      "동수",
      "연락처",
      "이동구간",
      "배정차량",
      "탑승인원",
      "청구요금(원)",
      "결제상태",
      "완납일시",
      "처리관리자",
      "감사로그ID",
    ];

    // CSV 행 생성
    const rows = ledgerRecords.map((r) => [
      r.date,
      `"${r.time}"`,
      `"${r.passengerName}"`,
      `"${r.building}"`,
      `"${r.phone}"`,
      `"${r.route}"`,
      `"${r.vehicleType} (${r.vehiclePlate})"`,
      r.passengerCount,
      r.fareAmount,
      r.paymentStatus === "paid" ? "완납" : "미납",
      r.paidAt || "-",
      r.settledBy || "-",
      r.auditLogId || "-",
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 with BOM for Excel Korean support
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const todayYMD = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.setAttribute("href", url);
    link.setAttribute("download", `아덴힐_셔틀_수납정산장부_${todayYMD}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback({
      type: "success",
      text: isKr
        ? "정산 장부 CSV 파일이 성공적으로 다운로드되었습니다."
        : "结算账簿CSV已成功导出。",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 상단 알림 배너 */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all ${
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

      {/* 헤더 섹션 정보 카드 */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-amber-500/10 to-emerald-500/10 border border-indigo-500/20 dark:border-indigo-500/30 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black uppercase tracking-wider">
                CUSTOMER & SETTLEMENT
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isKr ? "101개 동 입주민 DB 및 스마트 뱅킹형 수납 장부" : "住户档案与财务结算账簿"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isKr ? "고객 관리 및 수납·정산 장부" : "客户管理与财务结算账簿"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
              {isKr
                ? "자가가입 승객과 관리실 수기 등록 고객을 통합 관리하고, 실시간 완납 처리와 엑셀 내보내기를 지원합니다."
                : "统一管理自主注册与人工登记住户，支持即时确认收款与账簿导出。"}
            </p>
          </div>

          {/* 서브 탭 A / C / B 스위처 (Bento Grid 세그먼트 컨트롤) */}
          <div className="flex p-1.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs self-start md:self-auto flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setSubTab("residents")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all squishy-btn ${
                subTab === "residents"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{isKr ? "입주민·고객 DB" : "住户·客户档案"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 font-bold">
                {residents.filter((r) => r.isActive).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab("pending_approval")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all squishy-btn ${
                subTab === "pending_approval"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isKr ? "가입 승인 대기" : "申请待审批"}</span>
              {pendingResidents.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white text-rose-600 font-extrabold animate-pulse">
                  {pendingResidents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubTab("ledger")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all squishy-btn ${
                subTab === "ledger"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>{isKr ? "수납·정산 장부" : "收纳与结算账簿"}</span>
              {kpi.unpaidPassengerCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-extrabold animate-pulse">
                  {kpi.unpaidPassengerCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          서브 탭 A: [입주민·고객 DB 관리] 화면
      ========================================================================= */}
      {subTab === "residents" && (
        <div className="space-y-6">
          {/* 상단 툴바 & 실시간 검색 필터 */}
          <div className="bg-white dark:bg-[#111622] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleResidentSearch} className="flex-1 flex items-center gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={residentSearchQuery}
                  onChange={(e) => {
                    setResidentSearchQuery(e.target.value);
                    loadResidents(e.target.value);
                  }}
                  placeholder={
                    isKr
                      ? "동호수(예: 102동), 성함, 전화번호 검색..."
                      : "搜索栋号、姓名或电话..."
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs shrink-0 squishy-btn"
              >
                {isKr ? "검색" : "搜索"}
              </button>
            </form>

            <button
              onClick={openNewResidentModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all squishy-btn shrink-0 self-start md:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>{isKr ? "+ 신규 고객 수기 등록" : "+ 人工登记新住户"}</span>
            </button>
          </div>

          {/* 고객 목록 데이터 테이블 */}
          <div className="bg-white dark:bg-[#111622] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isKr ? "입주민 및 예약 고객 명단" : "住户与预订客户名册"}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                총 {residents.length}명 조회됨
              </span>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase">
                    <th className="py-3 px-4">{isKr ? "동/호수" : "栋号/房号"}</th>
                    <th className="py-3 px-4">{isKr ? "고객 성함" : "姓名"}</th>
                    <th className="py-3 px-4">{isKr ? "연락처" : "联络方式"}</th>
                    <th className="py-3 px-4">{isKr ? "등록 구분" : "登记渠道"}</th>
                    <th className="py-3 px-4 text-center">{isKr ? "누적 탑승" : "乘车次数"}</th>
                    <th className="py-3 px-4 text-right">{isKr ? "현재 총 미납금" : "当前欠费"}</th>
                    <th className="py-3 px-4 text-right">{isKr ? "관리 액션" : "操作"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {residents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {isKr ? "조건에 맞는 고객 정보가 없습니다." : "暂无符合条件的住户数据。"}
                      </td>
                    </tr>
                  ) : (
                    residents.map((res) => {
                      const hasUnpaid = res.unpaidAmount > 0;
                      return (
                        <tr
                          key={res.id}
                          className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40 ${
                            !res.isActive ? "opacity-40 bg-slate-100/50 dark:bg-slate-950/50" : ""
                          }`}
                        >
                          {/* 동/호수 */}
                          <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                              <span>{res.building}</span>
                            </span>
                          </td>

                          {/* 고객 성함 */}
                          <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-xs">
                                {res.name.slice(0, 1)}
                              </div>
                              <div>
                                <div>{res.name}</div>
                                {res.memo && (
                                  <div className="text-[11px] text-slate-400 font-normal">
                                    {res.memo}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 연락처 */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {res.phone}
                          </td>

                          {/* 등록 구분 (자가가입 / 관리자 등록) */}
                          <td className="py-3.5 px-4">
                            {res.registerType === "self" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-extrabold text-[11px] border border-sky-200/50 dark:border-sky-800/50">
                                {isKr ? "자가 가입" : "自助注册"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-extrabold text-[11px] border border-purple-200/50 dark:border-purple-800/50">
                                {isKr ? "관리자 수기" : "人工录入"}
                              </span>
                            )}
                          </td>

                          {/* 누적 탑승 횟수 */}
                          <td className="py-3.5 px-4 text-center font-extrabold text-slate-800 dark:text-slate-200">
                            {res.rideCount}회
                          </td>

                          {/* 현재 총 미납금 */}
                          <td className="py-3.5 px-4 text-right">
                            {hasUnpaid ? (
                              <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                                ₩{new Intl.NumberFormat("ko-KR").format(res.unpaidAmount)}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                {isKr ? "미납 없음 (₩0)" : "无欠费"}
                              </span>
                            )}
                          </td>

                          {/* 관리 액션 */}
                          <td className="py-3.5 px-4 text-right">
                            {res.isActive ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditResidentModal(res)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title={isKr ? "고객 정보 수정" : "修改"}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteResidentTarget({
                                      resident: res,
                                      reason: "관리자 요청에 의한 소프트 딜리트",
                                    })
                                  }
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title={isKr ? "비활성화 (소프트 딜리트)" : "停用客户"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                {isKr ? "보관됨" : "已归档"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          서브 탭 C: [가입 승인 대기 목록 & 원클릭 승인 통제]
      ========================================================================= */}
      {subTab === "pending_approval" && (
        <div className="space-y-6">
          {/* 상단 보안 & RBAC 권한 안내 배너 */}
          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">
                  {isKr ? "신규 승객 간편 가입 승인 통제 센터 (RBAC 4인 관리 체계)" : "新乘客注册审核控制中心"}
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium">
                  {isKr
                    ? "어르신 승객이 '전화번호 + 4자리 숫자 PIN'으로 신청한 계정을 검증 후 정식 입주민으로 승인합니다. [개발자] 및 [관리과장] 계정만 승인 권한이 유효합니다."
                    : "对使用手机号与4位数字PIN申请的新账号进行核验与准入审批。仅开发者与总管理主任具备审批权限。"}
                </p>
              </div>
            </div>

            {/* 현재 관리자 권한 배지 */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
              <span className="text-xs text-slate-500 font-bold">{isKr ? "현재 관리자:" : "当前管理员:"}</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {currentUser ? `${currentUser.name} (${currentUser.roleName})` : "로그인 필요"}
              </span>
              {currentUser?.canApproveResident ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                  승인 권한 부여됨
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                  조회 전용 (권한 없음)
                </span>
              )}
            </div>
          </div>

          {/* 승인 대기 목록 테이블 */}
          <div className="bg-white dark:bg-[#111622] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {isKr ? "가입 승인 대기 신청자 목록" : "待审批申请人列表"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-black">
                  {pendingResidents.length}건
                </span>
              </div>
              <button
                type="button"
                onClick={loadPendingAndAuth}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 squishy-btn"
                title="목록 새로고침"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-black uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">신청 일시</th>
                    <th className="py-3 px-4">성명</th>
                    <th className="py-3 px-4">희망 거주 동수</th>
                    <th className="py-3 px-4">휴대폰 번호</th>
                    <th className="py-3 px-4 text-center">심사 상태</th>
                    <th className="py-3 px-4 text-right">원클릭 승인 통제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {pendingResidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                        현재 승인 대기 중인 신규 가입 신청자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    pendingResidents.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleString("ko-KR")}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-sm">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-black border border-amber-300 dark:border-amber-700">
                            {item.building}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.phone}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black text-[11px] animate-pulse">
                            승인 대기
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentUser?.canApproveResident ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRejectPendingResident(item.id, item.name)}
                                  disabled={isPending}
                                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold squishy-btn disabled:opacity-50"
                                >
                                  ✕ 반려
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApprovePendingResident(item.id, item.name)}
                                  disabled={isPending}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black squishy-btn shadow-xs disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>✓ 정식 승인</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                승인 권한 없음
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          서브 탭 B: [수납 및 연체 정산 장부] 화면
      ========================================================================= */}
      {subTab === "ledger" && (
        <div className="space-y-6">
          {/* 1) 상단 재무 현황 요약 KPI 카드 (파스텔 틴트) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* [총 누적 미납액] (소프트 웜 앰버 틴트) */}
            <div className="bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/40 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>{isKr ? "총 누적 미납액" : "累计待收总额"}</span>
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {isKr ? "정산 요망" : "待结清"}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 tracking-tight">
                ₩{new Intl.NumberFormat("ko-KR").format(kpi.totalUnpaidAmount)}
              </div>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 font-medium">
                {isKr ? "현재 미정산 잔액 합계" : "当前全部未结账款总计"}
              </p>
            </div>

            {/* [미납 승객 수] */}
            <div className="bg-rose-500/10 border border-rose-500/30 dark:border-rose-500/40 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>{isKr ? "미납 대상 승객 수" : "欠费乘客总数"}</span>
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  {isKr ? "주의" : "关注"}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
                {kpi.unpaidPassengerCount}명
              </div>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 font-medium">
                {isKr ? "정산 대기 중인 고유 승객 계정" : "存在待结算费用的独立账号"}
              </p>
            </div>

            {/* [당월 수납 완료액] (소프트 세이지 에메랄드 틴트) */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/40 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isKr ? "당월 수납 완료액" : "本月已收总额"}</span>
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {isKr ? "정산 완료" : "已入账"}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                ₩{new Intl.NumberFormat("ko-KR").format(kpi.monthPaidAmount)}
              </div>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 font-medium">
                {isKr ? "2026년 10월 정상 완납 누적금" : "2026年10月已结算金额"}
              </p>
            </div>
          </div>

          {/* 2) 다차원 상세 검색 필터 바 (Multi-Filter Bar) */}
          <div className="bg-white dark:bg-[#111622] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isKr ? "다차원 장부 검색 필터" : "多维账簿检索筛选"}
                </h3>
              </div>

              {/* 퀵 필터 버튼 그룹 */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => handleQuickFilterChange("today")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterQuick === "today"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {isKr ? "오늘" : "今日"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterChange("week")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterQuick === "week"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {isKr ? "최근 7일" : "近7日"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterChange("month")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterQuick === "month"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {isKr ? "당월(이번 달)" : "本月"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterChange("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterQuick === "all"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {isKr ? "전체" : "全部"}
                </button>
              </div>
            </div>

            {/* 필터 세부 인풋 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* 기간 설정: 시작일 ~ 종료일 */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isKr ? "시작일" : "起始日期"}
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isKr ? "종료일" : "结束日期"}
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* 동/호수 선택 드롭다운 */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isKr ? "동/호수 선택" : "选择栋号"}
                </label>
                <select
                  value={filterBuilding}
                  onChange={(e) => setFilterBuilding(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="all">{isKr ? "전체 동/호수" : "全部栋号"}</option>
                  {buildingOptions.filter((b) => b !== "all").map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* 수납 상태 드롭다운 */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isKr ? "수납 상태" : "结算状态"}
                </label>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="all">{isKr ? "전체 내역" : "全部"}</option>
                  <option value="unpaid">{isKr ? "미납 내역만" : "仅未结"}</option>
                  <option value="paid">{isKr ? "완납 완료만" : "仅已结"}</option>
                </select>
              </div>
            </div>

            {/* 승객명 직접 검색 및 액션 버튼들 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={filterPassengerName}
                  onChange={(e) => setFilterPassengerName(e.target.value)}
                  placeholder={isKr ? "승객 성함으로 직접 검색..." : "直接搜索乘客姓名..."}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleLedgerFilterApply}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 squishy-btn"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>{isKr ? "필터 적용" : "应用筛选"}</span>
                </button>

                {/* 5) 엑셀(CSV) 다운로드 버튼 */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 squishy-btn"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>{isKr ? "CSV(엑셀) 다운로드" : "导出Excel(CSV)"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3) 상세 정산 거래내역 테이블 */}
          <div className="bg-white dark:bg-[#111622] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isKr ? "정산 거래내역 장부" : "结算交易明细账"}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {ledgerRecords.length}건 조회됨
              </span>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase">
                    <th className="py-3 px-4">{isKr ? "이용 일자" : "乘车日期"}</th>
                    <th className="py-3 px-4">{isKr ? "탑승 회차/시간" : "班次与时间"}</th>
                    <th className="py-3 px-4">{isKr ? "승객명 (동수)" : "乘客 (栋号)"}</th>
                    <th className="py-3 px-4">{isKr ? "이동 구간" : "乘车路线"}</th>
                    <th className="py-3 px-4">{isKr ? "배정 차량" : "车辆"}</th>
                    <th className="py-3 px-4 text-right">{isKr ? "청구 요금" : "应收金额"}</th>
                    <th className="py-3 px-4 text-center">{isKr ? "결제 상태" : "支付状态"}</th>
                    <th className="py-3 px-4 text-right">{isKr ? "관리 액션" : "操作"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {ledgerRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        {isKr ? "검색 조건에 해당하는 정산 내역이 없습니다." : "暂无结算明细。"}
                      </td>
                    </tr>
                  ) : (
                    ledgerRecords.map((r) => {
                      const isPaid = r.paymentStatus === "paid";
                      return (
                        <tr
                          key={r.id}
                          className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                        >
                          {/* 이용 일자 */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {r.date}
                          </td>

                          {/* 탑승 회차/시간 */}
                          <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-200">
                            {r.time}
                          </td>

                          {/* 승객명 & 동수 */}
                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-900 dark:text-white">
                              {r.passengerName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-bold">
                              {r.building} · {r.phone}
                            </div>
                          </td>

                          {/* 이동 구간 */}
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-bold">
                            {r.route}
                          </td>

                          {/* 배정 차량 */}
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {r.vehiclePlate} ({r.vehicleType.slice(0, 3)})
                            </span>
                          </td>

                          {/* 청구 요금 */}
                          <td className="py-3.5 px-4 text-right font-black text-sm">
                            ₩{new Intl.NumberFormat("ko-KR").format(r.fareAmount)}
                          </td>

                          {/* 결제 상태 배지 */}
                          <td className="py-3.5 px-4 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200/50 dark:border-emerald-800/50">
                                <Check className="h-3 w-3" />
                                <span>{isKr ? "완납 완료" : "已结清"}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] border border-rose-200/50 dark:border-rose-800/50">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{isKr ? "미납" : "未支付"}</span>
                              </span>
                            )}
                          </td>

                          {/* 4) 원터치 완납 처리 버튼 */}
                          <td className="py-3.5 px-4 text-right">
                            {isPaid ? (
                              <span className="text-[11px] text-slate-400 font-mono">
                                {r.paidAt}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPayConfirmTarget(r)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all squishy-btn"
                              >
                                {isKr ? "완납 처리" : "确认收款"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 1: 고객 등록/수정 모달
      ========================================================================= */}
      {isResidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <span>
                  {editingResident
                    ? (isKr ? "고객 정보 수정" : "修改住户信息")
                    : (isKr ? "신규 고객 수기 등록" : "人工登记新住户")}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsResidentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResident} className="space-y-4">
              {/* 동/호수 선택 또는 직접 입력 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "동/호수 (101개 동 또는 커뮤니티 센터)" : "栋号/房号"}
                </label>
                <input
                  type="text"
                  required
                  value={residentForm.building}
                  onChange={(e) => setResidentForm((prev) => ({ ...prev, building: e.target.value }))}
                  placeholder={isKr ? "예: 102동 301호 또는 105동" : "例: 102栋 301号"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* 고객 성함 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "고객 성함" : "姓名"}
                </label>
                <input
                  type="text"
                  required
                  value={residentForm.name}
                  onChange={(e) => setResidentForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={isKr ? "예: 홍길동" : "例: 洪吉童"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* 휴대폰 연락처 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "휴대폰 연락처" : "手机号码"}
                </label>
                <input
                  type="text"
                  required
                  value={residentForm.phone}
                  onChange={(e) =>
                    setResidentForm((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))
                  }
                  placeholder="010-0000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* 등록 구분 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "등록 구분" : "登记渠道"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResidentForm((prev) => ({ ...prev, registerType: "manual" }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      residentForm.registerType === "manual"
                        ? "bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-700 dark:text-purple-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isKr ? "관리실 수기 등록" : "人工录入"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResidentForm((prev) => ({ ...prev, registerType: "self" }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      residentForm.registerType === "self"
                        ? "bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-700 dark:text-sky-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isKr ? "자가 회원 가입" : "自主注册"}
                  </button>
                </div>
              </div>

              {/* 특이사항 메모 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "특이사항 메모 (선택)" : "备注说明 (选填)"}
                </label>
                <input
                  type="text"
                  value={residentForm.memo || ""}
                  onChange={(e) => setResidentForm((prev) => ({ ...prev, memo: e.target.value }))}
                  placeholder={isKr ? "예: 어르신 세대 유선 전화 예약 대행" : "备注信息"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsResidentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {isKr ? "취소" : "取消"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20"
                >
                  {editingResident ? (isKr ? "수정 완료" : "保存修改") : (isKr ? "등록 완료" : "确认登记")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 2: 고객 소프트 딜리트 확인 팝업
      ========================================================================= */}
      {deleteResidentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {isKr ? "고객 비활성화 (소프트 딜리트)" : "停用客户确认"}
                </h4>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  {isKr ? "데이터는 영구 보존됩니다." : "数据永久保留于审计库。"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <strong className="text-slate-900 dark:text-white font-black">
                {deleteResidentTarget.resident.name} ({deleteResidentTarget.resident.building})
              </strong>
              님의 계정을 비활성화하시겠습니까? 물리 삭제 없이 `audit_logs`에 사유가 영구 기록됩니다.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {isKr ? "삭제 사유" : "停用理由"}
              </label>
              <input
                type="text"
                value={deleteResidentTarget.reason}
                onChange={(e) =>
                  setDeleteResidentTarget((prev) =>
                    prev ? { ...prev, reason: e.target.value } : null
                  )
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                placeholder={isKr ? "삭제 사유 입력 (예: 이사, 계정 정리 등)" : "填写停用理由"}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteResidentTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                {isKr ? "취소" : "取消"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteResident}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20"
              >
                {isKr ? "비활성화 처리" : "确认停用"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 3: 완납 처리 컨펌 모달 (파괴적 금융 액션)
      ========================================================================= */}
      {payConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {isKr ? "수납 완납 확인" : "确认收款入账"}
                </h4>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {isKr ? "승객 웹 미납 잔액 즉시 차감" : "即时同步至乘客端"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isKr ? "대상 승객" : "乘客姓名"}</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {payConfirmTarget.passengerName} ({payConfirmTarget.building})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isKr ? "이용 일자" : "乘车日期"}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {payConfirmTarget.date} {payConfirmTarget.time}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-bold">{isKr ? "완납 처리 금액" : "入账金额"}</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  ₩{new Intl.NumberFormat("ko-KR").format(payConfirmTarget.fareAmount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isKr ? (
                <>
                  <strong className="text-slate-900 dark:text-white font-extrabold">{payConfirmTarget.passengerName}</strong>
                  {" "}님의 <strong>{new Intl.NumberFormat("ko-KR").format(payConfirmTarget.fareAmount)}원</strong> 미납금을 완납 처리하시겠습니까?
                  처리 시 고객의 미납 잔액이 즉시 동기화되며 `audit_logs`에 영구 기록됩니다.
                </>
              ) : (
                <>
                  确定要确认 <strong>{payConfirmTarget.passengerName}</strong> 的 <strong>{payConfirmTarget.fareAmount}韩元</strong> 账单吗？
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                {isKr ? "취소" : "取消"}
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20"
              >
                {isKr ? "완납 처리 확정" : "确认结清"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
