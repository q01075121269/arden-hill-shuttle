"use server";

import { z } from "zod";

export type FeedbackActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

export interface SuggestionItem {
  id: string;
  createdAt: string; // YYYY-MM-DD HH:mm
  passengerName: string;
  dongNumber: string; // 예: "102동", "112동"
  contact: string;
  content: string;
  status: "pending" | "resolved"; // [접수 대기] | [확인 완료]
  resolvedAt?: string;
  adminMemo?: string;
}

// 건의사항 검증 스키마
const suggestionInputSchema = z.object({
  passengerName: z.string().min(2, "성함을 2자 이상 입력해주세요."),
  dongNumber: z.string().min(2, "동호수를 입력해주세요 (예: 102동)."),
  contact: z.string().optional().default(""),
  content: z.string().min(5, "건의 내용을 5자 이상 입력해주세요."),
});

export type SuggestionInput = z.infer<typeof suggestionInputSchema>;

// 모의 인메모리 건의사항 저장소 (초기 목데이터 포함)
let GLOBAL_SUGGESTIONS: SuggestionItem[] = [
  {
    id: "SUGG-20261009-001",
    createdAt: "2026-10-09 11:40",
    passengerName: "김은정",
    dongNumber: "105동",
    contact: "010-8812-7721",
    content: "오전 8시 10분 공항행 1회차 버스에 카운티 대형 차량 배차가 더 자주 되었으면 좋겠습니다. 가족 단위 이동 시 짐이 많아 좌석이 부족할 때가 있습니다.",
    status: "pending",
  },
  {
    id: "SUGG-20261009-002",
    createdAt: "2026-10-09 09:15",
    passengerName: "박준영",
    dongNumber: "168동",
    contact: "010-7712-4490",
    content: "이마트 휴무일(둘째/넷째 일요일)에 제주민속오일장으로 대체 경유해주시는 서비스 정말 편리합니다. 안내 방송도 같이 나오면 더 좋겠습니다.",
    status: "resolved",
    resolvedAt: "2026-10-09 10:00",
    adminMemo: "기사님들께 오일장 경유 시 차내 안내방송 매뉴얼 전달 완료",
  },
  {
    id: "SUGG-20261008-003",
    createdAt: "2026-10-08 17:30",
    passengerName: "왕웨이 (Wang Wei)",
    dongNumber: "112동",
    contact: "010-9901-2241",
    content: "공항 5번 게이트 승차 위치에 중국어 안내 팻말이나 배너가 눈에 잘 띄게 설치되었으면 좋겠습니다.",
    status: "pending",
  },
  {
    id: "SUGG-20261008-004",
    createdAt: "2026-10-08 14:10",
    passengerName: "최민수",
    dongNumber: "140동",
    contact: "010-4491-0021",
    content: "골프백을 적재할 수 있는 트렁크 공간이 카니발의 경우 협소한 편인데, 예약 시 골프백 유무를 체크하는 칸이 있으면 좋겠습니다.",
    status: "resolved",
    resolvedAt: "2026-10-08 15:20",
    adminMemo: "차기 예약 UI 업데이트 항목으로 검토 등록",
  },
];

/**
 * 1. 승객 웹: 관리소 건의사항 실시간 등록 Server Action
 */
export async function submitSuggestionAction(
  input: SuggestionInput
): Promise<FeedbackActionResult<SuggestionItem>> {
  const parsed = suggestionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.",
    };
  }

  const now = new Date();
  const timeFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const newSuggestion: SuggestionItem = {
    id: `SUGG-${Date.now().toString(36).toUpperCase()}`,
    createdAt: timeFormatted,
    passengerName: parsed.data.passengerName.trim(),
    dongNumber: parsed.data.dongNumber.trim(),
    contact: parsed.data.contact?.trim() || "",
    content: parsed.data.content.trim(),
    status: "pending",
  };

  GLOBAL_SUGGESTIONS.unshift(newSuggestion);

  console.log(`[Suggestion] 주민 건의 등록: ${newSuggestion.dongNumber} ${newSuggestion.passengerName}`);

  return {
    success: true,
    data: newSuggestion,
    message: "관리사무소에 건의·애로사항이 정상적으로 접수되었습니다. 신속히 검토하겠습니다.",
  };
}

/**
 * 2. 관리자 웹: 건의사항 목록 조회 Server Action
 */
export async function getSuggestionsAction(): Promise<
  FeedbackActionResult<SuggestionItem[]>
> {
  return {
    success: true,
    data: [...GLOBAL_SUGGESTIONS],
  };
}

/**
 * 3. 관리자 웹: 건의사항 처리 상태 토글 ([접수 대기] <-> [확인 완료])
 */
export async function toggleSuggestionStatusAction(
  id: string,
  adminMemo?: string
): Promise<FeedbackActionResult<SuggestionItem>> {
  const itemIndex = GLOBAL_SUGGESTIONS.findIndex((s) => s.id === id);
  if (itemIndex === -1) {
    return {
      success: false,
      error: "해당 건의사항을 찾을 수 없습니다.",
    };
  }

  const current = GLOBAL_SUGGESTIONS[itemIndex];
  const newStatus: "pending" | "resolved" = current.status === "pending" ? "resolved" : "pending";
  const now = new Date();
  const resolvedAt = newStatus === "resolved"
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    : undefined;

  const updated: SuggestionItem = {
    ...current,
    status: newStatus,
    resolvedAt,
    adminMemo: adminMemo !== undefined ? adminMemo : current.adminMemo,
  };

  GLOBAL_SUGGESTIONS[itemIndex] = updated;

  return {
    success: true,
    data: updated,
    message: `건의사항 처리 상태가 '${newStatus === "resolved" ? "확인 완료" : "접수 대기"}'(으)로 변경되었습니다.`,
  };
}

/**
 * 4. 관리자 웹: 건의사항 삭제 Server Action
 */
export async function deleteSuggestionAction(
  id: string
): Promise<FeedbackActionResult<{ deletedId: string }>> {
  GLOBAL_SUGGESTIONS = GLOBAL_SUGGESTIONS.filter((s) => s.id !== id);
  return {
    success: true,
    data: { deletedId: id },
    message: "건의사항이 삭제되었습니다.",
  };
}
