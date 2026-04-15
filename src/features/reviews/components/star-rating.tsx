"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function StarRating({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating}점`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
            aria-label={interactive ? `${i + 1}점` : undefined}
          >
            <Star
              size={size}
              fill={filled ? "#FBBF24" : "none"}
              stroke={filled ? "#FBBF24" : "#D1D5DB"}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
