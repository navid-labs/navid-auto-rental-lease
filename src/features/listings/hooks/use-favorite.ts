"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useFavorite(listingId: string, initialCount = 0) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/favorites?listingId=${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.isFavorited !== undefined) setIsFavorited(data.isFavorited);
      })
      .catch(() => {}); // Not logged in — silently ignore
  }, [listingId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (res.status === 401) {
        toast.info("찜하기 기능은 로그인 후 이용 가능합니다.");
        return;
      }

      const data = await res.json();
      setIsFavorited(data.isFavorited);
      setCount(data.favoriteCount);
      toast.success(data.isFavorited ? "찜 목록에 추가되었습니다." : "찜 목록에서 제거되었습니다.");
    } catch {
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return { isFavorited, count, loading, toggle };
}
