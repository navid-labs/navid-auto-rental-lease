type ListingType = "TRANSFER" | "USED_LEASE" | "USED_RENTAL";
type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "PHEV" | "EV" | "HYDROGEN" | "LPG";
type Transmission = "AUTO" | "MANUAL" | "CVT" | "DCT";
type BodyType =
  | "SEDAN"
  | "SUV"
  | "HATCH"
  | "COUPE"
  | "WAGON"
  | "VAN"
  | "TRUCK"
  | "CONVERTIBLE";
type Drivetrain = "FF" | "FR" | "AWD" | "FOURWD";
type PlateType = "PRIVATE" | "COMMERCIAL";
type Grade = "A" | "B" | "C";
type ImagePosition =
  | "EXTERIOR_FRONT"
  | "EXTERIOR_SIDE_LEFT"
  | "EXTERIOR_SIDE_RIGHT"
  | "EXTERIOR_REAR"
  | "INTERIOR_DASH"
  | "INTERIOR_SEATS"
  | "ENGINE"
  | "ODOMETER"
  | "PLATE"
  | "TRUNK"
  | "OTHER";

type SampleListingImage = {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
  position?: ImagePosition;
};

type SampleListing = {
  id: string;
  sellerId: string;
  type: ListingType;
  status: "ACTIVE";
  brand: string;
  model: string;
  year: number;
  trim: string;
  fuelType: FuelType;
  transmission: Transmission;
  seatingCapacity: number;
  mileage: number;
  color: string;
  plateNumber: string;
  vin?: string;
  displacement?: number;
  bodyType?: BodyType;
  drivetrain?: Drivetrain;
  plateType?: PlateType;
  monthlyPayment: number;
  initialCost: number;
  remainingMonths: number;
  totalPrice?: number;
  remainingBalance?: number;
  capitalCompany?: string;
  transferFee: number;
  viewCount: number;
  favoriteCount: number;
  accidentCount?: number;
  ownerCount?: number;
  exteriorGrade?: Grade;
  interiorGrade?: Grade;
  mileageVerified: boolean;
  registrationRegion?: string;
  inspectionReportKey?: string;
  inspectionDate?: Date;
  carryoverPremium?: number;
  terminationFee?: number;
  deposit?: number;
  mileageLimit?: number;
  isVerified: boolean;
  inspectionChecklist?: Record<string, unknown>;
  rejectionReason?: string;
  inspectedAt?: Date;
  inspectedBy?: string;
  description?: string;
  options: string[];
  createdAt: Date;
  updatedAt: Date;
  images: SampleListingImage[];
  // TODO: schema migration pending - contractMonths, contractEndDate, acquisitionMethod,
  // residualValue, driverMinAge, registrationDate, fuelEfficiency, fuelEfficiencyGrade,
  // lowEmissionGrade, optionsByCategory, damageHistory, cautionHistory, chatCount.
};

const COMMON_OPTIONS = [
  "헤드램프 LED",
  "헤드램프 하이빔 어시스트",
  "사이드미러 전동접이",
  "사이드미러 열선",
  "사이드미러 방향지시등 일체형",
  "휠타이어 알루미늄휠",
  "시트 전동시트(운전석)",
  "시트 전동시트(동승석)",
  "시트 열선시트(앞)",
  "시트 통풍시트(운전석)",
  "룸미러 전자식 룸미러(ECM)",
  "룸미러 하이패스 내장",
  "스티어링휠 가죽스티어링휠",
  "스티어링휠 열선내장",
  "파킹 전자식 파킹",
  "에어백 운전석",
  "에어백 동승석",
  "에어백 사이드",
  "에어백 커튼",
  "주행안전 차체자세제어장치(VDC,ESC,ESP)",
  "주행안전 급제동경보시스템(ESS)",
  "주행안전 후측방경보시스템(BSD)",
  "주차보조 전방감지센서",
  "주차보조 후방감지센서",
  "주차보조 후방카메라",
  "에어컨 풀오토에어컨",
  "유무선단자 USB",
  "유무선단자 블루투스",
  "내비게이션 순정 내비게이션",
] as const;

const IMAGE_POSITIONS: ImagePosition[] = [
  "EXTERIOR_FRONT",
  "EXTERIOR_SIDE_LEFT",
  "EXTERIOR_SIDE_RIGHT",
  "EXTERIOR_REAR",
  "INTERIOR_DASH",
  "INTERIOR_SEATS",
  "ENGINE",
  "ODOMETER",
  "PLATE",
];

function imagesFor(listingId: string, label: string, count = 9): SampleListingImage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${listingId}-image-${index + 1}`,
    url: `https://placehold.co/800x600/png?text=${encodeURIComponent(`${label} ${index + 1}`)}`,
    order: index,
    isPrimary: index === 0,
    position: IMAGE_POSITIONS[index] ?? "OTHER",
  }));
}

export const sampleListings: SampleListing[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    sellerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    type: "TRANSFER",
    status: "ACTIVE",
    brand: "기아",
    model: "더 뉴카니발 하이브리드(KA4)",
    year: 2024,
    trim: "1.6 HEV 9인승 노블레스",
    fuelType: "HYBRID",
    transmission: "AUTO",
    seatingCapacity: 9,
    mileage: 28000,
    color: "미색",
    plateNumber: "203호1320",
    vin: "KNAGH81A0RA123456",
    displacement: 1598,
    bodyType: "VAN",
    drivetrain: "FF",
    plateType: "PRIVATE",
    monthlyPayment: 732490,
    initialCost: 0,
    remainingMonths: 37,
    totalPrice: 48880000,
    remainingBalance: 27102130,
    capitalCompany: "현대캐피탈",
    transferFee: 550000,
    viewCount: 518,
    favoriteCount: 3,
    accidentCount: 0,
    ownerCount: 1,
    exteriorGrade: "A",
    interiorGrade: "A",
    mileageVerified: true,
    registrationRegion: "경기 평택시 비전동",
    inspectionReportKey: "sample/carnival-hybrid/report.pdf",
    inspectionDate: new Date("2026-04-20"),
    carryoverPremium: 1200000,
    terminationFee: 0,
    deposit: 0,
    mileageLimit: 15000,
    isVerified: true,
    inspectionChecklist: { tire: "good", smoking: false, wheelScratch: true },
    inspectedAt: new Date("2026-04-21"),
    inspectedBy: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    description: "비흡연 차량이며 실내외 관리 상태가 좋습니다. 휠에 작은 스크래치가 있어 사진으로 확인 가능합니다.",
    options: [
      "패키지 기본형-컴포트",
      "선루프 듀얼선루프",
      "주행보조 드라이브와이즈",
      "안전 모니터링팩",
      "외관 스타일",
      ...COMMON_OPTIONS,
    ],
    createdAt: new Date("2026-04-22"),
    updatedAt: new Date("2026-05-01"),
    images: imagesFor("11111111-1111-4111-8111-111111111111", "Vehicle 1 Front", 10),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    sellerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab",
    type: "TRANSFER",
    status: "ACTIVE",
    brand: "제네시스",
    model: "GV80",
    year: 2023,
    trim: "가솔린 3.5 터보 AWD 7인승",
    fuelType: "GASOLINE",
    transmission: "AUTO",
    seatingCapacity: 7,
    mileage: 34000,
    color: "우유니 화이트",
    plateNumber: "154저8271",
    vin: "KMUHCESC0PU234567",
    displacement: 3470,
    bodyType: "SUV",
    drivetrain: "AWD",
    plateType: "PRIVATE",
    monthlyPayment: 1190000,
    initialCost: 2500000,
    remainingMonths: 29,
    totalPrice: 72400000,
    remainingBalance: 34510000,
    capitalCompany: "KB캐피탈",
    transferFee: 770000,
    viewCount: 846,
    favoriteCount: 14,
    accidentCount: 0,
    ownerCount: 1,
    exteriorGrade: "A",
    interiorGrade: "B",
    mileageVerified: true,
    registrationRegion: "서울 강남구",
    inspectionDate: new Date("2026-04-18"),
    deposit: 3000000,
    mileageLimit: 20000,
    isVerified: true,
    description: "프리미엄 패키지와 7인승 옵션이 적용된 GV80입니다. 가족용으로 사용했고 정비 이력이 안정적입니다.",
    options: [
      "패키지 파퓰러패키지",
      "주행보조 드라이브와이즈",
      "안전 모니터링팩",
      "시트 열선시트(뒤)",
      "시트 통풍시트(동승석)",
      ...COMMON_OPTIONS,
    ],
    createdAt: new Date("2026-04-18"),
    updatedAt: new Date("2026-05-02"),
    images: imagesFor("22222222-2222-4222-8222-222222222222", "Vehicle 2 Front", 9),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    sellerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac",
    type: "TRANSFER",
    status: "ACTIVE",
    brand: "테슬라",
    model: "모델 3",
    year: 2024,
    trim: "롱레인지 AWD",
    fuelType: "EV",
    transmission: "AUTO",
    seatingCapacity: 5,
    mileage: 18000,
    color: "펄 화이트",
    plateNumber: "45허9081",
    vin: "LRW3E7EKXRC345678",
    bodyType: "SEDAN",
    drivetrain: "AWD",
    plateType: "PRIVATE",
    monthlyPayment: 845000,
    initialCost: 1000000,
    remainingMonths: 41,
    totalPrice: 60200000,
    remainingBalance: 34645000,
    capitalCompany: "신한카드",
    transferFee: 440000,
    viewCount: 402,
    favoriteCount: 9,
    accidentCount: 0,
    ownerCount: 1,
    exteriorGrade: "A",
    interiorGrade: "A",
    mileageVerified: true,
    registrationRegion: "인천 연수구",
    mileageLimit: 20000,
    isVerified: true,
    description: "전기차 충전 환경이 맞지 않아 승계로 내놓습니다. 실내 오염 없이 깨끗하게 유지했습니다.",
    options: [
      "안전 모니터링팩",
      "주행보조 오토파일럿",
      "시트 열선시트(뒤)",
      "에어컨 공기청정기",
      ...COMMON_OPTIONS,
    ],
    createdAt: new Date("2026-04-25"),
    updatedAt: new Date("2026-05-03"),
    images: imagesFor("33333333-3333-4333-8333-333333333333", "Vehicle 3 Front", 8),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    sellerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaad",
    type: "USED_LEASE",
    status: "ACTIVE",
    brand: "벤츠",
    model: "GLC",
    year: 2022,
    trim: "GLC 300 4MATIC AMG Line",
    fuelType: "GASOLINE",
    transmission: "AUTO",
    seatingCapacity: 5,
    mileage: 42000,
    color: "셀레나이트 그레이",
    plateNumber: "319누4210",
    vin: "W1NKM8HB6NF456789",
    displacement: 1991,
    bodyType: "SUV",
    drivetrain: "AWD",
    plateType: "PRIVATE",
    monthlyPayment: 980000,
    initialCost: 5000000,
    remainingMonths: 24,
    totalPrice: 62800000,
    remainingBalance: 23520000,
    capitalCompany: "메리츠캐피탈",
    transferFee: 880000,
    viewCount: 719,
    favoriteCount: 21,
    accidentCount: 1,
    ownerCount: 2,
    exteriorGrade: "B",
    interiorGrade: "A",
    mileageVerified: true,
    registrationRegion: "경기 성남시 분당구",
    deposit: 7000000,
    mileageLimit: 20000,
    isVerified: true,
    description: "수입 SUV 리스 승계 매물입니다. 단순 교환 이력이 있으며 성능점검 기록부로 확인 가능합니다.",
    options: [
      "패키지 AMG라인",
      "선루프 파노라마선루프",
      "주행안전 차선이탈경보(LDWS)",
      "주차보조 어라운드뷰",
      ...COMMON_OPTIONS,
    ],
    createdAt: new Date("2026-04-15"),
    updatedAt: new Date("2026-04-30"),
    images: imagesFor("44444444-4444-4444-8444-444444444444", "Vehicle 4 Front", 9),
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    sellerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaae",
    type: "USED_LEASE",
    status: "ACTIVE",
    brand: "현대",
    model: "쏘나타 디 엣지",
    year: 2024,
    trim: "2.0 익스클루시브",
    fuelType: "GASOLINE",
    transmission: "AUTO",
    seatingCapacity: 5,
    mileage: 22000,
    color: "녹턴 그레이",
    plateNumber: "182거5521",
    vin: "KMHL341CBRA567890",
    displacement: 1999,
    bodyType: "SEDAN",
    drivetrain: "FF",
    plateType: "PRIVATE",
    monthlyPayment: 512000,
    initialCost: 0,
    remainingMonths: 32,
    totalPrice: 32600000,
    remainingBalance: 16384000,
    capitalCompany: "우리금융캐피탈",
    transferFee: 330000,
    viewCount: 236,
    favoriteCount: 5,
    accidentCount: 0,
    ownerCount: 1,
    exteriorGrade: "A",
    interiorGrade: "A",
    mileageVerified: true,
    registrationRegion: "대전 유성구",
    mileageLimit: 15000,
    isVerified: true,
    description: "출퇴근 위주로 사용한 국산 중형 세단입니다. 월 납입금이 낮고 초기 비용 부담이 적습니다.",
    options: [
      "패키지 컴포트패키지",
      "내비게이션 12.3인치",
      "시트 열선시트(뒤)",
      "에어컨 공기청정기",
      ...COMMON_OPTIONS,
    ],
    createdAt: new Date("2026-04-28"),
    updatedAt: new Date("2026-05-04"),
    images: imagesFor("55555555-5555-4555-8555-555555555555", "Vehicle 5 Front", 8),
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    sellerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaf",
    type: "USED_RENTAL",
    status: "ACTIVE",
    brand: "기아",
    model: "셀토스 디 올뉴",
    year: 2023,
    trim: "1.6 가솔린 터보 시그니처",
    fuelType: "GASOLINE",
    transmission: "DCT",
    seatingCapacity: 5,
    mileage: 31000,
    color: "그래비티 그레이",
    plateNumber: "197하6402",
    vin: "KNDEP81ATPA678901",
    displacement: 1598,
    bodyType: "SUV",
    drivetrain: "FF",
    plateType: "PRIVATE",
    monthlyPayment: 468000,
    initialCost: 800000,
    remainingMonths: 27,
    totalPrice: 28700000,
    remainingBalance: 12636000,
    capitalCompany: "BNK캐피탈",
    transferFee: 330000,
    viewCount: 308,
    favoriteCount: 7,
    accidentCount: 0,
    ownerCount: 1,
    exteriorGrade: "B",
    interiorGrade: "A",
    mileageVerified: true,
    registrationRegion: "부산 해운대구",
    deposit: 1000000,
    mileageLimit: 20000,
    isVerified: true,
    description: "장기렌트 승계 매물이며 보험과 정비 조건 확인이 쉽습니다. 소형 SUV를 낮은 월 납입금으로 찾는 분께 맞습니다.",
    options: [
      "주행보조 드라이브와이즈",
      "안전 모니터링팩",
      "외관 스타일",
      "시트 인조가죽시트",
      ...COMMON_OPTIONS,
    ],
    createdAt: new Date("2026-04-26"),
    updatedAt: new Date("2026-05-01"),
    images: imagesFor("66666666-6666-4666-8666-666666666666", "Vehicle 6 Front", 9),
  },
];
