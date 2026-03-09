import Link from 'next/link'

const SERVICE_LINKS = [
  { label: '내차사기', href: '/buy' },
  { label: '내차팔기', href: '/sell' },
  { label: '렌트/구독', href: '/rental' },
  { label: '금융사전용관', href: '/finance' },
]

const SUPPORT_LINKS = [
  { label: '자주묻는질문', href: '/faq' },
  { label: '공지사항', href: '/notices' },
  { label: '라이브상담', href: '/live-chat' },
  { label: '1:1 문의', href: '/inquiry' },
]

const COMPANY_LINKS = [
  { label: '회사소개', href: '/about' },
  { label: '이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '채용정보', href: '/careers' },
]

function FooterLinkColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="flex flex-col gap-[14px]">
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className="footer-link text-[13px] leading-none"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <>
      {/* Scoped styles for footer link hover — avoids 'use client' */}
      <style>{`
        .footer-link { color: #8888AA; transition: color 0.15s; }
        .footer-link:hover { color: #AAAACC; }
      `}</style>

      <footer style={{ backgroundColor: '#1A1A2E' }}>
        {/* Main columns */}
        <div
          className="mx-auto max-w-7xl px-4 md:px-6"
          style={{ paddingTop: 48, paddingBottom: 48 }}
        >
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-[60px]">
            {/* Column 1 - 고객센터 */}
            <div className="flex flex-col gap-3 md:max-w-[280px]">
              <p className="text-sm font-semibold text-white">고객센터</p>
              <a
                href="tel:15442277"
                className="text-[32px] font-bold leading-none text-white transition-opacity hover:opacity-80"
              >
                1544-2277
              </a>
              <p className="text-[13px] leading-[1.8]" style={{ color: '#8888AA' }}>
                평일 09:00 ~ 18:00
                <br />
                점심시간 12:00 ~ 13:00
                <br />
                토/일/공휴일 휴무
              </p>
            </div>

            {/* Columns 2, 3, 4 - Link groups */}
            <div className="col-span-1 grid grid-cols-1 gap-10 sm:grid-cols-3 md:col-span-3 md:gap-[60px]">
              <FooterLinkColumn title="서비스" links={SERVICE_LINKS} />
              <FooterLinkColumn title="고객지원" links={SUPPORT_LINKS} />
              <FooterLinkColumn title="회사" links={COMPANY_LINKS} />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <p className="text-[13px]" style={{ color: '#8888AA' }}>
              &copy; 2026 Navid Auto. All rights reserved.
            </p>
            <p className="text-[13px]" style={{ color: '#8888AA' }}>
              사업자등록번호: 000-00-00000&nbsp;&nbsp;|&nbsp;&nbsp;대표: 홍길동&nbsp;&nbsp;|&nbsp;&nbsp;contact@navid-auto.kr
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
