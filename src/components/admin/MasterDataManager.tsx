"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  ShieldCheck,
  Clock,
  Phone,
  Coins,
  Bus,
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  RefreshCw,
  Info,
} from "lucide-react";
import { Language } from "@/types";
import {
  getAdminMasterData,
  updateSystemPolicyAction,
  upsertVehicleAction,
  deleteVehicleAction,
  upsertDriverAction,
  deleteDriverAction,
  type SystemPolicyData,
  type VehicleMasterItem,
  type DriverMasterItem,
  type AuditLogItem,
} from "@/app/actions/admin-master";

interface MasterDataManagerProps {
  lang: Language;
}

export function MasterDataManager({ lang }: MasterDataManagerProps) {
  const isKr = lang === "KR";
  const [isPending, startTransition] = useTransition();

  // 1. 마스터 데이터 상태
  const [policy, setPolicy] = useState<SystemPolicyData>({
    fareAmount: 5000,
    cutoffTime: "22:00",
    adminPhone: "010-3342-9981",
    dutyPhone: "010-8921-4421",
    updatedAt: new Date().toISOString(),
  });
  const [vehicles, setVehicles] = useState<VehicleMasterItem[]>([]);
  const [drivers, setDrivers] = useState<DriverMasterItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2. 정책 입력 폼 상태 (숫자 포맷팅 등)
  const [fareInput, setFareInput] = useState<string>("5,000");
  const [cutoffInput, setCutoffInput] = useState<string>("22:00");
  const [adminPhoneInput, setAdminPhoneInput] = useState<string>("010-3342-9981");
  const [dutyPhoneInput, setDutyPhoneInput] = useState<string>("010-8921-4421");

  // 3. 차량 모달 상태
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleMasterItem | null>(null);
  const [vehicleForm, setVehicleForm] = useState<{
    id?: string;
    type: "carnival" | "county";
    plateNumber: string;
    capacity: number;
    status: "operational" | "maintenance";
  }>({
    type: "carnival",
    plateNumber: "",
    capacity: 7,
    status: "operational",
  });

  // 4. 기사 모달 상태
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverMasterItem | null>(null);
  const [driverForm, setDriverForm] = useState<{
    id?: string;
    name: string;
    phone: string;
    assignedVehicleId: string;
  }>({
    name: "",
    phone: "",
    assignedVehicleId: "",
  });

  // 5. 삭제 확인 모달 상태 (소프트 딜리트)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "vehicle" | "driver";
    id: string;
    name: string;
  } | null>(null);

  // 초기 데이터 로딩
  const loadMasterData = async () => {
    const res = await getAdminMasterData();
    if (res.success && res.data) {
      setPolicy(res.data.policy);
      setVehicles(res.data.vehicles);
      setDrivers(res.data.drivers);
      setAuditLogs(res.data.auditLogs);

      // 폼 동기화
      setFareInput(new Intl.NumberFormat("ko-KR").format(res.data.policy.fareAmount));
      setCutoffInput(res.data.policy.cutoffTime);
      setAdminPhoneInput(res.data.policy.adminPhone);
      setDutyPhoneInput(res.data.policy.dutyPhone);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // 피드백 메시지 자동 소멸
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // 요금 포맷터
  const handleFareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (!rawValue) {
      setFareInput("0");
      return;
    }
    const num = parseInt(rawValue, 10);
    setFareInput(new Intl.NumberFormat("ko-KR").format(num));
  };

  // 전화번호 포맷터
  const formatPhoneNumber = (value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    if (clean.length < 4) return clean;
    if (clean.length < 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    if (clean.length < 11) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
  };

  // -------------------------------------------------------------
  // (1) 기본 정책 저장 핸들러
  // -------------------------------------------------------------
  const handleSavePolicy = () => {
    const fareAmount = parseInt(fareInput.replace(/,/g, ""), 10);
    if (isNaN(fareAmount) || fareAmount < 0) {
      setFeedback({ type: "error", text: isKr ? "유효한 요금을 입력해주세요." : "请输入有效票价。" });
      return;
    }

    startTransition(async () => {
      const res = await updateSystemPolicyAction({
        fareAmount,
        cutoffTime: cutoffInput,
        adminPhone: adminPhoneInput,
        dutyPhone: dutyPhoneInput,
      });

      if (res.success) {
        setPolicy(res.data);
        setFeedback({
          type: "success",
          text: isKr ? "기본 운영 정책이 성공적으로 저장 및 즉시 반영되었습니다." : "运营政策已更新并实时生效。",
        });
        await loadMasterData();
      } else {
        setFeedback({ type: "error", text: res.error || (isKr ? "정책 저장 실패" : "保存失败") });
      }
    });
  };

  // -------------------------------------------------------------
  // (2) 차량 관리 핸들러 (모달 오픈, 저장, 상태 토글, 삭제)
  // -------------------------------------------------------------
  const openNewVehicleModal = () => {
    setEditingVehicle(null);
    setVehicleForm({
      type: "carnival",
      plateNumber: "",
      capacity: 7,
      status: "operational",
    });
    setIsVehicleModalOpen(true);
  };

  const openEditVehicleModal = (veh: VehicleMasterItem) => {
    setEditingVehicle(veh);
    setVehicleForm({
      id: veh.id,
      type: veh.type,
      plateNumber: veh.plateNumber,
      capacity: veh.capacity,
      status: veh.status,
    });
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.plateNumber.trim()) {
      setFeedback({ type: "error", text: isKr ? "차량 번호를 입력해주세요." : "请输入车牌号。" });
      return;
    }

    startTransition(async () => {
      const res = await upsertVehicleAction({
        id: vehicleForm.id,
        type: vehicleForm.type,
        plateNumber: vehicleForm.plateNumber.trim(),
        capacity: Number(vehicleForm.capacity),
        status: vehicleForm.status,
        isActive: true,
      });

      if (res.success) {
        setVehicles(res.data.vehicles);
        setIsVehicleModalOpen(false);
        setFeedback({
          type: "success",
          text: isKr ? "차량 정보가 성공적으로 저장되었습니다." : "车辆信息已成功保存。",
        });
        await loadMasterData();
      } else {
        setFeedback({ type: "error", text: res.error || "차량 저장 실패" });
      }
    });
  };

  // 차량 운행 상태 토글
  const handleToggleVehicleStatus = (veh: VehicleMasterItem) => {
    const nextStatus = veh.status === "operational" ? "maintenance" : "operational";
    startTransition(async () => {
      const res = await upsertVehicleAction({
        id: veh.id,
        type: veh.type,
        plateNumber: veh.plateNumber,
        capacity: veh.capacity,
        status: nextStatus,
        isActive: veh.isActive,
      });
      if (res.success) {
        setVehicles(res.data.vehicles);
        setFeedback({
          type: "success",
          text: `${veh.plateNumber} 상태가 [${nextStatus === "operational" ? (isKr ? "운행 가능" : "可运营") : (isKr ? "정비 점검 중" : "维修保养中")}]으로 변경되었습니다.`,
        });
        await loadMasterData();
      }
    });
  };

  // -------------------------------------------------------------
  // (3) 기사 관리 핸들러 (모달 오픈, 저장, 배정차량 변경, 삭제)
  // -------------------------------------------------------------
  const openNewDriverModal = () => {
    setEditingDriver(null);
    const firstActiveVehicleId = vehicles.find((v) => v.isActive)?.id || "";
    setDriverForm({
      name: "",
      phone: "",
      assignedVehicleId: firstActiveVehicleId,
    });
    setIsDriverModalOpen(true);
  };

  const openEditDriverModal = (drv: DriverMasterItem) => {
    setEditingDriver(drv);
    setDriverForm({
      id: drv.id,
      name: drv.name,
      phone: drv.phone,
      assignedVehicleId: drv.assignedVehicleId,
    });
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.phone.trim()) {
      setFeedback({ type: "error", text: isKr ? "기사 성함과 연락처를 모두 입력해주세요." : "请完整填写姓名和电话。" });
      return;
    }

    startTransition(async () => {
      const res = await upsertDriverAction({
        id: driverForm.id,
        name: driverForm.name.trim(),
        phone: driverForm.phone.trim(),
        assignedVehicleId: driverForm.assignedVehicleId,
        isActive: true,
      });

      if (res.success) {
        setDrivers(res.data.drivers);
        setIsDriverModalOpen(false);
        setFeedback({
          type: "success",
          text: isKr ? "기사 마스터 정보가 저장되었습니다 (기사용 웹 즉시 연동)." : "司机信息已保存并同步。",
        });
        await loadMasterData();
      } else {
        setFeedback({ type: "error", text: res.error || "기사 저장 실패" });
      }
    });
  };

  // -------------------------------------------------------------
  // (4) 소프트 딜리트 실행 핸들러 (물리 삭제 절대 금지)
  // -------------------------------------------------------------
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      if (deleteTarget.type === "vehicle") {
        const res = await deleteVehicleAction(deleteTarget.id);
        if (res.success) {
          setVehicles(res.data.vehicles);
          setFeedback({
            type: "success",
            text: isKr ? "차량이 비활성화(소프트 딜리트) 및 감사로그 기록 완료되었습니다." : "车辆已停用并记录审计日志。",
          });
        } else {
          setFeedback({ type: "error", text: res.error || "삭제 실패" });
        }
      } else {
        const res = await deleteDriverAction(deleteTarget.id);
        if (res.success) {
          setDrivers(res.data.drivers);
          setFeedback({
            type: "success",
            text: isKr ? "기사 계정이 비활성화(소프트 딜리트) 및 감사로그 기록 완료되었습니다." : "司机账号已停用并记录审计日志。",
          });
        } else {
          setFeedback({ type: "error", text: res.error || "삭제 실패" });
        }
      }
      setDeleteTarget(null);
      await loadMasterData();
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
      <div className="bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider">
                MASTER POLICY
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <History className="h-3.5 w-3.5" />
                {isKr ? "최근 정책 갱신" : "最后更新"}: {new Date(policy.updatedAt).toLocaleString("ko-KR")}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isKr ? "기본 운영 정책 및 마스터 데이터 관리" : "基础运营政策与主数据管理"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
              {isKr
                ? "승객용 웹, 기사용 웹, 관리 관제탑 전반의 요금 단가, 마감 기준 시각, 등록 차량 및 배정 기사 정보를 중앙 통제합니다."
                : "中央统筹管理票价政策、预订截止时限、班车车队与当值司机基础数据。"}
            </p>
          </div>

          <button
            onClick={loadMasterData}
            disabled={isPending}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-all squishy-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin text-emerald-500" : ""}`} />
            <span>{isKr ? "마스터 데이터 동기화" : "同步最新数据"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          카드 1: [시스템 운영 기본 정책]
      ========================================================================= */}
      <section className="bg-white dark:bg-[#111622] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {isKr ? "시스템 운영 기본 정책 설정" : "系统运营基础政策设置"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isKr
                  ? "승객 예약 화면의 예상 요금 및 마감 시각 안내에 실시간 바인딩됩니다."
                  : "设置将即时同步至乘客端预订界面与预订截止控制。"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSavePolicy}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all squishy-btn disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>{isKr ? "정책 저장 및 즉시 반영" : "保存并实时生效"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {/* 1) 편도 기본 탑승 요금 단가 설정 */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isKr ? "편도 기본 탑승 요금 단가" : "单程基础乘车票价"}</span>
                </label>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {isKr ? "원화 ₩" : "韩元 ₩"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                {isKr ? "승객 예약 시 인원수별 예상 금액 계산에 기준이 됩니다." : "作为乘客预订时计费依据。"}
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                  ₩
                </span>
                <input
                  type="text"
                  value={fareInput}
                  onChange={handleFareChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all text-right"
                  placeholder="5,000"
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isKr ? "현재 적용 단가" : "当前单价"}</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                ₩{new Intl.NumberFormat("ko-KR").format(policy.fareAmount)}
              </span>
            </div>
          </div>

          {/* 2) 전날 예약 마감 시간 설정 */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{isKr ? "전날 예약 마감 시간 설정" : "前日预订截止时间"}</span>
                </label>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {isKr ? "잠금 기준시" : "截止控制"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                {isKr ? "기준 시각 도달 시 승객 웹 예약 폼이 자동 잠금 처리됩니다." : "达到此时间后系统将自动锁定翌日预订。"}
              </p>
              <input
                type="time"
                value={cutoffInput}
                onChange={(e) => setCutoffInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-base focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all text-center tracking-wider"
              />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isKr ? "현재 마감 기준" : "生效截止时"}</span>
              <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                매일 {policy.cutoffTime} 마감
              </span>
            </div>
          </div>

          {/* 3) 비상 연락처 통합 관리 */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-sky-500" />
                  <span>{isKr ? "비상 연락처 통합 관리" : "紧急联络热线"}</span>
                </label>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {isKr ? "고객 안내" : "前台指引"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                {isKr ? "승객 웹 하단 긴급 연락처 및 당직실 핫라인 번호입니다." : "用于乘客端紧急联络与值班室热线。"}
              </p>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 mb-0.5 block">
                    {isKr ? "관리사무소 직통" : "管理处直通"}
                  </span>
                  <input
                    type="text"
                    value={adminPhoneInput}
                    onChange={(e) => setAdminPhoneInput(formatPhoneNumber(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    placeholder="010-3342-9981"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 mb-0.5 block">
                    {isKr ? "야간/당직자 비상폰" : "夜间/值班手机"}
                  </span>
                  <input
                    type="text"
                    value={dutyPhoneInput}
                    onChange={(e) => setDutyPhoneInput(formatPhoneNumber(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    placeholder="010-8921-4421"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isKr ? "안내 번호 동기화" : "号码状态"}</span>
              <span className="font-bold text-sky-600 dark:text-sky-400 text-xs">
                {policy.adminPhone}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          카드 2: [셔틀 차량(Vehicle) 마스터 관리] Bento 스타일 테이블
      ========================================================================= */}
      <section className="bg-white dark:bg-[#111622] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {isKr ? "셔틀 차량(Vehicle) 마스터 관리" : "班车车队(Vehicle)主数据"}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {vehicles.filter((v) => v.isActive).length}대 가동
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isKr
                  ? "차종별 탑승 정원 및 실시간 정비·점검 상태를 관리합니다 (물리 삭제 금지 및 Audit Log 자동 보존)."
                  : "管理车队类型、核载人数及运行/保养状态（禁止硬删除，自动记录审计日志）。"}
              </p>
            </div>
          </div>
          <button
            onClick={openNewVehicleModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all squishy-btn self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{isKr ? "신규 차량 등록" : "登记新车辆"}</span>
          </button>
        </div>

        {/* 차량 데이터 테이블 */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase">
                <th className="py-3 px-4">{isKr ? "차량 구분" : "车型"}</th>
                <th className="py-3 px-4">{isKr ? "차량 번호" : "车牌号"}</th>
                <th className="py-3 px-4">{isKr ? "탑승 정원" : "核载人数"}</th>
                <th className="py-3 px-4">{isKr ? "운행 가능 여부 (원터치 전환)" : "运营状态切换"}</th>
                <th className="py-3 px-4">{isKr ? "계정 상태" : "状态"}</th>
                <th className="py-3 px-4 text-right">{isKr ? "관리 액션" : "操作"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {vehicles.map((veh) => {
                const isCarnival = veh.type === "carnival";
                const isOperational = veh.status === "operational";
                return (
                  <tr
                    key={veh.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40 ${
                      !veh.isActive ? "opacity-40 bg-slate-100/50 dark:bg-slate-950/50" : ""
                    }`}
                  >
                    {/* 차량 구분 */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${
                          isCarnival
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60"
                        }`}
                      >
                        <Bus className="h-3.5 w-3.5" />
                        {isCarnival ? (isKr ? "카니발" : "嘉华 (Carnival)") : (isKr ? "29인승 카운티" : "29座 考斯特 (County)")}
                      </span>
                    </td>

                    {/* 차량 번호 */}
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-sm">
                      {veh.plateNumber}
                    </td>

                    {/* 탑승 정원 */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                        {veh.capacity}인승 ({veh.capacity} Seats)
                      </span>
                    </td>

                    {/* 현재 상태 (운행 가능 / 정비 점검 중 토글) */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleVehicleStatus(veh)}
                        disabled={!veh.isActive || isPending}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all border squishy-btn ${
                          isOperational
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOperational ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        <span>
                          {isOperational
                            ? (isKr ? "운행 가능 (정상)" : "正常运营")
                            : (isKr ? "정비 점검 중" : "维修保养中")}
                        </span>
                      </button>
                    </td>

                    {/* 활성 상태 배지 */}
                    <td className="py-3.5 px-4">
                      {veh.isActive ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-extrabold text-[11px]">
                          SOFT DELETED
                        </span>
                      )}
                    </td>

                    {/* 액션 버튼 */}
                    <td className="py-3.5 px-4 text-right">
                      {veh.isActive ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditVehicleModal(veh)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isKr ? "차량 정보 수정" : "修改"}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: "vehicle",
                                id: veh.id,
                                name: `${veh.plateNumber} (${veh.type === "carnival" ? "카니발" : "카운티"})`,
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={isKr ? "차량 비활성화 (소프트 딜리트)" : "停用车辆"}
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
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          카드 3: [운행 기사(Driver) 마스터 관리] 카드 & 테이블
      ========================================================================= */}
      <section className="bg-white dark:bg-[#111622] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {isKr ? "운행 기사(Driver) 마스터 관리" : "当值司机(Driver)主数据"}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {drivers.filter((d) => d.isActive).length}명 등록
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isKr
                  ? "등록된 기사 목록은 기사용 웹 로그인 화면 셀렉터에 즉시 실시간 바인딩됩니다."
                  : "在此登记的司机将即时同步至司机端登录选择列表。"}
              </p>
            </div>
          </div>
          <button
            onClick={openNewDriverModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all squishy-btn self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{isKr ? "신규 기사 등록" : "登记新司机"}</span>
          </button>
        </div>

        {/* 기사 데이터 테이블 */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase">
                <th className="py-3 px-4">{isKr ? "기사 성함" : "司机姓名"}</th>
                <th className="py-3 px-4">{isKr ? "직통 연락처" : "联络电话"}</th>
                <th className="py-3 px-4">{isKr ? "담당 배정 차량" : "指派车辆"}</th>
                <th className="py-3 px-4">{isKr ? "활성 상태 배지" : "状态"}</th>
                <th className="py-3 px-4 text-right">{isKr ? "관리 액션" : "操作"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {drivers.map((drv) => {
                const assignedVehicle = vehicles.find((v) => v.id === drv.assignedVehicleId);
                return (
                  <tr
                    key={drv.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40 ${
                      !drv.isActive ? "opacity-40 bg-slate-100/50 dark:bg-slate-950/50" : ""
                    }`}
                  >
                    {/* 기사 성함 */}
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs">
                          {drv.name.slice(0, 1)}
                        </div>
                        <span>{drv.name}</span>
                      </div>
                    </td>

                    {/* 직통 연락처 */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {drv.phone}
                    </td>

                    {/* 담당 배정 차량 드롭다운 즉시 선택 또는 표기 */}
                    <td className="py-3.5 px-4">
                      {assignedVehicle ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold border border-slate-200 dark:border-slate-700">
                          <Bus className="h-3.5 w-3.5 text-sky-500" />
                          <span>
                            {assignedVehicle.plateNumber} (
                            {assignedVehicle.type === "carnival" ? (isKr ? "카니발" : "嘉华") : (isKr ? "카운티" : "考斯特")})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          {isKr ? "미배정" : "未指派"}
                        </span>
                      )}
                    </td>

                    {/* 활성 상태 배지 */}
                    <td className="py-3.5 px-4">
                      {drv.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200/50 dark:border-emerald-800/50">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{isKr ? "정상 근무" : "在岗"}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] border border-rose-200/50 dark:border-rose-800/50">
                          {isKr ? "퇴직/비활성" : "离岗"}
                        </span>
                      )}
                    </td>

                    {/* 액션 */}
                    <td className="py-3.5 px-4 text-right">
                      {drv.isActive ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDriverModal(drv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isKr ? "기사 정보 수정" : "修改"}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: "driver",
                                id: drv.id,
                                name: `${drv.name} (${drv.phone})`,
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={isKr ? "기사 계정 비활성화 (소프트 딜리트)" : "停用司机"}
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
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          감사 로그 (Audit Logs) 무결성 가시화 섹션
      ========================================================================= */}
      <section className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
              {isKr ? "시스템 마스터 변경 감사 이력 (Audit Logs)" : "审计变更流水记录"}
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {isKr ? "최근 5건 보존 내역" : "最近5条记录"}
          </span>
        </div>

        <div className="space-y-2">
          {auditLogs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-400">
                  {log.action}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {log.entity} : {log.entityId}
                </span>
                <span className="text-slate-400 text-[11px]">by {log.actor}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {new Date(log.timestamp).toLocaleString("ko-KR")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          모달 1: 차량 등록/수정 모달
      ========================================================================= */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="h-5 w-5 text-sky-500" />
                <span>
                  {editingVehicle
                    ? (isKr ? "차량 정보 수정" : "修改车辆信息")
                    : (isKr ? "신규 차량 등록" : "登记新车辆")}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              {/* 차종 선택 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "차량 구분 (차종)" : "车型"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVehicleForm((prev) => ({ ...prev, type: "carnival", capacity: 7 }))}
                    className={`p-3 rounded-xl border text-xs font-black transition-all ${
                      vehicleForm.type === "carnival"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isKr ? "카니발 (7/9인승)" : "嘉华 (7/9座)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleForm((prev) => ({ ...prev, type: "county", capacity: 29 }))}
                    className={`p-3 rounded-xl border text-xs font-black transition-all ${
                      vehicleForm.type === "county"
                        ? "bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isKr ? "29인승 카운티" : "29座 考斯特"}
                  </button>
                </div>
              </div>

              {/* 차량 번호 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "차량 번호 (예: 제주 70가 1142)" : "车牌号 (例: 济州 70가 1142)"}
                </label>
                <input
                  type="text"
                  required
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, plateNumber: e.target.value }))}
                  placeholder={isKr ? "예: 제주 70가 1142" : "例: 济州 70가 1142"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* 탑승 정원 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "탑승 정원 (인승)" : "核载人数"}
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* 운행 상태 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "초기 상태" : "运营状态"}
                </label>
                <select
                  value={vehicleForm.status}
                  onChange={(e) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      status: e.target.value as "operational" | "maintenance",
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  <option value="operational">{isKr ? "운행 가능 (정상)" : "正常运营"}</option>
                  <option value="maintenance">{isKr ? "정비 점검 중" : "维修保养中"}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {isKr ? "취소" : "取消"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-600/20"
                >
                  {editingVehicle ? (isKr ? "수정 완료" : "保存修改") : (isKr ? "등록 완료" : "确认登记")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 2: 기사 등록/수정 모달
      ========================================================================= */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-500" />
                <span>
                  {editingDriver
                    ? (isKr ? "기사 정보 수정" : "修改司机信息")
                    : (isKr ? "신규 기사 등록" : "登记新司机")}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4">
              {/* 기사 성함 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "기사 성함" : "司机姓名"}
                </label>
                <input
                  type="text"
                  required
                  value={driverForm.name}
                  onChange={(e) => setDriverForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={isKr ? "예: 김철수 기사님" : "例: 金司机"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* 직통 연락처 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "휴대폰 연락처" : "手机号码"}
                </label>
                <input
                  type="text"
                  required
                  value={driverForm.phone}
                  onChange={(e) =>
                    setDriverForm((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))
                  }
                  placeholder="010-8921-4421"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* 담당 배정 차량 */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  {isKr ? "담당 배정 차량" : "指派车辆"}
                </label>
                <select
                  value={driverForm.assignedVehicleId}
                  onChange={(e) => setDriverForm((prev) => ({ ...prev, assignedVehicleId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">{isKr ? "차량 미배정" : "暂不指派"}</option>
                  {vehicles
                    .filter((v) => v.isActive)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} ({v.type === "carnival" ? (isKr ? "카니발" : "嘉华") : (isKr ? "카운티" : "考斯特")}) - {v.capacity}인승
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {isKr ? "취소" : "取消"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20"
                >
                  {editingDriver ? (isKr ? "수정 완료" : "保存修改") : (isKr ? "등록 완료" : "确认登记")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          모달 3: 소프트 딜리트 확인 팝업 (물리 삭제 절대 금지)
      ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {isKr ? "데이터 비활성화 (소프트 딜리트)" : "停用确认 (软删除)"}
                </h4>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  {isKr ? "물리 삭제 없이 이력이 보존됩니다." : "数据将被归档保留。"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isKr ? (
                <>
                  <strong className="text-slate-900 dark:text-white font-extrabold">{deleteTarget.name}</strong>
                  을(를) 시스템에서 비활성화하시겠습니까? 관련 운행 이력 및 감사 로그(`audit_logs`)는 안전하게 영구 보존됩니다.
                </>
              ) : (
                <>
                  确定要停用 <strong>{deleteTarget.name}</strong> 吗？所有运行历史与审计日志均将被完整永久保留。
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                {isKr ? "취소" : "取消"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20"
              >
                {isKr ? "비활성화 처리" : "确认停用"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
