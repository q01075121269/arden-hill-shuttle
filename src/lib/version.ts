export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

export interface VersionReleaseInfo {
  version: string;
  releaseDate: string;
  titleKr: string;
  titleCn: string;
  highlightsKr: string[];
  highlightsCn: string[];
}

export const CURRENT_RELEASE_INFO: VersionReleaseInfo = {
  version: APP_VERSION,
  releaseDate: "2026-10-09",
  titleKr: `아덴힐 스마트 셔틀 운영시스템 v${APP_VERSION} 릴리즈`,
  titleCn: `雅顿山智能班车运营系统 v${APP_VERSION} 正式发布`,
  highlightsKr: [
    "Next.js 15 App Router & React 19 기반의 초고속 탑승객 예약 및 관리 시스템 오픈",
    "아덴힐 리조트 101개 전 구역(빌라 101동~200동 및 커뮤니티 센터) 지정 픽업 지원",
    "탑승 인원 기반 탄력 배차 자동화 (5인 이하 카니발 / 6인 이상 카운티)",
    "기사 전용 5대 안전점검표 및 실시간 회차 승차 확인 시스템 도입",
    "관리자 전용 Bento Grid 2.0 관제, 종이 서식 100% 인쇄 및 스마트 수납 장부 지원",
    "한국어 / 중국어(KR | CN) 실시간 다국어 지원",
  ],
  highlightsCn: [
    "基于 Next.js 15 与 React 19 的高性能乘客预约与运行管理系统上线",
    "支持雅顿山度假村全部101个区域 (别墅101栋~200栋及社区中心) 指定上车",
    "根据乘车人数自动弹性排班 (5人及以下分配嘉华 / 6人及以上分配25座考斯特)",
    "司机专享每日5大安全检查与班次乘车一键核对",
    "管理员专享 Bento Grid 2.0 监控、1:1 纸质运行日志打印与财务账单导出",
    "中韩双语 (KR | 中文) 实时切换支持",
  ],
};

const RELEASE_STORAGE_KEY = `AH_LAST_SEEN_VERSION`;

export function checkShouldShowReleaseModal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const lastSeen = localStorage.getItem(RELEASE_STORAGE_KEY);
    return lastSeen !== APP_VERSION;
  } catch {
    return false;
  }
}

export function markReleaseSeen(dontShowToday = false) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RELEASE_STORAGE_KEY, APP_VERSION);
  } catch (err) {
    console.error("Failed to save release version seen:", err);
  }
}
