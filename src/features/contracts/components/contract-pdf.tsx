import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import '@/lib/pdf/fonts'
import type { ContractPDFData } from '@/features/contracts/types'

// Inline formatters -- @react-pdf/renderer uses its own reconciler,
// so we cannot import from @/lib/utils/format
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

function formatDate(date: Date | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NanumGothic',
    fontSize: 10,
    lineHeight: 1.6,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  contractId: {
    textAlign: 'right',
    fontSize: 8,
    color: '#666666',
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
    marginBottom: 2,
    minHeight: 20,
    alignItems: 'center',
  },
  label: {
    width: '30%',
    fontWeight: 700,
    backgroundColor: '#f5f5f5',
    padding: 4,
    fontSize: 9,
  },
  value: {
    width: '70%',
    padding: 4,
    fontSize: 9,
  },
  signatureArea: {
    marginTop: 40,
  },
  dateLine: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 10,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  signatureBlock: {
    width: '40%',
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 30,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    width: '100%',
    marginBottom: 4,
  },
  signatureHint: {
    fontSize: 8,
    color: '#999999',
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

export function ContractPDF({ data }: { data: ContractPDFData }) {
  const isLease = data.contractType === 'LEASE'
  const documentTitle = isLease ? '리스 계약서' : '렌탈 계약서'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Navid Auto</Text>
          <Text style={styles.title}>{documentTitle}</Text>
        </View>

        {/* Contract ID */}
        <Text style={styles.contractId}>
          계약번호: {data.contractId.slice(0, 8)}
        </Text>

        {/* Section: 당사자 정보 */}
        <Text style={styles.sectionTitle}>당사자 정보</Text>
        <InfoRow label="고객명" value={data.customerName} />
        <InfoRow label="연락처" value={data.customerPhone ?? '-'} />
        <InfoRow label="이메일" value={data.customerEmail} />
        <InfoRow label="딜러명" value={data.dealerName ?? '-'} />

        {/* Section: 차량 정보 */}
        <Text style={styles.sectionTitle}>차량 정보</Text>
        <InfoRow label="차량명" value={data.vehicleName} />
        <InfoRow label="연식" value={`${data.vehicleYear}년`} />
        <InfoRow label="차량번호" value={data.vehiclePlateNumber ?? '-'} />
        <InfoRow
          label="주행거리"
          value={`${new Intl.NumberFormat('ko-KR').format(data.vehicleMileage)}km`}
        />
        <InfoRow label="색상" value={data.vehicleColor ?? '-'} />

        {/* Section: 계약 조건 */}
        <Text style={styles.sectionTitle}>계약 조건</Text>
        <InfoRow label="계약유형" value={isLease ? '리스' : '렌탈'} />
        <InfoRow
          label="계약기간"
          value={`${formatDate(data.startDate)} ~ ${formatDate(data.endDate)}`}
        />
        <InfoRow label="월납입금" value={formatKRW(data.monthlyPayment)} />
        <InfoRow label="보증금" value={formatKRW(data.deposit)} />
        <InfoRow label="총금액" value={formatKRW(data.totalAmount)} />

        {/* Section: 잔존가치 (Lease only) */}
        {isLease && (
          <>
            <Text style={styles.sectionTitle}>잔존가치</Text>
            <InfoRow
              label="잔존가치"
              value={
                data.residualValue != null
                  ? formatKRW(data.residualValue)
                  : '-'
              }
            />
            <InfoRow
              label="잔존율"
              value={
                data.residualRate != null
                  ? `${Number(data.residualRate)}%`
                  : '-'
              }
            />
          </>
        )}

        {/* Signature Area */}
        <View style={styles.signatureArea}>
          <Text style={styles.dateLine}>
            {formatDate(new Date())}
          </Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>고객 (갑)</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureHint}>(서명 또는 인)</Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>회사 (을)</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureHint}>(서명 또는 인)</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          본 계약서는 Navid Auto에서 발행되었습니다.
        </Text>
      </Page>
    </Document>
  )
}
