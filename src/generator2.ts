import { groupBy } from 'lodash-es'
import type { ParserContext, APIConfig } from './parser2'
import { type IFs, Volume, createFsFromVolume } from 'memfs'
import { dirname } from 'path'

export function generate(ctx: ParserContext) {
  const groupedApis = Object.values(groupBy(ctx.apis, (n) => n.path))

  const vfs = createFsFromVolume(new Volume())

  groupedApis.forEach((groupedApi) => {
    generateApiByPath(groupedApi, vfs)
  })

  return vfs
}

function generateApiByPath(groupedApi: APIConfig[], fs: IFs) {
  const codes: string[] = []

  const apiCodes = groupedApi.map((api) => generateApi(api)).join('\n\n')
  codes.push(apiCodes)

  let path = groupedApi.at(0)!.path
  path = normalizeApiPath(path)

  fs.mkdirSync(dirname(path), { recursive: true })

  fs.writeFileSync(path + '.ts', codes.join('\n\n'))
}

function generateApi(api: APIConfig) {
  return `export const $${api.method.toLowerCase()} = (params: any) => ({} as any)`
}

function normalizeApiPath(path: string) {
  return path
    .split('/')
    .map((item) => (/^\{[^\}]+\}$/.test(item) ? `_${item.slice(1, -1)}` : item))
    .join('/')
}
