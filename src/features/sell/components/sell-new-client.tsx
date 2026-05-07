"use client";

import { useSyncExternalStore } from "react";
import { SellWizard } from "./sell-wizard";
import {
  isSellDraftVehicle,
  SELL_DRAFT_VEHICLE_KEY,
  type SellDraftVehicle,
} from "./sell-draft";

interface SellNewClientProps {
  manualEntry: boolean;
}

export function SellNewClient({ manualEntry }: SellNewClientProps) {
  const draft = useSellDraftVehicle();

  return (
    <SellWizard
      key={draft ? draft.plate : "manual"}
      initialVehicle={draft ?? undefined}
      manualEntry={manualEntry || !draft}
    />
  );
}

function useSellDraftVehicle(): SellDraftVehicle | null {
  const raw = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem(SELL_DRAFT_VEHICLE_KEY),
    () => null
  );

  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isSellDraftVehicle(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
