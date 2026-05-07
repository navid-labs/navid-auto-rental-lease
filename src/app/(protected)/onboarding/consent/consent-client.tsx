"use client";

import { useRouter } from "next/navigation";
import { ConsentModal, type ConsentResult } from "@/features/auth/components/consent-modal";

export function ConsentClient() {
  const router = useRouter();

  async function handleSubmit(result: ConsentResult) {
    const res = await fetch("/api/auth/consent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result),
    });
    if (!res.ok) {
      throw new Error("consent failed");
    }
    router.push("/");
    router.refresh();
  }

  return <ConsentModal onSubmit={handleSubmit} />;
}
