"use client";

import React, { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  X,
  Send,
  AlertTriangle,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Language } from "@/types";
import { publishEmergencyNoticeAction } from "@/app/actions/admin-overview";

interface NoticePublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export function NoticePublisherModal({
  isOpen,
  onClose,
  lang,
}: NoticePublisherModalProps) {
  const isKr = lang === "KR";
  const [isPending, startTransition] = useTransition();

  const [titleKr, setTitleKr] = useState("[긴급] 기상 악화(강풍/폭설)에 따른 셔틀 운행 구간 서행 안내");
  const [titleCn, setTitleCn] = useState("[紧急通知] 因恶劣天气(强风/降雪)班车减速慢行通知");
  const [contentKr, setContentKr] = useState(
    "현재 산간도로 결빙 및 강풍으로 인해 전 회차 10~15분 가량 서행 운행 중입니다. 승객 여러분의 안전을 위해 이동 시간에 여유를 두고 탑승해 주시기 바랍니다."
  );
  const [contentCn, setContentCn] = useState(
    "目前因山区道路结冰和强风天气，全班次车辆减速慢行约10~15分钟。为了各位乘客的安全，请预留充足出行时间。"
  );
  const [targetScope, setTargetScope] = useState<"all" | "today_passengers">("all");
  const [isEmergency, setIsEmergency] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await publishEmergencyNoticeAction({
        titleKr,
        titleCn,
        contentKr,
        contentCn,
        targetScope,
        isEmergency,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message || "공지가 성공적으로 발행되었습니다." });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: "error", text: res.error || "발행 실패" });
      }
    });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden cursor-default"
      >
        {/* 상단 헤더 바 */}
        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">
                  {isKr ? "한/중 동시 긴급 팝업 발행 센터" : "中韩双语紧急弹窗发布中心"}
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                  EMERGENCY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isKr
                  ? "승객용 웹 화면 접속 시 한국어 상단, 중국어 하단으로 분리된 팝업이 즉시 표출됩니다."
                  : "将在乘客端访问时以韩文在上、中文在下的双语弹窗形式即时弹出。"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 squishy-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* 1. 노출 대상 선택 */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-500" />
              <span>{isKr ? "노출 대상 범위" : "推送目标范围"}</span>
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTargetScope("all")}
                className={`p-3 rounded-2xl border font-bold transition-all text-left flex items-center justify-between ${
                  targetScope === "all"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div>
                  <div className="font-black">{isKr ? "전체 승객 웹 (권장)" : "全体乘客端 (推荐)"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isKr ? "승객 웹에 접속하는 모든 방문자" : "所有访问乘客端的用户"}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTargetScope("today_passengers")}
                className={`p-3 rounded-2xl border font-bold transition-all text-left flex items-center justify-between ${
                  targetScope === "today_passengers"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div>
                  <div className="font-black">{isKr ? "오늘 예약자만" : "仅今日已预约用户"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isKr ? "오늘 탑승 예약 내역을 가진 고객" : "今日有乘车预订的乘客"}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. 한국어(KR) 입력 영역 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-[10px]">
                KR
              </span>
              <span>한국어 공지 내용</span>
            </div>
            <div>
              <input
                type="text"
                required
                value={titleKr}
                onChange={(e) => setTitleKr(e.target.value)}
                placeholder="한국어 팝업 제목을 입력해주세요"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <textarea
                rows={3}
                required
                value={contentKr}
                onChange={(e) => setContentKr(e.target.value)}
                placeholder="한국어 공지 본문을 입력해주세요"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
              />
            </div>
          </div>

          {/* 3. 중국어(CN) 입력 영역 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-[10px]">
                CN
              </span>
              <span>중국어(简体中文) 공지 내용</span>
            </div>
            <div>
              <input
                type="text"
                required
                value={titleCn}
                onChange={(e) => setTitleCn(e.target.value)}
                placeholder="请输入中文弹窗标题"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <textarea
                rows={3}
                required
                value={contentCn}
                onChange={(e) => setContentCn(e.target.value)}
                placeholder="请输入中文公告正文"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
              />
            </div>
          </div>

          {/* 모달 하단 액션 */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              {isKr ? "취소" : "取消"}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-600/25 flex items-center gap-2 squishy-btn"
            >
              <Send className="h-4 w-4" />
              <span>{isKr ? "즉시 발송 및 승객 팝업 표출" : "立即发布并推送弹窗"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
