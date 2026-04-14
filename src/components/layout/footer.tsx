import Link from "next/link";

const SERVICE_LINKS = [
  { href: "/list", label: "매물보기" },
  { href: "/used", label: "중고 리스·렌트" },
  { href: "/sell", label: "매물등록" },
  { href: "/guide", label: "이용가이드" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/faq", label: "자주 묻는 질문" },
  { href: "/notice", label: "공지사항" },
];

export function Footer() {
  return (
    <footer
      className="border-t bg-[var(--chayong-surface)]"
      style={{ borderColor: "var(--chayong-divider)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white"
                style={{ backgroundColor: "var(--chayong-primary)" }}
              >
                C
              </span>
              <span className="text-base font-bold" style={{ color: "var(--chayong-text)" }}>
                차용
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--chayong-text-caption)" }}>
              안전하게 승계하는 가장 쉬운 방법.
              <br />
              월 납입금만 보고 간편하게 비교하세요.
            </p>
          </div>

          {/* 서비스 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
              서비스
            </h3>
            <ul className="flex flex-col gap-2">
              {SERVICE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-[var(--chayong-primary)]"
                    style={{ color: "var(--chayong-text-sub)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 이용 안내 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
              이용 안내
            </h3>
            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-[var(--chayong-primary)]"
                    style={{ color: "var(--chayong-text-sub)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 고객센터 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--chayong-text)" }}>
              고객센터
            </h3>
            <p
              className="text-xl font-bold"
              style={{ color: "var(--chayong-primary)" }}
            >
              1544-1234
            </p>
            <p className="text-sm" style={{ color: "var(--chayong-text-caption)" }}>
              평일 09:00 – 18:00
              <br />
              (토·일·공휴일 휴무)
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div
          className="mt-8 border-t pt-6 text-xs"
          style={{
            borderColor: "var(--chayong-divider)",
            color: "var(--chayong-text-caption)",
          }}
        >
          © {new Date().getFullYear()} 차용. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
