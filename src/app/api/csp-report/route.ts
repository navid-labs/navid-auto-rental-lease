export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Log the violation report
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSP Violation]', JSON.stringify(body, null, 2))
    } else {
      // Structured JSON for production log aggregation
      console.log(JSON.stringify({
        type: 'csp-violation',
        timestamp: new Date().toISOString(),
        report: body['csp-report'] ?? body,
      }))
    }
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 400 })
  }
}
