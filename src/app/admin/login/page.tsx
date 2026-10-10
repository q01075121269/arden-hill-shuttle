"use client";

import React, { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Building,
  KeyRound,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loginAdminAction } from "@/app/actions/auth";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin";
  const errorParam = searchParams.get("error");

  const [loginId, setLoginId] = useState("admin_dev");
  const [password, setPassword] = useState("admin7788!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === "unauthorized" ? "관리자 권한이 있는 계정으로 로그인해 주세요." : ""
  );
  const [isPending, startTransition] = useTransition();

  // 4인 관리자 빠른 입력 프리셋
  const adminPresets = [
    { label: "1. 개발자 (시스템 총괄)", id: "admin_dev", pw: "admin7788!", role: "Super Admin" },
    { label: "2. 관리과장 (총괄 관리)", id: "admin_mgr", pw: "arden2026!", role: "General Manager" },
    { label: "3. 보좌관 1 (운행·예약)", id: "admin_asst1", pw: "asst1111!", role: "Assistant 1" },
    { label: "4. 보좌관 2 (수납·현장)", id: "admin_asst2", pw: "asst2222!", role: "Assistant 2" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    startTransition(async () => {
      const res = await loginAdminAction(loginId, password, rememberMe);
      if (res.success) {
        router.push(returnUrl);
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-[#151D2A] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* 헤더 */}
      <div className="space-y-2 text-center">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-emerald-600 text-white items-center justify-center font-black shadow-lg shadow-emerald-600/20">
          <Building className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            아덴힐 스마트 셔틀
          </h1>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            ADMIN BACKOFFICE · 4인 통합 관제탑
          </p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          보안 인가된 관리자 계정으로 로그인해 주세요.
        </p>
      </div>

      {/* 에러 메시지 배너 */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 아이디/연락처 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>관리자 아이디 또는 휴대폰 번호</span>
          </label>
          <input
            type="text"
            required
            placeholder="예: admin_dev 또는 010-1111-2222"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* 비밀번호 */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-slate-400" />
            <span>비밀번호</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 자동 로그인 (Remember Me) 체크박스 */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded-md text-emerald-600 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 accent-emerald-600"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              자동 로그인 (30일간 로그인 상태 유지)
            </span>
          </label>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 squishy-btn shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          {isPending ? (
            <span>관제탑 인증 중...</span>
          ) : (
            <>
              <span>관제탑 시스템 접속</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* 4인 관리자 빠른 계정 선택 프리셋 (현장 편의용) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            <span>4인 관리자 계정 빠른 입력 (클릭 시 자동 채우기)</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {adminPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setLoginId(preset.id);
                setPassword(preset.pw);
              }}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-left hover:border-emerald-500 transition-colors squishy-btn"
            >
              <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 truncate">
                {preset.label}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                ID: {preset.id}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] flex flex-col justify-between p-4 sm:p-8">
      {/* 상단 테마 토글 */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto">
        <span className="text-xs font-bold text-slate-400">제주 아덴힐 리조트 관제실</span>
        <ThemeToggle />
      </div>

      {/* 중앙 폼 */}
      <div className="flex items-center justify-center py-6">
        <Suspense fallback={<div className="text-xs text-slate-400">불러오는 중...</div>}>
          <AdminLoginForm />
        </Suspense>
      </div>

      {/* 푸터 */}
      <div className="text-center text-[11px] text-slate-400 font-mono">
        ARDEN HILL RESORT SHUTTLE SECURITY CONTROLLER © 2026
      </div>
    </div>
  );
}
