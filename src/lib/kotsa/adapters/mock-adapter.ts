import type { KotsaVehicleData, KotsaPanelCondition } from '../types'
import type { KotsaAdapter } from './kotsa-adapter'

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

const normalPanel: KotsaPanelCondition = { status: 'normal', detail: null }

// ── 기준 픽스처 데이터 (현대 아반떼 CN7 2023, 가솔린 1598cc) ────────────────

const BASE_FIXTURE: KotsaVehicleData = {
  basicInfo: {
    vin: 'KMHD341ABPA000001',
    registrationNumber: '23가1234',
    ownerName: '김나빗',
    registrationDate: '2023-03-10',
    firstRegistrationDate: '2023-03-10',
    vehicleType: '승용',
    vehicleUse: '자가용',
    manufacturer: '현대',
    modelName: '아반떼 CN7',
    modelYear: 2023,
    color: '아이스 화이트 펄',
    displacement: 1598,
    fuelType: '가솔린',
    maxPower: '123ps/6300rpm',
    transmissionType: 'IVT(무단변속기)',
    numberOfSeats: 5,
    totalWeight: 1805,
    curbWeight: 1305,
    numberOfOwnerChanges: 0,
    hasSeizure: false,
    hasMortgage: false,
    insuranceExpiryDate: '2026-03-09',
    inspectionExpiryDate: '2027-03-09',
    mileage: 28500,
    mileageDate: '2025-11-15',
    isCommercial: false,
    isPenalized: false,
    registrationStatus: '등록',
    cancelDate: null,
    exportDate: null,
    scrappedDate: null,
    remarks: null,
    lastUpdated: '2025-11-15',
    dataSource: 'KOTSA',
    responseCode: '00',
  },
  spec: {
    engine: {
      type: 'Smartstream G1.6',
      displacement: 1598,
      fuelType: '가솔린',
      fuelSystem: 'GDI',
      maxPower: '123ps/6300rpm',
      maxTorque: '15.7kgf.m/4850rpm',
      emissionStandard: 'Euro6d',
      catalyticConverter: true,
      turbocharger: false,
      hybridType: null,
      evRange: null,
      batteryCapacity: null,
      chargingType: null,
      hydrogenTankCapacity: null,
      fuelTankCapacity: 50,
      fuelEfficiency: '15.2',
      co2Emission: 108,
    },
    transmission: {
      type: 'IVT(무단변속기)',
      gears: 1,
      driveType: 'FF',
    },
    body: {
      type: '세단',
      numberOfDoors: 4,
      length: 4650,
      width: 1825,
      height: 1415,
      wheelbase: 2720,
      trackFront: 1575,
      trackRear: 1580,
      overhangFront: 880,
      overhangRear: 1050,
      groundClearance: 145,
      curbWeight: 1305,
      grossWeight: 1805,
      maxPayload: 500,
      towingCapacity: 0,
    },
    tire: {
      frontSize: '225/45R17',
      rearSize: '225/45R17',
      spareTire: 'T125/70D16',
    },
    suspension: {
      front: '맥퍼슨 스트럿',
      rear: '토션 빔',
    },
    brake: {
      front: '벤틸레이티드 디스크',
      rear: '드럼',
      parkingBrake: '전자식(EPB)',
    },
    steering: {
      type: '전동식 파워스티어링(R-MDPS)',
      turningRadius: 5.3,
    },
  },
  maintenance: {
    totalRecords: 3,
    records: [
      {
        date: '2023-09-12',
        mileage: 10000,
        shopName: '현대 블루핸즈 강남점',
        shopType: '공식',
        category: '엔진오일 교환',
        description: '엔진오일(5W-30 합성유) 및 오일필터 교환, 타이어 위치교환',
        parts: [
          { name: '엔진오일 5W-30 합성유 4L', quantity: 1, price: 32000 },
          { name: '오일필터', quantity: 1, price: 8000 },
        ],
        laborCost: 15000,
        totalCost: 55000,
        nextMaintenanceDate: '2024-09-12',
        nextMaintenanceMileage: 20000,
        warranty: false,
        recallRelated: false,
        technicianId: 'TECH-BH-0421',
        reportNumber: 'RPT-20230912-0042',
      },
      {
        date: '2024-07-05',
        mileage: 20000,
        shopName: '현대 블루핸즈 강남점',
        shopType: '공식',
        category: '엔진오일 교환',
        description: '엔진오일 및 오일필터 교환, 에어컨 필터 교환, 와이퍼 블레이드 교환',
        parts: [
          { name: '엔진오일 5W-30 합성유 4L', quantity: 1, price: 32000 },
          { name: '오일필터', quantity: 1, price: 8000 },
          { name: '에어컨 필터', quantity: 1, price: 18000 },
          { name: '와이퍼 블레이드 세트', quantity: 1, price: 22000 },
        ],
        laborCost: 20000,
        totalCost: 100000,
        nextMaintenanceDate: '2025-07-05',
        nextMaintenanceMileage: 30000,
        warranty: false,
        recallRelated: false,
        technicianId: 'TECH-BH-0421',
        reportNumber: 'RPT-20240705-0118',
      },
      {
        date: '2025-03-20',
        mileage: 27000,
        shopName: '현대자동차 직영서비스 서초점',
        shopType: '직영',
        category: '정기점검',
        description: '법정 정기점검, 브레이크 패드 점검, 냉각수 보충',
        parts: [
          { name: '냉각수 보충제', quantity: 1, price: 5000 },
        ],
        laborCost: 30000,
        totalCost: 35000,
        nextMaintenanceDate: '2025-09-20',
        nextMaintenanceMileage: 35000,
        warranty: false,
        recallRelated: false,
        technicianId: 'TECH-DS-0087',
        reportNumber: 'RPT-20250320-0203',
      },
    ],
    lastMaintenanceDate: '2025-03-20',
    lastMaintenanceMileage: 27000,
  },
  inspection: {
    accidentHistory: {
      hasAccident: false,
      accidentCount: 0,
      totalRepairCost: 0,
      floodDamage: false,
      fireDamage: false,
      majorAccident: false,
      details: [],
    },
    exterior: {
      hood: normalPanel,
      frontFenderLeft: normalPanel,
      frontFenderRight: normalPanel,
      frontDoorLeft: normalPanel,
      frontDoorRight: normalPanel,
      rearDoorLeft: normalPanel,
      rearDoorRight: normalPanel,
      trunkLid: normalPanel,
      roofPanel: normalPanel,
      quarterPanelLeft: normalPanel,
      quarterPanelRight: normalPanel,
      sideSillLeft: normalPanel,
      sideSillRight: normalPanel,
      frontBumper: normalPanel,
      rearBumper: normalPanel,
      corrosion: false,
      unevenGaps: false,
    },
    mechanical: {
      engineCondition: '양호',
      oilLeak: false,
      coolantLeak: false,
      transmissionCondition: '양호',
      transmissionNoise: false,
      clutchCondition: '해당없음(자동)',
      driveShaft: '양호',
      steeringPlay: 3,
      powerSteeringLeak: false,
      brakeCondition: '양호',
      brakePadRemaining: 85,
      absFunction: true,
      exhaustSystem: '양호',
      emissionTestResult: '적합',
      suspensionCondition: '양호',
      shockAbsorber: '양호',
      wheelBearing: '양호',
      tireCondition: '양호',
      tireTreadDepth: [7.0, 7.0, 6.5, 6.5],
    },
    interior: {
      dashboard: '양호',
      seats: '양호',
      seatbelts: '정상',
      airbags: '미전개',
      headliner: '양호',
      carpet: '양호',
      audioSystem: '정상',
      navigationSystem: '정상',
      climateControl: '정상',
      powerWindows: '정상',
      centralLocking: '정상',
      odometer: 28500,
      warningLights: [],
      overallCondition: '양호',
    },
    detail: {
      inspectorName: '박성능',
      inspectorLicense: 'KINSPECT-20891',
      inspectionCenter: '한국자동차진단보증(주)',
      inspectionDate: '2025-11-15',
      expiryDate: '2026-11-14',
      overallGrade: 'A',
      overallScore: 88,
    },
  },
}

// ── 딥 머지 헬퍼 (plain object 한정) ────────────────────────────────────────

function deepMerge<T>(base: T, overrides: DeepPartial<T>): T {
  if (
    overrides === null ||
    overrides === undefined ||
    typeof overrides !== 'object' ||
    Array.isArray(overrides)
  ) {
    return overrides as T
  }

  const result = { ...base } as Record<string, unknown>
  for (const key of Object.keys(overrides as object)) {
    const overrideVal = (overrides as Record<string, unknown>)[key]
    const baseVal = (base as Record<string, unknown>)[key]

    if (
      overrideVal !== null &&
      overrideVal !== undefined &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(baseVal as object, overrideVal as DeepPartial<object>)
    } else {
      result[key] = overrideVal
    }
  }
  return result as T
}

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

// ── 공개 API ─────────────────────────────────────────────────────────────────

/**
 * 테스트/개발용 KOTSA 픽스처 데이터를 생성한다.
 * overrides로 특정 필드를 덮어쓸 수 있다.
 *
 * @param overrides - 기본 픽스처에서 변경할 필드 (deep partial)
 * @returns KotsaVehicleData 픽스처
 */
export function createMockKotsaVehicleData(
  overrides?: DeepPartial<KotsaVehicleData>
): KotsaVehicleData {
  if (!overrides) return BASE_FIXTURE
  return deepMerge(BASE_FIXTURE, overrides)
}

/**
 * KOTSA 어댑터 Mock 구현체
 * 테스트 및 로컬 개발 환경에서 실제 API 없이 사용한다.
 */
export class MockKotsaAdapter implements KotsaAdapter {
  private readonly overrides?: DeepPartial<KotsaVehicleData>

  constructor(overrides?: DeepPartial<KotsaVehicleData>) {
    this.overrides = overrides
  }

  async fetchVehicleInfo(
    registrationNumber: string,
    _ci: string
  ): Promise<KotsaVehicleData> {
    if (!registrationNumber) {
      throw new Error('등록번호가 비어 있습니다.')
    }

    const data = createMockKotsaVehicleData(this.overrides)

    // 조회한 등록번호를 픽스처에 반영 (현실적인 동작 모사)
    return {
      ...data,
      basicInfo: {
        ...data.basicInfo,
        registrationNumber,
      },
    }
  }
}
