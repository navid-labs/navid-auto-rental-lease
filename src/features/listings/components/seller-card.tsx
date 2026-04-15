import { UserRole } from "@prisma/client";
import { BadgeCheck, User } from "lucide-react";

interface SellerCardProps {
  sellerId: string;
  sellerName?: string | null;
  sellerRole: UserRole;
  isVerified?: boolean;
  /** Listing ID to pre-fill chat link */
  listingId: string;
}

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  DEALER: "딜러",
  SELLER: "개인판매자",
  ADMIN: "관리자",
};

const ROLE_BADGE_STYLE: Partial<Record<UserRole, { bg: string; text: string }>> = {
  DEALER: { bg: "var(--chayong-primary-light)", text: "var(--chayong-primary)" },
  SELLER: { bg: "#F0FDF4", text: "#16A34A" },
  ADMIN: { bg: "#FEF3C7", text: "#B45309" },
};

export function SellerCard({
  sellerName,
  sellerRole,
  isVerified,
  listingId,
}: SellerCardProps) {
  const roleLabel = ROLE_LABEL[sellerRole] ?? sellerRole;
  const badgeStyle = ROLE_BADGE_STYLE[sellerRole];
  const displayName = sellerName ?? "판매자";

  return (
    <section
      aria-label="판매자 정보"
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--chayong-border)" }}
    >
      <p
        className="mb-3 text-sm font-semibold"
        style={{ color: "var(--chayong-text)" }}
      >
        판매자 정보
      </p>

      <div className="flex items-center gap-3">
        {/* Avatar placeholder */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--chayong-surface)" }}
          aria-hidden="true"
        >
          <User size={20} style={{ color: "var(--chayong-text-caption)" }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="truncate text-sm font-semibold"
              style={{ color: "var(--chayong-text)" }}
            >
              {displayName}
            </span>
            {isVerified && (
              <BadgeCheck
                size={16}
                style={{ color: "var(--chayong-primary)" }}
                aria-label="인증 판매자"
              />
            )}
          </div>

          {badgeStyle && (
            <span
              className="mt-0.5 inline-block rounded-md px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
              }}
            >
              {roleLabel}
            </span>
          )}
        </div>
      </div>

      {/* Chat CTA */}
      <a
        href={`/chat?listing=${listingId}`}
        className="mt-4 flex h-10 w-full items-center justify-center rounded-xl border text-sm font-semibold transition hover:bg-[var(--chayong-surface)]"
        style={{
          borderColor: "var(--chayong-border)",
          color: "var(--chayong-text-sub)",
        }}
      >
        판매자에게 문의
      </a>
    </section>
  );
}
