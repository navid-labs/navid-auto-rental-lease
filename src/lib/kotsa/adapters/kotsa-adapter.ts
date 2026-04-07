import type { KotsaVehicleData } from '../types'

/**
 * KOTSA 어댑터 인터페이스
 * 실제 KOTSA API 또는 Mock 구현체가 이 인터페이스를 따른다
 */
export type KotsaAdapter = {
  /**
   * 차량 번호와 CI로 KOTSA 차량 정보를 조회한다
   * @param registrationNumber - 차량 등록번호 (예: 12가3456)
   * @param ci - 연계정보 (Connect Information)
   * @returns 차량 종합 정보
   */
  fetchVehicleInfo(registrationNumber: string, ci: string): Promise<KotsaVehicleData>
}
