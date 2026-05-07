import type { PlateLookupResult } from "./plate-lookup";

export const SELL_DRAFT_VEHICLE_KEY = "chayong:sell:draftVehicle";

export type SellDraftVehicle = Pick<
  PlateLookupResult,
  "plate" | "brand" | "model" | "year" | "fuel"
>;

export function isSellDraftVehicle(value: unknown): value is SellDraftVehicle {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<SellDraftVehicle>;
  return (
    typeof draft.plate === "string" &&
    typeof draft.brand === "string" &&
    typeof draft.model === "string" &&
    typeof draft.year === "number" &&
    (draft.fuel === "GASOLINE" ||
      draft.fuel === "DIESEL" ||
      draft.fuel === "HYBRID" ||
      draft.fuel === "EV")
  );
}
