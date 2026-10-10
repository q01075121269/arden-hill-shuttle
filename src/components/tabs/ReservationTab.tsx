"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Car,
  CheckCircle2,
  Trash2,
  Edit3,
  ArrowRight,
  ArrowRightLeft,
  X,
  UserCheck,
} from "lucide-react";
import { Language, Reservation } from "@/types";
import {
  SHUTTLE_TIMETABLE,
  I18N,
} from "@/lib/constants";
import { BoardingImminentAlertModal } from "@/components/passenger/BoardingImminentAlertModal";
import {
  createReservationAction,
  updateReservationAction,
  cancelReservationAction,
} from "@/app/actions/reservation";

interface ReservationTabProps {
  lang: Language;
  reservations: Reservation[];
  onReservationAdded: (newRes: Reservation) => void;
  onReservationUpdated?: (updatedRes: Reservation) => void;
  onReservationCancelled: (id: string) => void;
}

export function ReservationTab({
  lang,
  reservations,
  onReservationAdded,
  onReservationUpdated,
  onReservationCancelled,
}: ReservationTabProps) {
  const isKr = lang === "KR";
  const t = I18N[lang];
  const [isPending, startTransition] = useTransition();

  // 오늘 날짜 문자열 (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];

  // 시간표 탭 방향 선택: "outbound"(아덴힐 ➔ 공항) vs "inbound"(공항 ➔ 아덴힐)
  const [activeDirectionTab, setActiveDirectionTab] = useState<"outbound" | "inbound">("outbound");

  // ============================================================================
  // 회원 프로필 기본 정보 (자동 바인딩 데이터)
  // ============================================================================
  const defaultProfile = {
    name: isKr ? "홍길동" : "王伟",
    phone: "010-1234-5678",
  };

  // ============================================================================
  // 신규 예약 신청 모달(BottomSheet) 상태
  // ============================================================================
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [modalDirection, setModalDirection] = useState<"outbound" | "inbound">("outbound");
  const [modalDepartureDate, setModalDepartureDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [modalDepartureTime, setModalDepartureTime] = useState("08:10");
  const [passengerCount, setPassengerCount] = useState(2);
  const [passengerName, setPassengerName] = useState(defaultProfile.name);
  const [phone, setPhone] = useState(defaultProfile.phone);
  const [isProfileEditing, setIsProfileEditing] = useState(false);

  // 승차 / 하차 위치
  const [pickupLocation, setPickupLocation] = useState(isKr ? "102동 앞" : "102栋前");
  const [dropoffOption, setDropoffOption] = useState<"airport" | "emart" | "custom">("airport");
  const [dropoffCustomText, setDropoffCustomText] = useState(isKr ? "105동 앞" : "105栋前");

  // 왕복 연계 예약 옵션 및 상세 입력 상태
  const [isRoundTripChecked, setIsRoundTripChecked] = useState(false);
  const [returnTime, setReturnTime] = useState("16:20");
  const [returnPax, setReturnPax] = useState(2);
  const [returnPickup, setReturnPickup] = useState(isKr ? "제주국제공항 3층 5번 게이트" : "济州国际机场 3楼 5号门");
  const [returnDropoff, setReturnDropoff] = useState(isKr ? "102동 앞" : "102栋前");

  const [formError, setFormError] = useState<string | null>(null);

  // ============================================================================
  // 기존 예약 수정 모달 상태
  // ============================================================================
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPax, setEditPax] = useState(1);
  const [editPickup, setEditPickup] = useState("");
  const [editDropoff, setEditDropoff] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // ============================================================================
  // 5분 전 탑승 임박 알림 모달 상태
  // ============================================================================
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertTargetReservation, setAlertTargetReservation] = useState<Reservation | null>(null);
  const [alertRemainingMinutes, setAlertRemainingMinutes] = useState(5);
  const [hasAlertedIds, setHasAlertedIds] = useState<string[]>([]);

  // 모달 뒤로 가기 히스토리 동기화
  React.useEffect(() => {
    const handleModalPopState = (event: PopStateEvent) => {
      if (isBookingModalOpen) {
        setIsBookingModalOpen(false);
      }
      if (isEditModalOpen) {
        setIsEditModalOpen(false);
        setEditingReservation(null);
      }
    };
    window.addEventListener("popstate", handleModalPopState);
    return () => window.removeEventListener("popstate", handleModalPopState);
  }, [isBookingModalOpen, isEditModalOpen]);

  // 신규 예약 모달 오픈 (시간표 회차 터치 시)
  const handleOpenBookingModal = (direction: "outbound" | "inbound", time: string) => {
    setModalDirection(direction);
    setModalDepartureTime(time);
    if (direction === "outbound") {
      setPickupLocation(isKr ? "102동 앞" : "102栋前");
      setDropoffOption("airport");
      setReturnTime("16:20");
      setReturnPickup(isKr ? "제주국제공항 3층 5번 게이트" : "济州国际机场 3楼 5号门");
      setReturnDropoff(isKr ? "102동 앞" : "102栋前");
    } else {
      setPickupLocation(isKr ? "제주국제공항 3층 5번 게이트" : "济州国际机场 3楼 5号门");
      setDropoffOption("custom");
      setDropoffCustomText(isKr ? "102동 앞" : "102栋前");
      setReturnTime("12:30");
      setReturnPickup(isKr ? "102동 앞" : "102栋前");
      setReturnDropoff(isKr ? "제주국제공항 3층 5번 게이트" : "济州国际机场 3楼 5号门");
    }
    setFormError(null);
    window.history.pushState({ modal: "booking" }, "", window.location.href);
    setIsBookingModalOpen(true);
  };

  // 기존 예약 수정 모달 오픈
  const handleOpenEditModal = (res: Reservation) => {
    setEditingReservation(res);
    setEditDate(res.departureDate);
    setEditTime(res.departureTime);
    setEditPax(res.passengerCount);
    setEditPickup(res.pickupLocation);
    setEditDropoff(res.dropoffLocation);
    setEditError(null);
    window.history.pushState({ modal: "edit" }, "", window.location.href);
    setIsEditModalOpen(true);
  };

  // 차량 배정 정보 계산 (5인 이하 카니발, 6인 이상 카운티)
  const isCarnival = passengerCount <= 5;
  const vehicleTag = isCarnival ? t.reservationModal.carnivalTag : t.reservationModal.countyTag;
  const vehiclePlate = isCarnival
    ? isKr ? "제주 70가 1142 (리무진)" : "济州 70嘎 1142 (商务车)"
    : isKr ? "제주 72바 5501 (카운티)" : "济州 72巴 5501 (考斯特)";

  // 최종 하차 위치 문자열 계산
  const computedDropoffLocation =
    modalDirection === "outbound"
      ? dropoffOption === "emart"
        ? isKr ? "이마트 신제주점 경유 하차" : "经停新济州易买得下车"
        : isKr ? "제주국제공항 3층 5번 게이트" : "济州国际机场 3楼 5号门"
      : dropoffCustomText.trim() || (isKr ? "아덴힐 102동 앞" : "雅顿山 102栋前");

  // 예약 신청 제출 처리 (단건 또는 왕복 2건)
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!passengerName.trim()) {
      setFormError(isKr ? "예약자 성명을 입력해 주세요." : "请输入预约人姓名。");
      return;
    }
    if (!phone.trim()) {
      setFormError(isKr ? "연락처를 입력해 주세요." : "请输入联络电话。");
      return;
    }
    if (!pickupLocation.trim()) {
      setFormError(isKr ? "승차 위치를 입력해 주세요." : "请输入上车地点。");
      return;
    }

    startTransition(async () => {
      // 1. 편도 또는 가는 편 예약 생성
      const res1 = await createReservationAction({
        passengerName: passengerName.trim(),
        phone: phone.trim(),
        pickupLocation: pickupLocation.trim(),
        dropoffLocation: computedDropoffLocation,
        departureDate: modalDepartureDate,
        departureTime: modalDepartureTime,
        passengerCount,
      });

      if (!res1.success) {
        setFormError(res1.error);
        return;
      }
      onReservationAdded(res1.data);

      // 2. 왕복 예약 선택 시 반대편 예약도 독립된 폼 데이터로 생성
      if (isRoundTripChecked) {
        const res2 = await createReservationAction({
          passengerName: passengerName.trim(),
          phone: phone.trim(),
          pickupLocation: returnPickup.trim(),
          dropoffLocation: returnDropoff.trim(),
          departureDate: modalDepartureDate,
          departureTime: returnTime,
          passengerCount: returnPax,
        });

        if (res2.success) {
          onReservationAdded(res2.data);
        }
      }

      setIsBookingModalOpen(false);
      setIsRoundTripChecked(false);
      alert(
        isRoundTripChecked
          ? isKr ? "가는 편 및 돌아오는 편 왕복 2건의 예약이 확정되었습니다." : "去程及返程往返2单预约均已成功确认。"
          : isKr ? "셔틀 예약이 성공적으로 접수되었습니다." : "班车预约已成功完成。"
      );
    });
  };

  // 기존 예약 수정 제출 처리
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;
    setEditError(null);

    if (!editPickup.trim()) {
      setEditError(isKr ? "승차 위치를 입력해 주세요." : "请输入上车地点。");
      return;
    }
    if (!editDropoff.trim()) {
      setEditError(isKr ? "하차 위치를 입력해 주세요." : "请输入下车地点。");
      return;
    }

    startTransition(async () => {
      const result = await updateReservationAction({
        id: editingReservation.id,
        passengerName: editingReservation.passengerName,
        phone: editingReservation.phone,
        pickupLocation: editPickup.trim(),
        dropoffLocation: editDropoff.trim(),
        departureDate: editDate,
        departureTime: editTime,
        passengerCount: editPax,
      });

      if (result.success) {
        if (onReservationUpdated) {
          onReservationUpdated(result.data);
        }
        setIsEditModalOpen(false);
        setEditingReservation(null);
        alert(isKr ? "예약 정보가 성공적으로 변경되었습니다." : "预约信息已成功修改。");
      } else {
        setEditError(result.error);
      }
    });
  };

  // 예약 취소 핸들러 (컨펌 모달 및 Server Action 연동)
  const handleCancelReservation = (id: string) => {
    const confirmPrompt = isKr
      ? "정말 예약을 취소하시겠습니까?\n취소 시 배차가 회수되며, 복구하려면 다시 예약하셔야 합니다."
      : "确定要取消此预约吗？\n取消后排班将被回收，如需恢复需重新预约。";
    if (!confirm(confirmPrompt)) return;

    startTransition(async () => {
      const result = await cancelReservationAction(id);
      if (result.success) {
        onReservationCancelled(id);
        alert(isKr ? "예약이 안전하게 취소 처리되었습니다." : "预约已成功取消。");
      } else {
        alert(result.error);
      }
    });
  };

  // 진행 중인 활성 예약(Pending) 조회
  const activeReservation = reservations.find(
    (r) => r.boardingStatus === "pending"
  );

  // 예약 취소/수정 가능 여부 (이용일 전날 22:00 이전인지 체크)
  const isEditable = (res: Reservation) => {
    try {
      const now = new Date();
      const depDate = new Date(`${res.departureDate}T00:00:00`);
      const deadline = new Date(depDate);
      deadline.setDate(deadline.getDate() - 1);
      deadline.setHours(22, 0, 0, 0);
      return now < deadline;
    } catch {
      return true;
    }
  };

  // 5분 전 실시간 탑승 감지 타이머 (30초 주기로 남은 시간 자동 체크)
  useEffect(() => {
    const check5Minutes = () => {
      if (!activeReservation) return;
      if (hasAlertedIds.includes(activeReservation.id)) return;

      try {
        const now = new Date();
        const [depHours, depMins] = activeReservation.departureTime.split(":").map(Number);
        const depDate = new Date(`${activeReservation.departureDate}T00:00:00`);
        depDate.setHours(depHours, depMins, 0, 0);

        const diffMinutes = Math.round((depDate.getTime() - now.getTime()) / (1000 * 60));

        // 출발 0분 ~ 5분 전 구간에 도달한 경우 자동 알람 발동
        if (diffMinutes <= 5 && diffMinutes >= -5) {
          setAlertRemainingMinutes(Math.max(1, diffMinutes));
          setAlertTargetReservation(activeReservation);
          setIsAlertModalOpen(true);
          setHasAlertedIds((prev) => [...prev, activeReservation.id]);
        }
      } catch {
        // 날짜 파싱 예외 무시
      }
    };

    check5Minutes();
    const interval = setInterval(check5Minutes, 30000);
    return () => clearInterval(interval);
  }, [activeReservation, hasAlertedIds]);

  // 탑승 확정 핸들러
  const handleConfirmBoarding = () => {
    alert(
      isKr
        ? "✅ 탑승 상태가 확정되었습니다! 기사님께 탑승 이동 중임을 알렸습니다. 안전하게 승차해 주세요."
        : "✅ 乘车状态已确认！已通知司机正在前往乘车点，请注意安全乘车。"
    );
  };

  return (
    <div className="space-y-6">
      {/* 
        ========================================================================
        1. 기존 예약 알림 배너 (이미 접수된 예약이 있을 경우 최상단 고정 노출)
        ========================================================================
      */}
      {activeReservation && (
        <div className="w-full rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5 break-keep animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  {t.activeReservationCard.pinnedTitle}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums mt-0.5">
                  {activeReservation.departureDate} {activeReservation.departureTime} ({activeReservation.passengerCount}{isKr ? "명" : "人"})
                </h4>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 shrink-0">
              {t.activeReservationCard.statusPending}
            </span>
          </div>

          {/* 운행 구간 및 차량 */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 space-y-1 text-xs">
            <div className="flex items-start gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">{t.activeReservationCard.routeLabel}:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 break-keep">
                {activeReservation.pickupLocation} ➔ {activeReservation.dropoffLocation}
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">{t.activeReservationCard.paxLabel}:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {activeReservation.passengerCount}{isKr ? "명" : "人"} · {activeReservation.vehicleNumber || (isKr ? "배차 확정" : "排班已确认")}
              </span>
            </div>
          </div>

          {/* 22시 마감 안내 및 2분할 버튼 제어 */}
          {isEditable(activeReservation) ? (
            <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal block leading-tight">
                {t.activeReservationCard.deadlineNotice}
              </span>
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(activeReservation)}
                  className="min-h-[48px] w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700 squishy-btn flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <span className="whitespace-nowrap">{t.activeReservationCard.modifyBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelReservation(activeReservation.id)}
                  className="min-h-[48px] w-full px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 text-xs sm:text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 squishy-btn flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="whitespace-nowrap">{t.activeReservationCard.cancelBtn}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 
        ========================================================================
        2. 양방향 정규 운행 시간표 뷰 (도착 시간 타임라인 전면 표출)
        ========================================================================
      */}
      <div className="w-full rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4 break-keep">
        {/* 상단 타이틀 */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.timetable.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            {t.timetable.subtitle}
          </p>
        </div>

        {/* 방향 전환 세그먼트 컨트롤 (2분할 버튼) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/40 dark:border-slate-700/50 w-full">
          <button
            type="button"
            onClick={() => setActiveDirectionTab("outbound")}
            className={`min-h-[44px] py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all squishy-btn flex items-center justify-center gap-1.5 ${
              activeDirectionTab === "outbound"
                ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">{isKr ? "아덴힐 ➔ 공항" : "度假村 ➔ 机场"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDirectionTab("inbound")}
            className={`min-h-[44px] py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all squishy-btn flex items-center justify-center gap-1.5 ${
              activeDirectionTab === "inbound"
                ? "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">{isKr ? "공항 ➔ 아덴힐" : "机场 ➔ 度假村"}</span>
          </button>
        </div>

        {/* 5회차 시간표 카드 목록 (3단계 타임라인 전면 표출) */}
        <div className="space-y-3 w-full">
          {(activeDirectionTab === "outbound"
            ? SHUTTLE_TIMETABLE.outbound
            : SHUTTLE_TIMETABLE.inbound
          ).map((item) => {
            const isOutbound = activeDirectionTab === "outbound";
            const startLabel = isOutbound ? (isKr ? "아덴힐" : "雅顿山") : (isKr ? "제주공항" : "济州机场");
            const emartLabel = isKr ? "이마트" : "易买得";
            const destLabel = isOutbound ? (isKr ? "제주공항" : "济州机场") : (isKr ? "아덴힐" : "雅顿山");

            return (
              <div
                key={item.round}
                onClick={() => handleOpenBookingModal(activeDirectionTab, item.time)}
                className="group w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer squishy-btn space-y-3"
              >
                {/* 상단: 회차 뱃지 + 예약 가능 태그 */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {isKr ? item.roundKr : item.roundCn}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {t.timetable.openBadge}
                  </span>
                </div>

                {/* 3단계 타임라인: 출발(시간) ➔ 이마트(도착) ➔ 최종 도착지(도착) */}
                <div className="grid grid-cols-3 gap-1 py-2 text-center items-center bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                  <div className="space-y-0.5 px-1">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {isKr ? "출발" : "发车"}
                    </div>
                    <div className="text-base sm:text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                      {item.time}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate">
                      {startLabel}
                    </div>
                  </div>

                  <div className="space-y-0.5 px-1 border-x border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {isKr ? "경유 (도착)" : "经由 (到达)"}
                    </div>
                    <div className="text-base sm:text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                      {item.emartTime}
                    </div>
                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 truncate">
                      {emartLabel}
                    </div>
                  </div>

                  <div className="space-y-0.5 px-1">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {isKr ? "최종 도착" : "终点到达"}
                    </div>
                    <div className="text-base sm:text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                      {item.destTime}
                    </div>
                    <div className="text-[11px] font-bold text-sky-700 dark:text-sky-400 truncate">
                      {destLabel}
                    </div>
                  </div>
                </div>

                {/* 하단 원터치 예약 트리거 버튼 */}
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span>{t.timetable.quickBookBtn}</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
          {t.timetable.guideNotice}
        </p>
      </div>

      {/* 
        ========================================================================
        3. 신규 예약 신청 모달 (BottomSheet / Modal)
        ========================================================================
      */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {t.reservationModal.modalTitle}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {t.reservationModal.modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 squishy-btn"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 모달 폼 본문 */}
            <form onSubmit={handleBookingSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200/60 dark:border-rose-800/60">
                  {formError}
                </div>
              )}

              {/* 1) 회원 인적사항 자동 바인딩 영역 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {t.reservationModal.profileAutoFilled}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsProfileEditing(!isProfileEditing)}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline"
                  >
                    {isProfileEditing ? (isKr ? "닫기" : "收起") : t.activeReservationCard.modifyBtn}
                  </button>
                </div>

                {isProfileEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {t.reservationModal.passengerNameLabel}
                      </label>
                      <input
                        type="text"
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {t.reservationModal.passengerPhoneLabel}
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full mt-0.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{passengerName}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{phone}</span>
                  </div>
                )}
              </div>

              {/* 2) 탑승 날짜 및 운행 방향 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 캘린더 날짜 피커 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.reservationModal.datePickerLabel}</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={modalDepartureDate}
                    onChange={(e) => setModalDepartureDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* 운행 방향 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.reservationModal.directionLabel}</span>
                  </label>
                  <select
                    value={modalDirection}
                    onChange={(e) => {
                      const dir = e.target.value as "outbound" | "inbound";
                      setModalDirection(dir);
                      if (dir === "outbound") {
                        setPickupLocation(isKr ? "102동 앞" : "102栋前");
                        setDropoffOption("airport");
                        setModalDepartureTime("08:10");
                      } else {
                        setPickupLocation(isKr ? "제주국제공항 3층 5번 게이트" : "济州国际机场 3楼 5号门");
                        setDropoffOption("custom");
                        setDropoffCustomText(isKr ? "102동 앞" : "102栋前");
                        setModalDepartureTime("09:30");
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  >
                    <option value="outbound">{t.reservationModal.directionOutbound}</option>
                    <option value="inbound">{t.reservationModal.directionInbound}</option>
                  </select>
                </div>
              </div>

              {/* 3) 출발 시간 (회차) & 탑승 인원수 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.reservationModal.scheduleLabel}</span>
                  </label>
                  <select
                    value={modalDepartureTime}
                    onChange={(e) => setModalDepartureTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  >
                    {(modalDirection === "outbound"
                      ? SHUTTLE_TIMETABLE.outbound
                      : SHUTTLE_TIMETABLE.inbound
                    ).map((sch) => (
                      <option key={sch.round} value={sch.time}>
                        {sch.time} ({isKr ? sch.roundKr : sch.roundCn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 탑승 인원수 카운터 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.reservationModal.paxLabel}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={passengerCount <= 1}
                      onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                      className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-black text-base text-slate-900 dark:text-white flex items-center justify-center squishy-btn disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-black text-base text-slate-900 dark:text-slate-100">
                      {passengerCount}{isKr ? "명" : "人"}
                    </span>
                    <button
                      type="button"
                      disabled={passengerCount >= 25}
                      onClick={() => setPassengerCount(Math.min(25, passengerCount + 1))}
                      className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-black text-base text-slate-900 dark:text-white flex items-center justify-center squishy-btn disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 배차 차종 자동 안내 뱃지 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg font-black border ${
                      isCarnival
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200/50 dark:border-sky-800/50"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50"
                    }`}
                  >
                    {vehicleTag}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">({vehiclePlate})</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {isCarnival
                    ? t.reservationModal.vehicleNoteCarnival
                    : t.reservationModal.vehicleNoteCounty}
                </span>
              </div>

              {/* 4) 승차 위치 (자유 텍스트 입력) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.reservationModal.pickupLabel}</span>
                </label>
                <input
                  type="text"
                  required
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder={
                    modalDirection === "outbound"
                      ? t.reservationModal.pickupCustomPlaceholder
                      : t.reservationModal.pickupAirportStation
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* 5) 하차 위치 (버튼 그룹 또는 텍스트 입력) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.reservationModal.dropoffLabel}</span>
                </label>

                {modalDirection === "outbound" ? (
                  // 아덴힐 ➔ 공항 방면: [이마트 경유 하차] | [제주공항 3층 5번 게이트] 택 1
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDropoffOption("airport")}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all squishy-btn flex items-center justify-between ${
                        dropoffOption === "airport"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{t.reservationModal.dropoffOptionAirport}</span>
                      {dropoffOption === "airport" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDropoffOption("emart")}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all squishy-btn flex items-center justify-between ${
                        dropoffOption === "emart"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{t.reservationModal.dropoffOptionEmart}</span>
                      {dropoffOption === "emart" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  </div>
                ) : (
                  // 공항 ➔ 아덴힐 방면: 아덴힐 내 희망 하차 위치 직접 텍스트 입력
                  <input
                    type="text"
                    required
                    value={dropoffCustomText}
                    onChange={(e) => setDropoffCustomText(e.target.value)}
                    placeholder={t.reservationModal.dropoffCustomPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                )}
              </div>

              {/* 6) 왕복 함께 예약 상세 폼 섹션 */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={isRoundTripChecked}
                    onChange={(e) => setIsRoundTripChecked(e.target.checked)}
                    className="h-4 w-4 rounded-md text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{t.reservationModal.roundTripCheckbox}</span>
                </label>

                {isRoundTripChecked && (
                  <div className="pt-3 border-t border-emerald-200/50 dark:border-emerald-800/30 space-y-3 animate-in fade-in">
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                      {t.reservationModal.roundTripSectionTitle}
                    </span>

                    {/* 복귀편 회차 및 복귀편 인원 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {t.reservationModal.roundTripScheduleLabel}
                        </label>
                        <select
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                        >
                          {(modalDirection === "outbound"
                            ? SHUTTLE_TIMETABLE.inbound
                            : SHUTTLE_TIMETABLE.outbound
                          ).map((sch) => (
                            <option key={sch.round} value={sch.time}>
                              {sch.time} ({isKr ? sch.roundKr : sch.roundCn})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {t.reservationModal.roundTripPaxLabel}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            disabled={returnPax <= 1}
                            onClick={() => setReturnPax(Math.max(1, returnPax - 1))}
                            className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-xs text-slate-900 dark:text-white flex items-center justify-center squishy-btn disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center font-black text-xs text-slate-900 dark:text-slate-100">
                            {returnPax}{isKr ? "명" : "人"}
                          </span>
                          <button
                            type="button"
                            disabled={returnPax >= 25}
                            onClick={() => setReturnPax(Math.min(25, returnPax + 1))}
                            className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-xs text-slate-900 dark:text-white flex items-center justify-center squishy-btn disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 복귀편 승차 및 하차 위치 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {t.reservationModal.roundTripPickupLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={returnPickup}
                          onChange={(e) => setReturnPickup(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {t.reservationModal.roundTripDropoffLabel}
                        </label>
                        <input
                          type="text"
                          required
                          value={returnDropoff}
                          onChange={(e) => setReturnDropoff(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 공항 정차 시간 경고문 */}
              <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium leading-relaxed">
                {t.reservationModal.airportWarning}
              </p>

              {/* 제출 버튼 (2분할 대칭 풀위드) */}
              <div className="pt-3 grid grid-cols-2 gap-2 w-full border-t border-slate-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="min-h-[48px] w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm squishy-btn flex items-center justify-center"
                >
                  {t.reservationModal.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-[48px] w-full px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm squishy-btn shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isPending ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                  <span className="truncate">
                    {isRoundTripChecked
                      ? t.reservationModal.submitRoundTripBtn
                      : t.reservationModal.submitBtn}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        4. 예약 정보 직접 수정 모달 (BottomSheet / Modal)
        ========================================================================
      */}
      {isEditModalOpen && editingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {t.activeReservationCard.modifyModalTitle}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {t.activeReservationCard.modifyModalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 squishy-btn"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 수정 폼 */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {editError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200/60 dark:border-rose-800/60">
                  {editError}
                </div>
              )}

              {/* 탑승 날짜 & 시간 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                    {t.reservationModal.datePickerLabel}
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                    {t.reservationModal.scheduleLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="08:10, 10:30 등"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* 탑승 인원 수 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  {t.reservationModal.paxLabel}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={editPax <= 1}
                    onClick={() => setEditPax(Math.max(1, editPax - 1))}
                    className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-black text-base text-slate-900 dark:text-white flex items-center justify-center squishy-btn disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-black text-base text-slate-900 dark:text-slate-100">
                    {editPax}{isKr ? "명" : "人"}
                  </span>
                  <button
                    type="button"
                    disabled={editPax >= 25}
                    onClick={() => setEditPax(Math.min(25, editPax + 1))}
                    className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-black text-base text-slate-900 dark:text-white flex items-center justify-center squishy-btn disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 승차 위치 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  {t.reservationModal.pickupLabel}
                </label>
                <input
                  type="text"
                  required
                  value={editPickup}
                  onChange={(e) => setEditPickup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* 하차 위치 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  {t.reservationModal.dropoffLabel}
                </label>
                <input
                  type="text"
                  required
                  value={editDropoff}
                  onChange={(e) => setEditDropoff(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* 모달 하단 버튼 (2분할 대칭 풀위드) */}
              <div className="pt-3 grid grid-cols-2 gap-2 w-full border-t border-slate-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="min-h-[48px] w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm squishy-btn flex items-center justify-center"
                >
                  {t.reservationModal.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-[48px] w-full px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm squishy-btn shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isPending ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                  <span>{t.activeReservationCard.saveChangesBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5분 전 탑승 임박 알람 모달 (Web Audio 사운드 및 탑승/취소 선택) */}
      <BoardingImminentAlertModal
        isOpen={isAlertModalOpen}
        reservation={alertTargetReservation}
        remainingMinutes={alertRemainingMinutes}
        onConfirmBoarding={handleConfirmBoarding}
        onCancelBoarding={(id) => handleCancelReservation(id)}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </div>
  );
}
