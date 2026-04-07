/**
 * KOTSA 기본 차량 정보 타입
 * 자동차종합정보 API 기본 정보 응답 구조
 */
export type KotsaBasicInfo = {
  vin: string                         // 차대번호
  registrationNumber: string          // 등록번호
  ownerName: string                   // 소유자
  registrationDate: string            // 등록일
  firstRegistrationDate: string       // 최초등록일
  vehicleType: string                 // 차종 (승용/승합/화물/특수)
  vehicleUse: string                  // 용도 (자가용/영업용/관용)
  manufacturer: string                // 제조사
  modelName: string                   // 차명
  modelYear: number                   // 연식
  color: string                       // 색상
  displacement: number                // 배기량 (cc)
  fuelType: string                    // 연료
  maxPower: string                    // 최고출력 (ps/rpm)
  transmissionType: string            // 변속기
  numberOfSeats: number               // 승차정원
  totalWeight: number                 // 총중량 (kg)
  curbWeight: number                  // 공차중량 (kg)
  numberOfOwnerChanges: number        // 소유자변경횟수
  hasSeizure: boolean                 // 압류여부
  hasMortgage: boolean                // 저당여부
  insuranceExpiryDate: string | null  // 보험만료일
  inspectionExpiryDate: string | null // 검사만료일
  mileage: number                     // 주행거리
  mileageDate: string                 // 주행거리측정일
  isCommercial: boolean               // 사업용여부
  isPenalized: boolean                // 과태료여부
  registrationStatus: string          // 등록상태
  cancelDate: string | null           // 말소일
  exportDate: string | null           // 수출일
  scrappedDate: string | null         // 폐차일
  remarks: string | null              // 비고
  lastUpdated: string                 // 최종갱신일
  dataSource: string                  // 데이터출처
  responseCode: string                // 응답코드
}
