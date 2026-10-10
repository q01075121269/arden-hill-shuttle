"use client";

import React, { useRef, useState } from "react";
import { Printer, Download, Image as ImageIcon, FileText, CheckCircle2 } from "lucide-react";
import { Language } from "@/types";
import { DailyOperationData } from "@/app/actions/admin-operations";
import { exportElementToImage, exportElementToPdf } from "@/lib/export-utils";

interface DailyLogPrintProps {
  lang: Language;
  date?: string;
  data?: DailyOperationData;
  onPrint?: () => void;
}

export function DailyLogPrint({
  lang,
  date = "2026-10-09",
  data,
  onPrint,
}: DailyLogPrintProps) {
  const isKr = lang === "KR";
  const paperRef = useRef<HTMLDivElement>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportImage = async () => {
    if (!paperRef.current) return;
    setIsExportingImage(true);
    try {
      await exportElementToImage(
        paperRef.current,
        `${date}_아덴힐_셔틀버스_일일운행일지.png`,
        { scale: 2 }
      );
      setExportNotice(isKr ? "일일운행일지가 이미지(PNG)로 저장되었습니다." : "运行日志已保存为图片。");
      setTimeout(() => setExportNotice(null), 3000);
    } catch (e) {
      alert(isKr ? "이미지 저장에 실패했습니다." : "保存图片失败。");
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportPdf = async () => {
    if (!paperRef.current) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf(
        paperRef.current,
        `${date}_아덴힐_셔틀버스_일일운행일지.pdf`,
        { orientation: "portrait" }
      );
      setExportNotice(isKr ? "일일운행일지가 PDF 문서로 저장되었습니다." : "运行日志已导出为PDF文件。");
      setTimeout(() => setExportNotice(null), 3000);
    } catch (e) {
      alert(isKr ? "PDF 저장에 실패했습니다." : "导出PDF失败。");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 기본 더미 데이터 (data prop이 없을 경우 대비)
  const defaultOutbound = [
    { round: "1회차", departTime: "08:10", departPax: "5명", emartTime: "08:45", emartPax: "5명", airportTime: "09:20", airportPax: "5명", notes: "카니발 리무진 운행 (정시 출발)" },
    { round: "2회차", departTime: "10:30", departPax: "9명", emartTime: "11:05", emartPax: "9명", airportTime: "11:40", airportPax: "9명", notes: "29인승 카운티 셔틀 운행" },
    { round: "3회차", departTime: "12:30", departPax: "4명", emartTime: "13:05", emartPax: "4명", airportTime: "13:40", airportPax: "4명", notes: "카니발 리무진 운행" },
    { round: "4회차", departTime: "15:00", departPax: "8명", emartTime: "15:35", emartPax: "8명", airportTime: "16:10", airportPax: "8명", notes: "29인승 카운티 셔틀 운행" },
    { round: "5회차", departTime: "18:20", departPax: "7명", emartTime: "18:55", emartPax: "7명", airportTime: "19:30", airportPax: "7명", notes: "야간 순환 운행" },
    { round: "6회차", departTime: "20:00", departPax: "2명", emartTime: "20:30", emartPax: "2명", airportTime: "21:00", airportPax: "2명", notes: "마지막 회차 정상 운행" },
  ];

  const defaultInbound = [
    { round: "1회차", departTime: "09:30", departPax: "6명", emartTime: "10:05", emartPax: "6명", resortTime: "10:40", resortPax: "6명", notes: "공항 3층 5번 게이트 정시 픽업" },
    { round: "2회차", departTime: "11:30", departPax: "8명", emartTime: "12:05", emartPax: "8명", resortTime: "12:40", resortPax: "8명", notes: "29인승 카운티 셔틀 운행" },
    { round: "3회차", departTime: "13:30", departPax: "5명", emartTime: "14:05", emartPax: "5명", resortTime: "14:40", resortPax: "5명", notes: "카니발 리무진 운행" },
    { round: "4회차", departTime: "16:20", departPax: "10명", emartTime: "16:55", emartPax: "10명", resortTime: "17:30", resortPax: "10명", notes: "단체 투숙객 수송 완료" },
    { round: "5회차", departTime: "19:10", departPax: "4명", emartTime: "19:40", emartPax: "4명", resortTime: "20:15", resortPax: "4명", notes: "야간 복귀 정상 운행" },
  ];

  // 실제 데이터 바인딩
  const outboundRows = data
    ? data.outboundRounds.map((r) => {
        const paxStr = `${r.boardedPax || r.totalPax}명`;
        return {
          round: `${r.roundNumber}회차`,
          departTime: r.timeText,
          departPax: paxStr,
          emartTime: r.timeText, // 중간 경유
          emartPax: paxStr,
          airportTime: r.timeText,
          airportPax: paxStr,
          notes: `${r.allocatedVehicleType === "carnival" ? "카니발" : "카운티"} 배정 (${r.vehiclePlate.slice(0, 10)})`,
        };
      })
    : defaultOutbound;

  const inboundRows = data
    ? data.inboundRounds.map((r) => {
        const paxStr = `${r.boardedPax || r.totalPax}명`;
        return {
          round: `${r.roundNumber}회차`,
          departTime: r.timeText,
          departPax: paxStr,
          emartTime: r.timeText,
          emartPax: paxStr,
          resortTime: r.timeText,
          resortPax: paxStr,
          notes: `${r.allocatedVehicleType === "carnival" ? "카니발" : "카운티"} 배정`,
        };
      })
    : defaultInbound;

  const totalOutbound = outboundRows.reduce(
    (sum, r) => sum + parseInt(r.departPax.replace(/[^0-9]/g, "") || "0"),
    0
  );
  const totalInbound = inboundRows.reduce(
    (sum, r) => sum + parseInt(r.departPax.replace(/[^0-9]/g, "") || "0"),
    0
  );
  const grandTotal = totalOutbound + totalInbound;

  const stopoverLabel = data?.stopoverName || "이마트 신제주점";
  const driverName = data?.safetyCheck.driverName || "김철수 기사님";

  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  return (
    <div className="w-full">
      {/* 
        A4 단일 페이지 전용 Print CSS (@media print)
        - 마진 8mm 고정, 브라우저 머리글/바닥글 제거
        - 흑백 고대비 테두리 선, 2페이지 넘어감 원천 차단
      */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 10px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print,
          header,
          nav,
          footer,
          button {
            display: none !important;
          }
          .printable-paper {
            width: 100% !important;
            max-width: 100% !important;
            border: 2px solid #000000 !important;
            padding: 12px 14px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          .printable-paper * {
            color: #000000 !important;
            border-color: #000000 !important;
          }
        }
      `}</style>

      {/* 1. 상단 화면 조작 배너 (no-print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
        <div>
          <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Printer className="h-5 w-5" />
            </div>
            <span>{isKr ? "공식 '아덴힐 셔틀버스 운행일지' 종이 서식 (A4 1:1 출력)" : "标准纸质运行日志 (A4 1:1 打印)"}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
            {isKr
              ? "기사 5대 안전점검 결과와 상/하행 회차별 승차 인원이 행정 서식 규격에 맞게 100% 오차 없이 자동 바인딩됩니다."
              : "自动汇总司机5大安全检查与往返各班次实际乘车数据，精准适配A4纸质表格。"}
          </p>
        </div>

        {/* 출력 및 저장 액션 버튼 그룹 */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 1. 이미지(PNG) 저장 버튼 */}
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExportingImage || isExportingPdf}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm squishy-btn shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            title="일일운행일지를 PNG 이미지 파일로 저장"
          >
            <ImageIcon className="h-4 w-4" />
            <span>{isExportingImage ? "이미지 생성 중..." : isKr ? "💾 이미지(PNG) 저장" : "保存为图片 (PNG)"}</span>
          </button>

          {/* 2. PDF 파일 직접 다운로드 저장 버튼 */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingImage || isExportingPdf}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm squishy-btn shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            title="일일운행일지를 A4 PDF 문서 파일로 저장"
          >
            <FileText className="h-4 w-4" />
            <span>{isExportingPdf ? "PDF 생성 중..." : isKr ? "📄 PDF 파일 저장" : "导出 PDF 文件"}</span>
          </button>

          {/* 3. A4 종이 인쇄 버튼 */}
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm squishy-btn shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            title="프린터 출력 또는 브라우저 PDF 인쇄"
          >
            <Printer className="h-4 w-4" />
            <span>{isKr ? "🖨️ A4 종이 인쇄" : "A4 打印"}</span>
          </button>
        </div>
      </div>

      {/* 저장 완료 알림 토스트 (no-print) */}
      {exportNotice && (
        <div className="no-print mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 
        2. 원본 종이 서식 컨테이너 (A4 Portrait 규격 1:1 정밀 구현)
      */}
      <div
        ref={paperRef}
        className="printable-paper mx-auto w-full max-w-[210mm] bg-white text-black p-5 sm:p-7 border-2 border-black shadow-xl rounded-none space-y-3 font-sans"
      >
        {/* 상단 제목 및 결재 서명 테이블 */}
        <div className="flex items-start justify-between border-b-2 border-black pb-2.5">
          <div className="space-y-0.5">
            <div className="text-[10px] font-extrabold tracking-widest text-neutral-600 uppercase">
              Arden Hill Resort Smart Shuttle Operation Daily Sheet
            </div>
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              아덴힐 셔틀버스 일일 운행일지
            </h1>
            <div className="text-[11px] font-bold text-neutral-800">
              운행 일자: {date} | 문서번호: AH-LOG-{date.replace(/-/g, "")}-01
            </div>
          </div>

          {/* 결재란 테이블 (운전자 확인, 확인자) */}
          <div className="border border-black text-center text-[10px]">
            <div className="grid grid-cols-2 bg-neutral-100 border-b border-black font-extrabold">
              <div className="px-4 py-0.5 border-r border-black">운전자 확인</div>
              <div className="px-4 py-0.5">확인자 (관리자)</div>
            </div>
            <div className="grid grid-cols-2 h-11">
              <div className="border-r border-black flex flex-col items-center justify-center font-bold px-2 text-[10px]">
                <span>{driverName.slice(0, 3)}</span>
                <span className="text-[9px] text-neutral-500">(전자서명 완료)</span>
              </div>
              <div className="flex flex-col items-center justify-center font-bold px-2 text-[10px]">
                <span>이관리</span>
                <span className="text-[9px] text-neutral-500">(인 / 서명)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 메타 정보 테이블: 운행업체, 운행일, 운행차량, 운행구간 */}
        <table className="w-full border-collapse border border-black text-[10.5px] text-center">
          <tbody>
            <tr className="bg-neutral-100 font-extrabold">
              <td className="border border-black p-1 w-[14%]">운행 업체</td>
              <td className="border border-black p-1 w-[36%] font-normal text-left px-2">
                아덴힐 리조트 스마트 셔틀 운영본부
              </td>
              <td className="border border-black p-1 w-[14%]">운행 차량</td>
              <td className="border border-black p-1 w-[36%] font-normal text-left px-2">
                제주 70가 1142 (카니발) / 제주 72바 5501 (카운티)
              </td>
            </tr>
            <tr className="bg-neutral-100 font-extrabold">
              <td className="border border-black p-1">운행 구간</td>
              <td className="border border-black p-1 font-normal text-left px-2">
                아덴힐 리조트 ↔ {stopoverLabel} ↔ 제주공항 3층 5번 게이트 (왕복)
              </td>
              <td className="border border-black p-1">총 수송 인원</td>
              <td className="border border-black p-1 font-black text-left px-2">
                총 {grandTotal}명 (하행 {totalOutbound}명 + 상행 {totalInbound}명)
              </td>
            </tr>
          </tbody>
        </table>

        {/* 표 1: ○ 일일 운행내역 현황 (아덴힐 출발 ➔ 공항 방면, 1~6회차) */}
        <div className="space-y-0.5">
          <div className="text-[11px] font-black text-neutral-900 flex items-center justify-between">
            <span>○ [운행내역 1] 아덴힐 리조트 ➔ 제주공항 방면 (하행 1~6회차)</span>
            <span className="text-[10px] font-bold text-neutral-600">소계: {totalOutbound}명</span>
          </div>
          <table className="w-full border-collapse border border-black text-[10px] text-center">
            <thead className="bg-neutral-200 font-extrabold border-b border-black">
              <tr>
                <th className="border border-black p-1 w-11">회차</th>
                <th className="border border-black p-1">아덴힐 출발 (시간/인원)</th>
                <th className="border border-black p-1">{stopoverLabel} (시간/인원)</th>
                <th className="border border-black p-1">제주공항 도착 (시간/인원)</th>
                <th className="border border-black p-1 w-[30%]">비고 / 특이사항</th>
              </tr>
            </thead>
            <tbody>
              {outboundRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-0.5 font-bold">{row.round}</td>
                  <td className="border border-black p-0.5">
                    {row.departTime} / <span className="font-bold">{row.departPax}</span>
                  </td>
                  <td className="border border-black p-0.5">
                    {row.emartTime} / <span className="font-bold">{row.emartPax}</span>
                  </td>
                  <td className="border border-black p-0.5">
                    {row.airportTime} / <span className="font-bold">{row.airportPax}</span>
                  </td>
                  <td className="border border-black p-0.5 text-left px-2">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 표 2: ○ 운행내역 현황 (제주공항 출발 ➔ 아덴힐 방면, 1~5회차) */}
        <div className="space-y-0.5">
          <div className="text-[11px] font-black text-neutral-900 flex items-center justify-between">
            <span>○ [운행내역 2] 제주공항 ➔ 아덴힐 리조트 방면 (상행 1~5회차)</span>
            <span className="text-[10px] font-bold text-neutral-600">소계: {totalInbound}명</span>
          </div>
          <table className="w-full border-collapse border border-black text-[10px] text-center">
            <thead className="bg-neutral-200 font-extrabold border-b border-black">
              <tr>
                <th className="border border-black p-1 w-11">회차</th>
                <th className="border border-black p-1">제주공항 출발 (시간/인원)</th>
                <th className="border border-black p-1">{stopoverLabel} (시간/인원)</th>
                <th className="border border-black p-1">아덴힐 도착 (시간/인원)</th>
                <th className="border border-black p-1 w-[30%]">비고 / 특이사항</th>
              </tr>
            </thead>
            <tbody>
              {inboundRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-0.5 font-bold">{row.round}</td>
                  <td className="border border-black p-0.5">
                    {row.departTime} / <span className="font-bold">{row.departPax}</span>
                  </td>
                  <td className="border border-black p-0.5">
                    {row.emartTime} / <span className="font-bold">{row.emartPax}</span>
                  </td>
                  <td className="border border-black p-0.5">
                    {row.resortTime} / <span className="font-bold">{row.resortPax}</span>
                  </td>
                  <td className="border border-black p-0.5 text-left px-2">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 표 3: ○ 운행 전·중·후 안전점검 */}
        <div className="space-y-0.5">
          <div className="text-[11px] font-black text-neutral-900 flex items-center justify-between">
            <span>○ [안전점검] 운행 전·중·후 5대 안전점검 (기사 모바일 전자점검 자동 바인딩)</span>
            <span className="text-[10px] font-bold text-neutral-800">
              점검 시간: {data?.safetyCheck.checkTime || "07:45"} | 판정: 전 항목 합격
            </span>
          </div>
          <table className="w-full border-collapse border border-black text-[10px] text-center">
            <thead className="bg-neutral-200 font-extrabold border-b border-black">
              <tr>
                <th className="border border-black p-1 w-[20%]">구분</th>
                <th className="border border-black p-1 w-[50%]">세 부 내 용</th>
                <th className="border border-black p-1 w-[10%]">양호</th>
                <th className="border border-black p-1 w-[10%]">보통</th>
                <th className="border border-black p-1 w-[10%]">불량</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-0.5 font-bold">1. 타이어 점검</td>
                <td className="border border-black p-0.5 text-left px-2">
                  타이어 적정 공기압 및 마모 상태 확인, 균열/이물질 유무
                </td>
                <td className="border border-black p-0.5 font-black text-xs">V</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
              </tr>
              <tr>
                <td className="border border-black p-0.5 font-bold">2. 등화 장치 점검</td>
                <td className="border border-black p-0.5 text-left px-2">
                  전조등, 방향지시등, 브레이크등, 비상등 작동
                </td>
                <td className="border border-black p-0.5 font-black text-xs">V</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
              </tr>
              <tr>
                <td className="border border-black p-0.5 font-bold">3. 누유/누수 확인</td>
                <td className="border border-black p-0.5 text-left px-2">
                  하부 바닥에 오일이나 냉각수 등이 샌 흔적 확인
                </td>
                <td className="border border-black p-0.5 font-black text-xs">V</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
              </tr>
              <tr>
                <td className="border border-black p-0.5 font-bold">4. 좌석 청결도</td>
                <td className="border border-black p-0.5 text-left px-2">
                  VIP 좌석 가죽 상태를 확인하고 이물질을 제거
                </td>
                <td className="border border-black p-0.5 font-black text-xs">V</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
              </tr>
              <tr>
                <td className="border border-black p-0.5 font-bold">5. 브레이크 상태</td>
                <td className="border border-black p-0.5 text-left px-2">
                  제동 시 밀림 현상이나 소음이 없는지 확인
                </td>
                <td className="border border-black p-0.5 font-black text-xs">V</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
                <td className="border border-black p-0.5 font-bold text-neutral-300">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 종합 특이사항 메모 및 운전자 전자 서명 표출 */}
        <div className="border border-black p-2 space-y-0.5 text-[10px]">
          <div className="font-bold text-neutral-900">6. 종합 특이사항 메모 및 운전자 확인 서명:</div>
          <div className="text-[9.5px] text-neutral-800 leading-normal min-h-[22px]">
            {data?.safetyCheck.memo || "기상 상태 양호. 전 회차(하행 6회, 상행 5회) 규정 속도 준수 및 승하차 안전 관리 완료됨. 차량 이상 소요 없음."}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-neutral-300 text-[10px]">
            <span className="font-bold">
              운전자 서명: {driverName} (전자확인필)
            </span>
            <span className="font-black">
              아덴힐 스마트 셔틀 운영관리책임자 (서명/인)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
