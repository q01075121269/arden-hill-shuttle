"use client";

import React, { useState, useEffect } from "react";
import {
  Navigation,
  Car,
  Bus,
  Clock,
  RefreshCw,
  Flag,
  MapPin,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Language } from "@/types";

interface ShuttleTrackingTabProps {
  lang: Language;
}

// 4단계 스테퍼 블록 정의
interface TrackerStep {
  id: number;
  labelKr: string;
  labelCn: string;
  statusTextKr: string;
  statusTextCn: string;
  subKr: string;
  subCn: string;
  icon: any;
  etaKr: string;
  etaCn: string;
}

const STEPPER_STAGES: TrackerStep[] = [
  {
    id: 0,
    labelKr: "출발 대기",
    labelCn: "等候发车",
    statusTextKr: "현재 리조트 승차장에서 탑승 대기 중입니다.",
    statusTextCn: "当前在度假村乘车点等候乘车中。",
    subKr: "커뮤니티 센터 & 클럽하우스",
    subCn: "社区中心与高尔夫会所",
    icon: Clock,
    etaKr: "출발 5분 전",
    etaCn: "发车前5分钟",
  },
  {
    id: 1,
    labelKr: "아덴힐 출발",
    labelCn: "雅顿山发车",
    statusTextKr: "현재 아덴힐 리조트를 출발하여 순환 운행 중입니다.",
    statusTextCn: "当前已从雅顿山出发，正在巡回运行中。",
    subKr: "101개 동 순환 정류장 경유",
    subCn: "途经度假村各楼栋站点",
    icon: Flag,
    etaKr: "운행 중",
    etaCn: "运行中",
  },
  {
    id: 2,
    labelKr: "이마트 도착",
    labelCn: "到达易买得",
    statusTextKr: "현재 이마트 신제주점에 도착했습니다.",
    statusTextCn: "当前已到达易买得新济州店。",
    subKr: "신제주 이마트 셔틀 정류장",
    subCn: "新济州易买得班车停靠点",
    icon: MapPin,
    etaKr: "약 20분 소요",
    etaCn: "约需20分钟",
  },
  {
    id: 3,
    labelKr: "공항 도착",
    labelCn: "到达机场",
    statusTextKr: "현재 제주국제공항 3층 5번 게이트에 도착했습니다.",
    statusTextCn: "当前已到达济州国际机场3楼5号门。",
    subKr: "제주공항 3층 5번 게이트 앞",
    subCn: "济州机场3楼5号门前",
    icon: Navigation,
    etaKr: "도착 완료",
    etaCn: "已到达目的地",
  },
];

interface ActiveVehicleState {
  id: string;
  nameKr: string;
  nameCn: string;
  plateKr: string;
  plateCn: string;
  type: "carnival" | "county";
  currentStageId: number;
  driverKr: string;
  driverCn: string;
  speedKm: number;
}

export function ShuttleTrackingTab({ lang }: ShuttleTrackingTabProps) {
  const isKr = lang === "KR";

  // 활성 운행 차량 2대
  const [vehicles, setVehicles] = useState<ActiveVehicleState[]>([
    {
      id: "VH-1",
      nameKr: "카니발 1호차 (리무진)",
      nameCn: "嘉华 1号车 (商务车)",
      plateKr: "제주 70가 1142",
      plateCn: "济州 70嘎 1142",
      type: "carnival",
      currentStageId: 2, // 이마트 도착 상태
      driverKr: "김철수 기사님",
      driverCn: "金司机",
      speedKm: 42,
    },
    {
      id: "VH-2",
      nameKr: "카운티 1호차 (29인승)",
      nameCn: "考斯特 1号车 (29座)",
      plateKr: "제주 72바 5501",
      plateCn: "济州 72巴 5501",
      type: "county",
      currentStageId: 1, // 아덴힐 출발 상태
      driverKr: "박영진 기사님",
      driverCn: "朴司机",
      speedKm: 55,
    },
  ]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("VH-1");
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(
    isKr ? "방금 전 갱신" : "刚刚更新"
  );

  // 실시간 15초 주기 시뮬레이션
  useEffect(() => {
    const timer = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => ({
          ...v,
          currentStageId: (v.currentStageId + 1) % STEPPER_STAGES.length,
        }))
      );
      setLastRefreshedTime(
        new Date().toLocaleTimeString(isKr ? "ko-KR" : "zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 15000);

    return () => clearInterval(timer);
  }, [isKr]);

  const activeVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const currentStep = STEPPER_STAGES[activeVehicle.currentStageId];

  return (
    <div className="space-y-6">
      {/* 탭 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Navigation className="h-6 w-6 text-primary" />
            <span>{isKr ? "셔틀 실시간 위치 관제" : "班车实时位置动态"}</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {isKr
              ? "외부 지도 설치 없이 4단계 스테퍼 블록으로 현재 차량 위치를 실시간 안내합니다."
              : "无需加载地图，通过4阶段步进方块实时掌握当前班车所在位置。"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-primary font-black">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>{lastRefreshedTime}</span>
        </div>
      </div>

      {/* 차량 선택 대형 버튼 (2분할 대칭) */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {vehicles.map((v) => {
          const isSelected = selectedVehicleId === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedVehicleId(v.id)}
              className={`min-h-[56px] p-3 sm:p-4 rounded-3xl border text-left squishy-btn transition-all ${
                isSelected
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md"
                  : "bg-white dark:bg-[#1E222B] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? "bg-white/20 dark:bg-black/20 text-white dark:text-slate-900"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50"
                  }`}
                >
                  {v.type === "carnival" ? (
                    <Car className="h-4 w-4" />
                  ) : (
                    <Bus className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    isSelected
                      ? "bg-white/20 dark:bg-black/20 text-white dark:text-slate-900"
                      : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50"
                  }`}
                >
                  {isKr ? "운행 중" : "运行中"}
                </span>
              </div>
              <div className="font-bold text-sm sm:text-base leading-tight truncate">
                {isKr ? v.nameKr : v.nameCn}
              </div>
              <div
                className={`text-[11px] mt-0.5 font-medium truncate ${
                  isSelected ? "text-white/80 dark:text-slate-800/80" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {isKr ? v.plateKr : v.plateCn}
              </div>
            </button>
          );
        })}
      </div>

      {/* 
        [셔틀 위치 보기] 4단계 스테퍼 블록 UI (Map-less Tracker)
        [출발 대기] ➔ [아덴힐 출발] ➔ [이마트 도착] ➔ [공항 도착]
      */}
      <div className="rounded-3xl bg-white dark:bg-[#1E222B] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4 w-full break-keep">
        {/* 현재 위치 강조 전광판 */}
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {isKr ? "현재 운행 상태 안내" : "当前运行状态说明"}
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {isKr ? currentStep.statusTextKr : currentStep.statusTextCn}
              </div>
            </div>
          </div>
          <span className="text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shrink-0">
            {isKr ? currentStep.etaKr : currentStep.etaCn}
          </span>
        </div>

        {/* 4단계 스테퍼 블록 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {STEPPER_STAGES.map((step) => {
            const isCurrent = activeVehicle.currentStageId === step.id;
            const isPassed = activeVehicle.currentStageId > step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between min-h-[150px] relative overflow-hidden ${
                  isCurrent
                    ? "bg-emerald-50/90 dark:bg-emerald-950/50 text-slate-900 dark:text-slate-100 border-emerald-300 dark:border-emerald-700 shadow-md tracker-pulse"
                    : isPassed
                    ? "bg-slate-100/70 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-800"
                    : "bg-white dark:bg-[#151D2A] text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800/60"
                }`}
              >
                {/* 상단 순번 및 아이콘 */}
                <div className="flex items-center justify-between">
                  <span
                    className={`h-8 w-8 rounded-xl font-black text-xs flex items-center justify-center ${
                      isCurrent
                        ? "bg-emerald-600 text-white"
                        : isPassed
                        ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="h-4 w-4" /> : step.id + 1}
                  </span>

                  <Icon
                    className={`h-6 w-6 ${
                      isCurrent
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isPassed
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  />
                </div>

                {/* 스테이지 라벨 & 서브텍스트 */}
                <div className="my-2">
                  <div className="font-black text-lg sm:text-xl leading-tight text-slate-900 dark:text-slate-100">
                    {isKr ? step.labelKr : step.labelCn}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold mt-1 text-slate-500 dark:text-slate-400">
                    {isKr ? step.subKr : step.subCn}
                  </div>
                </div>

                {/* 하단 현재 위치 태그 */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-black">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isKr ? step.etaKr : step.etaCn}
                  </span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-black animate-pulse">
                      {isKr ? "현재 위치" : "当前位置"}
                    </span>
                  )}
                  {isPassed && (
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      {isKr ? "통과 완료" : "已通过"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 셔틀 운행 준수 안내 팁 */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            {isKr
              ? "차량 위치는 기사님의 전용 관제 앱과 실시간 연동되어 15초 주기로 자동 갱신됩니다. 도로 사정에 따라 2~3분 오차가 발생할 수 있으니 5분 전 대기를 권장합니다."
              : "车辆位置与司机关联系统保持15秒实时自动同步。由于路况原因可能出现2~3分钟轻微浮动，建议您提前5分钟到达站台等候。"}
          </span>
        </div>
      </div>
    </div>
  );
}
