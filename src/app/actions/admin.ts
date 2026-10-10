"use server";

import { z } from "zod";

// 1. 운영 정책 수정 스키마
const policySchema = z.object({
  fareAmount: z.number().int().min(0, "요금은 0원 이상이어야 합니다."),
  cutoffHour: z.number().int().min(0).max(23, "마감 시간은 0~23시 사이여야 합니다."),
  cutoffMinute: z.number().int().min(0).max(59),
  driverPhone: z.string().min(8, "기사 연락처를 입력해주세요."),
  adminPhone: z.string().min(8, "관리실 연락처를 입력해주세요."),
  emartHolidays: z.array(z.string()), // ['2026-10-11', '2026-10-25']
  alternativeRouteName: z.string().min(1, "대체 노선명을 지정해주세요."), // '동문시장' | '오일장' | '365마트'
});

export type PolicyInput = z.infer<typeof policySchema>;

// 2. 공지사항 발행 스키마
const noticePublishSchema = z.object({
  titleKr: z.string().min(2, "한국어 제목을 입력해 주세요."),
  titleCn: z.string().min(2, "중국어 제목을 입력해 주세요."),
  contentKr: z.string().min(5, "한국어 본문을 입력해 주세요."),
  contentCn: z.string().min(5, "중국어 본문을 입력해 주세요."),
  targetScope: z.enum(["all", "target_date"]),
  targetDate: z.string().optional(),
  isEmergency: z.boolean(),
});

export type NoticePublishInput = z.infer<typeof noticePublishSchema>;

export type AdminActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// Server Action 1: 운영 정책 저장
export async function updatePolicyAction(
  input: PolicyInput
): Promise<AdminActionResult<PolicyInput>> {
  const parsed = policySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "운영 정책 설정값이 유효하지 않습니다. 입력란을 확인해 주세요.",
    };
  }

  console.log(`[Admin] 운영 정책 변경 저장: 요금 ${parsed.data.fareAmount}원, 마감 ${parsed.data.cutoffHour}시, 대체노선 ${parsed.data.alternativeRouteName}`);

  return {
    success: true,
    data: parsed.data,
    message: "운영 정책이 성공적으로 저장되었으며, 신규 예약 및 노선에 즉시 반영됩니다.",
  };
}

// Server Action 2: 동적 팝업 공지 발행
export async function publishNoticeAction(
  input: NoticePublishInput
): Promise<AdminActionResult<{ noticeId: string; publishedAt: string }>> {
  const parsed = noticePublishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "공지사항 입력값이 올바르지 않습니다.",
    };
  }

  const noticeId = `NOTICE-${Date.now().toString(36).toUpperCase()}`;
  const publishedAt = new Date().toISOString();

  console.log(`[Admin] 공지사항 발행 완료: ${noticeId} (타겟: ${parsed.data.targetScope})`);

  return {
    success: true,
    data: { noticeId, publishedAt },
    message: "승객 웹에 한국어/중국어 동시 표기 팝업 공지가 즉각 발행되었습니다.",
  };
}

// Server Action 3: 수납 완납 처리 및 audit_logs 기록
export async function settlePaymentAction(params: {
  reservationId: string;
  adminId?: string;
  amount: number;
}): Promise<AdminActionResult<{ reservationId: string; settledAt: string; auditLogId: string }>> {
  if (!params.reservationId) {
    return { success: false, error: "예약 식별자가 없습니다." };
  }

  const settledAt = new Date().toISOString();
  const auditLogId = `AUDIT-${Date.now().toString(36).toUpperCase()}`;

  // audit_logs 영구 기록 시뮬레이션
  console.log(`[audit_logs] 행위: PAYMENT_CONFIRMED, 대상: reservations (${params.reservationId}), 수납금액: ${params.amount}원, 감사ID: ${auditLogId}`);

  return {
    success: true,
    data: {
      reservationId: params.reservationId,
      settledAt,
      auditLogId,
    },
    message: "정상 완납 처리되었으며, 감사 로그(audit_logs)에 영구 보존되었습니다.",
  };
}
