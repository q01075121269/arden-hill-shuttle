"use client";

import React from "react";
import { Printer, Calendar, ShieldCheck, CheckSquare, Square } from "lucide-react";
import { Language } from "@/types";

interface DailyLogPrintViewProps {
  lang: Language;
}

export function DailyLogPrintView({ lang }: DailyLogPrintViewProps) {
  const isKr = lang === "KR";

  // 회차별 1~6회차 실시간 집계 시뮬레이션 데이터
  const TRIP_RECORDS = [
    {
      round: "1회차",
      departTime: "08:10",
      arriveEmart: "08:45",
      arriveAirport: "09:20",
      passengers: 8,
      driverName: "김철수",
      vehicleNumber: "제주 70가 1142",
      notes: "정시 출발 및 도착",
    },
    {
      round: "2회차",
      departTime: "10:30",
      arriveEmart: "11:05",
      arriveAirport: "11:40",
      passengers: 12,
      driverName: "박영진",
      vehicleNumber: "제주 72바 5501",
      notes: "공항 대기 승객 수송",
    },
    {
      round: "3회차",
      departTime: "12:30",
      arriveEmart: "13:05",
      arriveAirport: "13:40",
      passengers: 9,
      driverName: "김철수",
      vehicleNumber: "제주 70가 1142",
      notes: "정상 운행",
    },
    {
      round: "4회차",
      departTime: "15:00",
      arriveEmart: "15:35",
      arriveAirport: "16:10",
      passengers: 11,
      driverName: "박영진",
      vehicleNumber: "제주 72바 5501",
      notes: "정상 운행",
    },
    {
      round: "5회차",
      departTime: "18:20",
      arriveEmart: "18:55",
      arriveAirport: "19:30",
      passengers: 14,
      driverName: "김철수",
      vehicleNumber: "제주 70가 1142",
      notes: "야간 운행",
    },
    {
      round: "6회차",
      departTime: "20:00",
      arriveEmart: "20:30",
      arriveAirport: "21:00",
      passengers: 0,
      driverName: "박영진",
      vehicleNumber: "제주 72바 5501",
      notes: "운행 예정",
    },
  ];

  const totalPassengers = TRIP_RECORDS.reduce((sum, r) => sum + r.passengers, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 화면 상단 조작부 (인쇄 시 숨겨짐: no-print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border-2 border-border shadow-xs">
        <div>
          <h3 className="font-black text-lg text-foreground flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            <span>{isKr ? "아덴힐 셔틀버스 운행일지 종이 양식 출력" : "打印雅顿山班车纸质运行日志"}</span>
          </h3>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            {isKr
              ? "기사 5대 안전점검 결과와 회차별 수송 통계가 서식 규격에 자동 취합됩니다."
              : "自动汇总司机5大安全检查结果与各班次输送统计。"}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-sm squishy-btn shadow-md hover:opacity-95 flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          <span>{isKr ? "운행일지 즉시 인쇄 (A4 PDF)" : "立即打印日志 (A4 PDF)"}</span>
        </button>
      </div>

      {/* 
        실제 A4 종이 서식 컨테이너
        인쇄 시 배경을 흰색으로 고정하고 흑백 고대비 보더 적용
      */}
      <div className="printable-paper mx-auto w-full max-w-[210mm] bg-white text-black p-8 sm:p-10 border border-neutral-300 shadow-xl rounded-xl space-y-6">
        {/* 서식 제목 및 결재란 */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <div className="text-xs font-bold tracking-widest text-neutral-600 uppercase">
              Arden Hill Resort Smart Shuttle Operation Log
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              아덴힐 셔틀버스 일일 운행일지
            </h1>
            <div className="text-xs font-semibold text-neutral-700 mt-1">
              운행 일자: 2026년 10월 09일 (금) | 관리번호: AH-LOG-20261009
            </div>
          </div>

          {/* 확인 결재 서명란 테이블 */}
          <div className="border border-black text-center text-xs">
            <div className="grid grid-cols-2 bg-neutral-100 border-b border-black font-bold">
              <div className="px-4 py-1 border-r border-black">운전자 확인</div>
              <div className="px-4 py-1">관리자 승인</div>
            </div>
            <div className="grid grid-cols-2 h-14">
              <div className="border-r border-black flex items-center justify-center font-bold px-3">
                김철수 (인 / 서명)
              </div>
              <div className="flex items-center justify-center font-bold text-neutral-400 px-3">
                (인 / 서명)
              </div>
            </div>
          </div>
        </div>

        {/* 1. 차량 및 기본 운행 메타 정보 표 */}
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-800">
            [1] 운행 차량 및 구간 정보
          </div>
          <table className="w-full border-collapse border border-black text-xs text-center">
            <tbody>
              <tr className="bg-neutral-100 font-bold">
                <td className="border border-black p-2 w-1/6">운행 업체</td>
                <td className="border border-black p-2 w-2/6 font-normal">아덴힐 리조트 운영본부</td>
                <td className="border border-black p-2 w-1/6">운행 차량</td>
                <td className="border border-black p-2 w-2/6 font-normal">제주 70가 1142 (카니발) / 72바 5501 (카운티)</td>
              </tr>
              <tr className="bg-neutral-100 font-bold">
                <td className="border border-black p-2">운행 구간</td>
                <td className="border border-black p-2 font-normal">아덴힐 리조트 ➔ 이마트 ➔ 제주공항 (왕복)</td>
                <td className="border border-black p-2">총 탑승 인원</td>
                <td className="border border-black p-2 font-bold text-sm">총 {totalPassengers}명 (누적 집계)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. 회차별(1~6회차) 운행 내역 현황 표 */}
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-800">
            [2] 회차별 운행 내역 현황 (1회차 ~ 6회차)
          </div>
          <table className="w-full border-collapse border border-black text-xs text-center">
            <thead className="bg-neutral-200 font-bold border-b border-black">
              <tr>
                <th className="border border-black p-2 w-12">회차</th>
                <th className="border border-black p-2">아덴힐 출발</th>
                <th className="border border-black p-2">이마트 경유</th>
                <th className="border border-black p-2">공항 도착</th>
                <th className="border border-black p-2 w-16">탑승 인원</th>
                <th className="border border-black p-2 w-20">운전자</th>
                <th className="border border-black p-2">비고 / 특이사항</th>
              </tr>
            </thead>
            <tbody>
              {TRIP_RECORDS.map((r, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="border border-black p-2 font-bold">{r.round}</td>
                  <td className="border border-black p-2">{r.departTime}</td>
                  <td className="border border-black p-2">{r.arriveEmart}</td>
                  <td className="border border-black p-2">{r.arriveAirport}</td>
                  <td className="border border-black p-2 font-bold">{r.passengers}명</td>
                  <td className="border border-black p-2">{r.driverName}</td>
                  <td className="border border-black p-2 text-left px-2">{r.notes}</td>
                </tr>
              ))}
              <tr className="bg-neutral-100 font-bold">
                <td colSpan={4} className="border border-black p-2 text-right pr-4">
                  일일 총 수송 합계
                </td>
                <td className="border border-black p-2 text-sm font-black">{totalPassengers}명</td>
                <td colSpan={2} className="border border-black p-2">
                  정상 완주율 100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. 5대 안전점검 결과 체크리스트 표 (기사 체크 자동 취합) */}
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 flex items-center justify-between">
            <span>[3] 일일 5대 안전점검 결과표 (운행 전 필수 점검)</span>
            <span className="text-emerald-700 font-bold">전 항목 이상 무 (점검 완료: 07:45)</span>
          </div>
          <table className="w-full border-collapse border border-black text-xs text-center">
            <thead className="bg-neutral-200 font-bold border-b border-black">
              <tr>
                <th className="border border-black p-2 w-1/4">점검 항목</th>
                <th className="border border-black p-2 w-2/4">세부 점검 기준</th>
                <th className="border border-black p-2 w-1/4">점검 판정</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold">1. 타이어 점검</td>
                <td className="border border-black p-2 text-left px-3">
                  타이어 적정 공기압 유지 여부 및 마모 상태, 편마모 유무 확인
                </td>
                <td className="border border-black p-2 font-black text-emerald-800">
                  [ ✓ ] 양 호
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">2. 등화장치 점검</td>
                <td className="border border-black p-2 text-left px-3">
                  전조등, 방향지시등, 브레이크등, 비상등 정상 점등 및 렌즈 청결
                </td>
                <td className="border border-black p-2 font-black text-emerald-800">
                  [ ✓ ] 양 호
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">3. 누유/누수 확인</td>
                <td className="border border-black p-2 text-left px-3">
                  엔진오일, 미션오일, 브레이크액, 라디에이터 냉각수 누출 흔적
                </td>
                <td className="border border-black p-2 font-black text-emerald-800">
                  [ ✓ ] 양 호
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">4. 좌석 청결도</td>
                <td className="border border-black p-2 text-left px-3">
                  VIP 좌석 가죽 상태 청결, 실내 바닥 매트 먼지 및 쓰레기 제거
                </td>
                <td className="border border-black p-2 font-black text-emerald-800">
                  [ ✓ ] 양 호
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">5. 브레이크 상태</td>
                <td className="border border-black p-2 text-left px-3">
                  제동 시 페달 답력 정상 및 밀림 현상, 패드 이상 소음 유무
                </td>
                <td className="border border-black p-2 font-black text-emerald-800">
                  [ ✓ ] 양 호
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 종합 의견 및 날인란 */}
        <div className="border border-black p-4 space-y-2 text-xs">
          <div className="font-bold">종합 관리자 의견:</div>
          <div className="text-neutral-700 min-h-[40px]">
            당일 기상 상태 양호하며 전 회차 규정 속도 준수 및 안전 운행 확인되었습니다. 특이 정비 소요 없음.
          </div>
          <div className="text-right font-bold text-neutral-800 pt-2 border-t border-neutral-300">
            아덴힐 리조트 스마트 셔틀 운영 관리책임자 (서명/인)
          </div>
        </div>
      </div>
    </div>
  );
}
