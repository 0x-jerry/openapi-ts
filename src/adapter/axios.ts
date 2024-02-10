import { Axios } from 'axios'
import type { RequestParams } from './types'

export function createAxiosAdapter<Config extends {}>(axios: Axios) {
  const _request = async <Return>(data: RequestParams<Config>) => {
    const resp = await axios.request<Return>({
      method: data.method,
      url: data.url,
      data: data.data,
      params: data.query,
    })

    return resp.data
  }

  return _request
}
