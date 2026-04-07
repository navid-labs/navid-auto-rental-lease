/**
 * KOTSA 차량 검사/사고 이력 타입
 * 자동차종합정보 API 성능점검 및 사고이력 응답 구조
 */

export type KotsaPanelCondition = {
  status: 'normal' | 'repainted' | 'replaced' | 'damaged' // 패널상태
  detail: string | null                                     // 상세설명
}

export type KotsaAccidentDetail = {
  date: string              // 사고일자
  type: string              // 사고유형 (충돌/침수/화재 등)
  repairCost: number        // 수리비용 (원)
  affectedParts: string[]   // 피해부위 목록
  repairShop: string        // 수리업체
}

export type KotsaAccidentHistory = {
  hasAccident: boolean                // 사고이력 유무
  accidentCount: number               // 사고횟수
  totalRepairCost: number             // 누적 수리비용 (원)
  floodDamage: boolean                // 침수피해여부
  fireDamage: boolean                 // 화재피해여부
  majorAccident: boolean              // 중대사고여부 (에어백 전개 등)
  details: KotsaAccidentDetail[]      // 사고상세 목록
}

export type KotsaExteriorInspection = {
  // 차체 패널 15개 항목
  hood: KotsaPanelCondition           // 후드 (엔진 덮개)
  frontFenderLeft: KotsaPanelCondition   // 앞 왼쪽 펜더
  frontFenderRight: KotsaPanelCondition  // 앞 오른쪽 펜더
  frontDoorLeft: KotsaPanelCondition     // 앞 왼쪽 도어
  frontDoorRight: KotsaPanelCondition    // 앞 오른쪽 도어
  rearDoorLeft: KotsaPanelCondition      // 뒤 왼쪽 도어
  rearDoorRight: KotsaPanelCondition     // 뒤 오른쪽 도어
  trunkLid: KotsaPanelCondition          // 트렁크 리드
  roofPanel: KotsaPanelCondition         // 루프 패널
  quarterPanelLeft: KotsaPanelCondition  // 왼쪽 쿼터 패널
  quarterPanelRight: KotsaPanelCondition // 오른쪽 쿼터 패널
  sideSillLeft: KotsaPanelCondition      // 왼쪽 사이드실
  sideSillRight: KotsaPanelCondition     // 오른쪽 사이드실
  frontBumper: KotsaPanelCondition       // 앞 범퍼
  rearBumper: KotsaPanelCondition        // 뒤 범퍼
  // 외관 이상 플래그
  corrosion: boolean                     // 부식여부
  unevenGaps: boolean                    // 단차/틈새 불량여부
}

export type KotsaMechanicalInspection = {
  engineCondition: string              // 엔진상태
  oilLeak: boolean                     // 엔진오일 누유여부
  coolantLeak: boolean                 // 냉각수 누수여부
  transmissionCondition: string        // 변속기상태
  transmissionNoise: boolean           // 변속기 이음여부
  clutchCondition: string              // 클러치상태 (수동변속기 해당)
  driveShaft: string                   // 구동축 상태
  steeringPlay: number                 // 스티어링 유격 (mm)
  powerSteeringLeak: boolean           // 파워스티어링 누유여부
  brakeCondition: string               // 브레이크 상태
  brakePadRemaining: number            // 브레이크 패드 잔량 (%)
  absFunction: boolean                 // ABS 정상작동여부
  exhaustSystem: string                // 배기계통 상태
  emissionTestResult: string           // 배출가스 검사결과
  suspensionCondition: string          // 현가장치 상태
  shockAbsorber: string                // 충격흡수장치 상태
  wheelBearing: string                 // 휠베어링 상태
  tireCondition: string                // 타이어 상태
  tireTreadDepth: number[]             // 타이어 트레드 깊이 [FL, FR, RL, RR] (mm)
}

export type KotsaInteriorInspection = {
  dashboard: string                    // 대시보드 상태
  seats: string                        // 시트 상태
  seatbelts: string                    // 안전벨트 상태
  airbags: string                      // 에어백 상태
  headliner: string                    // 천장(헤드라이너) 상태
  carpet: string                       // 카펫/바닥 상태
  audioSystem: string                  // 오디오 시스템 작동여부
  navigationSystem: string             // 내비게이션 작동여부
  climateControl: string               // 공조장치 작동여부
  powerWindows: string                 // 파워윈도우 작동여부
  centralLocking: string               // 중앙잠금장치 작동여부
  odometer: number                     // 계기판 주행거리 표시값 (km)
  warningLights: string[]              // 경고등 점등 항목 목록
  overallCondition: string             // 실내 전반적 상태
}

export type KotsaInspectionDetail = {
  inspectorName: string                         // 점검자 이름
  inspectorLicense: string                      // 점검자 자격번호
  inspectionCenter: string                      // 성능점검업체
  inspectionDate: string                        // 점검일자
  expiryDate: string                            // 성능점검 유효기간
  overallGrade: 'A_PLUS' | 'A' | 'B_PLUS' | 'B' | 'C' // 종합등급
  overallScore: number                          // 종합점수 (0-100)
}

export type KotsaInspection = {
  accidentHistory: KotsaAccidentHistory
  exterior: KotsaExteriorInspection
  mechanical: KotsaMechanicalInspection
  interior: KotsaInteriorInspection
  detail: KotsaInspectionDetail
}
