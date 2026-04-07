import { describe, it, expect } from 'vitest'
import type {
  KotsaBasicInfo,
  KotsaEngineSpec,
  KotsaTransmissionSpec,
  KotsaBodySpec,
  KotsaTireSpec,
  KotsaSuspensionSpec,
  KotsaBrakeSpec,
  KotsaSteeringSpec,
  KotsaSpec,
  KotsaMaintenancePart,
  KotsaMaintenanceRecord,
  KotsaMaintenanceHistory,
  KotsaPanelCondition,
  KotsaAccidentDetail,
  KotsaAccidentHistory,
  KotsaExteriorInspection,
  KotsaMechanicalInspection,
  KotsaInteriorInspection,
  KotsaInspectionDetail,
  KotsaInspection,
  KotsaVehicleData,
} from '@/lib/kotsa/types'

// Type compilation tests — these assertions verify the shape at the type level.
// Runtime checks on the constructed objects confirm fields are accessible.

describe('KotsaBasicInfo', () => {
  it('accepts a fully populated object', () => {
    const info: KotsaBasicInfo = {
      vin: 'KMHXX00XXXX000000',
      registrationNumber: '12가3456',
      ownerName: '홍길동',
      registrationDate: '2020-03-15',
      firstRegistrationDate: '2020-03-15',
      vehicleType: '승용',
      vehicleUse: '자가용',
      manufacturer: '현대',
      modelName: '아반떼',
      modelYear: 2020,
      color: '흰색',
      displacement: 1600,
      fuelType: '휘발유',
      maxPower: '123ps/6300rpm',
      transmissionType: '자동',
      numberOfSeats: 5,
      totalWeight: 1850,
      curbWeight: 1350,
      numberOfOwnerChanges: 1,
      hasSeizure: false,
      hasMortgage: false,
      insuranceExpiryDate: '2025-03-14',
      inspectionExpiryDate: '2026-03-14',
      mileage: 45000,
      mileageDate: '2024-11-01',
      isCommercial: false,
      isPenalized: false,
      registrationStatus: '등록',
      cancelDate: null,
      exportDate: null,
      scrappedDate: null,
      remarks: null,
      lastUpdated: '2024-11-01',
      dataSource: 'KOTSA',
      responseCode: '00',
    }

    expect(info.vin).toBe('KMHXX00XXXX000000')
    expect(info.modelYear).toBe(2020)
    expect(info.hasSeizure).toBe(false)
    expect(info.insuranceExpiryDate).toBe('2025-03-14')
    expect(info.cancelDate).toBeNull()
  })

  it('accepts nullable fields as null', () => {
    const info: Pick<
      KotsaBasicInfo,
      'insuranceExpiryDate' | 'inspectionExpiryDate' | 'cancelDate' | 'exportDate' | 'scrappedDate' | 'remarks'
    > = {
      insuranceExpiryDate: null,
      inspectionExpiryDate: null,
      cancelDate: null,
      exportDate: null,
      scrappedDate: null,
      remarks: null,
    }

    expect(info.insuranceExpiryDate).toBeNull()
    expect(info.remarks).toBeNull()
  })
})

describe('KotsaSpec sub-types', () => {
  it('KotsaEngineSpec accepts all 17 fields', () => {
    const engine: KotsaEngineSpec = {
      type: 'Nu 1.6 GDI',
      displacement: 1591,
      fuelType: '휘발유',
      fuelSystem: 'GDI',
      maxPower: '123ps/6300rpm',
      maxTorque: '15.7kgf.m/4850rpm',
      emissionStandard: 'Euro6',
      catalyticConverter: true,
      turbocharger: false,
      hybridType: null,
      evRange: null,
      batteryCapacity: null,
      chargingType: null,
      hydrogenTankCapacity: null,
      fuelTankCapacity: 50,
      fuelEfficiency: '14.2',
      co2Emission: 115,
    }

    expect(engine.displacement).toBe(1591)
    expect(engine.turbocharger).toBe(false)
    expect(engine.hybridType).toBeNull()
    expect(engine.fuelEfficiency).toBe('14.2')
  })

  it('KotsaTransmissionSpec accepts 3 fields', () => {
    const transmission: KotsaTransmissionSpec = {
      type: '자동',
      gears: 6,
      driveType: 'FF',
    }

    expect(transmission.gears).toBe(6)
    expect(transmission.driveType).toBe('FF')
  })

  it('KotsaBodySpec accepts all 15 fields', () => {
    const body: KotsaBodySpec = {
      type: '세단',
      numberOfDoors: 4,
      length: 4620,
      width: 1800,
      height: 1440,
      wheelbase: 2700,
      trackFront: 1560,
      trackRear: 1565,
      overhangFront: 870,
      overhangRear: 1050,
      groundClearance: 145,
      curbWeight: 1350,
      grossWeight: 1850,
      maxPayload: 500,
      towingCapacity: 0,
    }

    expect(body.length).toBe(4620)
    expect(body.numberOfDoors).toBe(4)
  })

  it('KotsaTireSpec accepts front, rear, spare', () => {
    const tire: KotsaTireSpec = {
      frontSize: '205/55R16',
      rearSize: '205/55R16',
      spareTire: 'T125/70D16',
    }

    expect(tire.frontSize).toBe('205/55R16')
  })

  it('KotsaSuspensionSpec accepts front and rear', () => {
    const suspension: KotsaSuspensionSpec = {
      front: '맥퍼슨 스트럿',
      rear: '토션 빔',
    }

    expect(suspension.front).toBe('맥퍼슨 스트럿')
  })

  it('KotsaBrakeSpec accepts front, rear, parking', () => {
    const brake: KotsaBrakeSpec = {
      front: '벤틸레이티드 디스크',
      rear: '드럼',
      parkingBrake: '전자식',
    }

    expect(brake.parkingBrake).toBe('전자식')
  })

  it('KotsaSteeringSpec accepts type and turning radius', () => {
    const steering: KotsaSteeringSpec = {
      type: '전동식 파워스티어링(MDPS)',
      turningRadius: 5.4,
    }

    expect(steering.turningRadius).toBe(5.4)
  })
})

describe('KotsaSpec composite', () => {
  it('accepts all sub-type members', () => {
    const spec: KotsaSpec = {
      engine: {
        type: 'Theta II',
        displacement: 1998,
        fuelType: '휘발유',
        fuelSystem: 'MPI',
        maxPower: '152ps/6000rpm',
        maxTorque: '19.6kgf.m/4000rpm',
        emissionStandard: 'Euro6',
        catalyticConverter: true,
        turbocharger: false,
        hybridType: null,
        evRange: null,
        batteryCapacity: null,
        chargingType: null,
        hydrogenTankCapacity: null,
        fuelTankCapacity: 60,
        fuelEfficiency: '12.3',
        co2Emission: 133,
      },
      transmission: { type: '자동', gears: 6, driveType: 'FF' },
      body: {
        type: '세단',
        numberOfDoors: 4,
        length: 4730,
        width: 1850,
        height: 1470,
        wheelbase: 2795,
        trackFront: 1590,
        trackRear: 1600,
        overhangFront: 900,
        overhangRear: 1035,
        groundClearance: 150,
        curbWeight: 1450,
        grossWeight: 1950,
        maxPayload: 500,
        towingCapacity: 0,
      },
      tire: { frontSize: '225/45R18', rearSize: '225/45R18', spareTire: 'T125/70D16' },
      suspension: { front: '맥퍼슨 스트럿', rear: '멀티링크' },
      brake: { front: '벤틸레이티드 디스크', rear: '벤틸레이티드 디스크', parkingBrake: '전자식' },
      steering: { type: '전동식(MDPS)', turningRadius: 5.8 },
    }

    expect(spec.engine.displacement).toBe(1998)
    expect(spec.transmission.gears).toBe(6)
    expect(spec.body.wheelbase).toBe(2795)
    expect(spec.tire.frontSize).toBe('225/45R18')
    expect(spec.suspension.rear).toBe('멀티링크')
    expect(spec.brake.front).toBe('벤틸레이티드 디스크')
    expect(spec.steering.turningRadius).toBe(5.8)
  })
})

describe('KotsaMaintenanceHistory', () => {
  it('KotsaMaintenancePart has name, quantity, price', () => {
    const part: KotsaMaintenancePart = {
      name: '엔진오일 필터',
      quantity: 1,
      price: 12000,
    }

    expect(part.name).toBe('엔진오일 필터')
    expect(part.price).toBe(12000)
  })

  it('KotsaMaintenanceRecord accepts all 14 fields', () => {
    const record: KotsaMaintenanceRecord = {
      date: '2024-05-20',
      mileage: 40000,
      shopName: '현대 블루핸즈',
      shopType: '공식',
      category: '엔진오일 교환',
      description: '엔진오일 및 필터 교환',
      parts: [{ name: '엔진오일 5W-30', quantity: 4, price: 8000 }],
      laborCost: 20000,
      totalCost: 52000,
      nextMaintenanceDate: '2025-05-20',
      nextMaintenanceMileage: 50000,
      warranty: false,
      recallRelated: false,
      technicianId: 'TECH-001',
      reportNumber: 'RPT-20240520-001',
    }

    expect(record.mileage).toBe(40000)
    expect(record.parts).toHaveLength(1)
    expect(record.nextMaintenanceMileage).toBe(50000)
  })

  it('KotsaMaintenanceHistory wraps records array', () => {
    const history: KotsaMaintenanceHistory = {
      totalRecords: 0,
      records: [],
      lastMaintenanceDate: null,
      lastMaintenanceMileage: null,
    }

    expect(history.totalRecords).toBe(0)
    expect(history.records).toHaveLength(0)
    expect(history.lastMaintenanceDate).toBeNull()
  })
})

describe('KotsaInspection types', () => {
  it('KotsaPanelCondition accepts all 4 status values', () => {
    const statuses: KotsaPanelCondition['status'][] = ['normal', 'repainted', 'replaced', 'damaged']

    statuses.forEach((status) => {
      const panel: KotsaPanelCondition = { status, detail: null }
      expect(panel.status).toBe(status)
    })
  })

  it('KotsaAccidentHistory accepts all fields', () => {
    const history: KotsaAccidentHistory = {
      hasAccident: false,
      accidentCount: 0,
      totalRepairCost: 0,
      floodDamage: false,
      fireDamage: false,
      majorAccident: false,
      details: [],
    }

    expect(history.hasAccident).toBe(false)
    expect(history.details).toHaveLength(0)
  })

  it('KotsaAccidentDetail has all 5 fields', () => {
    const detail: KotsaAccidentDetail = {
      date: '2022-08-10',
      type: '충돌',
      repairCost: 1500000,
      affectedParts: ['앞 범퍼', '후드'],
      repairShop: '삼성화재 직영',
    }

    expect(detail.affectedParts).toHaveLength(2)
    expect(detail.repairCost).toBe(1500000)
  })

  it('KotsaExteriorInspection has 15 panels and 2 flags', () => {
    const normalPanel: KotsaPanelCondition = { status: 'normal', detail: null }

    const exterior: KotsaExteriorInspection = {
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
    }

    expect(exterior.hood.status).toBe('normal')
    expect(exterior.rearBumper.status).toBe('normal')
    expect(exterior.corrosion).toBe(false)
    expect(exterior.unevenGaps).toBe(false)
  })

  it('KotsaMechanicalInspection has all 19 fields', () => {
    const mechanical: KotsaMechanicalInspection = {
      engineCondition: '양호',
      oilLeak: false,
      coolantLeak: false,
      transmissionCondition: '양호',
      transmissionNoise: false,
      clutchCondition: '해당없음',
      driveShaft: '양호',
      steeringPlay: 5,
      powerSteeringLeak: false,
      brakeCondition: '양호',
      brakePadRemaining: 80,
      absFunction: true,
      exhaustSystem: '양호',
      emissionTestResult: '적합',
      suspensionCondition: '양호',
      shockAbsorber: '양호',
      wheelBearing: '양호',
      tireCondition: '양호',
      tireTreadDepth: [7.5, 7.5, 7.0, 7.0],
    }

    expect(mechanical.tireTreadDepth).toHaveLength(4)
    expect(mechanical.brakePadRemaining).toBe(80)
    expect(mechanical.oilLeak).toBe(false)
  })

  it('KotsaInteriorInspection has all 14 fields', () => {
    const interior: KotsaInteriorInspection = {
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
      odometer: 45000,
      warningLights: [],
      overallCondition: '양호',
    }

    expect(interior.odometer).toBe(45000)
    expect(interior.warningLights).toHaveLength(0)
    expect(interior.airbags).toBe('미전개')
  })

  it('KotsaInspectionDetail accepts all 7 fields including grade enum', () => {
    const grades: KotsaInspectionDetail['overallGrade'][] = ['A_PLUS', 'A', 'B_PLUS', 'B', 'C']

    grades.forEach((grade) => {
      const detail: KotsaInspectionDetail = {
        inspectorName: '김성능',
        inspectorLicense: 'LIC-12345',
        inspectionCenter: '한국자동차진단보증',
        inspectionDate: '2024-10-15',
        expiryDate: '2025-10-14',
        overallGrade: grade,
        overallScore: 90,
      }
      expect(detail.overallGrade).toBe(grade)
    })
  })
})

describe('KotsaVehicleData combined type', () => {
  it('has basicInfo, spec, maintenance, inspection top-level keys', () => {
    const normalPanel: KotsaPanelCondition = { status: 'normal', detail: null }

    const data: KotsaVehicleData = {
      basicInfo: {
        vin: 'TEST00000000000001',
        registrationNumber: '00가0000',
        ownerName: '테스트',
        registrationDate: '2023-01-01',
        firstRegistrationDate: '2023-01-01',
        vehicleType: '승용',
        vehicleUse: '자가용',
        manufacturer: '기아',
        modelName: 'K5',
        modelYear: 2023,
        color: '검정',
        displacement: 1998,
        fuelType: '휘발유',
        maxPower: '160ps/6500rpm',
        transmissionType: '자동',
        numberOfSeats: 5,
        totalWeight: 1950,
        curbWeight: 1450,
        numberOfOwnerChanges: 0,
        hasSeizure: false,
        hasMortgage: false,
        insuranceExpiryDate: null,
        inspectionExpiryDate: null,
        mileage: 5000,
        mileageDate: '2024-01-01',
        isCommercial: false,
        isPenalized: false,
        registrationStatus: '등록',
        cancelDate: null,
        exportDate: null,
        scrappedDate: null,
        remarks: null,
        lastUpdated: '2024-01-01',
        dataSource: 'KOTSA',
        responseCode: '00',
      },
      spec: {
        engine: {
          type: 'Theta II',
          displacement: 1998,
          fuelType: '휘발유',
          fuelSystem: 'MPI',
          maxPower: '160ps/6500rpm',
          maxTorque: '20.0kgf.m/4200rpm',
          emissionStandard: 'Euro6',
          catalyticConverter: true,
          turbocharger: false,
          hybridType: null,
          evRange: null,
          batteryCapacity: null,
          chargingType: null,
          hydrogenTankCapacity: null,
          fuelTankCapacity: 60,
          fuelEfficiency: '13.0',
          co2Emission: 125,
        },
        transmission: { type: '자동', gears: 8, driveType: 'FF' },
        body: {
          type: '세단',
          numberOfDoors: 4,
          length: 4905,
          width: 1860,
          height: 1445,
          wheelbase: 2900,
          trackFront: 1610,
          trackRear: 1620,
          overhangFront: 895,
          overhangRear: 1110,
          groundClearance: 140,
          curbWeight: 1450,
          grossWeight: 1950,
          maxPayload: 500,
          towingCapacity: 0,
        },
        tire: { frontSize: '225/45R18', rearSize: '225/45R18', spareTire: 'T135/80D16' },
        suspension: { front: '맥퍼슨 스트럿', rear: '멀티링크' },
        brake: { front: '벤틸레이티드 디스크', rear: '벤틸레이티드 디스크', parkingBrake: '전자식' },
        steering: { type: '전동식(R-MDPS)', turningRadius: 5.5 },
      },
      maintenance: {
        totalRecords: 0,
        records: [],
        lastMaintenanceDate: null,
        lastMaintenanceMileage: null,
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
          clutchCondition: '해당없음',
          driveShaft: '양호',
          steeringPlay: 3,
          powerSteeringLeak: false,
          brakeCondition: '양호',
          brakePadRemaining: 90,
          absFunction: true,
          exhaustSystem: '양호',
          emissionTestResult: '적합',
          suspensionCondition: '양호',
          shockAbsorber: '양호',
          wheelBearing: '양호',
          tireCondition: '양호',
          tireTreadDepth: [8.0, 8.0, 8.0, 8.0],
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
          odometer: 5000,
          warningLights: [],
          overallCondition: '양호',
        },
        detail: {
          inspectorName: '이점검',
          inspectorLicense: 'LIC-99999',
          inspectionCenter: '카히스토리',
          inspectionDate: '2024-12-01',
          expiryDate: '2025-11-30',
          overallGrade: 'A_PLUS',
          overallScore: 97,
        },
      },
    }

    expect(data.basicInfo.vin).toBe('TEST00000000000001')
    expect(data.spec.engine.displacement).toBe(1998)
    expect(data.maintenance.totalRecords).toBe(0)
    expect(data.inspection.accidentHistory.hasAccident).toBe(false)
    expect(data.inspection.detail.overallGrade).toBe('A_PLUS')
  })
})
