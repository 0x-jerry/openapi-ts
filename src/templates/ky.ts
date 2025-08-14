export const tpl = `
import ky, { type KyInstance } from 'ky'

export interface RequestConfig {
  _any_config?: string
}

export const kyIns = ky.create({})

export const _request = createAdapter(kyIns)

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
  query?: any

  /**
   * path parameters
   */
  params?: any

  /**
   * custom config
   */
  config?: RequestConfig
}

function createAdapter(instance: KyInstance) {
  const _request = async <Return>(data: RequestParams) => {
    const resp = await instance(data.url, {
      method: data.method,
      searchParams: data.query,
      json: data.data,
    }).json<Return>()

    return resp
  }

  return _request
}
`
