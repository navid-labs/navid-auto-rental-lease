"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StarRating } from "./star-rating";

interface ReviewFormProps {
  dealerId: string;
  listingId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ dealerId, listingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      toast.error("별점을 선택해주세요.");
      return;
    }
    if (comment.trim().length === 0) {
      toast.error("후기를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId, listingId, rating, comment }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "후기 등록에 실패했습니다.");
        return;
      }

      toast.success("후기가 등록되었습니다.");
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
          별점
        </p>
        <StarRating rating={rating} size={24} interactive onChange={setRating} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="mb-1 text-xs font-medium" style={{ color: "var(--chayong-text-sub)" }}>
            후기
          </p>
          <span className="text-xs" style={{ color: "var(--chayong-text-caption)" }}>
            {comment.length}/100
          </span>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 100))}
          placeholder="거래 경험을 공유해주세요."
          rows={3}
          className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2"
          style={{
            borderColor: "var(--chayong-divider)",
            color: "var(--chayong-text)",
            backgroundColor: "var(--chayong-surface)",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="h-12 w-full rounded-xl text-[15px] font-semibold text-white transition disabled:opacity-50"
        style={{ backgroundColor: "var(--chayong-primary)" }}
      >
        {submitting ? "등록 중..." : "후기 등록"}
      </button>
    </form>
  );
}
