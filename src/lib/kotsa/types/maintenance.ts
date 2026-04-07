/**
 * KOTSA 정비 이력 타입
 * 자동차종합정보 API 정비 이력 응답 구조
 */

export type KotsaMaintenancePart = {
  name: string     // 부품명
  quantity: number // 수량
  price: number    // 단가 (원)
}

export type KotsaMaintenanceRecord = {
  date: string                         // 정비일자
  mileage: number                      // 정비 시 주행거리 (km)
  shopName: string                     // 정비업체명
  shopType: string                     // 정비업체유형 (공식/일반/직영 등)
  category: string                     // 정비분류 (엔진오일/타이어/브레이크 등)
  description: string                  // 정비내용
  parts: KotsaMaintenancePart[]        // 교체부품 목록
  laborCost: number                    // 공임비 (원)
  totalCost: number                    // 총비용 (원)
  nextMaintenanceDate: string | null   // 다음정비예정일
  nextMaintenanceMileage: number | null // 다음정비예정 주행거리 (km)
  warranty: boolean                    // 보증수리여부
  recallRelated: boolean               // 리콜관련여부
  technicianId: string                 // 담당기술자 ID
  reportNumber: string                 // 정비이력 보고서번호
}

export type KotsaMaintenanceHistory = {
  totalRecords: number                 // 총 정비이력 건수
  records: KotsaMaintenanceRecord[]   // 정비이력 목록
  lastMaintenanceDate: string | null  // 최종정비일
  lastMaintenanceMileage: number | null // 최종정비 주행거리 (km)
}
