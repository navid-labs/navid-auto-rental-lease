export const SECTION_IDS = [
  'price',
  'basic-info',
  'options',
  'body-diagram',
  'diagnosis',
  'history',
  'warranty',
  'home-service',
  'reviews-faq',
  'evaluator',
] as const

export type SectionId = typeof SECTION_IDS[number]

export const SECTION_LABELS: Record<SectionId, { tab: string; heading: string }> = {
  'price': { tab: '가격정보', heading: '가격정보' },
  'basic-info': { tab: '기본정보', heading: '기본정보' },
  'options': { tab: '옵션', heading: '주요옵션' },
  'body-diagram': { tab: '외부/진단', heading: '외부패널 진단' },
  'diagnosis': { tab: '진단결과', heading: '주요 진단결과' },
  'history': { tab: '이력정보', heading: '주요 과거이력' },
  'warranty': { tab: '보증정보', heading: '보증 안내' },
  'home-service': { tab: '홈서비스', heading: '홈서비스 구매안내' },
  'reviews-faq': { tab: '후기/FAQ', heading: '구매후기' },
  'evaluator': { tab: '평가사', heading: '차량평가사 추천' },
}

/** Panel status for body diagram color coding */
export const PANEL_COLORS = {
  normal: '#CBD5E1',    // slate-300
  repainted: '#F59E0B', // amber-500
  replaced: '#EF4444',  // red-500
} as const

export const PANEL_LABELS = {
  normal: '정상',
  repainted: '판금',
  replaced: '교환',
} as const
