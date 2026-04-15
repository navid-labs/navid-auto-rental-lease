import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공지사항",
  description: "차용 서비스 공지사항",
};

export default function NoticePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold" style={{ color: "var(--chayong-text)" }}>
        공지사항
      </h1>
      <div
        className="rounded-xl border p-6 text-center text-sm"
        style={{
          borderColor: "var(--chayong-divider)",
          color: "var(--chayong-text-sub)",
        }}
      >
        등록된 공지사항이 없습니다.
      </div>
    </div>
  );
}
