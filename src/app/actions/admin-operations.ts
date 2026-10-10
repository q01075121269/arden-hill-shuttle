"use server";

import { z } from "zod";
import { AuditLogItem } from "./admin-master";

export type AdminActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// 1. 회차 승객 예약 아이템 인터페이스
export interface OperationReservationItem {
  id: string; // 예약 ID (예: RSV-20261009-01)
  date: string; // YYYY-MM-DD
  direction: "outbound" | "inbound"; // outbound: 아덴힐->공항, inbound: 공항->아덴힐
  roundNumber: number; // 회차 번호 (1~6 또는 1~5)
  timeText: string; // 출발 시간 (예: 08:10)
  pickupLocation: string; // 승차 위치 (예: 102동 앞, 105동 앞, 공항 3층 5번 게이트)
  dropoffLocation: string; // 하차 희망지 (예: 제주공항, 이마트, 아덴힐 커뮤니티)
  passengerName: string; // 고객 성함
  phone: string; // 연락처
  passengerCount: number; // 탑승 인원
  paymentStatus: "paid" | "unpaid"; // 수납 상태
  boardedStatus: "boarded" | "waiting"; // 기사 승차 체크 상태 ([승차 완료] / [대기])
  notes?: string; // 특이사항/메모
  isActive: boolean; // 소프트 딜리트 플래그
  createdAt: string;
  updatedAt: string;
}

// 2. 일일 회차 요약 인터페이스
export interface OperationRoundSummary {
  direction: "outbound" | "inbound";
  roundNumber: number;
  timeText: string;
  totalPax: number; // 총 예약 인원
  boardedPax: number; // 실제 승차 완료 인원
  allocatedVehicleType: "carnival" | "county"; // 5인 이하 카니발, 6인 이상 카운티
  vehiclePlate: string;
  reservations: OperationReservationItem[];
}

// 3. 기사 5대 안전점검 결과 인터페이스
export interface DriverDailySafetyCheck {
  driverName: string;
  vehiclePlate: string;
  checkTime: string;
  tireCheck: "good" | "normal" | "bad";
  lightCheck: "good" | "normal" | "bad";
  leakCheck: "good" | "normal" | "bad";
  cleanCheck: "good" | "normal" | "bad";
  brakeCheck: "good" | "normal" | "bad";
  memo: string;
  signatureCompleted: boolean;
}

// 4. 일일 종합 운행 데이터 인터페이스
export interface DailyOperationData {
  date: string;
  stopoverName: string; // 당일 경유지 ("이마트 (정상 운행)", "제주민속오일장", 등)
  outboundRounds: OperationRoundSummary[];
  inboundRounds: OperationRoundSummary[];
  safetyCheck: DriverDailySafetyCheck;
  totalOutboundPax: number;
  totalInboundPax: number;
  grandTotalPax: number;
}

// Zod 유효성 검증 스키마
const reservationAdminSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(10, "올바른 날짜를 선택해주세요."),
  direction: z.enum(["outbound", "inbound"]),
  roundNumber: z.number().int().min(1).max(6),
  timeText: z.string().min(4),
  pickupLocation: z.string().min(1, "승차 위치를 입력해주세요."),
  dropoffLocation: z.string().min(1, "하차 희망지를 입력해주세요."),
  passengerName: z.string().min(2, "승객 성함을 입력해주세요."),
  phone: z.string().min(8, "연락처를 입력해주세요."),
  passengerCount: z.number().int().min(1, "탑승 인원은 1명 이상이어야 합니다."),
  paymentStatus: z.enum(["paid", "unpaid"]).default("unpaid"),
  boardedStatus: z.enum(["boarded", "waiting"]).default("waiting"),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export type ReservationAdminInput = z.input<typeof reservationAdminSchema>;

// 회차 기본 시간표 템플릿
const OUTBOUND_TIMES = ["08:10", "10:30", "12:30", "15:00", "18:20", "20:00"];
const INBOUND_TIMES = ["09:30", "11:30", "13:30", "16:20", "19:10"];

// 초기 대체 경유지 캘린더 맵 (Key: YYYY-MM-DD, Value: 경유지명)
let GLOBAL_ALTERNATIVE_ROUTES: Record<string, string> = {
  "2026-10-11": "제주민속오일장", // 일요일 대형마트 의무휴업일
  "2026-10-25": "제주민속오일장",
  "2026-10-14": "동문재래시장",
};

// 초기 일일 예약 저장소
let GLOBAL_OPERATIONS_RESERVATIONS: OperationReservationItem[] = [
  // 하행 1회차 (08:10)
  {
    id: "RSV-20261009-01",
    date: "2026-10-09",
    direction: "outbound",
    roundNumber: 1,
    timeText: "08:10",
    pickupLocation: "112동 앞",
    dropoffLocation: "제주공항 3층",
    passengerName: "김민수",
    phone: "010-3321-9988",
    passengerCount: 2,
    paymentStatus: "paid",
    boardedStatus: "boarded",
    notes: "골프백 2개",
    isActive: true,
    createdAt: "2026-10-08T14:00:00Z",
    updatedAt: "2026-10-09T08:10:00Z",
  },
  {
    id: "RSV-20261009-02",
    date: "2026-10-09",
    direction: "outbound",
    roundNumber: 1,
    timeText: "08:10",
    pickupLocation: "105동 앞",
    dropoffLocation: "제주공항 3층",
    passengerName: "최영식",
    phone: "010-4421-5588",
    passengerCount: 3,
    paymentStatus: "paid",
    boardedStatus: "boarded",
    notes: "정시 출발",
    isActive: true,
    createdAt: "2026-10-08T15:20:00Z",
    updatedAt: "2026-10-09T08:10:00Z",
  },
  // 하행 2회차 (10:30) - 9명 카운티 자동 배정
  {
    id: "RSV-20261009-03",
    date: "2026-10-09",
    direction: "outbound",
    roundNumber: 2,
    timeText: "10:30",
    pickupLocation: "102동 앞",
    dropoffLocation: "이마트 신제주점",
    passengerName: "Wang Wei (王伟)",
    phone: "010-5544-3322",
    passengerCount: 4,
    paymentStatus: "unpaid",
    boardedStatus: "boarded",
    notes: "쇼핑 후 공항 이동 예정",
    isActive: true,
    createdAt: "2026-10-08T18:00:00Z",
    updatedAt: "2026-10-09T10:30:00Z",
  },
  {
    id: "RSV-20261009-04",
    date: "2026-10-09",
    direction: "outbound",
    roundNumber: 2,
    timeText: "10:30",
    pickupLocation: "커뮤니티 센터",
    dropoffLocation: "제주공항 3층",
    passengerName: "한지혜",
    phone: "010-8899-1122",
    passengerCount: 5,
    paymentStatus: "paid",
    boardedStatus: "boarded",
    notes: "가족 여행객",
    isActive: true,
    createdAt: "2026-10-08T19:30:00Z",
    updatedAt: "2026-10-09T10:30:00Z",
  },
  // 하행 3회차 (12:30) - 4명 카니발
  {
    id: "RSV-20261009-05",
    date: "2026-10-09",
    direction: "outbound",
    roundNumber: 3,
    timeText: "12:30",
    pickupLocation: "168동 앞",
    dropoffLocation: "제주공항 3층",
    passengerName: "이지은 (투숙객)",
    phone: "010-7766-1122",
    passengerCount: 3,
    paymentStatus: "unpaid",
    boardedStatus: "boarded",
    notes: "체크아웃 승객",
    isActive: true,
    createdAt: "2026-10-09T09:00:00Z",
    updatedAt: "2026-10-09T12:30:00Z",
  },
  {
    id: "RSV-20261009-06",
    date: "2026-10-09",
    direction: "outbound",
    roundNumber: 3,
    timeText: "12:30",
    pickupLocation: "101동 앞",
    dropoffLocation: "이마트",
    passengerName: "김선우",
    phone: "010-2233-4455",
    passengerCount: 1,
    paymentStatus: "paid",
    boardedStatus: "waiting",
    notes: "단독 탑승",
    isActive: true,
    createdAt: "2026-10-09T09:30:00Z",
    updatedAt: "2026-10-09T09:30:00Z",
  },
  // 상행 1회차 (09:30)
  {
    id: "RSV-20261009-07",
    date: "2026-10-09",
    direction: "inbound",
    roundNumber: 1,
    timeText: "09:30",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "112동 앞",
    passengerName: "박영호",
    phone: "010-9922-4411",
    passengerCount: 2,
    paymentStatus: "paid",
    boardedStatus: "boarded",
    notes: "제주 입도 정시 픽업",
    isActive: true,
    createdAt: "2026-10-08T16:00:00Z",
    updatedAt: "2026-10-09T09:30:00Z",
  },
  {
    id: "RSV-20261009-08",
    date: "2026-10-09",
    direction: "inbound",
    roundNumber: 1,
    timeText: "09:30",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "140동 앞",
    passengerName: "오정현",
    phone: "010-6677-8899",
    passengerCount: 4,
    paymentStatus: "paid",
    boardedStatus: "boarded",
    notes: "가족 투숙객",
    isActive: true,
    createdAt: "2026-10-08T20:00:00Z",
    updatedAt: "2026-10-09T09:30:00Z",
  },
  // 상행 2회차 (11:30) - 8명 카운티
  {
    id: "RSV-20261009-09",
    date: "2026-10-09",
    direction: "inbound",
    roundNumber: 2,
    timeText: "11:30",
    pickupLocation: "제주공항 3층 5번 게이트",
    dropoffLocation: "클럽하우스",
    passengerName: "강서연",
    phone: "010-3344-5566",
    passengerCount: 8,
    paymentStatus: "paid",
    boardedStatus: "boarded",
    notes: "단체 라운딩 팀",
    isActive: true,
    createdAt: "2026-10-08T21:00:00Z",
    updatedAt: "2026-10-09T11:30:00Z",
  },
];

// 감사 로그
let GLOBAL_OPERATIONS_AUDIT: AuditLogItem[] = [];

/**
 * 1. 특정 일자의 일일 운행 데이터 동시 조회 (회차별 승객, 배차, 안전점검)
 */
export async function getDailyOperationDataAction(
  targetDate: string
): Promise<AdminActionResult<DailyOperationData>> {
  const dateStr = targetDate || "2026-10-09";
  const stopoverName = GLOBAL_ALTERNATIVE_ROUTES[dateStr] || "이마트 (정상 운행)";

  // 당일 활성 예약 목록 필터링
  const dayReservations = GLOBAL_OPERATIONS_RESERVATIONS.filter(
    (r) => r.date === dateStr && r.isActive
  );

  // 하행 1~6회차 집계
  const outboundRounds: OperationRoundSummary[] = OUTBOUND_TIMES.map((time, idx) => {
    const roundNum = idx + 1;
    const rList = dayReservations.filter(
      (r) => r.direction === "outbound" && r.roundNumber === roundNum
    );
    const totalPax = rList.reduce((sum, r) => sum + r.passengerCount, 0);
    const boardedPax = rList
      .filter((r) => r.boardedStatus === "boarded")
      .reduce((sum, r) => sum + r.passengerCount, 0);
    // 탄력 배차: 5인 이하 카니발, 6인 이상 카운티
    const allocatedVehicleType = totalPax <= 5 ? "carnival" : "county";
    const vehiclePlate =
      allocatedVehicleType === "carnival" ? "제주 70가 1142 (카니발)" : "제주 72바 5501 (카운티)";

    return {
      direction: "outbound",
      roundNumber: roundNum,
      timeText: time,
      totalPax,
      boardedPax,
      allocatedVehicleType,
      vehiclePlate,
      reservations: rList,
    };
  });

  // 상행 1~5회차 집계
  const inboundRounds: OperationRoundSummary[] = INBOUND_TIMES.map((time, idx) => {
    const roundNum = idx + 1;
    const rList = dayReservations.filter(
      (r) => r.direction === "inbound" && r.roundNumber === roundNum
    );
    const totalPax = rList.reduce((sum, r) => sum + r.passengerCount, 0);
    const boardedPax = rList
      .filter((r) => r.boardedStatus === "boarded")
      .reduce((sum, r) => sum + r.passengerCount, 0);
    const allocatedVehicleType = totalPax <= 5 ? "carnival" : "county";
    const vehiclePlate =
      allocatedVehicleType === "carnival" ? "제주 70가 1142 (카니발)" : "제주 72바 5501 (카운티)";

    return {
      direction: "inbound",
      roundNumber: roundNum,
      timeText: time,
      totalPax,
      boardedPax,
      allocatedVehicleType,
      vehiclePlate,
      reservations: rList,
    };
  });

  const totalOutboundPax = outboundRounds.reduce((sum, r) => sum + r.totalPax, 0);
  const totalInboundPax = inboundRounds.reduce((sum, r) => sum + r.totalPax, 0);
  const grandTotalPax = totalOutboundPax + totalInboundPax;

  // 당일 기사 안전점검 결과
  const safetyCheck: DriverDailySafetyCheck = {
    driverName: "김철수 기사님",
    vehiclePlate: "제주 70가 1142 / 제주 72바 5501",
    checkTime: "07:45",
    tireCheck: "good",
    lightCheck: "good",
    leakCheck: "good",
    cleanCheck: "good",
    brakeCheck: "good",
    memo: "기상 상태 양호. 차량 공기압 및 제동 계통 정상 확인 완료.",
    signatureCompleted: true,
  };

  return {
    success: true,
    data: {
      date: dateStr,
      stopoverName,
      outboundRounds,
      inboundRounds,
      safetyCheck,
      totalOutboundPax,
      totalInboundPax,
      grandTotalPax,
    },
  };
}

/**
 * 2. 관리자 직권 예약 추가 및 수정 (upsertReservationByAdmin)
 */
export async function upsertReservationByAdminAction(
  data: ReservationAdminInput
): Promise<AdminActionResult<{ reservation: OperationReservationItem; daily: DailyOperationData }>> {
  const parsed = reservationAdminSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "예약 정보가 올바르지 않습니다.",
    };
  }

  const now = new Date().toISOString();
  let saved: OperationReservationItem;
  let previousData = null;

  if (parsed.data.id) {
    // 수정
    const index = GLOBAL_OPERATIONS_RESERVATIONS.findIndex((r) => r.id === parsed.data.id);
    if (index === -1) {
      return { success: false, error: "수정할 예약을 찾을 수 없습니다." };
    }
    previousData = { ...GLOBAL_OPERATIONS_RESERVATIONS[index] };
    saved = {
      ...GLOBAL_OPERATIONS_RESERVATIONS[index],
      pickupLocation: parsed.data.pickupLocation,
      dropoffLocation: parsed.data.dropoffLocation,
      passengerName: parsed.data.passengerName,
      phone: parsed.data.phone,
      passengerCount: parsed.data.passengerCount,
      paymentStatus: parsed.data.paymentStatus,
      boardedStatus: parsed.data.boardedStatus,
      notes: parsed.data.notes,
      isActive: parsed.data.isActive ?? true,
      updatedAt: now,
    };
    GLOBAL_OPERATIONS_RESERVATIONS[index] = saved;
  } else {
    // 신규 수기 등록
    const newId = `RSV-ADM-${Date.now().toString(36).toUpperCase()}`;
    saved = {
      id: newId,
      date: parsed.data.date,
      direction: parsed.data.direction,
      roundNumber: parsed.data.roundNumber,
      timeText: parsed.data.timeText,
      pickupLocation: parsed.data.pickupLocation,
      dropoffLocation: parsed.data.dropoffLocation,
      passengerName: parsed.data.passengerName,
      phone: parsed.data.phone,
      passengerCount: parsed.data.passengerCount,
      paymentStatus: parsed.data.paymentStatus,
      boardedStatus: parsed.data.boardedStatus,
      notes: parsed.data.notes || "관리자 전화/문자 수기 등록",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    GLOBAL_OPERATIONS_RESERVATIONS.push(saved);
  }

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-${Date.now()}`,
    action: "UPSERT_DRIVER" as any,
    entity: "drivers" as any,
    entityId: saved.id,
    actor: "Admin-Operations",
    previousData,
    newData: saved,
    timestamp: now,
  };
  GLOBAL_OPERATIONS_AUDIT.unshift(auditLog);

  console.log(`[audit_logs] 관리자 직권 예약 저장: ${saved.passengerName} (${saved.date} ${saved.timeText}, ${saved.passengerCount}명)`);

  const dailyResult = await getDailyOperationDataAction(saved.date);
  if (!dailyResult.success) {
    return { success: false, error: dailyResult.error };
  }

  return {
    success: true,
    data: {
      reservation: saved,
      daily: dailyResult.data,
    },
    message: "예약 정보가 성공적으로 저장 및 탄력 배차에 반영되었습니다.",
  };
}

/**
 * 3. 관리자 직권 예약 소프트 딜리트 (deleteReservationByAdmin)
 */
export async function deleteReservationByAdminAction(
  reservationId: string,
  targetDate: string
): Promise<AdminActionResult<{ daily: DailyOperationData }>> {
  const index = GLOBAL_OPERATIONS_RESERVATIONS.findIndex((r) => r.id === reservationId);
  if (index === -1) {
    return { success: false, error: "삭제할 예약 정보를 찾을 수 없습니다." };
  }

  const previousData = { ...GLOBAL_OPERATIONS_RESERVATIONS[index] };
  GLOBAL_OPERATIONS_RESERVATIONS[index].isActive = false;
  GLOBAL_OPERATIONS_RESERVATIONS[index].updatedAt = new Date().toISOString();

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-${Date.now()}`,
    action: "DELETE_DRIVER" as any,
    entity: "drivers" as any,
    entityId: reservationId,
    actor: "Admin-Operations",
    previousData,
    newData: { isActive: false, reason: "관리자 직권 예약 취소 (소프트 딜리트)" },
    timestamp: new Date().toISOString(),
  };
  GLOBAL_OPERATIONS_AUDIT.unshift(auditLog);

  console.log(`[audit_logs] 관리자 직권 예약 소프트 딜리트: ${previousData.passengerName} (${previousData.id})`);

  const dailyResult = await getDailyOperationDataAction(targetDate || previousData.date);
  if (!dailyResult.success) {
    return { success: false, error: dailyResult.error };
  }

  return {
    success: true,
    data: {
      daily: dailyResult.data,
    },
    message: `예약(${previousData.passengerName} 님)이 비활성화(취소)되었습니다.`,
  };
}

/**
 * 3-1. 예약 승차 상태 원터치 토글 ([승차 완료] <-> [대기])
 */
export async function toggleReservationBoardedAction(
  reservationId: string
): Promise<AdminActionResult<{ reservationId: string; nextStatus: "boarded" | "waiting"; daily?: DailyOperationData }>> {
  if (!reservationId) {
    return { success: false, error: "예약 ID가 누락되었습니다." };
  }

  const target = GLOBAL_OPERATIONS_RESERVATIONS.find((r) => r.id === reservationId);
  if (!target) {
    return { success: false, error: "해당 예약을 찾을 수 없습니다." };
  }

  const nextStatus: "boarded" | "waiting" = target.boardedStatus === "boarded" ? "waiting" : "boarded";
  target.boardedStatus = nextStatus;
  target.updatedAt = new Date().toISOString();

  const dailyResult = await getDailyOperationDataAction(target.date);

  return {
    success: true,
    data: {
      reservationId,
      nextStatus,
      daily: dailyResult.success ? dailyResult.data : undefined,
    },
    message: `${target.passengerName} 님의 상태가 [${nextStatus === "boarded" ? "승차 완료" : "대기"}]로 변경되었습니다.`,
  };
}

/**
 * 4. 특정 일자 대체 경유지 설정 및 전 모듈 동기화 (setAlternativeRoute)
 */
export async function setAlternativeRouteAction(
  date: string,
  routeName: string
): Promise<AdminActionResult<{ date: string; stopoverName: string }>> {
  if (!date) {
    return { success: false, error: "날짜를 지정해주세요." };
  }

  if (routeName === "이마트 (기본)" || routeName === "이마트") {
    delete GLOBAL_ALTERNATIVE_ROUTES[date];
  } else {
    GLOBAL_ALTERNATIVE_ROUTES[date] = routeName;
  }

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-${Date.now()}`,
    action: "UPDATE_POLICY" as any,
    entity: "system_policies" as any,
    entityId: date,
    actor: "Admin-Operations",
    previousData: { date, stopoverName: "이마트" },
    newData: { date, stopoverName: routeName },
    timestamp: new Date().toISOString(),
  };
  GLOBAL_OPERATIONS_AUDIT.unshift(auditLog);

  console.log(`[audit_logs] 대체 경유지 설정: ${date} ➔ ${routeName}`);

  return {
    success: true,
    data: {
      date,
      stopoverName: GLOBAL_ALTERNATIVE_ROUTES[date] || "이마트 (정상 운행)",
    },
    message: `${date} 경유지가 [${routeName}] (으)로 변경 및 전 모듈에 즉시 동기화되었습니다.`,
  };
}

/**
 * 5. 월간 대체 노선 캘린더 맵 조회
 */
export async function getMonthlyRouteScheduleAction(
  yearMonth: string // YYYY-MM
): Promise<AdminActionResult<{ routes: Record<string, string> }>> {
  return {
    success: true,
    data: { routes: GLOBAL_ALTERNATIVE_ROUTES },
  };
}

// 명세서 호환용 별칭 Export
export const getDailyOperationData = getDailyOperationDataAction;
export const upsertReservationByAdmin = upsertReservationByAdminAction;
export const deleteReservationByAdmin = deleteReservationByAdminAction;
export const setAlternativeRoute = setAlternativeRouteAction;
export const getMonthlyRouteSchedule = getMonthlyRouteScheduleAction;
