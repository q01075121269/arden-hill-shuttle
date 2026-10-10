"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Users,
  Car,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Reservation } from "@/types";

interface BoardingImminentAlertModalProps {
  isOpen: boolean;
  reservation: Reservation | null;
  remainingMinutes?: number;
  onConfirmBoarding: () => void;
  onCancelBoarding: (id: string) => void;
  onClose: () => void;
}

/**
 * Web Audio API를 활용한 청아한 셔틀 탑승 안내 차임벨 사운드 합성기
 * (외부 mp3 파일 로딩 지연/실패 없이 모든 기기에서 100% 즉시 재생)
 */
function playChimeSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // 3단계 알림 화음 (도-미-솔 벨소리: 523.25Hz -> 659.25Hz -> 783.99Hz -> 1046.5Hz)
    const tones = [
      { freq: 587.33, start: 0.0, dur: 0.25 }, // D5
      { freq: 739.99, start: 0.2, dur: 0.3 },  // F#5
      { freq: 880.0, start: 0.45, dur: 0.55 }, // A5
      { freq: 1174.66, start: 0.75, dur: 0.8 }, // D6
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.35, now + start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (e) {
    console.warn("[Audio] Web Audio chime could not play:", e);
  }
}

export function BoardingImminentAlertModal({
  isOpen,
  reservation,
  remainingMinutes = 5,
  onConfirmBoarding,
  onCancelBoarding,
  onClose,
}: BoardingImminentAlertModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 모달 오픈 시 사운드 재생 및 4초 간격 리마인드 차임벨
  useEffect(() => {
    if (isOpen) {
      if (!isMuted) {
        playChimeSound();
        soundIntervalRef.current = setInterval(() => {
          if (!isMuted) playChimeSound();
        }, 4500);
      }
    } else {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
    }

    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
    };
  }, [isOpen, isMuted]);

  if (!isOpen || !reservation || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-none animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm max-h-[92dvh] overflow-y-auto overscroll-contain bg-white dark:bg-[#151D2A] rounded-3xl p-5 shadow-2xl border-2 border-amber-500/80 dark:border-amber-500/60 space-y-4 my-auto animate-in zoom-in-95 duration-200 cursor-default ring-4 ring-amber-500/20"
      >
        {/* 상단 알림 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/30 animate-bounce shrink-0">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                  셔틀 출발 임박 알림
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                  출발 5분 전
                </span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                예약 승차 시간이 다 되어갑니다!
              </p>
            </div>
          </div>

          {/* 음소거 토글 버튼 */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white squishy-btn"
            title={isMuted ? "소리 켜기" : "소리 끄기"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-emerald-600 animate-pulse" />}
          </button>
        </div>

        {/* 핵심 알림 안내 카드 */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              탑승 예정 시각
            </span>
            <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
              {reservation.departureTime} (약 {remainingMinutes}분 후 출발)
            </span>
          </div>

          <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
            📢 현재 <strong>미승차 상태</strong>로 확인됩니다. 정시 출발을 위해 탑승 장소로 신속히 이동해 주시거나, 일정이 변경되셨다면 승차를 취소해 주세요.
          </p>
        </div>

        {/* 탑승 정보 카드 */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">탑승 구간:</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 break-keep">
                {reservation.pickupLocation} ➔ {reservation.dropoffLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              탑승 인원 / 배차 차량:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {reservation.passengerCount}명 · {reservation.vehicleNumber || "배차 확정"}
            </span>
          </div>
        </div>

        {/* 2대 선택지 버튼: [지금 바로 탑승합니다] vs [승차를 취소합니다] */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              onConfirmBoarding();
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 squishy-btn shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>지금 바로 탑승합니다 (탑승 이동 중)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onCancelBoarding(reservation.id);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 font-black text-xs flex items-center justify-center gap-1.5 squishy-btn transition-colors cursor-pointer"
          >
            <XCircle className="h-4 w-4 text-rose-600" />
            <span>승차를 취소합니다 (기사님께 취소 전달)</span>
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
          취소 시 배차가 회수되며, 다른 대기 입주민에게 우선 배정됩니다.
        </p>
      </div>
    </div>,
    document.body
  );
}
