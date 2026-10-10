export type Language = "KR" | "CN";

export type VehicleType = "carnival" | "county"; // 5인 이하 카니발, 6인 이상 카운티

export type PaymentStatus = "unpaid" | "paid";

export type BoardingStatus = "pending" | "boarding_completed" | "cancelled" | "no_show";

export interface Reservation {
  id: string;
  userId?: string;
  passengerName: string;
  phone: string;
  pickupLocation: string;
  dropoffLocation: string;
  departureDate: string;
  departureTime: string;
  passengerCount: number;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  fareAmount: number;
  paymentStatus: PaymentStatus;
  boardingStatus: BoardingStatus;
  is_active?: boolean;
  cancelledAt?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  titleKr: string;
  titleCn: string;
  contentKr: string;
  contentCn: string;
  targetScope: "all" | "target_date";
  targetDate?: string;
  isPinned: boolean;
  isEmergency?: boolean;
  createdAt: string;
}

export interface ShuttleStop {
  id: string;
  nameKr: string;
  nameCn: string;
  zone: string;
  etaMinutes: number;
  order: number;
}
