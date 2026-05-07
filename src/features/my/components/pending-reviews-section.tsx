"use client";

import { useEffect, useState } from "react";
import { ReviewForm } from "@/features/reviews/components/review-form";

type PendingReviewItem = {
  escrowId: string;
  listingId: string;
  listingTitle: string;
  dealerId: string;
  dealerName: string | null;
  completedAt: string;
};

export function PendingReviewsSection() {
  const [items, setItems] = useState<PendingReviewItem[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPendingReviews() {
      try {
        const res = await fetch("/api/reviews/pending");
        if (!res.ok) {
          if (!cancelled) {
            setItems([]);
          }
          return;
        }

        const data: { items?: PendingReviewItem[] } = await res.json();
        const nextItems = Array.isArray(data.items) ? data.items : [];

        if (!cancelled) {
          setItems(nextItems);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      }
    }

    loadPendingReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold" style={{ color: "var(--chayong-text)" }}>
        후기 작성 대기
      </h2>

      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedId === item.escrowId;
          const completedAt = new Date(item.completedAt).toLocaleDateString("ko-KR");
          const dealerLabel = item.dealerName ?? "익명 딜러";

          return (
            <article
              key={item.escrowId}
              className="rounded-xl border border-[var(--chayong-divider)] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
                    {item.listingTitle}
                  </p>
                  <p className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
                    딜러: {dealerLabel}
                  </p>
                  <p className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
                    거래 완료: {completedAt}
                  </p>
                </div>

                <button
                  type="button"
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: "var(--chayong-primary)" }}
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedId((current) => (current === item.escrowId ? null : item.escrowId))
                  }
                >
                  후기 작성
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-[var(--chayong-divider)] pt-4">
                  <ReviewForm
                    dealerId={item.dealerId}
                    listingId={item.listingId}
                    onSuccess={() => {
                      setItems((current) =>
                        current?.filter((currentItem) => currentItem.escrowId !== item.escrowId) ?? null
                      );
                      setExpandedId((current) => (current === item.escrowId ? null : current));
                    }}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
