import type { KyInstance } from 'ky'
import { omitBy } from 'lodash-es'
import type { RequestParams } from './types'

export function createKyAdapter<Config extends {}>(ky: KyInstance) {
  const _request = async <Return>(data: RequestParams<Config>) => {
    const resp = await ky(data.url, {
      method: data.method,
      searchParams: omitBy(data.query, (v) => v == null),
      json: data.data,
    }).json<Return>()

    return resp
  }

  return _request
}
