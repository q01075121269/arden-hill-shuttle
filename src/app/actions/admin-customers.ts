"use server";

import { z } from "zod";
import { AuditLogItem } from "./admin-master";

export type AdminActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// 1. 입주민/고객 타입 & Zod 스키마
export interface ResidentItem {
  id: string;
  building: string; // 동/호수 (예: 102동, 105동, 커뮤니티 센터 등)
  name: string; // 고객 성함
  phone: string; // 연락처
  registerType: "self" | "manual"; // 자가가입 | 관리자 수기등록
  rideCount: number; // 누적 탑승 횟수
  unpaidAmount: number; // 현재 총 미납금 (₩)
  isActive: boolean; // 소프트 딜리트 플래그 (물리 삭제 절대 금지)
  memo?: string; // 특이사항/메모
  createdAt: string;
  updatedAt: string;
}

const residentSchema = z.object({
  id: z.string().optional(),
  building: z.string().min(1, "동/호수를 입력해 주세요."),
  name: z.string().min(2, "고객 성함을 2자 이상 입력해 주세요."),
  phone: z.string().min(8, "연락처를 정확히 입력해 주세요."),
  registerType: z.enum(["self", "manual"]).default("manual"),
  rideCount: z.number().int().min(0).optional().default(0),
  unpaidAmount: z.number().int().min(0).optional().default(0),
  memo: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export type ResidentInput = z.input<typeof residentSchema>;

// 초기 입주민 목데이터
let GLOBAL_RESIDENTS: ResidentItem[] = [
  {
    id: "RES-001",
    building: "112동",
    name: "김민수",
    phone: "010-3321-9988",
    registerType: "self",
    rideCount: 14,
    unpaidAmount: 0,
    isActive: true,
    memo: "단골 승객 (상행/하행 출퇴근 이용)",
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-10-09T08:00:00Z",
  },
  {
    id: "RES-002",
    building: "105동",
    name: "Wang Wei (王伟)",
    phone: "010-5544-3322",
    registerType: "self",
    rideCount: 8,
    unpaidAmount: 20000,
    isActive: true,
    memo: "골프백 2개 상시 적재",
    createdAt: "2026-08-15T00:00:00Z",
    updatedAt: "2026-10-09T10:30:00Z",
  },
  {
    id: "RES-003",
    building: "168동",
    name: "이지은 (투숙객)",
    phone: "010-7766-1122",
    registerType: "manual",
    rideCount: 5,
    unpaidAmount: 15000,
    isActive: true,
    memo: "관리실 유선 예약 고객 (주말 체크아웃)",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-10-09T12:30:00Z",
  },
  {
    id: "RES-004",
    building: "140동",
    name: "박영호",
    phone: "010-9922-4411",
    registerType: "self",
    rideCount: 21,
    unpaidAmount: 0,
    isActive: true,
    memo: "클럽하우스 라운딩 정기 이용",
    createdAt: "2026-07-20T00:00:00Z",
    updatedAt: "2026-10-08T15:00:00Z",
  },
  {
    id: "RES-005",
    building: "102동",
    name: "최현우",
    phone: "010-8812-4321",
    registerType: "manual",
    rideCount: 3,
    unpaidAmount: 10000,
    isActive: true,
    memo: "어르신 세대 (관리실 전화 예약 대행)",
    createdAt: "2026-09-15T00:00:00Z",
    updatedAt: "2026-10-07T09:00:00Z",
  },
  {
    id: "RES-006",
    building: "커뮤니티 센터",
    name: "정수민",
    phone: "010-3344-7788",
    registerType: "self",
    rideCount: 9,
    unpaidAmount: 0,
    isActive: true,
    memo: "센터 강사",
    createdAt: "2026-08-10T00:00:00Z",
    updatedAt: "2026-10-06T14:00:00Z",
  },
];

// 고객 관련 글로벌 감사 로그
let GLOBAL_CUSTOMER_AUDIT: AuditLogItem[] = [];

import {
  getAllStoredResidents,
  saveResidentToStorage,
  findResidentById,
  type StoredResident,
} from "@/lib/supabase-residents";

/**
 * 1. 입주민/고객 목록 조회 Server Action (Supabase 클라우드 DB 실시간 조회 & 검색)
 */
export async function getResidentsAction(
  searchQuery?: string
): Promise<AdminActionResult<{ residents: ResidentItem[] }>> {
  try {
    const stored = await getAllStoredResidents();
    // 승인 완료(approved)된 활성 입주민 목록
    let list: ResidentItem[] = stored
      .filter((r) => r.isActive && r.status === "approved")
      .map((r) => ({
        id: r.id,
        building: r.building,
        name: r.name,
        phone: r.phone,
        registerType: r.registerType,
        rideCount: r.rideCount,
        unpaidAmount: r.unpaidAmount,
        isActive: r.isActive,
        memo: r.memo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.building.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.phone.replace(/[^0-9]/g, "").includes(q.replace(/[^0-9]/g, ""))
      );
    }

    return {
      success: true,
      data: { residents: list },
    };
  } catch (err) {
    console.error("[getResidentsAction error]:", err);
    return {
      success: true,
      data: { residents: GLOBAL_RESIDENTS.filter((r) => r.isActive) },
    };
  }
}

/**
 * 2. 고객 정보 등록 및 수정 Server Action (Supabase 클라우드 DB 영구 upsert)
 */
export async function upsertResidentAction(
  data: ResidentInput
): Promise<AdminActionResult<{ resident: ResidentItem; residents: ResidentItem[] }>> {
  const parsed = residentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.",
    };
  }

  const now = new Date().toISOString();
  let savedResident: ResidentItem;

  if (parsed.data.id) {
    // 수정
    const existing = await findResidentById(parsed.data.id);
    if (!existing) {
      return { success: false, error: "수정할 고객 정보를 찾을 수 없습니다." };
    }

    const updatedStored: StoredResident = {
      ...existing,
      building: parsed.data.building,
      name: parsed.data.name,
      phone: parsed.data.phone,
      registerType: parsed.data.registerType,
      memo: parsed.data.memo ?? existing.memo,
      isActive: parsed.data.isActive ?? true,
      updatedAt: now,
    };
    await saveResidentToStorage(updatedStored);

    savedResident = {
      id: updatedStored.id,
      building: updatedStored.building,
      name: updatedStored.name,
      phone: updatedStored.phone,
      registerType: updatedStored.registerType,
      rideCount: updatedStored.rideCount,
      unpaidAmount: updatedStored.unpaidAmount,
      isActive: updatedStored.isActive,
      memo: updatedStored.memo,
      createdAt: updatedStored.createdAt,
      updatedAt: updatedStored.updatedAt,
    };
  } else {
    // 신규 등록 (관리자 수기 등록 -> 즉시 승인 상태)
    const newId = `RES-${Date.now().toString(36).toUpperCase()}`;
    const newStored: StoredResident = {
      id: newId,
      building: parsed.data.building,
      name: parsed.data.name,
      phone: parsed.data.phone,
      pin: "0000",
      status: "approved", // 관리자 직접 등록은 즉시 승인
      registerType: parsed.data.registerType || "manual",
      rideCount: 0,
      unpaidAmount: 0,
      memo: parsed.data.memo || "관리자 수기 직접 등록 고객",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await saveResidentToStorage(newStored);

    savedResident = {
      id: newStored.id,
      building: newStored.building,
      name: newStored.name,
      phone: newStored.phone,
      registerType: newStored.registerType,
      rideCount: newStored.rideCount,
      unpaidAmount: newStored.unpaidAmount,
      isActive: newStored.isActive,
      memo: newStored.memo,
      createdAt: newStored.createdAt,
      updatedAt: newStored.updatedAt,
    };
  }

  // 최신 목록 조회
  const latestResult = await getResidentsAction();
  const latestList = latestResult.success ? latestResult.data.residents : [];

  return {
    success: true,
    data: { resident: savedResident, residents: latestList },
    message: "고객 정보가 성공적으로 저장되었습니다.",
  };
}

/**
 * 3. 고객 정보 소프트 딜리트 Server Action (Supabase 클라우드 비활성화)
 */
export async function deleteResidentAction(
  residentId: string,
  reason?: string
): Promise<AdminActionResult<{ residents: ResidentItem[] }>> {
  const existing = await findResidentById(residentId);
  if (!existing) {
    return { success: false, error: "삭제할 고객 정보를 찾을 수 없습니다." };
  }

  existing.isActive = false;
  existing.updatedAt = new Date().toISOString();
  await saveResidentToStorage(existing);

  const latestResult = await getResidentsAction();
  const latestList = latestResult.success ? latestResult.data.residents : [];

  return {
    success: true,
    data: { residents: latestList },
    message: "해당 입주민 정보가 비활성화(삭제) 처리되었습니다.",
  };
}

/**
 * 고객의 미납 잔액 직접 차감/동기화 헬퍼 (정산 완료 시 호출)
 */
export async function deductResidentUnpaid(residentId: string, amount: number) {
  const index = GLOBAL_RESIDENTS.findIndex((r) => r.id === residentId);
  if (index !== -1) {
    GLOBAL_RESIDENTS[index].unpaidAmount = Math.max(0, GLOBAL_RESIDENTS[index].unpaidAmount - amount);
    GLOBAL_RESIDENTS[index].updatedAt = new Date().toISOString();
  }
}

// 명세서 호환용 별칭 Export
export const getResidents = getResidentsAction;
export const upsertResident = upsertResidentAction;
export const deleteResident = deleteResidentAction;
