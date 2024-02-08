import { groupBy } from 'lodash-es'
import type { ParserContext, APIConfig, APIParameterConfig } from './parser2'
import { type IFs, Volume, createFsFromVolume } from 'memfs'
import path, { dirname } from 'path'
import { type SchemaObject } from 'openapi-typescript'
import { generateInterface } from './generateTypes'

const config = {
  nameMapper: {
    apiModel: 'TypeModel',
    query: 'query',
    body: 'data',
    parameters: 'params',
  },
  adapterPath: '../_http.ts',
}

export async function generate(ctx: ParserContext) {
  const groupedApis = Object.values(groupBy(ctx.apis, (n) => n.path))

  const vfs = createFsFromVolume(new Volume())

  const p = groupedApis.map((groupedApi) => generateApiByPath(ctx, groupedApi, vfs))

  await Promise.all(p)

  generateIndexFiles(vfs)

  return vfs
}

// todo, fix the same name with folder
// ex. `clients.ts` file and `clients` folder
function generateIndexFiles(vfs: IFs) {
  return _generateIndexFiles(vfs, '/')

  function _generateIndexFiles(vfs: IFs, input: string) {
    const files = vfs.readdirSync(input) as string[]

    const hasIndex = files.includes('index.ts')

    if (hasIndex) {
      console.error('Can not create index file, for:', input)
      return
    }

    const indexFileCodes: string[] = files.map((item) => {
      const name = item.replace(/\.ts$/, '')
      return `export * as ${name} from './${name}'`
    })

    vfs.writeFileSync(path.join(input, 'index.ts'), indexFileCodes.join('\n'))

    for (const file of files) {
      const _input = path.join(input, file.toString())
      const isDirectory = vfs.statSync(_input).isDirectory()

      if (isDirectory) {
        _generateIndexFiles(vfs, _input)
      }
    }
  }
}

async function generateApiByPath(ctx: ParserContext, groupedApi: APIConfig[], fs: IFs) {
  let outputFilePath = groupedApi.at(0)!.path
  outputFilePath = normalizeApiPath(outputFilePath) + '.ts'

  const adapterRelativePath = path.join(
    path.relative(path.dirname(outputFilePath), '/'),
    config.adapterPath
  )

  const codes: string[] = [
    `// @ts-ignore\n// @ts-nocheck`,
    `import { _http, type RequestConfig } from '${adapterRelativePath}'`,
  ]

  const types = Object.assign({}, ...groupedApi.map((item) => item.types))

  const schema: SchemaObject = {
    ...ctx.schema,
    type: 'object',
    properties: types,
    required: Object.keys(types),
  }

  const typeCodes = await generateInterface(config.nameMapper.apiModel, schema)
  codes.push(typeCodes)

  const apiCodes = groupedApi.map((api) => generateApiMethodCode(api)).join('\n\n')
  codes.push(apiCodes)

  fs.mkdirSync(dirname(outputFilePath), { recursive: true })

  fs.writeFileSync(outputFilePath, codes.join('\n\n'))
}

function generateApiMethodCode(api: APIConfig) {
  const params = [
    `    url: \`${generateRequestUrl(api)}\`,`,
    (api.bodyType || api.bodyTypeIsFormData) && `    body: ${config.nameMapper.body},`,
    api.queryType && `    query: ${config.nameMapper.query},`,
    'config',
  ].filter(Boolean)

  return `export const $${api.method.toLowerCase()} = (${generateRequestParameters(api)}) => {
    return _http.${api.method}<${generateResponseType(api)}>({
      ${params.join('\n')}
    })
  }`
}

function generateRequestUrl(api: APIConfig): string {
  const parseParamReg = /\{([^}]+)\}/g

  return api.path.replace(parseParamReg, `\${${config.nameMapper.parameters}.\$1}`)
}

function normalizeApiPath(path: string) {
  return path
    .split('/')
    .map((item) => (/^\{[^\}]+\}$/.test(item) ? `_${item.slice(1, -1)}` : item))
    .join('/')
}

interface ParameterConfig {
  name: string
}

export interface ParametersConfig {
  query: ParameterConfig
  body: ParameterConfig
  param: ParameterConfig
}

function generateRequestParameters(api: APIConfig): string {
  const params: string[] = []

  if (api.paramsType) {
    params.push(generateParameterType(api.paramsType, { name: config.nameMapper.parameters }))
  }

  if (api.bodyTypeIsFormData) {
    params.push(`${config.nameMapper.body}: FormData`)
  } else if (api.bodyType) {
    params.push(generateParameterType(api.bodyType, { name: config.nameMapper.body }))
  }

  if (api.queryType) {
    params.push(generateParameterType(api.queryType, { name: config.nameMapper.query }))
  }

  params.push(`config?: RequestConfig`)
  return params.join(', ')
}

function generateParameterType(parameterSchema: APIParameterConfig, opt: ParameterConfig): string {
  if (!parameterSchema) return ''

  const typeName = parameterSchema.name

  let type = `${config.nameMapper.apiModel}["${typeName}"]`

  return `${opt.name}: ${type}`
}

function generateResponseType(api: APIConfig): string {
  if (!api.responseType) return 'void'

  return `${`${config.nameMapper.apiModel}["${api.responseType.name}"]`}`
}
