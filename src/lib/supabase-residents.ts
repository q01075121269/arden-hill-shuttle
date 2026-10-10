import { getSupabaseServerClient } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";

export interface StoredResident {
  id: string;
  name: string;
  phone: string;
  pin: string;
  building: string;
  status: "approved" | "pending" | "rejected";
  registerType: "self" | "manual";
  rideCount: number;
  unpaidAmount: number;
  memo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 초기 기본 시드 입주민 (Supabase에 데이터가 없을 때 자동 시드)
const INITIAL_SEED_RESIDENTS: StoredResident[] = [
  {
    id: "RES-001",
    name: "김민수",
    phone: "010-3321-9988",
    pin: "1234",
    building: "112동",
    status: "approved",
    registerType: "self",
    rideCount: 14,
    unpaidAmount: 0,
    memo: "단골 승객 (상행/하행 출퇴근 이용)",
    isActive: true,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-10-09T08:00:00Z",
  },
  {
    id: "RES-002",
    name: "최영식",
    phone: "010-4421-5588",
    pin: "4321",
    building: "105동",
    status: "approved",
    registerType: "self",
    rideCount: 8,
    unpaidAmount: 20000,
    memo: "골프백 2개 상시 적재",
    isActive: true,
    createdAt: "2026-08-10T00:00:00Z",
    updatedAt: "2026-10-09T08:00:00Z",
  },
  {
    id: "RES-003",
    name: "박서연",
    phone: "010-7711-2244",
    pin: "7788",
    building: "140동",
    status: "approved",
    registerType: "self",
    rideCount: 21,
    unpaidAmount: 0,
    memo: "클럽하우스 라운딩 정기 이용",
    isActive: true,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-10-09T08:00:00Z",
  },
  {
    id: "RES-004",
    name: "윤상혁",
    phone: "010-4490-8821",
    pin: "9900",
    building: "102동",
    status: "pending",
    registerType: "self",
    rideCount: 0,
    unpaidAmount: 0,
    memo: "신규 가입 신청자 (승인 대기)",
    isActive: true,
    createdAt: "2026-10-09T09:00:00Z",
    updatedAt: "2026-10-09T09:00:00Z",
  },
];

const PREFIX = "RES-";

/**
 * Supabase DB에서 모든 입주민 목록 조회 (클라우드 영구 저장소)
 */
export async function getAllStoredResidents(): Promise<StoredResident[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .like("id", `${PREFIX}%`)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      // 최초 실행 시 기본 시드가 없으면 시드 데이터를 DB에 영구 등록
      if (!data || data.length === 0) {
        await seedInitialResidentsIfEmpty();
      }
      return INITIAL_SEED_RESIDENTS;
    }

    const residents: StoredResident[] = data.map((row) => {
      let parsedExtra: any = {};
      try {
        parsedExtra = JSON.parse(row.content || "{}");
      } catch {
        parsedExtra = {};
      }

      return {
        id: row.id,
        name: row.passenger_name,
        phone: row.contact || parsedExtra.phone || "",
        pin: parsedExtra.pin || "0000",
        building: row.dong_number || parsedExtra.building || "",
        status: parsedExtra.status || (row.status === "resolved" ? "approved" : "pending"),
        registerType: parsedExtra.registerType || "self",
        rideCount: parsedExtra.rideCount ?? 0,
        unpaidAmount: parsedExtra.unpaidAmount ?? 0,
        memo: parsedExtra.memo || row.admin_memo || "",
        isActive: parsedExtra.isActive !== false,
        createdAt: row.created_at || parsedExtra.createdAt || new Date().toISOString(),
        updatedAt: parsedExtra.updatedAt || row.created_at || new Date().toISOString(),
      };
    });

    return residents;
  } catch (err) {
    console.error("[getAllStoredResidents error]:", err);
    return INITIAL_SEED_RESIDENTS;
  }
}

/**
 * 기본 시드 데이터가 비어 있을 때 4인 기본 계정 Supabase 등록
 */
async function seedInitialResidentsIfEmpty() {
  try {
    const supabase = getSupabaseServerClient();
    for (const r of INITIAL_SEED_RESIDENTS) {
      const extra = {
        phone: r.phone,
        pin: r.pin,
        building: r.building,
        status: r.status,
        registerType: r.registerType,
        rideCount: r.rideCount,
        unpaidAmount: r.unpaidAmount,
        memo: r.memo,
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };

      await supabase.from("feedbacks").upsert({
        id: r.id,
        passenger_name: r.name,
        dong_number: r.building,
        contact: r.phone,
        content: JSON.stringify(extra),
        status: r.status === "approved" ? "resolved" : "pending",
        admin_memo: r.memo,
      });
    }
  } catch (err) {
    console.error("[seedInitialResidentsIfEmpty error]:", err);
  }
}

/**
 * 입주민 신규 저장 또는 업데이트 (클라우드 영구 저장)
 */
export async function saveResidentToStorage(resident: StoredResident): Promise<boolean> {
  try {
    const supabase = getSupabaseServerClient();
    const extra = {
      phone: resident.phone,
      pin: resident.pin,
      building: resident.building,
      status: resident.status,
      registerType: resident.registerType,
      rideCount: resident.rideCount,
      unpaidAmount: resident.unpaidAmount,
      memo: resident.memo,
      isActive: resident.isActive,
      createdAt: resident.createdAt,
      updatedAt: resident.updatedAt,
    };

    const { error } = await supabase.from("feedbacks").upsert({
      id: resident.id,
      passenger_name: resident.name,
      dong_number: resident.building,
      contact: resident.phone,
      content: JSON.stringify(extra),
      status: resident.status === "approved" ? "resolved" : "pending",
      admin_memo: resident.memo,
    });

    if (error) {
      console.error("[saveResidentToStorage Supabase error]:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[saveResidentToStorage error]:", err);
    return false;
  }
}

/**
 * 전화번호로 입주민 조회
 */
export async function findResidentByPhone(rawPhone: string): Promise<StoredResident | null> {
  const targetPhone = normalizePhone(rawPhone);
  const all = await getAllStoredResidents();
  return all.find((r) => normalizePhone(r.phone) === targetPhone && r.isActive) || null;
}

/**
 * ID로 입주민 조회
 */
export async function findResidentById(id: string): Promise<StoredResident | null> {
  const all = await getAllStoredResidents();
  return all.find((r) => r.id === id) || null;
}

/**
 * 입주민 가입 승인 처리
 */
export async function approveResidentInStorage(id: string): Promise<StoredResident | null> {
  const resident = await findResidentById(id);
  if (!resident) return null;

  resident.status = "approved";
  resident.updatedAt = new Date().toISOString();
  await saveResidentToStorage(resident);
  return resident;
}

/**
 * 입주민 가입 반려/삭제 처리
 */
export async function rejectResidentInStorage(id: string): Promise<StoredResident | null> {
  const resident = await findResidentById(id);
  if (!resident) return null;

  resident.status = "rejected";
  resident.isActive = false;
  resident.updatedAt = new Date().toISOString();
  await saveResidentToStorage(resident);
  return resident;
}
