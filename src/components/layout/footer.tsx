export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between md:px-6">
        <div className="text-center md:text-left">
          <span className="text-lg font-bold text-accent">Navid Auto</span>
          <p className="mt-1 text-xs">프리미엄 중고차 렌탈 & 리스 플랫폼</p>
        </div>

        <div className="flex flex-col items-center gap-1 text-xs md:items-end">
          <p>문의: contact@navid-auto.kr</p>
          <p>&copy; 2026 Navid Auto. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
