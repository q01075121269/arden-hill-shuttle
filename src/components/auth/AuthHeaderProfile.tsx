"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  User,
  KeyRound,
  LogIn,
  LogOut,
  X,
  Phone,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  getCurrentUserAction,
  loginWithPinAction,
  registerResidentAction,
  logoutUserAction,
  type AuthUser,
} from "@/app/actions/auth";
import { normalizePhone } from "@/lib/phone";

interface AuthHeaderProfileProps {
  onLoginSuccess?: (user: AuthUser) => void;
  onLogoutSuccess?: () => void;
  className?: string;
}

export function AuthHeaderProfile({
  onLoginSuccess,
  onLogoutSuccess,
  className = "",
}: AuthHeaderProfileProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register">("login");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 폼 입력 상태
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("112동");

  // 현재 사용자 세션 복원
  const refreshUser = async () => {
    const user = await getCurrentUserAction();
    setCurrentUser(user);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // 전화번호 자동 포맷팅 입력 핸들러
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, "").slice(0, 11);
    if (digits.length <= 3) {
      setPhone(digits);
    } else if (digits.length <= 7) {
      setPhone(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    } else {
      setPhone(`${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`);
    }
  };

  // 로그인 제출
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const res = await loginWithPinAction(phone, pin);
      if (res.success) {
        setCurrentUser(res.data);
        setSuccessMessage(res.message || "로그인되었습니다.");
        if (onLoginSuccess) onLoginSuccess(res.data);
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMessage("");
        }, 600);
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  // 회원가입 제출
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    startTransition(async () => {
      const res = await registerResidentAction({
        name,
        phone,
        pin,
        building,
      });
      if (res.success) {
        // ※ 가입 신청 완료 시 자동 로그인을 시키지 않고, 승인 대기 안내를 보여줌
        setSuccessMessage("✅ 회원가입 신청이 정상 접수되었습니다! 아덴힐 관리실(064-793-0000) 확인 및 승인 후 로그인하실 수 있습니다.");
        setName("");
        setPin("");
        setBuilding("");
        // 3초 후 로그인 탭으로 전환하여 대기 안내
        setTimeout(() => {
          setModalTab("login");
        }, 3000);
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  // 로그아웃
  const handleLogout = () => {
    startTransition(async () => {
      await logoutUserAction();
      setCurrentUser(null);
      setIsModalOpen(false);
      if (onLogoutSuccess) onLogoutSuccess();
      window.location.reload();
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* =========================================================================
          헤더 트리거 버튼 (로그인 전 vs 로그인 후)
      ========================================================================= */}
      {currentUser ? (
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-xs transition-colors squishy-btn"
        >
          <div className="h-5 w-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
            {currentUser.name.slice(0, 1)}
          </div>
          <span className="truncate max-w-[80px]">{currentUser.name} 님</span>
          {currentUser.status === "pending" && (
            <span className="px-1 py-0.2 rounded-xs bg-amber-500 text-white text-[8px] font-bold">
              대기
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setModalTab("login");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs squishy-btn shadow-xs transition-all"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>로그인</span>
        </button>
      )}

      {/* =========================================================================
          인증 모달 팝업 (모바일 화면 최상위 z-[9999] 배치 & 안전 스크롤)
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-none">
          <div className="w-full max-w-sm max-h-[92dvh] overflow-y-auto overscroll-contain bg-white dark:bg-[#151D2A] rounded-3xl p-5 shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-3.5 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* 상단 닫기 */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#151D2A] z-10">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                  {currentUser ? "내 계정 정보" : modalTab === "login" ? "입주민 간편 로그인" : "신규 회원가입 신청"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 상태 알림 배너 */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold leading-relaxed">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* (1) 로그인 상태일 때: 내 정보 카드 + 로그아웃 */}
            {currentUser ? (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-slate-900 dark:text-slate-100">
                      {currentUser.name} 님
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        currentUser.status === "approved"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {currentUser.status === "approved" ? "승인 완료" : "승인 대기 중"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-medium">
                    <div className="flex items-center justify-between">
                      <span>휴대폰 번호</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {currentUser.phone}
                      </span>
                    </div>
                    {currentUser.building && (
                      <div className="flex items-center justify-between">
                        <span>거주 동수</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {currentUser.building}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>사용자 구분</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {currentUser.roleName}
                      </span>
                    </div>
                  </div>
                </div>

                {currentUser.status === "pending" && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                    현재 관리자의 입주민 확인(승인) 대기 상태입니다. 승인 전에도 기본 조회 및 관제 이용이 가능합니다.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isPending}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 squishy-btn transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              /* (2) 미로그인 상태일 때: 간편 로그인 ↔ 회원가입 탭 */
              <div className="space-y-3.5">
                {/* 탭 세그먼트 */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab("login");
                      setErrorMessage("");
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all squishy-btn ${
                      modalTab === "login"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    간편 로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTab("register");
                      setErrorMessage("");
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all squishy-btn ${
                      modalTab === "register"
                        ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    회원가입 신청
                  </button>
                </div>

                {/* 탭 A: 간편 로그인 폼 */}
                {modalTab === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-3 text-xs font-bold">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400">휴대폰 번호</label>
                      <input
                        type="tel"
                        required
                        placeholder="010-0000-0000"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 dark:text-slate-400">
                        간편 비밀번호 (숫자 4자리 PIN)
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-lg font-bold tracking-widest text-center text-slate-900 dark:text-slate-100 mt-1 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 squishy-btn shadow-xs cursor-pointer transition-colors"
                    >
                      {isPending ? "로그인 중..." : "원터치 로그인"}
                    </button>

                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={() => setModalTab("register")}
                        className="text-[11px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold underline"
                      >
                        아직 회원이 아니신가요? 간편 가입 신청 ➔
                      </button>
                    </div>
                  </form>
                ) : (
                  /* 탭 B: 회원가입 신청 폼 */
                  <form onSubmit={handleRegister} className="space-y-3 text-xs font-bold">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      💡 <strong>입주민 인증 안내</strong>: 안전한 셔틀 운영을 위해 가입 신청 후 관리실에서 확인하여 승인해 드립니다. 승인 완료 후 로그인하실 수 있습니다.
                    </div>

                    <div>
                      <label className="text-slate-600 dark:text-slate-400">성명 (입주민 성함)</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 홍길동"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 dark:text-slate-400">휴대폰 번호 (로그인 ID 겸용)</label>
                      <input
                        type="tel"
                        required
                        placeholder="010-0000-0000"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-600 dark:text-slate-400">간편 비밀번호(4자리)</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          required
                          placeholder="숫자 4자리"
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-base font-black text-center tracking-widest text-slate-900 dark:text-slate-100 mt-0.5 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 dark:text-slate-400">거주 동수</label>
                        <input
                          type="text"
                          required
                          placeholder="예: 112동"
                          value={building}
                          onChange={(e) => setBuilding(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 squishy-btn shadow-xs cursor-pointer transition-colors mt-2"
                    >
                      {isPending ? "신청 접수 중..." : "회원가입 신청 접수하기"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
