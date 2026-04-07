/**
 * KOTSA 차량 제원 타입
 * 자동차종합정보 API 제원 정보 응답 구조
 */

export type KotsaEngineSpec = {
  type: string                        // 엔진형식
  displacement: number                // 배기량 (cc)
  fuelType: string                    // 연료종류
  fuelSystem: string                  // 연료공급방식
  maxPower: string                    // 최고출력 (ps/rpm)
  maxTorque: string                   // 최대토크 (kgf.m/rpm)
  emissionStandard: string            // 배출가스등급
  catalyticConverter: boolean         // 촉매장치여부
  turbocharger: boolean               // 터보차저여부
  hybridType: string | null           // 하이브리드방식 (HEV/PHEV/MHEV 등)
  evRange: number | null              // 전기차 주행거리 (km)
  batteryCapacity: number | null      // 배터리용량 (kWh)
  chargingType: string | null         // 충전방식
  hydrogenTankCapacity: number | null // 수소탱크용량 (kg)
  fuelTankCapacity: number            // 연료탱크용량 (L)
  fuelEfficiency: string              // 복합연비 (km/L 또는 km/kWh)
  co2Emission: number                 // CO2 배출량 (g/km)
}

export type KotsaTransmissionSpec = {
  type: string                        // 변속기형식 (자동/수동/CVT/DCT 등)
  gears: number                       // 변속단수
  driveType: string                   // 구동방식 (FF/FR/4WD/AWD 등)
}

export type KotsaBodySpec = {
  type: string                        // 차체형태 (세단/SUV/해치백 등)
  numberOfDoors: number               // 도어수
  length: number                      // 전장 (mm)
  width: number                       // 전폭 (mm)
  height: number                      // 전고 (mm)
  wheelbase: number                   // 축거 (mm)
  trackFront: number                  // 앞 윤거 (mm)
  trackRear: number                   // 뒤 윤거 (mm)
  overhangFront: number               // 앞 오버행 (mm)
  overhangRear: number                // 뒤 오버행 (mm)
  groundClearance: number             // 최저지상고 (mm)
  curbWeight: number                  // 공차중량 (kg)
  grossWeight: number                 // 총중량 (kg)
  maxPayload: number                  // 최대적재량 (kg)
  towingCapacity: number              // 견인능력 (kg)
}

export type KotsaTireSpec = {
  frontSize: string                   // 앞 타이어 규격
  rearSize: string                    // 뒤 타이어 규격
  spareTire: string                   // 스페어타이어 규격
}

export type KotsaSuspensionSpec = {
  front: string                       // 앞 현가장치
  rear: string                        // 뒤 현가장치
}

export type KotsaBrakeSpec = {
  front: string                       // 앞 브레이크
  rear: string                        // 뒤 브레이크
  parkingBrake: string                // 주차브레이크
}

export type KotsaSteeringSpec = {
  type: string                        // 조향장치형식
  turningRadius: number               // 최소회전반경 (m)
}

export type KotsaSpec = {
  engine: KotsaEngineSpec
  transmission: KotsaTransmissionSpec
  body: KotsaBodySpec
  tire: KotsaTireSpec
  suspension: KotsaSuspensionSpec
  brake: KotsaBrakeSpec
  steering: KotsaSteeringSpec
}
