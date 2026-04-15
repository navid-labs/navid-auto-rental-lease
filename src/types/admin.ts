import type { Listing, Profile } from "@prisma/client";

export type AdminRole = "admin" | "inspector" | "finance";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin: "시스템 관리자",
  inspector: "차량 평가사",
  finance: "금융 매니저",
};

export type KanbanListing = Pick<
  Listing,
  | "id" | "type" | "status" | "brand" | "model" | "year"
  | "monthlyPayment" | "isVerified" | "createdAt" | "updatedAt"
> & {
  seller: Pick<Profile, "id" | "name">;
  _count: { images: number };
};

export type KanbanColumnId = "DRAFT" | "PENDING" | "ACTIVE" | "RESERVED" | "SOLD" | "HIDDEN";

export interface InspectionChecklist {
  exterior: { frameIntact: boolean; panelCondition: boolean; paintCondition: boolean };
  drivetrain: { engineNoLeak: boolean; transmissionOk: boolean; undercarriageOk: boolean };
  consumables: { tireCondition: boolean; brakePads: boolean; battery: boolean };
  documents: { vinMatch: boolean; insuranceHistory: boolean; inspectionReport: boolean; noIllegalMods: boolean };
  memo: string;
}

export const DEFAULT_INSPECTION_CHECKLIST: InspectionChecklist = {
  exterior: { frameIntact: false, panelCondition: false, paintCondition: false },
  drivetrain: { engineNoLeak: false, transmissionOk: false, undercarriageOk: false },
  consumables: { tireCondition: false, brakePads: false, battery: false },
  documents: { vinMatch: false, insuranceHistory: false, inspectionReport: false, noIllegalMods: false },
  memo: "",
};

export const INSPECTION_LABELS: Record<string, Record<string, string>> = {
  exterior: { frameIntact: "골격 손상 없음", panelCondition: "패널 판금/교환 없음", paintCondition: "도장 상태 양호" },
  drivetrain: { engineNoLeak: "엔진 누유 없음", transmissionOk: "변속기 정상", undercarriageOk: "하체 상태 양호" },
  consumables: { tireCondition: "타이어 잔여량 충분", brakePads: "브레이크패드 잔여량 충분", battery: "배터리 상태 양호" },
  documents: { vinMatch: "차대번호 일치", insuranceHistory: "보험이력 확인", inspectionReport: "성능점검기록부 확인", noIllegalMods: "불법구조변경 없음" },
};

export const INSPECTION_SECTION_LABELS: Record<string, string> = {
  exterior: "외판 및 골격",
  drivetrain: "구동 장치",
  consumables: "소모품 잔존량",
  documents: "서류 및 이력",
};

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING", "HIDDEN"],
  PENDING: ["ACTIVE", "DRAFT", "HIDDEN"],
  ACTIVE: ["RESERVED", "HIDDEN"],
  RESERVED: ["SOLD", "ACTIVE", "HIDDEN"],
  SOLD: ["HIDDEN"],
  HIDDEN: ["DRAFT"],
};

export interface ActionCardData {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  bg: string;
  href: string;
  urgent?: boolean;
}
