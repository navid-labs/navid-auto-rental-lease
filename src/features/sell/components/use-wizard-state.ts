// src/features/sell/components/use-wizard-state.ts
import { useState } from "react";
import type { PlateLookupResult } from "./plate-lookup";

export interface WizardForm {
  plate?: string;
  brand: string;
  model: string;
  year?: number;
  mileage?: number;
  fuel?: PlateLookupResult["fuel"];
  type?: "TRANSFER" | "USED_LEASE" | "USED_RENTAL";
  monthlyPayment?: number;
  initialCost?: number;
  remainingMonths?: number;
  description: string;
  photos: (File | null)[];
  // legacy fields preserved for submit
  trim: string;
  color: string;
  capitalCompany: string;
  options: string[];
  imageUrls: string[];
}

const INITIAL: WizardForm = {
  brand: "",
  model: "",
  description: "",
  photos: [],
  trim: "",
  color: "",
  capitalCompany: "",
  options: [],
  imageUrls: [],
};

export function useWizardState() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(INITIAL);

  const patch = (p: Partial<WizardForm>) => setForm((f) => ({ ...f, ...p }));
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return { step, form, patch, next, prev, setStep };
}
