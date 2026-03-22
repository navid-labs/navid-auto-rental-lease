import Link from 'next/link'
import { Instagram, Youtube, PenLine, MessageCircle, Smartphone } from 'lucide-react'

const SERVICE_LINKS = [
  { label: '내차사기', href: '/vehicles' },
  { label: '내차팔기', href: '/sell' },
  { label: '렌트/구독', href: '/rental-lease' },
  { label: '금융계산기', href: '/calculator' },
]

const SUPPORT_LINKS = [
  { label: '자주묻는질문', href: '/faq' },
  { label: '공지사항', href: '/notices' },
  { label: '라이브상담', href: '/live-chat' },
  { label: '1:1 문의', href: '/inquiry' },
]

const COMPANY_LINKS: { label: string; href: string; bold?: boolean }[] = [
  { label: '회사소개', href: '/about' },
  { label: '이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy', bold: true },
  { label: '채용정보', href: '/careers' },
]

const SNS_LINKS = [
  { label: '인스타그램', href: 'https://instagram.com', Icon: Instagram },
  { label: '유튜브', href: 'https://youtube.com', Icon: Youtube },
  { label: '블로그', href: 'https://blog.naver.com', Icon: PenLine },
  { label: '카카오', href: 'https://pf.kakao.com', Icon: MessageCircle },
]

function FooterLinkColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string; bold?: boolean }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="flex flex-col gap-[14px]">
        {links.map(({ label, href, bold }) => (
          <li key={href}>
            <Link
              href={href}
              className={`footer-link text-[13px] leading-none${bold ? ' !font-bold !text-white' : ''}`}
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
      {/* Scoped styles for footer link hover -- avoids 'use client' */}
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

          {/* SNS Links */}
          <div className="mt-8 flex items-center justify-center gap-6">
            {SNS_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-white/40 hover:text-white/80"
                aria-label={label}
              >
                <Icon className="size-[18px]" />
              </a>
            ))}
          </div>

          {/* Awards / Certification */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded bg-white/10 text-[11px] font-bold text-white/70">
                1st
              </div>
              <span className="text-[12px] text-[#8888AA]">고객만족도 1위 (2025)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded bg-white/10 text-[11px] font-bold text-white/70">
                7yr
              </div>
              <span className="text-[12px] text-[#8888AA]">브랜드 대상 7년 연속</span>
            </div>
          </div>

          {/* App Download Badges (placeholder) */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-[12px] text-white/60">
              <Smartphone className="size-4" />
              App Store
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-[12px] text-white/60">
              <Smartphone className="size-4" />
              Google Play
            </span>
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
