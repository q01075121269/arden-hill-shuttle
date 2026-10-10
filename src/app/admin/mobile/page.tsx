import { AdminMobileDashboard } from "@/components/admin/mobile/AdminMobileDashboard";

export const metadata = {
  title: "아덴힐 스마트 셔틀 - 관리자 모바일 기동 관제",
  description: "외근 및 현장 긴급 대응을 위한 관리자 모바일 전용 관제탑",
};

export default function AdminMobilePage() {
  return <AdminMobileDashboard />;
}
