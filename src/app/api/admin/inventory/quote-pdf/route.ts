import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { QuotePDF } from '@/features/inventory/components/quote-pdf'
import type { QuotePDFData } from '@/features/inventory/components/quote-pdf'

export async function POST(request: Request) {
  try {
    const data: QuotePDFData = await request.json()

    // Validate basic structure
    if (!data.vehicles || data.vehicles.length === 0) {
      return Response.json(
        { error: 'No vehicles provided' },
        { status: 400 }
      )
    }

    // Render PDF to buffer
    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createElement(QuotePDF, { data }) as any
    )

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="navid-quote-${timestamp}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Quote PDF generation error:', error)
    return Response.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
