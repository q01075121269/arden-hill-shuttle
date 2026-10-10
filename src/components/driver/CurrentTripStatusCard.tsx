"use client";

import React from "react";
import { Truck, Activity, Radio } from "lucide-react";

interface CurrentTripStatusCardProps {
  currentStatusBanner: string;
  currentRound: number;
  vehiclePlate: string;
  vehicleType: string;
}

export function CurrentTripStatusCard({
  currentStatusBanner,
  currentRound,
  vehiclePlate,
  vehicleType,
}: CurrentTripStatusCardProps) {
  return (
    <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
          <Radio className="h-5 w-5 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <span>실시간 관제 연동 진행 상태</span>
            <span>·</span>
            <span className="text-slate-600 dark:text-slate-300">
              {vehiclePlate} ({vehicleType === "carnival" ? "카니발" : "카운티"})
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate mt-0.5">
            {currentStatusBanner}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 text-xs font-black whitespace-nowrap">
          {currentRound}회차 운행
        </span>
      </div>
    </div>
  );
}
