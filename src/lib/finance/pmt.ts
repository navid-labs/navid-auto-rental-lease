/**
 * PMT 함수 — Excel PMT와 동일한 월 납입금 계산
 *
 * @param rate 월 이자율 (연이자율 / 12)
 * @param nper 총 납입 개월수
 * @param pv  현재가치 (리스원금, 양수)
 * @param fv  미래가치 (잔가, 음수로 전달)
 * @returns 월 납입금 (양수)
 */
export function pmt(
  rate: number,
  nper: number,
  pv: number,
  fv: number = 0
): number {
  if (nper <= 0) return 0
  if (rate === 0) return -(pv + fv) / nper

  const factor = Math.pow(1 + rate, nper)
  return -(pv * factor + fv) * rate / (factor - 1)
}
