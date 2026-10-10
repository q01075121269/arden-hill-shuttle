import { z } from "zod";

export const reservationFormSchema = z.object({
  passengerName: z.string().min(2, "이름을 2자 이상 입력해주세요."),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, "올바른 연락처 형식(010-0000-0000)을 입력해주세요."),
  pickupLocation: z.string().min(1, "승차 위치를 선택해주세요."),
  dropoffLocation: z.string().min(1, "하차 위치를 선택해주세요."),
  departureDate: z.string().min(1, "탑승 날짜를 선택해주세요."),
  departureTime: z.string().min(1, "탑승 시간을 선택해주세요."),
  passengerCount: z.coerce.number().int().min(1, "탑승 인원은 최소 1명 이상이어야 합니다.").max(25, "최대 25명까지 가능합니다."),
});

export type ReservationFormInput = z.infer<typeof reservationFormSchema>;
