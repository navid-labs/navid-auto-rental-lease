import Link from "next/link";
import { toURLSearchParams, type PaginationMeta } from "@/lib/api/pagination";

type Props = {
  pagination: PaginationMeta;
  basePath: string;
  preserveParams?: Record<string, string | undefined>;
};

const WINDOW = 2;

function buildHref(
  basePath: string,
  page: number,
  preserveParams: Record<string, string | undefined>
): string {
  const params = toURLSearchParams({
    ...preserveParams,
    page: page === 1 ? undefined : String(page),
  });
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function PaginationBar({ pagination, basePath, preserveParams = {} }: Props) {
  const { page, total, totalPages } = pagination;

  const start = Math.max(1, page - WINDOW);
  const end = Math.min(totalPages, page + WINDOW);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const linkClass = (active: boolean, disabled: boolean) =>
    [
      "px-3 py-1.5 text-sm rounded-lg border transition-colors",
      active
        ? "font-semibold"
        : disabled
        ? "pointer-events-none opacity-50"
        : "hover:bg-[var(--chayong-surface)]",
    ].join(" ");

  const linkStyle = (active: boolean) => ({
    borderColor: "var(--chayong-divider)",
    backgroundColor: active ? "var(--chayong-primary-light)" : "var(--chayong-bg)",
    color: active ? "var(--chayong-primary)" : "var(--chayong-text)",
  });

  return (
    <nav
      aria-label="페이지네이션"
      className="flex items-center justify-between gap-4 py-4"
    >
      <p className="text-sm" style={{ color: "var(--chayong-text-sub)" }}>
        총 {total.toLocaleString("ko-KR")}건 · {page}/{totalPages} 페이지
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(basePath, 1, preserveParams)}
          className={linkClass(false, !hasPrev)}
          style={linkStyle(false)}
          aria-label="첫 페이지"
        >
          «
        </Link>
        <Link
          href={buildHref(basePath, Math.max(1, page - 1), preserveParams)}
          className={linkClass(false, !hasPrev)}
          style={linkStyle(false)}
          aria-label="이전 페이지"
        >
          이전
        </Link>
        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(basePath, p, preserveParams)}
            aria-current={p === page ? "page" : undefined}
            className={linkClass(p === page, false)}
            style={linkStyle(p === page)}
          >
            {p}
          </Link>
        ))}
        <Link
          href={buildHref(basePath, Math.min(totalPages, page + 1), preserveParams)}
          className={linkClass(false, !hasNext)}
          style={linkStyle(false)}
          aria-label="다음 페이지"
        >
          다음
        </Link>
        <Link
          href={buildHref(basePath, totalPages, preserveParams)}
          className={linkClass(false, !hasNext)}
          style={linkStyle(false)}
          aria-label="끝 페이지"
        >
          »
        </Link>
      </div>
    </nav>
  );
}
