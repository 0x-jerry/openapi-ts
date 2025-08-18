export const tpl = `
export interface RequestConfig {
  _any_config?: string
}

export const _request = createAdapter()

interface RequestParams {
  /**
   * request path
   */
  url: string

  /**
   * request method
   */
  method: string

  /**
   * request body
   */
  data?: any

  /**
   * query
   */
  query?: Record<string, unknown>

  /**
   * path parameters
   */
  params?: Record<string, string>

  /**
   * custom config
   */
  config?: RequestConfig
}

function createAdapter() {
  const _request = async <Return>(data: RequestParams) => {
    const url = new URL(data.url, location.origin)

    Object.entries(data.query ?? {}).forEach(([key, value]) => {
      url.searchParams.set(key, String(value ?? ''))
    })

    const resp = await fetch(url, {
      method: data.method,
      body: JSON.stringify(data.data),
    })

    const responseData = await resp.json()
    return responseData as Return
  }

  return _request
}
`
