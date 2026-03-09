import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import '@/lib/pdf/fonts'

// Inline formatters -- @react-pdf/renderer uses its own reconciler,
// so we cannot import from @/lib/utils/format
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원'
}

function formatPercent(rate: number): string {
  return (rate * 100).toFixed(1) + '%'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** Serialized version of QuoteGenerationResult for JSON transfer */
export type QuotePDFData = {
  params: {
    leasePeriodMonths: number
    residualRate: number
    depositRate: number
    creditGroup: number
  }
  vehicles: Array<{
    vehicleName: string
    vehiclePrice: number
    brand: string
    year?: number
    exteriorColor?: string
    options?: string
    effectivePrice: number
    promotionRate?: number
    subsidyAmount?: number
    leaseMonthly: number
    leaseTotalPayment: number
    leaseDeposit: number
    leaseResidualValue: number
    leaseAnnualRate: number
    leaseAcquisitionTax: number
    rentalMonthly: number
    rentalTotalPayment: number
  }>
  generatedAt: string
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NanumGothic',
    fontSize: 10,
    lineHeight: 1.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 2,
  },
  dateText: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    marginTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  paramRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paramItem: {
    flexDirection: 'row',
    width: '50%',
  },
  paramLabel: {
    fontWeight: 700,
    fontSize: 9,
    width: '40%',
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  paramValue: {
    fontSize: 9,
    width: '60%',
    padding: 4,
  },
  vehicleHeader: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 6,
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
    minHeight: 18,
    alignItems: 'center',
  },
  label: {
    width: '35%',
    fontWeight: 700,
    backgroundColor: '#f5f5f5',
    padding: 4,
    fontSize: 9,
  },
  value: {
    width: '65%',
    padding: 4,
    fontSize: 9,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 8,
    marginBottom: 4,
    color: '#333333',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 12,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: '#999999',
  },
})

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const CREDIT_GROUP_LABELS: Record<number, string> = {
  1: '1등급 (우수)',
  2: '2등급 (양호)',
  3: '3등급 (보통)',
}

export function QuotePDF({ data }: { data: QuotePDFData }) {
  const { params, vehicles } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Navid Auto</Text>
            <Text style={styles.title}>견적서</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(data.generatedAt)}</Text>
        </View>

        {/* 견적 조건 */}
        <Text style={styles.sectionTitle}>견적 조건</Text>
        <View style={styles.paramRow}>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>리스기간</Text>
            <Text style={styles.paramValue}>{params.leasePeriodMonths}개월</Text>
          </View>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>잔존가율</Text>
            <Text style={styles.paramValue}>{formatPercent(params.residualRate)}</Text>
          </View>
        </View>
        <View style={styles.paramRow}>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>보증금율</Text>
            <Text style={styles.paramValue}>{formatPercent(params.depositRate)}</Text>
          </View>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>신용등급</Text>
            <Text style={styles.paramValue}>
              {CREDIT_GROUP_LABELS[params.creditGroup] ?? `${params.creditGroup}등급`}
            </Text>
          </View>
        </View>

        {/* Vehicle sections */}
        {vehicles.map((v, idx) => (
          <View key={idx} break={idx >= 3}>
            {idx > 0 && <View style={styles.divider} />}

            <Text style={styles.vehicleHeader}>
              {v.vehicleName}
              {v.year ? ` (${v.year}년)` : ''}
              {v.exteriorColor ? ` - ${v.exteriorColor}` : ''}
            </Text>

            {/* 차량 가격 정보 */}
            <InfoRow label="차량가격" value={formatKRW(v.vehiclePrice)} />
            {v.promotionRate != null && v.promotionRate > 0 && (
              <InfoRow
                label="프로모션 할인"
                value={`-${formatPercent(v.promotionRate)} (${formatKRW(v.vehiclePrice * v.promotionRate)})`}
              />
            )}
            {v.subsidyAmount != null && v.subsidyAmount > 0 && (
              <InfoRow label="보조금" value={`-${formatKRW(v.subsidyAmount)}`} />
            )}
            <InfoRow label="실구매가" value={formatKRW(v.effectivePrice)} />

            {/* 리스 견적 */}
            <Text style={styles.subSectionTitle}>리스 견적</Text>
            <InfoRow label="월납입금" value={formatKRW(v.leaseMonthly)} />
            <InfoRow label="보증금" value={formatKRW(v.leaseDeposit)} />
            <InfoRow label="잔존가치" value={formatKRW(v.leaseResidualValue)} />
            <InfoRow label="취득세" value={formatKRW(v.leaseAcquisitionTax)} />
            <InfoRow label="연이율" value={formatPercent(v.leaseAnnualRate)} />
            <InfoRow label="총납입금" value={formatKRW(v.leaseTotalPayment)} />

            {/* 렌탈 견적 */}
            <Text style={styles.subSectionTitle}>렌탈 견적</Text>
            <InfoRow label="월납입금" value={formatKRW(v.rentalMonthly)} />
            <InfoRow label="총납입금" value={formatKRW(v.rentalTotalPayment)} />
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          본 견적서는 Navid Auto에서 발행되었습니다. 실제 금액은 심사 결과에 따라 달라질 수 있습니다.
        </Text>
      </Page>
    </Document>
  )
}
