"use server";

import { z } from "zod";

export type AdminActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// 1. 시스템 기본 정책 타입 & 스키마
export interface SystemPolicyData {
  fareAmount: number; // 편도 기본 탑승 요금 단가 (원화 ₩)
  cutoffTime: string; // 전날 예약 마감 시간 (HH:mm)
  adminPhone: string; // 관리사무소 직통 전화번호
  dutyPhone: string; // 당직자 비상 연락처
  updatedAt: string;
}

const systemPolicySchema = z.object({
  fareAmount: z.number().min(0, "요금은 0원 이상이어야 합니다."),
  cutoffTime: z.string().regex(/^\d{2}:\d{2}$/, "올바른 시간 형식(HH:mm)이어야 합니다."),
  adminPhone: z.string().min(8, "관리사무소 연락처를 입력해 주세요."),
  dutyPhone: z.string().min(8, "당직자 연락처를 입력해 주세요."),
});

// 2. 셔틀 차량(Vehicle) 마스터 타입 & 스키마
export interface VehicleMasterItem {
  id: string;
  type: "carnival" | "county"; // 카니발(7/9인승) | 29인승 카운티
  plateNumber: string; // 차량 번호 (예: 제주 70가 1142)
  capacity: number; // 탑승 정원
  status: "operational" | "maintenance"; // 운행 가능 | 정비 점검 중
  isActive: boolean; // 소프트 딜리트 플래그
  createdAt: string;
  updatedAt: string;
}

const vehicleSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["carnival", "county"]),
  plateNumber: z.string().min(2, "차량 번호를 입력해 주세요."),
  capacity: z.number().int().min(1, "정원은 1명 이상이어야 합니다."),
  status: z.enum(["operational", "maintenance"]),
  isActive: z.boolean().default(true),
});

// 3. 운행 기사(Driver) 마스터 타입 & 스키마
export interface DriverMasterItem {
  id: string;
  name: string; // 기사 성함
  phone: string; // 직통 연락처
  assignedVehicleId: string; // 배정 차량 ID
  isActive: boolean; // 활성 상태 배지
  createdAt: string;
  updatedAt: string;
}

const driverSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "기사 성함을 입력해 주세요."),
  phone: z.string().min(8, "연락처를 입력해 주세요."),
  assignedVehicleId: z.string().min(1, "배정 차량을 선택해 주세요."),
  isActive: z.boolean().default(true),
});

// 4. 감사 로그(Audit Log) 타입
export interface AuditLogItem {
  id: string;
  action: "UPDATE_POLICY" | "UPSERT_VEHICLE" | "DELETE_VEHICLE" | "UPSERT_DRIVER" | "DELETE_DRIVER";
  entity: "system_policies" | "vehicles" | "drivers";
  entityId: string;
  actor: string;
  previousData: any;
  newData: any;
  timestamp: string;
}

// -------------------------------------------------------------
// 초기 인메모리 마스터 데이터 저장소 (시뮬레이션 DB)
// -------------------------------------------------------------
let GLOBAL_POLICY: SystemPolicyData = {
  fareAmount: 5000,
  cutoffTime: "22:00",
  adminPhone: "010-3342-9981",
  dutyPhone: "010-8921-4421",
  updatedAt: new Date().toISOString(),
};

let GLOBAL_VEHICLES: VehicleMasterItem[] = [
  {
    id: "VEH-01",
    type: "carnival",
    plateNumber: "제주 70가 1142",
    capacity: 7,
    status: "operational",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-10-09T00:00:00Z",
  },
  {
    id: "VEH-02",
    type: "county",
    plateNumber: "제주 72바 5501",
    capacity: 29,
    status: "operational",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-10-09T00:00:00Z",
  },
  {
    id: "VEH-03",
    type: "carnival",
    plateNumber: "제주 75허 9021",
    capacity: 9,
    status: "maintenance",
    isActive: true,
    createdAt: "2026-03-15T00:00:00Z",
    updatedAt: "2026-10-09T00:00:00Z",
  },
];

let GLOBAL_DRIVERS: DriverMasterItem[] = [
  {
    id: "DRV-01",
    name: "김철수 기사님",
    phone: "010-8921-4421",
    assignedVehicleId: "VEH-01",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-10-09T00:00:00Z",
  },
  {
    id: "DRV-02",
    name: "박영진 기사님",
    phone: "010-4421-9981",
    assignedVehicleId: "VEH-02",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-10-09T00:00:00Z",
  },
  {
    id: "DRV-03",
    name: "이민우 기사님",
    phone: "010-7712-3344",
    assignedVehicleId: "VEH-01",
    isActive: true,
    createdAt: "2026-02-10T00:00:00Z",
    updatedAt: "2026-10-09T00:00:00Z",
  },
];

let GLOBAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "AUDIT-001",
    action: "UPDATE_POLICY",
    entity: "system_policies",
    entityId: "POL-MAIN",
    actor: "Admin-Master",
    previousData: { fareAmount: 4000, cutoffTime: "21:00" },
    newData: { fareAmount: 5000, cutoffTime: "22:00" },
    timestamp: "2026-10-09T08:00:00Z",
  },
];

// -------------------------------------------------------------
// Server Actions 구현
// -------------------------------------------------------------

/**
 * 마스터 데이터 전체 조회 (정책, 차량, 기사, 감사로그)
 */
export async function getAdminMasterData(): Promise<
  AdminActionResult<{
    policy: SystemPolicyData;
    vehicles: VehicleMasterItem[];
    drivers: DriverMasterItem[];
    auditLogs: AuditLogItem[];
  }>
> {
  return {
    success: true,
    data: {
      policy: GLOBAL_POLICY,
      vehicles: GLOBAL_VEHICLES,
      drivers: GLOBAL_DRIVERS,
      auditLogs: GLOBAL_AUDIT_LOGS,
    },
  };
}

/**
 * 1. 시스템 기본 정책 업데이트 Server Action
 */
export async function updateSystemPolicyAction(
  data: Omit<SystemPolicyData, "updatedAt">
): Promise<AdminActionResult<SystemPolicyData>> {
  const parsed = systemPolicySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "입력값이 유효하지 않습니다.",
    };
  }

  const previousData = { ...GLOBAL_POLICY };
  const updatedPolicy: SystemPolicyData = {
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  GLOBAL_POLICY = updatedPolicy;

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-${Date.now()}`,
    action: "UPDATE_POLICY",
    entity: "system_policies",
    entityId: "POL-MAIN",
    actor: "Admin-Master",
    previousData,
    newData: updatedPolicy,
    timestamp: new Date().toISOString(),
  };
  GLOBAL_AUDIT_LOGS.unshift(auditLog);

  console.log(`[audit_logs] 시스템 정책 변경 완료: 요금 ₩${updatedPolicy.fareAmount}, 마감 ${updatedPolicy.cutoffTime}`);

  return {
    success: true,
    data: updatedPolicy,
    message: "시스템 기본 운영 정책이 성공적으로 저장되었습니다.",
  };
}

/**
 * 2. 셔틀 차량 등록 및 수정 Server Action
 */
export async function upsertVehicleAction(
  data: z.infer<typeof vehicleSchema>
): Promise<AdminActionResult<{ vehicle: VehicleMasterItem; vehicles: VehicleMasterItem[] }>> {
  const parsed = vehicleSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "차량 정보가 유효하지 않습니다.",
    };
  }

  const now = new Date().toISOString();
  let savedVehicle: VehicleMasterItem;
  let previousData = null;

  if (parsed.data.id) {
    // 수정
    const index = GLOBAL_VEHICLES.findIndex((v) => v.id === parsed.data.id);
    if (index === -1) {
      return { success: false, error: "해당 차량을 찾을 수 없습니다." };
    }
    previousData = { ...GLOBAL_VEHICLES[index] };
    savedVehicle = {
      ...GLOBAL_VEHICLES[index],
      type: parsed.data.type,
      plateNumber: parsed.data.plateNumber,
      capacity: parsed.data.capacity,
      status: parsed.data.status,
      isActive: parsed.data.isActive ?? true,
      updatedAt: now,
    };
    GLOBAL_VEHICLES[index] = savedVehicle;
  } else {
    // 신규 등록
    const newId = `VEH-${String(GLOBAL_VEHICLES.length + 1).padStart(2, "0")}`;
    savedVehicle = {
      id: newId,
      type: parsed.data.type,
      plateNumber: parsed.data.plateNumber,
      capacity: parsed.data.capacity,
      status: parsed.data.status,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    GLOBAL_VEHICLES.push(savedVehicle);
  }

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-${Date.now()}`,
    action: "UPSERT_VEHICLE",
    entity: "vehicles",
    entityId: savedVehicle.id,
    actor: "Admin-Master",
    previousData,
    newData: savedVehicle,
    timestamp: now,
  };
  GLOBAL_AUDIT_LOGS.unshift(auditLog);

  console.log(`[audit_logs] 차량 정보 저장 완료: ${savedVehicle.plateNumber} (${savedVehicle.type})`);

  return {
    success: true,
    data: { vehicle: savedVehicle, vehicles: GLOBAL_VEHICLES },
    message: "차량 마스터 정보가 성공적으로 저장되었습니다.",
  };
}

/**
 * 2-1. 셔틀 차량 소프트 딜리트 Server Action (물리 삭제 금지)
 */
export async function deleteVehicleAction(
  vehicleId: string
): Promise<AdminActionResult<{ vehicles: VehicleMasterItem[] }>> {
  const index = GLOBAL_VEHICLES.findIndex((v) => v.id === vehicleId);
  if (index === -1) {
    return { success: false, error: "삭제할 차량을 찾을 수 없습니다." };
  }

  const previousData = { ...GLOBAL_VEHICLES[index] };
  GLOBAL_VEHICLES[index].isActive = false;
  GLOBAL_VEHICLES[index].updatedAt = new Date().toISOString();

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-${Date.now()}`,
    action: "DELETE_VEHICLE",
    entity: "vehicles",
    entityId: vehicleId,
    actor: "Admin-Master",
    previousData,
    newData: { isActive: false },
    timestamp: new Date().toISOString(),
  };
  GLOBAL_AUDIT_LOGS.unshift(auditLog);

  console.log(`[audit_logs] 차량 소프트 딜리트 처리: ${previousData.plateNumber} (is_active = false)`);

  return {
    success: true,
    data: { vehicles: GLOBAL_VEHICLES },
    message: `차량(${previousData.plateNumber})이 비활성화(소프트 딜리트)되었습니다.`,
  };
}

/**
 * 3. 운행 기사 등록 및 수정 Server Action
 */
export async function upsertDriverAction(
  data: z.infer<typeof driverSchema>
): Promise<AdminActionResult<{ driver: DriverMasterItem; drivers: DriverMasterItem[] }>> {
  const parsed = driverSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "기사 정보가 유효하지 않습니다.",
    };
  }

  const now = new Date().toISOString();
  let savedDriver: DriverMasterItem;
  let previousData = null;

  if (parsed.data.id) {
    // 수정
    const index = GLOBAL_DRIVERS.findIndex((d) => d.id === parsed.data.id);
    if (index === -1) {
      return { success: false, error: "해당 기사를 찾을 수 없습니다." };
    }
    previousData = { ...GLOBAL_DRIVERS[index] };
    savedDriver = {
      ...GLOBAL_DRIVERS[index],
      name: parsed.data.name,
      phone: parsed.data.phone,
      assignedVehicleId: parsed.data.assignedVehicleId,
      isActive: parsed.data.isActive ?? true,
      updatedAt: now,
    };
    GLOBAL_DRIVERS[index] = savedDriver;
  } else {
    // 신규 등록
    const newId = `DRV-${String(GLOBAL_DRIVERS.length + 1).padStart(2, "0")}`;
    savedDriver = {
      id: newId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      assignedVehicleId: parsed.data.assignedVehicleId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    GLOBAL_DRIVERS.push(savedDriver);
  }

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-${Date.now()}`,
    action: "UPSERT_DRIVER",
    entity: "drivers",
    entityId: savedDriver.id,
    actor: "Admin-Master",
    previousData,
    newData: savedDriver,
    timestamp: now,
  };
  GLOBAL_AUDIT_LOGS.unshift(auditLog);

  console.log(`[audit_logs] 기사 정보 저장 완료: ${savedDriver.name} (${savedDriver.phone})`);

  return {
    success: true,
    data: { driver: savedDriver, drivers: GLOBAL_DRIVERS },
    message: "운행 기사 마스터 정보가 성공적으로 저장되었습니다.",
  };
}

/**
 * 3-1. 운행 기사 소프트 딜리트 Server Action (물리 삭제 금지)
 */
export async function deleteDriverAction(
  driverId: string
): Promise<AdminActionResult<{ drivers: DriverMasterItem[] }>> {
  const index = GLOBAL_DRIVERS.findIndex((d) => d.id === driverId);
  if (index === -1) {
    return { success: false, error: "삭제할 기사 정보를 찾을 수 없습니다." };
  }

  const previousData = { ...GLOBAL_DRIVERS[index] };
  GLOBAL_DRIVERS[index].isActive = false;
  GLOBAL_DRIVERS[index].updatedAt = new Date().toISOString();

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-${Date.now()}`,
    action: "DELETE_DRIVER",
    entity: "drivers",
    entityId: driverId,
    actor: "Admin-Master",
    previousData,
    newData: { isActive: false },
    timestamp: new Date().toISOString(),
  };
  GLOBAL_AUDIT_LOGS.unshift(auditLog);

  console.log(`[audit_logs] 기사 소프트 딜리트 처리: ${previousData.name} (is_active = false)`);

  return {
    success: true,
    data: { drivers: GLOBAL_DRIVERS },
    message: `기사(${previousData.name}) 정보가 비활성화되었습니다.`,
  };
}

// 명세서 함수명 호환용 Alias Exports
export const updateSystemPolicy = updateSystemPolicyAction;
export const upsertVehicle = upsertVehicleAction;
export const deleteVehicle = deleteVehicleAction;
export const upsertDriver = upsertDriverAction;
export const deleteDriver = deleteDriverAction;

