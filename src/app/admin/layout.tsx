import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 백오피스 | 아덴힐 스마트 셔틀 운영시스템",
  description: "아덴힐 리조트 셔틀 운영 정책, 실시간 관제, 운행일지 인쇄, 요금 수납 관리 백오피스",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full min-h-screen">{children}</div>;
}
