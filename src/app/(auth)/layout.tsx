import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { default: "차용", template: "%s | 차용" },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--chayong-surface)] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 text-2xl font-bold text-[var(--chayong-primary)] tracking-tight"
      >
        차용
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-[var(--chayong-bg)] rounded-2xl border border-[var(--chayong-divider)] shadow-sm px-8 py-10">
        {children}
      </div>
    </div>
  );
}
