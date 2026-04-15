import Link from "next/link";

export function AdminErrorView({
  message,
  resetHref,
}: {
  message: string;
  resetHref?: string;
}) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col items-center gap-3"
      style={{
        backgroundColor: "#FEF2F2",
        border: "1px solid var(--chayong-danger)",
        color: "var(--chayong-danger)",
      }}
    >
      <p className="font-medium">{message}</p>
      {resetHref && (
        <Link
          href={resetHref}
          className="text-sm underline"
          style={{ color: "var(--chayong-danger)" }}
        >
          필터 초기화
        </Link>
      )}
    </div>
  );
}
