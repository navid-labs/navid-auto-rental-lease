// src/lib/catalog/vehicle-options.ts

/**
 * 차량 옵션 정적 카탈로그.
 * DB에는 `Listing.options: String[]` 로 해당 `code` 값이 저장됨.
 * UI는 이 목록을 기반으로 그룹 렌더링·자동완성·필터를 구성.
 *
 * 향후 M3에 Feature 테이블로 이전 예정 (known tech debt).
 */

export type OptionGroup = "convenience" | "safety" | "performance" | "multimedia" | "interior" | "exterior"

export interface VehicleOption {
  code: string
  label: string
  group: OptionGroup
}

export const VEHICLE_OPTIONS: readonly VehicleOption[] = [
  // 편의
  { code: "navigation", label: "내비게이션", group: "convenience" },
  { code: "sunroof", label: "썬루프", group: "convenience" },
  { code: "panoramic_sunroof", label: "파노라마 썬루프", group: "convenience" },
  { code: "smart_key", label: "스마트키", group: "convenience" },
  { code: "remote_start", label: "원격시동", group: "convenience" },
  { code: "ventilated_seats", label: "통풍시트", group: "convenience" },
  { code: "heated_seats", label: "열선시트", group: "convenience" },
  { code: "heated_steering", label: "열선핸들", group: "convenience" },
  { code: "power_seats", label: "전동시트", group: "convenience" },
  { code: "memory_seats", label: "메모리시트", group: "convenience" },
  // 안전
  { code: "rear_camera", label: "후방카메라", group: "safety" },
  { code: "around_view", label: "어라운드뷰", group: "safety" },
  { code: "parking_sensors", label: "주차센서", group: "safety" },
  { code: "blind_spot", label: "사각지대 경보", group: "safety" },
  { code: "lane_assist", label: "차선유지보조", group: "safety" },
  { code: "adaptive_cruise", label: "어댑티브 크루즈", group: "safety" },
  { code: "auto_emergency_brake", label: "자동긴급제동", group: "safety" },
  // 퍼포먼스
  { code: "hud", label: "HUD", group: "performance" },
  { code: "paddle_shift", label: "패들시프트", group: "performance" },
  { code: "adaptive_headlight", label: "어댑티브 헤드라이트", group: "performance" },
  // 멀티미디어
  { code: "apple_carplay", label: "애플 카플레이", group: "multimedia" },
  { code: "android_auto", label: "안드로이드 오토", group: "multimedia" },
  { code: "premium_audio", label: "프리미엄 오디오", group: "multimedia" },
  { code: "wireless_charger", label: "무선충전", group: "multimedia" },
  // 내외장
  { code: "leather_seats", label: "가죽시트", group: "interior" },
  { code: "ambient_light", label: "앰비언트 라이트", group: "interior" },
  { code: "power_tailgate", label: "전동 트렁크", group: "exterior" },
  { code: "led_headlight", label: "LED 헤드라이트", group: "exterior" },
  { code: "alloy_wheel", label: "알로이 휠", group: "exterior" },
] as const

const CODE_SET = new Set(VEHICLE_OPTIONS.map((o) => o.code))

export function isValidOptionCode(code: string): boolean {
  return CODE_SET.has(code)
}

export function getOptionLabel(code: string): string {
  return VEHICLE_OPTIONS.find((o) => o.code === code)?.label ?? code
}

export function groupOptions(codes: readonly string[]): Record<OptionGroup, VehicleOption[]> {
  const byGroup: Record<OptionGroup, VehicleOption[]> = {
    convenience: [], safety: [], performance: [], multimedia: [], interior: [], exterior: [],
  }
  for (const opt of VEHICLE_OPTIONS) {
    if (codes.includes(opt.code)) byGroup[opt.group].push(opt)
  }
  return byGroup
}
