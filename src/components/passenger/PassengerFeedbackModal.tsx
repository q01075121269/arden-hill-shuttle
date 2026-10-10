"use client";

import React, { useState } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Language } from "@/types";
import { submitSuggestionAction } from "@/app/actions/feedback";

interface PassengerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export function PassengerFeedbackModal({
  isOpen,
  onClose,
  lang,
}: PassengerFeedbackModalProps) {
  const isKr = lang === "KR";

  const [passengerName, setPassengerName] = useState("");
  const [dongNumber, setDongNumber] = useState("");
  const [contact, setContact] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!passengerName.trim()) {
      setErrorMsg(isKr ? "성함을 입력해주세요." : "请输入您的姓名。");
      return;
    }
    if (!dongNumber.trim()) {
      setErrorMsg(isKr ? "동호수를 입력해주세요 (예: 102동)." : "请输入楼栋号（如：102栋）。");
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      setErrorMsg(isKr ? "건의 내용을 5자 이상 입력해주세요." : "请输入至少5个字的建议内容。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitSuggestionAction({
        passengerName: passengerName.trim(),
        dongNumber: dongNumber.trim(),
        contact: contact.trim(),
        content: content.trim(),
      });

      if (res.success) {
        setSuccessMsg(
          isKr
            ? "관리사무소에 건의·애로사항이 정상 접수되었습니다. 신속히 검토하겠습니다."
            : "您的建议已成功提交给管理处，我们将尽快处理。"
        );
        setTimeout(() => {
          setContent("");
          setSuccessMsg(null);
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res.error || (isKr ? "접수 중 오류가 발생했습니다." : "提交时发生错误。"));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isKr ? "서버 통신 중 오류가 발생했습니다." : "网络通信错误。"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/30">
            <MessageSquarePlus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              {isKr ? "관리소에 건의·애로사항 남기기" : "向管理处提交意见与建议"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {isKr
                ? "셔틀 운행 및 정류장 관련 불편사항을 자유롭게 남겨주세요."
                : "请提出关于班车运营与站点的任何宝贵意见。"}
            </p>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isKr ? "입주민 성함 *" : "居民姓名 *"}
              </label>
              <input
                type="text"
                placeholder={isKr ? "홍길동" : "姓名"}
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isKr ? "거주 동호수 *" : "居住楼栋 *"}
              </label>
              <input
                type="text"
                placeholder={isKr ? "102동" : "如: 102栋"}
                value={dongNumber}
                onChange={(e) => setDongNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isKr ? "연락처 (선택)" : "联系电话 (选填)"}
            </label>
            <input
              type="tel"
              placeholder={isKr ? "010-0000-0000" : "联系电话"}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isKr ? "건의 및 애로사항 내용 *" : "意见与建议内容 *"}
            </label>
            <textarea
              rows={4}
              placeholder={
                isKr
                  ? "예: 08:10 1회차 버스에 카운티 대형 차량 배차 희망, 트렁크 골프백 적재 공간 관련 등..."
                  : "例如：建议08:10发车班次增加大巴车、行李舱高尔夫球包空间等..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          {/* 에러 / 성공 메시지 */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 등록 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm squishy-btn shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? (isKr ? "접수 중..." : "提交中...") : isKr ? "건의사항 등록하기" : "提交建议"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
