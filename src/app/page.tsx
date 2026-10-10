import { Suspense } from "react";
import { Notice, Reservation } from "@/types";
import { ShuttleApp } from "@/components/ShuttleApp";

// 초기 시뮬레이션 공지사항 데이터 (한국어 / 중국어)
const INITIAL_NOTICE: Notice = {
  id: "NOTICE-01",
  titleKr: "제주공항 셔틀 탑승 장소 및 시간 엄수 안내",
  titleCn: "济州国际机场班车乘车地点与守时守则通知",
  contentKr:
    "제주국제공항 3층 5번 게이트는 공항 단속 구역으로 1분 이상 정차가 엄격히 금지되어 있습니다.\n정시 출발을 위해 출발 예정 시각 5분 전까지 반드시 승차 위치에서 대기해 주시기 바랍니다.",
  contentCn:
    "济州国际机场 3楼 5号门 属于机场特别管控区域，严禁停车超过1分钟。\n为保证准时发车，请务必于预定发车时间前5分钟到达指定乘车点等候。",
  targetScope: "all",
  isPinned: true,
  isEmergency: true,
  createdAt: new Date().toISOString(),
};

// 초기 시뮬레이션 예약 목록 (테스트 및 확인용)
const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: "RSV-AH2026101",
    passengerName: "이정우 (입주민)",
    phone: "010-9876-5432",
    pickupLocation: "아덴힐 112동 앞",
    dropoffLocation: "제주국제공항 3층 5번 게이트",
    departureDate: "2026-10-10",
    departureTime: "08:10",
    passengerCount: 2,
    vehicleType: "carnival",
    vehicleNumber: "제주 70가 1142",
    fareAmount: 0,
    paymentStatus: "paid",
    boardingStatus: "pending",
    createdAt: "2026-10-09T08:00:00Z",
  },
  {
    id: "RSV-AH2026102",
    passengerName: "Wang Wei (王伟)",
    phone: "010-5544-3322",
    pickupLocation: "제주국제공항 3층 5번 게이트",
    dropoffLocation: "커뮤니티 센터 / 관리사무실",
    departureDate: "2026-10-10",
    departureTime: "13:30",
    passengerCount: 8,
    vehicleType: "county",
    vehicleNumber: "제주 72바 5501",
    fareAmount: 40000,
    paymentStatus: "unpaid",
    boardingStatus: "pending",
    createdAt: "2026-10-09T08:15:00Z",
  },
];

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#111318]" />}>
      <ShuttleApp
        initialNotice={INITIAL_NOTICE}
        initialReservations={INITIAL_RESERVATIONS}
      />
    </Suspense>
  );
}
