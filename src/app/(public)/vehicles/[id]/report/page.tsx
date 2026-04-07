import { notFound } from 'next/navigation'
import { getVehicleReport } from '@/features/vehicles/queries/report'
import {
  ReportSummaryCard,
  PanelDiagram,
  MaintenanceTimeline,
  SpecTable,
} from '@/features/vehicles/components/report'

type Props = {
  params: Promise<{ id: string }>
}

/**
 * 차량 점검 리포트 페이지 (Server Component).
 * KOTSA 데이터를 기반으로 종합 점검 결과를 표시한다.
 */
export default async function VehicleReportPage({ params }: Props) {
  const { id } = await params
  const report = await getVehicleReport(id)

  if (!report) notFound()

  const { inspectionData, kotsaData } = report

  return (
    <main className="min-h-screen bg-zinc-50 pb-16">
      {/* 헤더 */}
      <div className="border-b border-zinc-200 bg-white px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-zinc-400">{report.brandName}</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">
            {report.modelName} {report.generationName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {report.trimName} &middot; {report.year}년식 &middot;{' '}
            {report.mileage.toLocaleString()} km &middot; {report.color}
          </p>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-6">
        <ReportSummaryCard
          inspectionData={inspectionData}
          basicInfo={kotsaData.basicInfo}
        />
        <PanelDiagram
          panels={inspectionData.panels}
          repaintCount={inspectionData.repaintCount}
          replacedCount={inspectionData.replacedCount}
        />
        <SpecTable
          basicInfo={kotsaData.basicInfo}
          spec={kotsaData.spec}
        />
        <MaintenanceTimeline records={kotsaData.maintenance.records} />
      </div>
    </main>
  )
}
