"use server";

import { z } from "zod";

// 5대+1 안전 점검 Zod 스키마
const safetyCheckSchema = z.object({
  driverName: z.string().min(1, "기사 성함을 선택해 주세요."),
  phone: z.string().optional(),
  vehicleNumber: z.string().min(1, "차량 번호를 입력해 주세요."),
  checkTire: z.enum(["good", "fair", "poor"]),
  checkLights: z.enum(["good", "fair", "poor"]),
  checkLeakage: z.enum(["good", "fair", "poor"]),
  checkCleanliness: z.enum(["good", "fair", "poor"]),
  checkBrakes: z.enum(["good", "fair", "poor"]),
  notes: z.string().optional(),
  signature: z.string().min(1, "점검 확인 서명이 필요합니다."),
});

export type SafetyCheckInput = z.infer<typeof safetyCheckSchema>;

export type DriverActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// 1. 일일 5대 안전점검 제출 Server Action
export async function submitSafetyCheckAction(
  input: SafetyCheckInput
): Promise<DriverActionResult<{ logId: string; checkedAt: string }>> {
  const parsed = safetyCheckSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "안전점검 항목을 모두 입력하고 서명해 주세요.",
    };
  }

  const { driverName, phone, vehicleNumber, checkTire, checkLights, checkLeakage, checkCleanliness, checkBrakes, notes } = parsed.data;

  // 5대 항목 이상 유무 점검
  const allPassed =
    checkTire !== "poor" &&
    checkLights !== "poor" &&
    checkLeakage !== "poor" &&
    checkCleanliness !== "poor" &&
    checkBrakes !== "poor";

  const logId = `DLOG-${new Date().toISOString().slice(0, 10)}-${vehicleNumber.replace(/\s+/g, "")}`;
  const checkedAt = new Date().toISOString();

  // 실제 DB(daily_logs) 레코드 upsert 시뮬레이션
  console.log(`[daily_logs] 기사 ${driverName} (${phone || "연락처 미등록"}) 차량 ${vehicleNumber} 안전점검 완료: ${checkedAt}, 이상여부: ${allPassed ? "양호" : "주의 필요"}${notes ? `, 특이사항: ${notes}` : ""}`);

  return {
    success: true,
    data: { logId, checkedAt },
    message: allPassed
      ? "당일 안전점검이 정상 완료되었습니다. 안전 운행하십시오."
      : "일부 점검 항목에 불량이 있습니다. 관리실에 보고 후 운행해 주세요.",
  };
}

// 2. 운행 상태 및 회차 구간 전환 Server Action
export type TripStage =
  | "READY_DEPART"
  | "DEPART_RESORT"
  | "DEPART_AIRPORT"
  | "ARRIVE_EMART"
  | "ARRIVE_AIRPORT"
  | "ARRIVE_RESORT";

export async function updateShuttleTripStatusAction(params: {
  round: number;
  stage: TripStage;
  vehicleNumber: string;
  isEmergencyAlert: boolean;
  emergencyNote?: string;
  direction?: "outbound" | "inbound";
}): Promise<DriverActionResult<{ statusText: string; updatedAt: string }>> {
  const stageLabels: Record<TripStage, string> = {
    READY_DEPART: "출발 준비",
    DEPART_RESORT: "아덴힐 출발",
    DEPART_AIRPORT: "공항 출발",
    ARRIVE_EMART: "이마트 (대체마트)",
    ARRIVE_AIRPORT: "공항 도착",
    ARRIVE_RESORT: "아덴힐 도착",
  };

  const dirPrefix = params.direction === "inbound" ? "(공항발) " : "(아덴힐발) ";
  const statusText = `${dirPrefix}${params.round}회차 [${stageLabels[params.stage] || params.stage}]`;
  const updatedAt = new Date().toISOString();

  console.log(`[trip_status] ${params.vehicleNumber} ${statusText} (긴급상태: ${params.isEmergencyAlert})`);

  return {
    success: true,
    data: { statusText, updatedAt },
    message: `${statusText} 상태가 승객 및 관리자 시스템에 실시간 동기화되었습니다.`,
  };
}

// 3. 승객 원터치 승차 완료 토글 Server Action
export async function toggleBoardingCheckAction(params: {
  reservationId: string;
  currentStatus: "pending" | "boarding_completed";
  passengerCount: number;
}): Promise<DriverActionResult<{ reservationId: string; newStatus: "pending" | "boarding_completed" }>> {
  const newStatus = params.currentStatus === "pending" ? "boarding_completed" : "pending";

  console.log(`[boarding_status] 예약 ${params.reservationId} -> ${newStatus} (탑승인원: ${params.passengerCount}명)`);

  return {
    success: true,
    data: {
      reservationId: params.reservationId,
      newStatus,
    },
    message: newStatus === "boarding_completed" ? "승차 확인 처리되었습니다." : "승차 대기 상태로 변경되었습니다.",
  };
}
