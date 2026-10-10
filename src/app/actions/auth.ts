"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export type UserRole =
  | "super_admin" // 개발자 (Super Admin / Developer)
  | "manager" // 관리과장 (General Manager)
  | "assistant1" // 관리 보좌관 1 (Assistant Admin 1)
  | "assistant2" // 관리 보좌관 2 (Assistant Admin 2)
  | "driver" // 운행 기사
  | "resident"; // 승객/입주민

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  roleName: string;
  building?: string; // 거주 동수 (예: 112동)
  status: "approved" | "pending" | "rejected";
  canApproveResident: boolean;
  canManageAllData: boolean;
  rememberMe?: boolean;
}

export type AuthActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// -------------------------------------------------------------
// 1. 관리자 4인 지정 계정 시드(Seed)
// -------------------------------------------------------------
interface AdminAccountSeed {
  id: string;
  loginId: string;
  phone: string;
  passwordHash: string; // 시뮬레이션용 해시 검증
  name: string;
  role: UserRole;
  roleName: string;
}

const ADMIN_ACCOUNTS: AdminAccountSeed[] = [
  {
    id: "ADM-001",
    loginId: "admin_dev",
    phone: "010-1111-2222",
    passwordHash: "admin7788!",
    name: "최고관리자 (개발자)",
    role: "super_admin",
    roleName: "개발자 (시스템 총괄)",
  },
  {
    id: "ADM-002",
    loginId: "admin_mgr",
    phone: "010-2222-3333",
    passwordHash: "arden2026!",
    name: "이진우 관리과장",
    role: "manager",
    roleName: "관리과장 (총괄 관리)",
  },
  {
    id: "ADM-003",
    loginId: "admin_asst1",
    phone: "010-3333-4444",
    passwordHash: "asst1111!",
    name: "박상현 보좌관",
    role: "assistant1",
    roleName: "관리 보좌관 1 (운행·예약)",
  },
  {
    id: "ADM-004",
    loginId: "admin_asst2",
    phone: "010-4444-5555",
    passwordHash: "asst2222!",
    name: "정유진 보좌관",
    role: "assistant2",
    roleName: "관리 보좌관 2 (수납·현장)",
  },
];

// -------------------------------------------------------------
// 2. 입주민 간편 계정 저장소 (전화번호 + 4자리 숫자 PIN)
// -------------------------------------------------------------
export interface ResidentAccount {
  id: string;
  name: string;
  phone: string; // 하이픈 통일: 010-XXXX-XXXX
  pin: string; // 숫자 4자리
  building: string; // 101동 ~ 200동, 커뮤니티 센터 등
  status: "approved" | "pending" | "rejected";
  createdAt: string;
  updatedAt: string;
}

// 초기 승인 입주민 목데이터
let GLOBAL_RESIDENT_ACCOUNTS: ResidentAccount[] = [
  {
    id: "RES-001",
    name: "김민수",
    phone: "010-3321-9988",
    pin: "1234",
    building: "112동",
    status: "approved",
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
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-10-09T08:00:00Z",
  },
  {
    id: "RES-004",
    name: "윤상혁",
    phone: "010-4490-8821",
    pin: "9900",
    building: "102동",
    status: "pending", // 승인 대기 샘플
    createdAt: "2026-10-09T09:00:00Z",
    updatedAt: "2026-10-09T09:00:00Z",
  },
];

const SESSION_COOKIE_NAME = "auth_session";

// -------------------------------------------------------------
// 3. Server Actions 구현
// -------------------------------------------------------------

/**
 * [입주민] 4자리 숫자 PIN 기반 간편 회원가입 신청
 */
export async function registerResidentAction(data: {
  name: string;
  phone: string;
  pin: string;
  building: string;
}): Promise<AuthActionResult<AuthUser>> {
  const name = data.name.trim();
  const phone = normalizePhone(data.phone.trim());
  const pin = data.pin.trim();
  const building = data.building.trim();

  if (!name || name.length < 2) {
    return { success: false, error: "성명을 2자 이상 정확히 입력해주세요." };
  }
  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    return { success: false, error: "올바른 휴대폰 번호(010-XXXX-XXXX)를 입력해주세요." };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { success: false, error: "간편 비밀번호는 숫자 4자리로 입력해주세요." };
  }
  if (!building) {
    return { success: false, error: "거주 동수를 입력해주세요." };
  }

  // 중복 가입 체크
  const existing = GLOBAL_RESIDENT_ACCOUNTS.find((r) => r.phone === phone);
  if (existing) {
    return { success: false, error: "이미 가입 신청된 휴대폰 번호입니다. 로그인해 주세요." };
  }

  const now = new Date().toISOString();
  const newAccount: ResidentAccount = {
    id: `RES-${Date.now().toString(36).toUpperCase()}`,
    name,
    phone,
    pin,
    building,
    status: "pending", // 관리자 승인 대기
    createdAt: now,
    updatedAt: now,
  };

  GLOBAL_RESIDENT_ACCOUNTS.unshift(newAccount);

  console.log(`[audit_logs] 입주민 신규 가입 신청 접수: ${name} (${phone}, ${building}) - 승인 대기`);

  const authUser: AuthUser = {
    id: newAccount.id,
    name: newAccount.name,
    phone: newAccount.phone,
    role: "resident",
    roleName: "입주민 승객",
    building: newAccount.building,
    status: newAccount.status,
    canApproveResident: false,
    canManageAllData: false,
  };

  // 세션 쿠키 발급 (승인 대기 상태로 세션 유지)
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(authUser), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30일
  });

  return {
    success: true,
    data: authUser,
    message: "회원가입 신청이 완료되었습니다. 관리자 승인 후 모든 편의 기능이 활성화됩니다.",
  };
}

/**
 * [입주민] 전화번호 + 4자리 숫자 PIN 로그인
 */
export async function loginWithPinAction(
  rawPhone: string,
  rawPin: string
): Promise<AuthActionResult<AuthUser>> {
  const phone = normalizePhone(rawPhone.trim());
  const pin = rawPin.trim();

  if (!phone || !pin) {
    return { success: false, error: "휴대폰 번호와 4자리 PIN을 모두 입력해주세요." };
  }

  const resident = GLOBAL_RESIDENT_ACCOUNTS.find((r) => r.phone === phone);
  if (!resident) {
    return { success: false, error: "등록되지 않은 휴대폰 번호입니다. 회원가입을 신청해주세요." };
  }

  if (resident.pin !== pin) {
    return { success: false, error: "비밀번호(숫자 4자리 PIN)가 일치하지 않습니다." };
  }

  const authUser: AuthUser = {
    id: resident.id,
    name: resident.name,
    phone: resident.phone,
    role: "resident",
    roleName: "입주민 승객",
    building: resident.building,
    status: resident.status,
    canApproveResident: false,
    canManageAllData: false,
  };

  // 30일 자동 로그인 쿠키 설정
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(authUser), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  console.log(`[audit_logs] 입주민 PIN 로그인 성공: ${resident.name} (${resident.phone})`);

  return {
    success: true,
    data: authUser,
    message: `${resident.name} 님, 환영합니다.`,
  };
}

/**
 * [관리자 4인] 자격 증명 검증 및 자동 로그인 (Remember Me) 세션 쿠키 발급
 */
export async function loginAdminAction(
  loginIdOrPhone: string,
  password: string,
  rememberMe: boolean = true
): Promise<AuthActionResult<AuthUser>> {
  const input = loginIdOrPhone.trim();
  const pwd = password.trim();

  if (!input || !pwd) {
    return { success: false, error: "관리자 아이디/연락처와 비밀번호를 입력해주세요." };
  }

  const admin = ADMIN_ACCOUNTS.find(
    (a) => a.loginId === input || a.phone === normalizePhone(input)
  );

  if (!admin || admin.passwordHash !== pwd) {
    return { success: false, error: "관리자 계정 정보 또는 비밀번호가 일치하지 않습니다." };
  }

  const canApprove = admin.role === "super_admin" || admin.role === "manager";
  const canManageAll = admin.role === "super_admin" || admin.role === "manager";

  const authUser: AuthUser = {
    id: admin.id,
    name: admin.name,
    phone: admin.phone,
    role: admin.role,
    roleName: admin.roleName,
    status: "approved",
    canApproveResident: canApprove,
    canManageAllData: canManageAll,
    rememberMe,
  };

  const cookieStore = await cookies();
  // 자동 로그인 활성화 시 30일(2,592,000초), 비활성화 시 1일 세션
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(authUser), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge,
  });

  console.log(`[audit_logs] 관리자 로그인 성공: ${admin.name} (${admin.roleName}) - 자동로그인: ${rememberMe ? "30일" : "1일"}`);

  return {
    success: true,
    data: authUser,
    message: `${admin.name} 님, 관제탑에 접속되었습니다.`,
  };
}

/**
 * 현재 세션 사용자 정보 복원
 */
export async function getCurrentUserAction(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const parsed: AuthUser = JSON.parse(sessionCookie.value);
    return parsed;
  } catch (err) {
    return null;
  }
}

/**
 * 원터치 로그아웃
 */
export async function logoutUserAction(): Promise<AuthActionResult<null>> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return {
    success: true,
    data: null,
    message: "로그아웃되었습니다.",
  };
}

/**
 * [개발자/관리과장 전용] 신규 입주민 가입 승인 (approveResident)
 */
export async function approveResidentAction(
  residentId: string
): Promise<AuthActionResult<ResidentAccount>> {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !currentUser.canApproveResident) {
    return {
      success: false,
      error: "회원 가입 승인 권한이 없습니다. (개발자 또는 관리과장 계정 필요)",
    };
  }

  const resident = GLOBAL_RESIDENT_ACCOUNTS.find((r) => r.id === residentId);
  if (!resident) {
    return { success: false, error: "해당 신청자를 찾을 수 없습니다." };
  }

  resident.status = "approved";
  resident.updatedAt = new Date().toISOString();

  console.log(`[audit_logs] 입주민 가입 승인 처리: ${resident.name} (${resident.phone}) by ${currentUser.name}`);

  return {
    success: true,
    data: resident,
    message: `${resident.name} 님의 가입이 성공적으로 승인되었습니다.`,
  };
}

/**
 * [개발자/관리과장 전용] 신규 입주민 가입 반려 (rejectResident)
 */
export async function rejectResidentAction(
  residentId: string
): Promise<AuthActionResult<ResidentAccount>> {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !currentUser.canApproveResident) {
    return {
      success: false,
      error: "회원 가입 반려 권한이 없습니다. (개발자 또는 관리과장 계정 필요)",
    };
  }

  const resident = GLOBAL_RESIDENT_ACCOUNTS.find((r) => r.id === residentId);
  if (!resident) {
    return { success: false, error: "해당 신청자를 찾을 수 없습니다." };
  }

  resident.status = "rejected";
  resident.updatedAt = new Date().toISOString();

  console.log(`[audit_logs] 입주민 가입 반려 처리: ${resident.name} (${resident.phone}) by ${currentUser.name}`);

  return {
    success: true,
    data: resident,
    message: `${resident.name} 님의 가입이 반려되었습니다.`,
  };
}

/**
 * [관리자용] 승인 대기 입주민 목록 조회
 */
export async function getPendingResidentsAction(): Promise<ResidentAccount[]> {
  return GLOBAL_RESIDENT_ACCOUNTS.filter((r) => r.status === "pending");
}

/**
 * [관리자용] 전체 입주민 계정 목록 조회
 */
export async function getAllResidentAccountsAction(): Promise<ResidentAccount[]> {
  return GLOBAL_RESIDENT_ACCOUNTS;
}
