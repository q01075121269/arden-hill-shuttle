"use server";

import { z } from "zod";
import { AuditLogItem } from "./admin-master";
import { deductResidentUnpaid } from "./admin-customers";

export type AdminActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// 정산 거래내역 레코드 타입
export interface SettlementLedgerItem {
  id: string; // 거래 식별자 (예: RSV-20261001)
  residentId: string; // 입주민 식별자 (RES-001)
  date: string; // 이용 일자 (YYYY-MM-DD)
  time: string; // 탑승 회차/시간 (예: 1회차 08:10)
  passengerName: string; // 승객명
  building: string; // 동수 (예: 105동, 112동)
  phone: string; // 연락처
  route: string; // 이동 구간 (예: 105동 ➔ 제주공항)
  vehicleType: string; // 차량 구분 (카니발 / 29인승 카운티)
  vehiclePlate: string; // 차량 번호 (제주 70가 1142 등)
  passengerCount: number; // 탑승 인원
  fareAmount: number; // 청구 요금 (₩)
  paymentStatus: "unpaid" | "paid"; // 결제 상태 배지
  paidAt?: string; // 완납 처리 일시
  settledBy?: string; // 완납 처리 관리자
  auditLogId?: string; // 연결된 감사로그 ID
}

// 다차원 필터 파라미터 타입
export interface SettlementFilterParams {
  startDate?: string;
  endDate?: string;
  quickFilter?: "today" | "week" | "month" | "all";
  building?: string;
  paymentStatus?: "all" | "unpaid" | "paid";
  passengerName?: string;
}

// 재무 현황 요약 KPI 카드 데이터
export interface SettlementKPIData {
  totalUnpaidAmount: number; // 총 누적 미납액 (소프트 웜 앰버 틴트)
  unpaidPassengerCount: number; // 미납 승객 수 (명)
  monthPaidAmount: number; // 당월 수납 완료액 (소프트 세이지 에메랄드 틴트)
}

// 초기 정산 장부 데이터베이스 (시뮬레이션)
let GLOBAL_SETTLEMENT_LEDGER: SettlementLedgerItem[] = [
  {
    id: "SETTLE-20261001",
    residentId: "RES-001",
    date: "2026-10-09",
    time: "1회차 (08:10)",
    passengerName: "김민수",
    building: "112동",
    phone: "010-3321-9988",
    route: "112동 앞 ➔ 제주공항",
    vehicleType: "카니발 리무진",
    vehiclePlate: "제주 70가 1142",
    passengerCount: 2,
    fareAmount: 10000,
    paymentStatus: "paid",
    paidAt: "2026-10-09 08:05",
    settledBy: "Admin-Auto",
    auditLogId: "AUDIT-INIT01",
  },
  {
    id: "SETTLE-20261002",
    residentId: "RES-002",
    date: "2026-10-09",
    time: "2회차 (10:30)",
    passengerName: "Wang Wei (王伟)",
    building: "105동",
    phone: "010-5544-3322",
    route: "제주공항 ➔ 커뮤니티센터",
    vehicleType: "29인승 카운티",
    vehiclePlate: "제주 72바 5501",
    passengerCount: 4,
    fareAmount: 20000,
    paymentStatus: "unpaid",
  },
  {
    id: "SETTLE-20261003",
    residentId: "RES-003",
    date: "2026-10-09",
    time: "3회차 (12:30)",
    passengerName: "이지은 (투숙객)",
    building: "168동",
    phone: "010-7766-1122",
    route: "168동 앞 ➔ 제주공항",
    vehicleType: "카니발 리무진",
    vehiclePlate: "제주 70가 1142",
    passengerCount: 3,
    fareAmount: 15000,
    paymentStatus: "unpaid",
  },
  {
    id: "SETTLE-20261004",
    residentId: "RES-004",
    date: "2026-10-08",
    time: "4회차 (15:00)",
    passengerName: "박영호",
    building: "140동",
    phone: "010-9922-4411",
    route: "클럽하우스 ➔ 제주공항",
    vehicleType: "29인승 카운티",
    vehiclePlate: "제주 72바 5501",
    passengerCount: 2,
    fareAmount: 10000,
    paymentStatus: "paid",
    paidAt: "2026-10-08 16:30",
    settledBy: "Admin-Manager",
    auditLogId: "AUDIT-PAID02",
  },
  {
    id: "SETTLE-20261005",
    residentId: "RES-005",
    date: "2026-10-07",
    time: "1회차 (08:10)",
    passengerName: "최현우",
    building: "102동",
    phone: "010-8812-4321",
    route: "102동 앞 ➔ 제주공항",
    vehicleType: "카니발 리무진",
    vehiclePlate: "제주 70가 1142",
    passengerCount: 2,
    fareAmount: 10000,
    paymentStatus: "unpaid",
  },
  {
    id: "SETTLE-20261006",
    residentId: "RES-006",
    date: "2026-10-06",
    time: "2회차 (10:30)",
    passengerName: "정수민",
    building: "커뮤니티 센터",
    phone: "010-3344-7788",
    route: "커뮤니티센터 ➔ 제주공항",
    vehicleType: "29인승 카운티",
    vehiclePlate: "제주 72바 5501",
    passengerCount: 1,
    fareAmount: 5000,
    paymentStatus: "paid",
    paidAt: "2026-10-06 11:00",
    settledBy: "Admin-Desk",
    auditLogId: "AUDIT-PAID03",
  },
  {
    id: "SETTLE-20261007",
    residentId: "RES-001",
    date: "2026-10-05",
    time: "5회차 (17:30)",
    passengerName: "김민수",
    building: "112동",
    phone: "010-3321-9988",
    route: "제주공항 ➔ 112동 앞",
    vehicleType: "카니발 리무진",
    vehiclePlate: "제주 70가 1142",
    passengerCount: 2,
    fareAmount: 10000,
    paymentStatus: "paid",
    paidAt: "2026-10-05 18:00",
    settledBy: "Admin-Auto",
    auditLogId: "AUDIT-PAID04",
  },
  {
    id: "SETTLE-20261008",
    residentId: "RES-004",
    date: "2026-10-04",
    time: "2회차 (10:30)",
    passengerName: "박영호",
    building: "140동",
    phone: "010-9922-4411",
    route: "140동 앞 ➔ 제주공항",
    vehicleType: "29인승 카운티",
    vehiclePlate: "제주 72바 5501",
    passengerCount: 2,
    fareAmount: 10000,
    paymentStatus: "paid",
    paidAt: "2026-10-04 11:20",
    settledBy: "Admin-Manager",
    auditLogId: "AUDIT-PAID05",
  },
];

// 수납 관련 글로벌 감사 로그
let GLOBAL_SETTLEMENT_AUDIT: AuditLogItem[] = [];

/**
 * 1. 다차원 조건부 정산 목록 및 KPI 조회 Server Action
 */
export async function getSettlementLedgerAction(
  filterParams?: SettlementFilterParams
): Promise<
  AdminActionResult<{
    records: SettlementLedgerItem[];
    kpi: SettlementKPIData;
  }>
> {
  let records = [...GLOBAL_SETTLEMENT_LEDGER];

  // (1) 날짜 / 퀵 필터 적용
  const todayStr = "2026-10-09"; // 기준일
  if (filterParams?.quickFilter === "today") {
    records = records.filter((r) => r.date === todayStr);
  } else if (filterParams?.quickFilter === "week") {
    // 최근 7일 (2026-10-03 ~ 2026-10-09)
    records = records.filter((r) => r.date >= "2026-10-03" && r.date <= todayStr);
  } else if (filterParams?.quickFilter === "month") {
    // 당월 (2026-10)
    records = records.filter((r) => r.date.startsWith("2026-10"));
  } else {
    // 커스텀 시작일/종료일
    if (filterParams?.startDate) {
      records = records.filter((r) => r.date >= filterParams.startDate!);
    }
    if (filterParams?.endDate) {
      records = records.filter((r) => r.date <= filterParams.endDate!);
    }
  }

  // (2) 동/호수 필터
  if (filterParams?.building && filterParams.building !== "all") {
    records = records.filter((r) => r.building === filterParams.building);
  }

  // (3) 수납 상태 필터
  if (filterParams?.paymentStatus && filterParams.paymentStatus !== "all") {
    records = records.filter((r) => r.paymentStatus === filterParams.paymentStatus);
  }

  // (4) 승객명 검색
  if (filterParams?.passengerName && filterParams.passengerName.trim()) {
    const q = filterParams.passengerName.trim().toLowerCase();
    records = records.filter((r) => r.passengerName.toLowerCase().includes(q));
  }

  // 최신 일자/시간 역순 정렬
  records.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // 전체 데이터셋 기반 KPI 집계
  const allUnpaid = GLOBAL_SETTLEMENT_LEDGER.filter((r) => r.paymentStatus === "unpaid");
  const totalUnpaidAmount = allUnpaid.reduce((sum, r) => sum + r.fareAmount, 0);

  // 미납 승객 수 (중복 제거된 residentId 또는 승객명)
  const unpaidResidentSet = new Set(allUnpaid.map((r) => r.residentId || r.passengerName));
  const unpaidPassengerCount = unpaidResidentSet.size;

  // 당월 수납 완료액 (2026-10 기준)
  const currentMonthPaid = GLOBAL_SETTLEMENT_LEDGER.filter(
    (r) => r.paymentStatus === "paid" && r.date.startsWith("2026-10")
  );
  const monthPaidAmount = currentMonthPaid.reduce((sum, r) => sum + r.fareAmount, 0);

  return {
    success: true,
    data: {
      records,
      kpi: {
        totalUnpaidAmount,
        unpaidPassengerCount,
        monthPaidAmount,
      },
    },
  };
}

/**
 * 2. 원터치 완납 처리 및 audit_logs 기록 Server Action
 */
export async function markAsPaidAction(
  ledgerId: string,
  residentId?: string
): Promise<
  AdminActionResult<{
    record: SettlementLedgerItem;
    records: SettlementLedgerItem[];
    kpi: SettlementKPIData;
  }>
> {
  const index = GLOBAL_SETTLEMENT_LEDGER.findIndex((r) => r.id === ledgerId);
  if (index === -1) {
    return { success: false, error: "해당 정산 거래내역을 찾을 수 없습니다." };
  }

  const target = GLOBAL_SETTLEMENT_LEDGER[index];
  if (target.paymentStatus === "paid") {
    return { success: false, error: "이미 완납 처리된 거래내역입니다." };
  }

  const now = new Date();
  const paidAtStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const auditLogId = `AUDIT-PAID-${Date.now()}`;

  // 장부 업데이트
  GLOBAL_SETTLEMENT_LEDGER[index] = {
    ...target,
    paymentStatus: "paid",
    paidAt: paidAtStr,
    settledBy: "Admin-Manager",
    auditLogId,
  };

  // 대상 입주민 DB의 미납 잔액 즉시 동기화
  const targetResidentId = residentId || target.residentId;
  if (targetResidentId) {
    await deductResidentUnpaid(targetResidentId, target.fareAmount);
  }

  // 감사 로그 영구 기록
  const auditLog: AuditLogItem = {
    id: auditLogId,
    action: "UPDATE_POLICY" as any, // audit action
    entity: "system_policies" as any,
    entityId: ledgerId,
    actor: "Admin-Manager",
    previousData: { paymentStatus: "unpaid", fareAmount: target.fareAmount },
    newData: {
      paymentStatus: "paid",
      fareAmount: target.fareAmount,
      residentId: targetResidentId,
      passengerName: target.passengerName,
      paidAt: paidAtStr,
    },
    timestamp: now.toISOString(),
  };
  GLOBAL_SETTLEMENT_AUDIT.unshift(auditLog);

  console.log(
    `[audit_logs] 완납 처리 완료: ${target.passengerName} (${target.building}), 금액 ₩${target.fareAmount}, 거래ID: ${ledgerId}, 감사ID: ${auditLogId}`
  );

  // 최신 데이터 조회 반환
  const refreshed = await getSettlementLedgerAction();
  if (!refreshed.success) {
    return {
      success: false,
      error: "정산 내역을 갱신하는 중 오류가 발생했습니다.",
    };
  }

  return {
    success: true,
    data: {
      record: GLOBAL_SETTLEMENT_LEDGER[index],
      records: refreshed.data.records,
      kpi: refreshed.data.kpi,
    },
    message: `${target.passengerName} 님의 ₩${new Intl.NumberFormat("ko-KR").format(target.fareAmount)} 미납금이 완납 처리되었습니다.`,
  };
}

// 명세서 호환용 별칭 Export
export const getSettlementLedger = getSettlementLedgerAction;
export const markAsPaid = markAsPaidAction;
