const PARTNERS = [
  { name: '하나캐피탈', initial: 'H' },
  { name: '우리캐피탈', initial: 'W' },
  { name: 'MG손해보험', initial: 'M' },
  { name: '현대캐피탈', initial: 'H' },
  { name: 'KB손해보험', initial: 'K' },
  { name: '삼성화재', initial: 'S' },
]

export function PartnerLogos() {
  return (
    <section className="border-t border-surface-hover bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        <p className="mb-4 text-center text-[13px] font-medium text-text-caption">금융 파트너사</p>
        <div className="flex items-center justify-center gap-8 md:gap-12">
          {PARTNERS.map((partner) => (
            <div key={partner.name} className="flex flex-col items-center gap-1.5">
              <div className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-[16px] font-bold text-text-tertiary">
                {partner.initial}
              </div>
              <span className="whitespace-nowrap text-[11px] text-text-tertiary">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
