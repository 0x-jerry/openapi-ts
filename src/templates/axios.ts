export const tpl = `
import axios, { type AxiosInstance } from 'axios'

export interface RequestConfig {
  _any_config?: string
}

export const axiosIns = axios.create({})

axiosIns.interceptors.response.use((resp) => {
  return resp.data
})

export const _request = createAdapter(axiosIns)

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

function createAdapter(instance: AxiosInstance) {
  const _request = async <Return>(data: RequestParams) => {
    const resp = await instance.request<Return>({
      method: data.method,
      url: data.url,
      data: data.data,
      params: data.query,
    })

    return resp
  }

  return _request
}
`