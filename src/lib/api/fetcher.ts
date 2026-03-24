export async function customFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(!isFormDataBody(options?.body) && {
        'Content-Type': 'application/json',
      }),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText,
    }))
    throw new ApiError(response.status, error.error ?? '요청에 실패했습니다')
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/pdf')) {
    return response.blob() as unknown as T
  }

  return response.json()
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
