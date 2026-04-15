"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./star-rating";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { name: string | null };
}

interface ReviewListProps {
  dealerId: string;
}

export function ReviewList({ dealerId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

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
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-lg p-3"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <div className="mb-1 flex items-center justify-between">
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
      ))}
    </ul>
  );
}
