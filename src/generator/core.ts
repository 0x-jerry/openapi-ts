import { set } from 'lodash-es'
import type { IFs } from 'memfs'
import type { SchemaObject } from 'openapi-typescript'
import path, { dirname } from 'node:path'
import { generateInterface } from '../generateTypes'
import type { APIConfig, APIParameterConfig, ParserContext } from '../parser'
import { groupBy } from 'lodash-es'
import { createSpinner } from '../utils'
import type { Volume } from 'memfs/lib/volume'
import type { Awaitable } from '@0x-jerry/utils'
import { OPENAPI_PARAM_REG } from './shared'

export const config = {
  nameMapper: {
    requestAdapterName: '_request',
    apiModel: 'TypeModel',
    query: 'query',
    body: 'data',
    parameters: 'params',
  },
  adapterPath: '../_adapter.ts',
}

export interface GeneratorContext extends ParserContext {
  fs: IFs
  vol: Volume
}

export interface GeneratorContextWithOption extends GeneratorContext {
  generateApiName(ctx: GeneratorContext, api: APIConfig): string
  generateIndex(ctx: GeneratorContext): Awaitable<void>
}

export async function generateFromCtx(ctx: GeneratorContextWithOption) {
  const groupedApis = Object.values(groupBy(ctx.apis, (n) => n.path))

  const spinner = createSpinner('Generate code from spec', groupedApis.length).start()

  for (const groupedApi of groupedApis) {
    await generateApiByPath(ctx, groupedApi)
    spinner.plusOne()
  }

  spinner.done()

  await ctx.generateIndex(ctx)
}

function generateApiMethodCode(ctx: GeneratorContextWithOption, api: APIConfig) {
  const comments = [
    '/**',
    `* ${api.summary || ''}`,
    '*',
    `* ${api.description || ''}`,
    '*',
    `* url path: ${api.path}`,
    api.bodyTypeIsFormData &&
      api.bodyType &&
      `* @param data FormData keys: [${Object.keys(
        ('properties' in api.bodyType.schema && api.bodyType.schema.properties) || {},
      ).join(', ')}]`,
    api.tags && `* @tags ${api.tags.join(', ')}`,
    '*/',
  ].filter(Boolean)

  const params = [
    `method: '${api.method}',`,
    `    url: \`${generateRequestUrl(api)}\`,`,
    (api.bodyType || api.bodyTypeIsFormData) && `    body: ${config.nameMapper.body},`,
    api.queryType && `    query: ${config.nameMapper.query},`,
    api.paramsType && `    params: ${config.nameMapper.parameters},`,
    'config,',
  ].filter(Boolean)

  const codes = [
    comments.join('\n'),
    `export const ${ctx.generateApiName(ctx, api)} = (${generateRequestParameters(api)}) => {
    return ${config.nameMapper.requestAdapterName}<${generateResponseType(api)}>({
      ${params.join('\n')}
    })
  }`,
  ]

  return codes.join('\n')
}

function generateRequestUrl(api: APIConfig): string {
  return api.path.replace(OPENAPI_PARAM_REG, `\${${config.nameMapper.parameters}.\$1}`)
}

export interface ParameterConfig {
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
    params.push(
      generateParameterType(api.paramsType, {
        name: config.nameMapper.parameters,
      }),
    )
  }

  if (api.bodyTypeIsFormData) {
    params.push(`${config.nameMapper.body}: FormData`)
  } else if (api.bodyType) {
    params.push(generateParameterType(api.bodyType, { name: config.nameMapper.body }))
  }

  if (api.queryType) {
    params.push(generateParameterType(api.queryType, { name: config.nameMapper.query }))
  }

  params.push('config?: RequestConfig')
  return params.join(', ')
}

function generateParameterType(parameterSchema: APIParameterConfig, opt: ParameterConfig): string {
  if (!parameterSchema) return ''

  const typeName = parameterSchema.name

  const type = `${config.nameMapper.apiModel}["${typeName}"]`

  return `${opt.name}: ${type}`
}

function generateResponseType(api: APIConfig): string {
  if (!api.responseType) return 'void'

  return `${`${config.nameMapper.apiModel}["${api.responseType.name}"]`}`
}

async function generateApiByPath(ctx: GeneratorContextWithOption, groupedApi: APIConfig[]) {
  const fs = ctx.fs

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const apiPath = groupedApi.at(0)!.path
  const outputFilePath = normalizeFilePath(apiPath)

  const adapterRelativePath = path
    .join(path.relative(path.dirname(outputFilePath), '/'), config.adapterPath)
    .replaceAll('\\', '/')

  const codes: string[] = [
    '// @ts-ignore\n// @ts-nocheck',
    `import { ${config.nameMapper.requestAdapterName}, type RequestConfig } from '${adapterRelativePath}'`,
  ]

  const types = Object.assign({}, ...groupedApi.map((item) => item.types))

  const schema: SchemaObject = {
    type: 'object',
    properties: types,
    required: Object.keys(types),
  }

  const refTypes = Object.assign({}, ...groupedApi.map((item) => item.refTypes))

  // biome-ignore lint/complexity/noForEach: <explanation>
  Object.entries(refTypes).forEach(([key, refSchema]) => {
    const paths = key.split('/').slice(1)
    set(schema, paths, refSchema)
  })

  const typeCodes = await generateInterface(config.nameMapper.apiModel, schema)
  codes.push(typeCodes)

  const apiCodes = groupedApi.map((api) => generateApiMethodCode(ctx, api)).join('\n\n')
  codes.push(apiCodes)

  fs.mkdirSync(dirname(outputFilePath), { recursive: true })

  fs.writeFileSync(outputFilePath, codes.join('\n\n'))
}

function normalizeFilePath(apiPath: string) {
  let filePath = apiPath
    .split('/')
    .map((item) => (/^\{[^\}]+\}$/.test(item) ? `_${item.slice(1, -1)}` : item))
    .join('/')

  if (filePath === '/') {
    filePath = '/_'
  }

  return `${filePath}.ts`
}
