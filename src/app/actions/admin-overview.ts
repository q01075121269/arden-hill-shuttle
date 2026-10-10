"use server";

import { z } from "zod";
import { AuditLogItem } from "./admin-master";

export type AdminActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// 4단계 실시간 위치 상태 타입
export type ShuttleProgressStep = "PREPARING" | "DEPARTED" | "STOPOVER" | "ARRIVED";

export interface ShuttleVehicleLiveStatus {
  id: string;
  type: "carnival" | "county";
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  currentRoundText: string; // 예: "1회차 (08:10 하행)"
  currentStep: ShuttleProgressStep; // 4단계 진행 상태
  stepLabel: string; // 단계 한국어 라벨
  progressPercent: number; // 25, 50, 75, 100
  lastReportedAt: string;
  statusBadge: string; // "이마트 이동 중", "공항 5번 게이트 대기"
}

// 탭 1 회차별 승객 승하차 명단 아이템
export interface OverviewPassengerItem {
  id: string;
  passengerName: string;
  phone: string;
  passengerCount: number;
  dongNumber: string; // "102동", "105동", "112동" 등 (동호수 필터용)
  pickupLocation: string; // "아덴힐 102동 앞", "공항 3층 5번 게이트 앞"
  dropoffLocation: string; // "이마트 신제주점", "공항 3층 5번 게이트", "아덴힐 108동 앞"
  boardedStatus: "boarded" | "waiting"; // "승차 완료" | "대기"
  paymentStatus: "paid" | "unpaid";
}

// 정류장별(경유지) 3단계 타임라인 스텝 인터페이스
export interface StopoverTimelineStep {
  stopName: string; // "아덴힐", "이마트 신제주점", "제주국제공항"
  timeText: string; // "08:10", "09:00", "09:20"
  statusLabel: string; // "출발", "도착 예정", "도착 예정"
  type: "departure" | "stopover" | "arrival";
}

// 탭 1 회차별 운행 상태 아이템
export interface OverviewRoundItem {
  id: string;
  direction: "outbound" | "inbound"; // outbound: 아덴힐->공항 (하행), inbound: 공항->아덴힐 (상행)
  directionLabel: string; // "아덴힐 ➔ 공항 방면" | "공항 ➔ 아덴힐 방면"
  roundNumber: number; // 1~6 or 1~5
  timeText: string; // "08:10", "10:30", "12:30", "15:00", "18:20", "20:00"
  status: "completed" | "in_transit" | "waiting" | "cancelled";
  statusText: string; // "운행 완료" | "실시간 운행 중 (이마트 경유)" | "출발 대기" | "미운행/결항"
  allocatedVehicleType: "carnival" | "county";
  vehiclePlate: string;
  driverName: string;
  totalPax: number;
  boardedPax: number;
  // 3단계 정류장별 도착 예정 타임라인
  timeline: StopoverTimelineStep[];
  routeSummaryText: string; // "아덴힐 [08:10 출발] ➔ 이마트 [09:00 도착 예정] ➔ 제주공항 [09:20 도착 예정]"
  passengers: OverviewPassengerItem[];
}

// 인포그래픽 추이 데이터 포인트
export interface AnalyticsTrendPoint {
  label: string; // "10/03(금)", "10/04(토)" or "1주차", "2주차" or "1월", "2월"
  passengers: number;
  completedTrips: number;
}

// 시간대별 탑승 인원 분포
export interface HourlyDistributionItem {
  roundText: string; // "하행 1회차", "상행 1회차"
  timeText: string; // "08:10", "09:30"
  direction: "outbound" | "inbound";
  passengerCount: number;
  isPeak: boolean;
}

// 인포그래픽 수송 통계 모델
export interface InfographicAnalyticsData {
  period: "weekly" | "monthly" | "yearly";
  periodLabel: string; // "최근 7일 (2026.10.03 ~ 10.09)", "2026년 10월", "2026년 연간"
  totalPassengers: number;
  prevComparisonPercent: number; // +18.4% or -3.2%
  isIncrease: boolean;
  trendData: AnalyticsTrendPoint[];
  elasticDispatch: {
    carnivalTrips: number; // 5인 이하
    carnivalRatio: number; // 64%
    countyTrips: number; // 6인 이상
    countyRatio: number; // 36%
    totalTrips: number;
  };
  // (1) 목적지별 수송 비율 분석: 제주공항행 vs 이마트/대체시장행
  destinationStats: {
    airportPax: number;
    airportRatio: number; // 예: 68%
    martPax: number;
    martRatio: number; // 예: 32%
    martName: string; // "이마트 신제주점" 또는 "제주민속오일장"
  };
  // (2) 시간대별(피크 타임) 탑승 집중도 분석
  hourlyDistribution: HourlyDistributionItem[];
  // (3) AI 종합 분석 인사이트 브리핑
  aiInsightText: string;
  topDongRankings: {
    rank: number;
    dong: string;
    passengerCount: number;
    percentage: number;
  }[];
  peakRound: {
    roundTitle: string; // "아덴힐발 08:10 1회차"
    direction: string; // "아덴힐 ➔ 공항"
    timeText: string; // "08:10"
    avgPassengers: number; // 14.8명
    congestionLevel: "혼잡 (최고 피크)" | "원활";
    utilizationRate: number; // 92%
  };
}

// 관제탑 통합 데이터 모델
export interface ControlTowerData {
  selectedDate: string; // "2026-10-09"
  stopoverName: string;
  // 1. 상단 슬림형 기사/차량 모니터 (카니발 / 카운티)
  vehicles: ShuttleVehicleLiveStatus[];
  // 2. 핵심 KPI 요약 바
  kpi: {
    totalRounds: number; // 11
    completedRounds: number; // 4
    operationRate: number; // 36
    totalPassengers: number; // 54
    boardedPassengers: number; // 34
    waitingPassengers: number; // 20
    unpaidAmount: number; // 45000
    unpaidCount: number; // 9
  };
  // 3. 당일 회차별 실시간 운행 현황 & 승하차 명단
  rounds: OverviewRoundItem[];
  // 4. 주간 / 월간 / 연간 인포그래픽 통계
  analytics: {
    weekly: InfographicAnalyticsData;
    monthly: InfographicAnalyticsData;
    yearly: InfographicAnalyticsData;
  };
}

export interface DashboardOverviewData {
  operationStatusBadge: {
    status: "normal" | "warning" | "emergency";
    text: string;
  };
  stopoverName: string;
  shuttles: ShuttleVehicleLiveStatus[];
  reservationKpi: {
    totalBookings: number;
    totalPassengers: number;
    boardingRate: number;
    carnivalCount: number;
    countyCount: number;
    cutoffTime: string;
    isCutoffClosed: boolean;
  };
  financeKpi: {
    totalUnpaidAmount: number;
    unpaidCount: number;
    unpaidPassengerCount: number;
  };
  safetyCheckStatus: {
    allPassed: boolean;
    inspectedVehiclesCount: number;
    totalVehiclesCount: number;
    memo: string;
    checkedAt: string;
  };
}

// 긴급 공지 발행 스키마
const emergencyNoticeSchema = z.object({
  titleKr: z.string().min(2, "한국어 제목을 입력해 주세요."),
  titleCn: z.string().min(2, "중국어 제목을 입력해 주세요."),
  contentKr: z.string().min(5, "한국어 본문을 입력해 주세요."),
  contentCn: z.string().min(5, "중국어 본문을 입력해 주세요."),
  targetScope: z.enum(["all", "today_passengers"]).default("all"),
  isEmergency: z.boolean().default(true),
});

export type EmergencyNoticeInput = z.infer<typeof emergencyNoticeSchema>;

// 긴급 공지 저장소
let GLOBAL_EMERGENCY_NOTICES: Array<EmergencyNoticeInput & { id: string; createdAt: string }> = [];
let GLOBAL_DASHBOARD_AUDIT: AuditLogItem[] = [];

/**
 * 날짜별 모의 회차 및 승하차 명단 생성기 (경유지 3단계 타임라인 포함)
 */
function generateRoundsForDate(dateStr: string, stopoverName: string = "이마트"): OverviewRoundItem[] {
  const martName = stopoverName.includes("오일장") ? "제주민속오일장" : "이마트";

  return [
    // [아덴힐 ➔ 공항 방면] (하행 6개 회차)
    {
      id: `${dateStr}-OUT-1`,
      direction: "outbound",
      directionLabel: "아덴힐 ➔ 공항 방면",
      roundNumber: 1,
      timeText: "08:10",
      status: "completed",
      statusText: "운행 완료",
      allocatedVehicleType: "county",
      vehiclePlate: "제주 72바 5501",
      driverName: "박영진 기사님",
      totalPax: 14,
      boardedPax: 14,
      timeline: [
        { stopName: "아덴힐", timeText: "08:10", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "09:00", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "제주공항", timeText: "09:20", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `아덴힐 [08:10 출발] ➔ ${martName} [09:00 도착 예정] ➔ 제주공항 [09:20 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P1`,
          passengerName: "김지훈",
          phone: "010-3341-8921",
          passengerCount: 2,
          dongNumber: "102동",
          pickupLocation: "아덴힐 102동 앞",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P2`,
          passengerName: "이서윤",
          phone: "010-8822-1104",
          passengerCount: 3,
          dongNumber: "105동",
          pickupLocation: "아덴힐 105동 앞",
          dropoffLocation: "이마트 신제주점",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P3`,
          passengerName: "왕웨이 (Wang Wei)",
          phone: "010-9901-2241",
          passengerCount: 4,
          dongNumber: "112동",
          pickupLocation: "아덴힐 112동 입구",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P4`,
          passengerName: "최민수",
          phone: "010-4491-0021",
          passengerCount: 5,
          dongNumber: "140동",
          pickupLocation: "아덴힐 140동 앞",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "boarded",
          paymentStatus: "unpaid",
        },
      ],
    },
    {
      id: `${dateStr}-OUT-2`,
      direction: "outbound",
      directionLabel: "아덴힐 ➔ 공항 방면",
      roundNumber: 2,
      timeText: "10:30",
      status: "completed",
      statusText: "운행 완료",
      allocatedVehicleType: "carnival",
      vehiclePlate: "제주 70가 1142",
      driverName: "김철수 기사님",
      totalPax: 4,
      boardedPax: 4,
      timeline: [
        { stopName: "아덴힐", timeText: "10:30", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "11:15", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "제주공항", timeText: "11:35", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `아덴힐 [10:30 출발] ➔ ${martName} [11:15 도착 예정] ➔ 제주공항 [11:35 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P5`,
          passengerName: "박준영",
          phone: "010-7712-4490",
          passengerCount: 2,
          dongNumber: "168동",
          pickupLocation: "아덴힐 168동 앞",
          dropoffLocation: "이마트 신제주점",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P6`,
          passengerName: "정다은",
          phone: "010-5521-7781",
          passengerCount: 2,
          dongNumber: "102동",
          pickupLocation: "아덴힐 102동 앞",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
      ],
    },
    {
      id: `${dateStr}-OUT-3`,
      direction: "outbound",
      directionLabel: "아덴힐 ➔ 공항 방면",
      roundNumber: 3,
      timeText: "12:30",
      status: "in_transit",
      statusText: "실시간 운행 중 (이마트 경유)",
      allocatedVehicleType: "carnival",
      vehiclePlate: "제주 70가 1142",
      driverName: "김철수 기사님",
      totalPax: 5,
      boardedPax: 5,
      timeline: [
        { stopName: "아덴힐", timeText: "12:30", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "13:15", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "제주공항", timeText: "13:35", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `아덴힐 [12:30 출발] ➔ ${martName} [13:15 도착 예정] ➔ 제주공항 [13:35 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P7`,
          passengerName: "강태우",
          phone: "010-3301-8899",
          passengerCount: 3,
          dongNumber: "112동",
          pickupLocation: "아덴힐 112동 앞",
          dropoffLocation: "이마트 신제주점",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P8`,
          passengerName: "린징 (Lin Jing)",
          phone: "010-8812-7721",
          passengerCount: 2,
          dongNumber: "105동",
          pickupLocation: "아덴힐 105동 앞",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "boarded",
          paymentStatus: "unpaid",
        },
      ],
    },
    {
      id: `${dateStr}-OUT-4`,
      direction: "outbound",
      directionLabel: "아덴힐 ➔ 공항 방면",
      roundNumber: 4,
      timeText: "15:00",
      status: "waiting",
      statusText: "출발 대기",
      allocatedVehicleType: "county",
      vehiclePlate: "제주 72바 5501",
      driverName: "박영진 기사님",
      totalPax: 8,
      boardedPax: 0,
      timeline: [
        { stopName: "아덴힐", timeText: "15:00", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "15:45", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "제주공항", timeText: "16:05", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `아덴힐 [15:00 출발] ➔ ${martName} [15:45 도착 예정] ➔ 제주공항 [16:05 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P9`,
          passengerName: "윤상혁",
          phone: "010-4490-8821",
          passengerCount: 4,
          dongNumber: "102동",
          pickupLocation: "아덴힐 102동 앞",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "waiting",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P10`,
          passengerName: "송혜진",
          phone: "010-2211-9988",
          passengerCount: 4,
          dongNumber: "140동",
          pickupLocation: "아덴힐 140동 앞",
          dropoffLocation: "이마트 신제주점",
          boardedStatus: "waiting",
          paymentStatus: "unpaid",
        },
      ],
    },
    {
      id: `${dateStr}-OUT-5`,
      direction: "outbound",
      directionLabel: "아덴힐 ➔ 공항 방면",
      roundNumber: 5,
      timeText: "18:20",
      status: "waiting",
      statusText: "출발 대기",
      allocatedVehicleType: "carnival",
      vehiclePlate: "제주 70가 1142",
      driverName: "김철수 기사님",
      totalPax: 4,
      boardedPax: 0,
      timeline: [
        { stopName: "아덴힐", timeText: "18:20", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "19:05", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "제주공항", timeText: "19:25", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `아덴힐 [18:20 출발] ➔ ${martName} [19:05 도착 예정] ➔ 제주공항 [19:25 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P11`,
          passengerName: "임채원",
          phone: "010-6641-0012",
          passengerCount: 2,
          dongNumber: "168동",
          pickupLocation: "아덴힐 168동 앞",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "waiting",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P12`,
          passengerName: "조현우",
          phone: "010-9982-1144",
          passengerCount: 2,
          dongNumber: "112동",
          pickupLocation: "아덴힐 112동 앞",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "waiting",
          paymentStatus: "paid",
        },
      ],
    },
    {
      id: `${dateStr}-OUT-6`,
      direction: "outbound",
      directionLabel: "아덴힐 ➔ 공항 방면",
      roundNumber: 6,
      timeText: "20:00",
      status: "waiting",
      statusText: "출발 대기",
      allocatedVehicleType: "carnival",
      vehiclePlate: "제주 70가 1142",
      driverName: "김철수 기사님",
      totalPax: 2,
      boardedPax: 0,
      timeline: [
        { stopName: "아덴힐", timeText: "20:00", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "20:45", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "제주공항", timeText: "21:05", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `아덴힐 [20:00 출발] ➔ ${martName} [20:45 도착 예정] ➔ 제주공항 [21:05 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P13`,
          passengerName: "한수민",
          phone: "010-1122-3344",
          passengerCount: 2,
          dongNumber: "105동",
          pickupLocation: "아덴힐 105동 앞",
          dropoffLocation: "공항 3층 5번 게이트",
          boardedStatus: "waiting",
          paymentStatus: "paid",
        },
      ],
    },

    // [공항 ➔ 아덴힐 방면] (상행 5개 회차)
    {
      id: `${dateStr}-IN-1`,
      direction: "inbound",
      directionLabel: "공항 ➔ 아덴힐 방면",
      roundNumber: 1,
      timeText: "09:30",
      status: "completed",
      statusText: "운행 완료",
      allocatedVehicleType: "county",
      vehiclePlate: "제주 72바 5501",
      driverName: "박영진 기사님",
      totalPax: 11,
      boardedPax: 11,
      timeline: [
        { stopName: "제주공항", timeText: "09:30", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "09:50", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "아덴힐", timeText: "10:30", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `제주공항 [09:30 출발] ➔ ${martName} [09:50 도착 예정] ➔ 아덴힐 [10:30 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P14`,
          passengerName: "오세훈",
          phone: "010-5591-2201",
          passengerCount: 4,
          dongNumber: "112동",
          pickupLocation: "공항 3층 5번 게이트",
          dropoffLocation: "아덴힐 112동 앞",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P15`,
          passengerName: "장리 (Zhang Li)",
          phone: "010-7744-8833",
          passengerCount: 4,
          dongNumber: "102동",
          pickupLocation: "공항 3층 5번 게이트",
          dropoffLocation: "아덴힐 102동 앞",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
        {
          id: `${dateStr}-P16`,
          passengerName: "서지안",
          phone: "010-6621-4499",
          passengerCount: 3,
          dongNumber: "105동",
          pickupLocation: "이마트 신제주점",
          dropoffLocation: "아덴힐 105동 앞",
          boardedStatus: "boarded",
          paymentStatus: "paid",
        },
      ],
    },
    {
      id: `${dateStr}-IN-2`,
      direction: "inbound",
      directionLabel: "공항 ➔ 아덴힐 방면",
      roundNumber: 2,
      timeText: "11:30",
      status: "completed",
      statusText: "운행 완료",
      allocatedVehicleType: "carnival",
      vehiclePlate: "제주 70가 1142",
      driverName: "김철수 기사님",
      totalPax: 0,
      boardedPax: 0,
      timeline: [
        { stopName: "제주공항", timeText: "11:30", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "11:50", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "아덴힐", timeText: "12:30", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `제주공항 [11:30 출발] ➔ ${martName} [11:50 도착 예정] ➔ 아덴힐 [12:30 도착 예정]`,
      passengers: [],
    },
    {
      id: `${dateStr}-IN-3`,
      direction: "inbound",
      directionLabel: "공항 ➔ 아덴힐 방면",
      roundNumber: 3,
      timeText: "13:30",
      status: "waiting",
      statusText: "출발 대기 (공항 5번 게이트)",
      allocatedVehicleType: "county",
      vehiclePlate: "제주 72바 5501",
      driverName: "박영진 기사님",
      totalPax: 4,
      boardedPax: 0,
      timeline: [
        { stopName: "제주공항", timeText: "13:30", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "13:50", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "아덴힐", timeText: "14:30", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `제주공항 [13:30 출발] ➔ ${martName} [13:50 도착 예정] ➔ 아덴힐 [14:30 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P17`,
          passengerName: "문동주",
          phone: "010-8890-4411",
          passengerCount: 4,
          dongNumber: "140동",
          pickupLocation: "공항 3층 5번 게이트",
          dropoffLocation: "아덴힐 140동 앞",
          boardedStatus: "waiting",
          paymentStatus: "unpaid",
        },
      ],
    },
    {
      id: `${dateStr}-IN-4`,
      direction: "inbound",
      directionLabel: "공항 ➔ 아덴힐 방면",
      roundNumber: 4,
      timeText: "16:20",
      status: "waiting",
      statusText: "출발 대기",
      allocatedVehicleType: "carnival",
      vehiclePlate: "제주 70가 1142",
      driverName: "김철수 기사님",
      totalPax: 2,
      boardedPax: 0,
      timeline: [
        { stopName: "제주공항", timeText: "16:20", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "16:40", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "아덴힐", timeText: "17:20", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `제주공항 [16:20 출발] ➔ ${martName} [16:40 도착 예정] ➔ 아덴힐 [17:20 도착 예정]`,
      passengers: [
        {
          id: `${dateStr}-P18`,
          passengerName: "배수지",
          phone: "010-2288-4491",
          passengerCount: 2,
          dongNumber: "168동",
          pickupLocation: "공항 3층 5번 게이트",
          dropoffLocation: "아덴힐 168동 앞",
          boardedStatus: "waiting",
          paymentStatus: "paid",
        },
      ],
    },
    {
      id: `${dateStr}-IN-5`,
      direction: "inbound",
      directionLabel: "공항 ➔ 아덴힐 방면",
      roundNumber: 5,
      timeText: "19:10",
      status: "waiting",
      statusText: "출발 대기",
      allocatedVehicleType: "carnival",
      vehiclePlate: "제주 70가 1142",
      driverName: "김철수 기사님",
      totalPax: 0,
      boardedPax: 0,
      timeline: [
        { stopName: "제주공항", timeText: "19:10", statusLabel: "출발", type: "departure" },
        { stopName: martName, timeText: "19:30", statusLabel: "도착 예정", type: "stopover" },
        { stopName: "아덴힐", timeText: "20:10", statusLabel: "도착 예정", type: "arrival" },
      ],
      routeSummaryText: `제주공항 [19:10 출발] ➔ ${martName} [19:30 도착 예정] ➔ 아덴힐 [20:10 도착 예정]`,
      passengers: [],
    },
  ];
}

/**
 * 인포그래픽 수송 통계 모의 데이터 생성 (목적지 분석, 시간대별 집중도, AI 인사이트 브리핑 반영)
 */
function generateInfographicAnalytics(): ControlTowerData["analytics"] {
  return {
    weekly: {
      period: "weekly",
      periodLabel: "최근 7일간 운행 실적 (2026.10.03 ~ 10.09)",
      totalPassengers: 368,
      prevComparisonPercent: 14.2,
      isIncrease: true,
      trendData: [
        { label: "10/03 (금)", passengers: 48, completedTrips: 11 },
        { label: "10/04 (토)", passengers: 62, completedTrips: 11 },
        { label: "10/05 (일)", passengers: 59, completedTrips: 11 },
        { label: "10/06 (월)", passengers: 42, completedTrips: 10 },
        { label: "10/07 (화)", passengers: 47, completedTrips: 11 },
        { label: "10/08 (수)", passengers: 56, completedTrips: 11 },
        { label: "10/09 (금·금일)", passengers: 54, completedTrips: 11 },
      ],
      elasticDispatch: {
        carnivalTrips: 48,
        carnivalRatio: 63,
        countyTrips: 28,
        countyRatio: 37,
        totalTrips: 76,
      },
      destinationStats: {
        airportPax: 250,
        airportRatio: 68,
        martPax: 118,
        martRatio: 32,
        martName: "이마트 신제주점",
      },
      hourlyDistribution: [
        { roundText: "하행 1회차", timeText: "08:10", direction: "outbound", passengerCount: 14, isPeak: true },
        { roundText: "상행 1회차", timeText: "09:30", direction: "inbound", passengerCount: 11, isPeak: true },
        { roundText: "하행 2회차", timeText: "10:30", direction: "outbound", passengerCount: 4, isPeak: false },
        { roundText: "상행 2회차", timeText: "11:30", direction: "inbound", passengerCount: 0, isPeak: false },
        { roundText: "하행 3회차", timeText: "12:30", direction: "outbound", passengerCount: 5, isPeak: false },
        { roundText: "상행 3회차", timeText: "13:30", direction: "inbound", passengerCount: 4, isPeak: false },
        { roundText: "하행 4회차", timeText: "15:00", direction: "outbound", passengerCount: 8, isPeak: false },
        { roundText: "상행 4회차", timeText: "16:20", direction: "inbound", passengerCount: 2, isPeak: false },
        { roundText: "하행 5회차", timeText: "18:20", direction: "outbound", passengerCount: 4, isPeak: false },
        { roundText: "상행 5회차", timeText: "19:10", direction: "inbound", passengerCount: 0, isPeak: false },
        { roundText: "하행 6회차", timeText: "20:00", direction: "outbound", passengerCount: 2, isPeak: false },
      ],
      aiInsightText: "이번 주 분석 결과, 08:10 1회차(14명)와 09:30 상행 1회차(11명)에 전체 승객의 46%가 집중되었으며, 목적지는 제주공항(68%)이 이마트(32%)보다 우세합니다. 카운티 버스 가동률은 37%로 안정적으로 탄력 배차되고 있습니다.",
      topDongRankings: [
        { rank: 1, dong: "112동", passengerCount: 94, percentage: 25.5 },
        { rank: 2, dong: "105동", passengerCount: 78, percentage: 21.2 },
        { rank: 3, dong: "140동", passengerCount: 65, percentage: 17.7 },
        { rank: 4, dong: "168동", passengerCount: 48, percentage: 13.0 },
        { rank: 5, dong: "102동", passengerCount: 42, percentage: 11.4 },
      ],
      peakRound: {
        roundTitle: "아덴힐발 08:10 (하행 1회차)",
        direction: "아덴힐 ➔ 공항",
        timeText: "08:10",
        avgPassengers: 14.2,
        congestionLevel: "혼잡 (최고 피크)",
        utilizationRate: 94,
      },
    },
    monthly: {
      period: "monthly",
      periodLabel: "당월 누적 운행 실적 (2026년 10월 1일 ~ 현재)",
      totalPassengers: 512,
      prevComparisonPercent: 8.6,
      isIncrease: true,
      trendData: [
        { label: "10/01~03", passengers: 154, completedTrips: 33 },
        { label: "10/04~06", passengers: 163, completedTrips: 32 },
        { label: "10/07~09", passengers: 157, completedTrips: 33 },
        { label: "10/10~12", passengers: 38, completedTrips: 11 },
      ],
      elasticDispatch: {
        carnivalTrips: 68,
        carnivalRatio: 65,
        countyTrips: 37,
        countyRatio: 35,
        totalTrips: 105,
      },
      destinationStats: {
        airportPax: 338,
        airportRatio: 66,
        martPax: 174,
        martRatio: 34,
        martName: "이마트 신제주점",
      },
      hourlyDistribution: [
        { roundText: "하행 1회차", timeText: "08:10", direction: "outbound", passengerCount: 198, isPeak: true },
        { roundText: "상행 1회차", timeText: "09:30", direction: "inbound", passengerCount: 152, isPeak: true },
        { roundText: "하행 2회차", timeText: "10:30", direction: "outbound", passengerCount: 45, isPeak: false },
        { roundText: "상행 2회차", timeText: "11:30", direction: "inbound", passengerCount: 12, isPeak: false },
        { roundText: "하행 3회차", timeText: "12:30", direction: "outbound", passengerCount: 38, isPeak: false },
        { roundText: "상행 3회차", timeText: "13:30", direction: "inbound", passengerCount: 25, isPeak: false },
        { roundText: "하행 4회차", timeText: "15:00", direction: "outbound", passengerCount: 24, isPeak: false },
        { roundText: "상행 4회차", timeText: "16:20", direction: "inbound", passengerCount: 8, isPeak: false },
        { roundText: "하행 5회차", timeText: "18:20", direction: "outbound", passengerCount: 7, isPeak: false },
        { roundText: "상행 5회차", timeText: "19:10", direction: "inbound", passengerCount: 2, isPeak: false },
        { roundText: "하행 6회차", timeText: "20:00", direction: "outbound", passengerCount: 1, isPeak: false },
      ],
      aiInsightText: "당월 누적 분석 결과, 오전 항공 연결 피크(08:10, 09:30) 집중도가 48%에 달하며, 주말 쇼핑 수요로 이마트행 비중이 34%로 전월 대비 소폭 상승했습니다.",
      topDongRankings: [
        { rank: 1, dong: "112동", passengerCount: 138, percentage: 27.0 },
        { rank: 2, dong: "105동", passengerCount: 108, percentage: 21.1 },
        { rank: 3, dong: "140동", passengerCount: 89, percentage: 17.4 },
        { rank: 4, dong: "102동", passengerCount: 74, percentage: 14.5 },
        { rank: 5, dong: "168동", passengerCount: 63, percentage: 12.3 },
      ],
      peakRound: {
        roundTitle: "아덴힐발 08:10 (하행 1회차)",
        direction: "아덴힐 ➔ 공항",
        timeText: "08:10",
        avgPassengers: 14.5,
        congestionLevel: "혼잡 (최고 피크)",
        utilizationRate: 96,
      },
    },
    yearly: {
      period: "yearly",
      periodLabel: "2026 연간 누적 운행 실적 (2026년 1월 ~ 10월)",
      totalPassengers: 5420,
      prevComparisonPercent: 22.4,
      isIncrease: true,
      trendData: [
        { label: "1월", passengers: 410, completedTrips: 110 },
        { label: "2월", passengers: 435, completedTrips: 112 },
        { label: "3월", passengers: 490, completedTrips: 120 },
        { label: "4월", passengers: 530, completedTrips: 125 },
        { label: "5월", passengers: 580, completedTrips: 130 },
        { label: "6월", passengers: 560, completedTrips: 128 },
        { label: "7월", passengers: 620, completedTrips: 135 },
        { label: "8월", passengers: 680, completedTrips: 140 },
        { label: "9월", passengers: 603, completedTrips: 132 },
        { label: "10월", passengers: 512, completedTrips: 105 },
      ],
      elasticDispatch: {
        carnivalTrips: 712,
        carnivalRatio: 61,
        countyTrips: 455,
        countyRatio: 39,
        totalTrips: 1167,
      },
      destinationStats: {
        airportPax: 3523,
        airportRatio: 65,
        martPax: 1897,
        martRatio: 35,
        martName: "이마트 및 전통시장",
      },
      hourlyDistribution: [
        { roundText: "하행 1회차", timeText: "08:10", direction: "outbound", passengerCount: 1950, isPeak: true },
        { roundText: "상행 1회차", timeText: "09:30", direction: "inbound", passengerCount: 1480, isPeak: true },
        { roundText: "하행 2회차", timeText: "10:30", direction: "outbound", passengerCount: 520, isPeak: false },
        { roundText: "상행 2회차", timeText: "11:30", direction: "inbound", passengerCount: 220, isPeak: false },
        { roundText: "하행 3회차", timeText: "12:30", direction: "outbound", passengerCount: 420, isPeak: false },
        { roundText: "상행 3회차", timeText: "13:30", direction: "inbound", passengerCount: 310, isPeak: false },
        { roundText: "하행 4회차", timeText: "15:00", direction: "outbound", passengerCount: 280, isPeak: false },
        { roundText: "상행 4회차", timeText: "16:20", direction: "inbound", passengerCount: 110, isPeak: false },
        { roundText: "하행 5회차", timeText: "18:20", direction: "outbound", passengerCount: 80, isPeak: false },
        { roundText: "상행 5회차", timeText: "19:10", direction: "inbound", passengerCount: 30, isPeak: false },
        { roundText: "하행 6회차", timeText: "20:00", direction: "outbound", passengerCount: 20, isPeak: false },
      ],
      aiInsightText: "2026 연간 분석 결과, 총 수송 인원은 5,420명으로 전년 대비 +22.4% 성장했습니다. 특히 112동·105동 거주민 이용률이 전체의 48%를 차지하며, 카운티 버스 가동률은 39%로 적절한 유류비 절감 효과를 거두고 있습니다.",
      topDongRankings: [
        { rank: 1, dong: "112동", passengerCount: 1420, percentage: 26.2 },
        { rank: 2, dong: "105동", passengerCount: 1180, percentage: 21.8 },
        { rank: 3, dong: "140동", passengerCount: 960, percentage: 17.7 },
        { rank: 4, dong: "102동", passengerCount: 780, percentage: 14.4 },
        { rank: 5, dong: "168동", passengerCount: 650, percentage: 12.0 },
      ],
      peakRound: {
        roundTitle: "아덴힐발 08:10 (하행 1회차)",
        direction: "아덴힐 ➔ 공항",
        timeText: "08:10",
        avgPassengers: 14.1,
        congestionLevel: "혼잡 (최고 피크)",
        utilizationRate: 94,
      },
    },
  };
}

/**
 * 1. 실시간 통합 관제탑 대시보드 V2 데이터 조회 Server Action
 *    - 특정 날짜(date) 파라미터 기반 상태 바인딩
 */
export async function getControlTowerDataAction(
  targetDate?: string
): Promise<AdminActionResult<ControlTowerData>> {
  const dateStr = targetDate || "2026-10-09";
  const stopoverName = "이마트 (정상 운행)";
  const rounds = generateRoundsForDate(dateStr, stopoverName);

  // 상단 슬림형 2대 차량 배지 상태
  const vehicles: ShuttleVehicleLiveStatus[] = [
    {
      id: "VEH-01",
      type: "carnival",
      plateNumber: "제주 70가 1142",
      driverName: "김철수 기사님",
      driverPhone: "010-8921-4421",
      currentRoundText: "하행 3회차 (12:30)",
      currentStep: "STOPOVER",
      stepLabel: "이마트 신제주점 경유 이동 중",
      progressPercent: 65,
      lastReportedAt: "12:48",
      statusBadge: "이마트 이동 중",
    },
    {
      id: "VEH-02",
      type: "county",
      plateNumber: "제주 72바 5501",
      driverName: "박영진 기사님",
      driverPhone: "010-4421-9981",
      currentRoundText: "상행 3회차 (13:30)",
      currentStep: "PREPARING",
      stepLabel: "공항 3층 5번 게이트 승차 대기 중",
      progressPercent: 20,
      lastReportedAt: "13:10",
      statusBadge: "공항 5번 게이트 대기",
    },
  ];

  // 일자별 KPI 계산
  const totalRounds = 11;
  const completedRounds = 4;
  const operationRate = Math.round((completedRounds / totalRounds) * 100); // 36%
  const totalPassengers = 54;
  const boardedPassengers = 34;
  const waitingPassengers = 20;
  const unpaidAmount = 45000;
  const unpaidCount = 9;

  const data: ControlTowerData = {
    selectedDate: dateStr,
    stopoverName,
    vehicles,
    kpi: {
      totalRounds,
      completedRounds,
      operationRate,
      totalPassengers,
      boardedPassengers,
      waitingPassengers,
      unpaidAmount,
      unpaidCount,
    },
    rounds,
    analytics: generateInfographicAnalytics(),
  };

  return {
    success: true,
    data,
  };
}

/**
 * 기존 DashboardOverviewData 호환용 Server Action
 */
export async function getDashboardOverviewDataAction(): Promise<
  AdminActionResult<DashboardOverviewData>
> {
  const v2Res = await getControlTowerDataAction("2026-10-09");
  if (!v2Res.success) {
    return { success: false, error: v2Res.error };
  }

  const v2 = v2Res.data;
  const data: DashboardOverviewData = {
    operationStatusBadge: {
      status: "normal",
      text: "실시간 운행 정상",
    },
    stopoverName: v2.stopoverName,
    shuttles: v2.vehicles,
    reservationKpi: {
      totalBookings: 28,
      totalPassengers: v2.kpi.totalPassengers,
      boardingRate: 88,
      carnivalCount: 18,
      countyCount: 10,
      cutoffTime: "22:00",
      isCutoffClosed: false,
    },
    financeKpi: {
      totalUnpaidAmount: v2.kpi.unpaidAmount,
      unpaidCount: v2.kpi.unpaidCount,
      unpaidPassengerCount: 3,
    },
    safetyCheckStatus: {
      allPassed: true,
      inspectedVehiclesCount: 2,
      totalVehiclesCount: 2,
      memo: "전 차량 타이어, 브레이크, 등화장치 등 5대 안전점검 합격 완료",
      checkedAt: "07:45",
    },
  };

  return {
    success: true,
    data,
  };
}

/**
 * 2. 한/중 동시 긴급 팝업 발행 Server Action (publishEmergencyNotice)
 */
export async function publishEmergencyNoticeAction(
  input: EmergencyNoticeInput
): Promise<AdminActionResult<{ noticeId: string; publishedAt: string }>> {
  const parsed = emergencyNoticeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "공지사항 입력값이 올바르지 않습니다.",
    };
  }

  const noticeId = `NOTICE-EMG-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  const record = {
    ...parsed.data,
    id: noticeId,
    createdAt: now,
  };
  GLOBAL_EMERGENCY_NOTICES.unshift(record);

  // 감사 로그 기록
  const auditLog: AuditLogItem = {
    id: `AUDIT-NOTC-${Date.now()}`,
    action: "UPDATE_POLICY" as any,
    entity: "system_policies" as any,
    entityId: noticeId,
    actor: "Admin-ControlTower",
    previousData: null,
    newData: record,
    timestamp: now,
  };
  GLOBAL_DASHBOARD_AUDIT.unshift(auditLog);

  console.log(`[audit_logs] 긴급 공지 발행 완료: ${record.titleKr} (${record.targetScope})`);

  return {
    success: true,
    data: { noticeId, publishedAt: now },
    message: "승객 웹에 한국어/중국어 동시 표기 긴급 팝업 공지가 즉각 발행되었습니다.",
  };
}

// 명세서 호환용 별칭 Export
export const getDashboardOverviewData = getDashboardOverviewDataAction;
export const getControlTowerData = getControlTowerDataAction;
export const publishEmergencyNotice = publishEmergencyNoticeAction;
