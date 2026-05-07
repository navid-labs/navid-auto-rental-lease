"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/ui/report-modal";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "./star-rating";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerId: string;
  reviewer: { name: string | null };
}

interface ReviewListProps {
  dealerId: string;
}

export function ReviewList({ dealerId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    targetId: string;
    targetSummary: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/reviews?dealerId=${dealerId}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
      })
      .catch(() => {
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [dealerId]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setCurrentUserId(user?.id ?? null);
        setAuthResolved(true);
      })
      .catch(() => {
        setCurrentUserId(null);
        setAuthResolved(true);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="animate-pulse rounded-lg p-3" style={{ backgroundColor: "var(--chayong-surface)" }}>
            <div className="mb-2 h-3 w-24 rounded" style={{ backgroundColor: "var(--chayong-divider)" }} />
            <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--chayong-divider)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
        아직 후기가 없습니다.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {reviews.map((review) => {
          const canReport = authResolved && review.reviewerId !== currentUserId;

          return (
            <li
              key={review.id}
              className="group relative rounded-lg p-3 pr-11"
              style={{ backgroundColor: "var(--chayong-surface)" }}
            >
              {canReport && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  aria-label="후기 신고"
                  onClick={() =>
                    setReportTarget({
                      targetId: review.id,
                      targetSummary: review.comment.slice(0, 80),
                    })
                  }
                >
                  <Flag className="size-3.5" />
                </Button>
              )}

              <div className="mb-1 flex items-center justify-between gap-2">
                <StarRating rating={review.rating} size={14} />
                <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
                  {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--chayong-text)" }}>
                {review.comment}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--chayong-text-sub)" }}>
                {review.reviewer.name ?? "익명"}
              </p>
            </li>
          );
        })}
      </ul>

      <ReportModal
        targetType="REVIEW"
        targetId={reportTarget?.targetId ?? ""}
        targetSummary={reportTarget?.targetSummary}
        isOpen={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        onSubmitted={() => setReportTarget(null)}
      />
    </>
  );
}
