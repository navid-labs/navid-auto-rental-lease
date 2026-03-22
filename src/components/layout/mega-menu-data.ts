export type MenuSection = {
  title: string
  links: { label: string; href: string }[]
}

export type MenuCategory = {
  label: string
  href: string
  hasMegaMenu: boolean
  sections?: MenuSection[]
}

export const MENU_DATA: MenuCategory[] = [
  {
    label: '내차사기',
    href: '/vehicles',
    hasMegaMenu: true,
    sections: [
      {
        title: '차종별',
        links: [
          { label: '세단', href: '/vehicles?vehicleType=sedan' },
          { label: 'SUV', href: '/vehicles?vehicleType=suv' },
          { label: '해치백', href: '/vehicles?vehicleType=hatchback' },
          { label: 'MPV', href: '/vehicles?vehicleType=mpv' },
          { label: '쿠페/컨버터블', href: '/vehicles?vehicleType=coupe' },
        ],
      },
      {
        title: '브랜드별',
        links: [
          { label: '현대', href: '/vehicles?brandName=현대' },
          { label: '기아', href: '/vehicles?brandName=기아' },
          { label: 'BMW', href: '/vehicles?brandName=BMW' },
          { label: '벤츠', href: '/vehicles?brandName=벤츠' },
          { label: '전체 브랜드', href: '/vehicles' },
        ],
      },
      {
        title: '가격별',
        links: [
          { label: '1,000만원 이하', href: '/vehicles?priceMax=10000000' },
          { label: '2,000만원 이하', href: '/vehicles?priceMax=20000000' },
          { label: '3,000만원 이하', href: '/vehicles?priceMax=30000000' },
          { label: '3,000만원 이상', href: '/vehicles?priceMin=30000000' },
        ],
      },
    ],
  },
  {
    label: '내차팔기',
    href: '/inquiry?type=sell',
    hasMegaMenu: false,
  },
  {
    label: '렌트/구독',
    href: '/rental-lease',
    hasMegaMenu: false,
  },
  {
    label: '금융서비스',
    href: '/calculator',
    hasMegaMenu: false,
  },
  {
    label: '고객센터',
    href: '/inquiry?type=support',
    hasMegaMenu: false,
  },
]
