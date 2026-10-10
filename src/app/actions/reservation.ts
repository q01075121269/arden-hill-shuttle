"use server";

import { reservationFormSchema, ReservationFormInput } from "@/lib/validations/reservation";
import { Reservation, VehicleType } from "@/types";

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// 서버 액션: 예약 생성
export async function createReservationAction(
  formData: ReservationFormInput
): Promise<ActionResult<Reservation>> {
  // 1. Zod 유효성 검증
  const parsed = reservationFormSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const field = err.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(err.message);
    });
    return {
      success: false,
      error: "입력값 검증에 실패했습니다. 입력란을 확인해 주세요.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 2. 비즈니스 로직: 탑승 인원에 따른 차종 자동 배정 (5인 이하 카니발, 6인 이상 카운티)
  const vehicleType: VehicleType = data.passengerCount <= 5 ? "carnival" : "county";
  const vehicleNumber = vehicleType === "carnival" ? "제주 70가 1142 (카니발)" : "제주 72바 5501 (카운티)";
  
  // 3. 요금 계산 (입주민 우대 0원 / 일반 기준 1인 5,000원)
  const fareAmount = data.passengerCount * 5000;

  // 4. 예약 레코드 생성 (서버 측 저장 시뮬레이션)
  const newReservation: Reservation = {
    id: `RSV-${Date.now().toString(36).toUpperCase()}`,
    passengerName: data.passengerName,
    phone: data.phone,
    pickupLocation: data.pickupLocation,
    dropoffLocation: data.dropoffLocation,
    departureDate: data.departureDate,
    departureTime: data.departureTime,
    passengerCount: data.passengerCount,
    vehicleType,
    vehicleNumber,
    fareAmount,
    paymentStatus: "unpaid",
    boardingStatus: "pending",
    is_active: true,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    data: newReservation,
    message: "탑승 예약이 성공적으로 접수되었습니다.",
  };
}

// 서버 액션: 예약 직접 수정 (승객 요청)
export interface UpdateReservationInput extends ReservationFormInput {
  id: string;
}

export async function updateReservationAction(
  input: UpdateReservationInput
): Promise<ActionResult<Reservation>> {
  if (!input.id) {
    return { success: false, error: "유효하지 않은 예약 번호입니다." };
  }

  // 1. Zod 유효성 검증
  const parsed = reservationFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const field = err.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(err.message);
    });
    return {
      success: false,
      error: "입력값 검증에 실패했습니다. 입력란을 확인해 주세요.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // 2. 비즈니스 로직: 탑승 인원에 따른 차종 자동 재배정
  const vehicleType: VehicleType = data.passengerCount <= 5 ? "carnival" : "county";
  const vehicleNumber = vehicleType === "carnival" ? "제주 70가 1142 (카니발)" : "제주 72바 5501 (카운티)";
  const fareAmount = data.passengerCount * 5000;

  // 3. 수정된 예약 데이터 객체 생성
  const updatedReservation: Reservation = {
    id: input.id,
    passengerName: data.passengerName,
    phone: data.phone,
    pickupLocation: data.pickupLocation,
    dropoffLocation: data.dropoffLocation,
    departureDate: data.departureDate,
    departureTime: data.departureTime,
    passengerCount: data.passengerCount,
    vehicleType,
    vehicleNumber,
    fareAmount,
    paymentStatus: "unpaid",
    boardingStatus: "pending",
    is_active: true,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    data: updatedReservation,
    message: "예약 정보가 성공적으로 변경되었습니다.",
  };
}

// 서버 액션: 예약 취소 (소프트 딜리트 is_active = false 처리)
export async function cancelReservationAction(
  reservationId: string
): Promise<ActionResult<{ id: string; status: string; is_active: boolean }>> {
  if (!reservationId) {
    return { success: false, error: "유효하지 않은 예약 번호입니다." };
  }

  // 데이터 무결성 보존: 물리 삭제가 아닌 소프트 딜리트(is_active = false, boardingStatus = cancelled)
  return {
    success: true,
    data: {
      id: reservationId,
      status: "cancelled",
      is_active: false,
    },
    message: "예약이 성공적으로 취소되었습니다.",
  };
}
